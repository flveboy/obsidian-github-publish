# obsidian-github-publish
publish article to different github accounts or repos;
1. 发布文章到不同的github仓库或者账号；
2. 可以配置多个repo，每个里面配置不同的账户或者不同的仓库；
3. 具体的路径则放在frontmatter中，具体使用方案见readme

# 说明
1. obsidian中安装本插件
2. 在设置里面添加repo信息，然后保存
   <img width="819" height="675" alt="image" src="https://github.com/user-attachments/assets/5552ff7d-e891-4f86-b113-69d9b1e32c10" />
3. md中的frontmatter中添加
   - repo: my-repo-id                                                 # 第2步配置的repo id
   - path: src/content/blog/                                          # github上的路径
   - branch: feature-branch                                           # 分支，默认是main，可以不加；如果不是main则要写的
   - commit: "Update documentation for new feature"                   # github的提交信息
   
   
