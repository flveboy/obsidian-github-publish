# Publish to GitHub Plugin for Obsidian

This plugin allows you to publish markdown files from Obsidian to GitHub repositories directly.

## Features

- **Right-click publishing**: Select any markdown file and publish it to GitHub with a single click
- **Multiple repositories**: Configure and manage multiple GitHub repositories
- **GitHub API integration**: Uses GitHub API to publish files securely
- **Settings panel**: Easy configuration of GitHub credentials and repositories

## Installation

### Manual Installation

1. Download the latest release from the GitHub repository
2. Extract the files into a folder named `publish-github-plugin`
3. Copy the folder to your Obsidian plugins directory:
   - Windows: `%APPDATA%\Obsidian\plugins\`
   - Mac: `~/Library/Application Support/obsidian/plugins/`
   - Linux: `~/.config/obsidian/plugins/`
4. Reload Obsidian
5. Enable the plugin in the settings

### Development Installation

1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run dev` to start the development server
4. Copy the plugin to your Obsidian plugins directory (use a symbolic link for easier development)
5. Reload Obsidian and enable the plugin

## Configuration

1. Go to Obsidian settings and open the "Publish to GitHub" tab
2. Add your GitHub personal access token (with repo scope)
3. Configure one or more repositories:
   - Repository owner (username or organization)
   - Repository name
   - Branch name (e.g., main or master)
   - Root directory in the repository

## Usage

### Using Frontmatter (Recommended)

Add frontmatter to your markdown files to specify publication settings:

```markdown
---
repo: my-repo-id
path: docs/my-file.md
branch: feature-branch
commit: "Update documentation for new feature"
---

Your markdown content here...
```

- **repo**: (Optional) The ID of the GitHub repository to publish to (overrides default)
- **path**: (Optional) The path in the repository where the file will be published. If the path ends with a slash, the filename will be appended automatically
- **branch**: (Optional) The branch in the repository to publish to (overrides repository default)
- **commit**: (Optional) Custom commit message for this publication

### Manual Publishing

1. Right-click on any markdown file in the Obsidian file explorer
2. Select "Publish to GitHub"
3. The file will be published to the configured GitHub repository (using frontmatter or default settings)

## Building

- Run `npm run build` to build the plugin
- The built files will be generated in the root directory (main.js, styles.css)

## Configuration Details

### GitHub Personal Access Token

To generate a personal access token:
1. Go to GitHub Settings > Developer settings > Personal access tokens
2. Click "Generate new token"
3. Give the token a name and select the "repo" scope
4. Click "Generate token" and copy it to the plugin settings

### Repository Configuration

- **Owner**: The GitHub username or organization that owns the repository
- **Name**: The name of the repository
- **Branch**: The branch to publish files to (default: main)
- **Root Directory**: The directory in the repository where files will be published (default: /)

## API Endpoints

The plugin uses the following GitHub API endpoints:
- `GET /repos/{owner}/{repo}/contents/{path}` - Check if a file exists
- `PUT /repos/{owner}/{repo}/contents/{path}` - Create or update a file

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
