import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { fromByteArray } from 'base64-js';

interface GitHubRepoConfig {
	id: string;
	token: string;
	username: string;
	reponame: string;
	branch?: string;
	default?: boolean;
}

interface PublishGitHubSettings {
	repos: GitHubRepoConfig[];
	defaultRepo: string;
}

const DEFAULT_SETTINGS: PublishGitHubSettings = {
	repos: [],
	defaultRepo: ''
};

export default class PublishGitHubPlugin extends Plugin {
	settings: PublishGitHubSettings;

	async onload() {
		await this.loadSettings();

		// Register right-click menu for files
		this.registerEvent(
			this.app.workspace.on('file-menu', (menu, file) => {
				menu.addItem(item => {
					item
						.setTitle('Publish to GitHub')
						.setIcon('cloud-upload')
						.onClick(async () => {
							await this.publishToGitHub(file);
						});
				});
			})
		);

		// Register right-click menu for editor
		this.registerEvent(
			this.app.workspace.on('editor-menu', (menu, editor, view) => {
				menu.addItem(item => {
					item
						.setTitle('Publish to GitHub')
						.setIcon('cloud-upload')
						.onClick(async () => {
							const file = view.file;
							if (file) {
								await this.publishToGitHub(file);
							}
						});
				});
			})
		);

		// Add settings tab
		this.addSettingTab(new GitHubSettingTab(this.app, this));
	}

	onunload() {
		// Clean up any resources
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async publishToGitHub(file: any) {
		try {
			// Read file content
			const content = await this.app.vault.read(file);

			// Parse frontmatter to get repo id, path, branch, and commit message
			const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;

			const { repo, path, branch, commit } = frontmatter || {};
			if (!repo && !this.settings.defaultRepo) {
				new Notice('No repo specified in frontmatter or default repo set');
				return;
			}

			const repoId = repo || this.settings.defaultRepo;
			const repoConfig = this.settings.repos.find(r => r.id === repoId);

			if (!repoConfig) {
				new Notice(`GitHub repo configuration not found for ${repoId}`);
				return;
			}

			const { token, username, reponame, branch: defaultBranch = 'main' } = repoConfig;
			let filePath = path || file.name;
			// Handle path ending with slash by appending filename
			if (path && path.endsWith('/')) {
				filePath = `${path}${file.name}`;
			}
			const targetBranch = branch || defaultBranch;
			const commitMessage = commit || `Publish: ${filePath}`;

			// Prepare GitHub API request
			const apiUrl = `https://api.github.com/repos/${username}/${reponame}/contents/${filePath}?ref=${targetBranch}`;
			const encodedContent = fromByteArray(new TextEncoder().encode(content));

			// Check if file exists
			const checkResponse = await fetch(apiUrl, {
				headers: {
					Authorization: `token ${token}`,
					Accept: 'application/vnd.github.v3+json'
				}
			});

			const sha = checkResponse.ok ? (await checkResponse.json()).sha : undefined;

			// Create or update file
			const response = await fetch(apiUrl, {
				method: 'PUT',
				headers: {
					Authorization: `token ${token}`,
					Accept: 'application/vnd.github.v3+json'
				},
				body: JSON.stringify({
					message: commitMessage,
					content: encodedContent,
					sha: sha, // Required for updates
					branch: targetBranch
				})
			});

			if (response.ok) {
				new Notice(`Successfully published ${filePath} to GitHub`);
			} else {
				const error = await response.json();
				new Notice(`Failed to publish: ${error.message || response.statusText}`);
			}
		} catch (error) {
			new Notice(`Error publishing to GitHub: ${error instanceof Error ? error.message : String(error)}`);
		}
	}
}

class GitHubSettingTab extends PluginSettingTab {
	plugin: PublishGitHubPlugin;

	constructor(app: App, plugin: PublishGitHubPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// Add repo button
		new Setting(containerEl)
			.setName('Add GitHub Repository')
			.setDesc('Add a new GitHub repository configuration')
			.addButton(button => button
				.setButtonText('Add Repo')
				.onClick(() => this.addRepo()));

		// Repo list
		this.plugin.settings.repos.forEach((repo, index) => {
			const repoContainer = containerEl.createDiv('repo-container');

			new Setting(repoContainer)
				.setName(`Repo ${index + 1}: ${repo.id}`)
				.setDesc(`${repo.username}/${repo.reponame}`)
				.addButton(button => button
					.setIcon('pencil')
					.setTooltip('Edit')
					.onClick(() => this.editRepo(index)))
				.addButton(button => button
					.setIcon('trash')
					.setTooltip('Delete')
					.onClick(() => this.deleteRepo(index)));

			// Default repo toggle
			if (this.plugin.settings.defaultRepo === repo.id) {
				new Setting(repoContainer)
					.setName('Default Repo')
					.setDesc('This is the default repository for publishing')
					.addToggle(toggle => toggle
						.setValue(true)
						.onChange(async (value) => {
							if (value) {
								this.plugin.settings.defaultRepo = repo.id;
								await this.plugin.saveSettings();
								this.display(); // Refresh to show only one default
							}
						}));
			}
		});
	}

	async addRepo() {
		const newRepo: GitHubRepoConfig = {
			id: `repo-${Date.now()}`,
		token: '',
		username: '',
		reponame: '',
		branch: 'main'
		};

		this.plugin.settings.repos.push(newRepo);
		await this.plugin.saveSettings();
		this.editRepo(this.plugin.settings.repos.length - 1);
	}

	async editRepo(index: number) {
		const repo = this.plugin.settings.repos[index];
		const modal = new RepoEditModal(this.app, repo, async (updatedRepo) => {
			this.plugin.settings.repos[index] = updatedRepo;
			await this.plugin.saveSettings();
			this.display();
		});
		modal.open();
	}

	async deleteRepo(index: number) {
		this.plugin.settings.repos.splice(index, 1);
		// If we deleted the default repo, clear the default
		if (this.plugin.settings.defaultRepo === this.plugin.settings.repos[index]?.id) {
			this.plugin.settings.defaultRepo = '';
		}
		await this.plugin.saveSettings();
		this.display();
	}
}

class RepoEditModal extends Modal {
	repo: GitHubRepoConfig;
	onSave: (repo: GitHubRepoConfig) => Promise<void>;

	constructor(app: App, repo: GitHubRepoConfig, onSave: (repo: GitHubRepoConfig) => Promise<void>) {
		super(app);
		this.repo = {...repo};
		this.onSave = onSave;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.addClass('repo-edit-modal');

		contentEl.createEl('h2', { text: 'Edit GitHub Repository' });

		// Repo ID
		new Setting(contentEl)
			.setName('Repo ID')
			.setDesc('A unique identifier for this repo (e.g., "blog")')
			.addText(text => text
				.setValue(this.repo.id)
				.onChange(value => this.repo.id = value));

		// GitHub Token
		new Setting(contentEl)
			.setName('GitHub Token')
			.setDesc('Personal Access Token with repo scope')
			.addText(text => text
				.setValue(this.repo.token)
				.onChange(value => this.repo.token = value));

		// GitHub Username
		new Setting(contentEl)
			.setName('GitHub Username')
			.setDesc('Your GitHub username')
			.addText(text => text
				.setValue(this.repo.username)
				.onChange(value => this.repo.username = value));

		// GitHub Repository Name
		new Setting(contentEl)
			.setName('Repository Name')
			.setDesc('Name of the GitHub repository')
			.addText(text => text
				.setValue(this.repo.reponame)
				.onChange(value => this.repo.reponame = value));

		// Branch Name
		new Setting(contentEl)
			.setName('Branch Name')
			.setDesc('Default branch for publishing (e.g., main or master)')
			.addText(text => text
				.setValue(this.repo.branch || 'main')
				.onChange(value => this.repo.branch = value));

		// Save button
		const saveBtn = contentEl.createEl('button', { text: 'Save', cls: 'mod-cta' });
		saveBtn.addEventListener('click', async () => {
			await this.onSave(this.repo);
			this.close();
		});

		contentEl.appendChild(saveBtn);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
