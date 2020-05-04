## 简介

>这是我的[个人博客](https://hujinbo.me)项目源码，使用高效的静态站点生成框架[Hexo](https://github.com/hexojs/hexo)和简洁优雅的主题[Next](https://github.com/theme-next/hexo-theme-next)搭建，它基于Node.js，拥有超快的渲染速度，支持 GitHub Flavored Markdown 的所有功能，只需一条指令即可部署到 GitHub Pages。
  

## 安装

1. 克隆最新的代码到电脑上（默认分支为 `hexo`，`master` 分支用于部署GitHub Pages）：

    ```bash
    git clone --recursive git@github.com:hujinbo/hujinbo.github.io.git
    ```

2. 下载完成后，请执行以下命令，安装所依赖的插件：

    ```bash
    cd hujinbo.github.io
    yarn install
    ```
    
3. 安装Markdown解析器，[下载Pandoc](https://github.com/jgm/pandoc/releases/tag/2.9.2.1)，根据提示安装即可

4. 最后，执行启动脚本即可：

    ```bash
    yarn run start
    ```

5. 可通过浏览器访问 `localhost:4000`，检查站点是否正常运行。
  

## 配置

在项目中存在 站点配置文件：`_config.yml` 和 主题配置文件：`source/_data/next.yml` ，前者主要包含Hexo本身的配置，后者用于配置Next主题相关的选项。如下为部署仓库的配置项：

```yaml
deploy:
  type: git
  repo: git@github.com:hujinbo/hujinbo.github.io.git
  branch: master
```


用户资源存放在 `source` 文件夹下，该目录下的 Markdown 和 HTML 文件会被解析到 `public` 文件夹下，而其他文件则是直接被拷贝过去，除了 `_posts` 文件夹，以 `_` (下划线)开头命名的文件或文件夹以及隐藏的文件会被忽略。   
若文章不想被处理，则可在 Front-matter 中设置 `layout: false`，还可以在 `_config.yml` 中配置 `skip_render` 跳过指定文件的渲染，支持使用[glob 表达式](https://github.com/isaacs/node-glob)来匹配路径。如下示例：

```yaml
skip_render:
  - 'README.md' # 排除指定文件
  - 'demo/*'    # 排除单个文件夹下全部文件
  - 'demo/*.md' # 排除单个文件夹下指定类型文件
  - 'demo/**'   # 排除单个文件夹下全部文件以及子目录
```
  

## 命令

### 写作命令

```bash
# 新建文章
hexo new post "文章标题"

# 新建页面
hexo new page "页面名称"

# 新建草稿
hexo new draft "草稿标题"

# 发布草稿
hexo publish post "草稿文章标题"
```

### 启动命令

```bash
# 普通模式
hexo server

# 调试模式
hexo server --debug

# 自定义IP
hexo server -i 192.168.1.1

# 自定义端口
hexo server -p 5000

# 静态模式（只处理public文件夹内的文件）
hexo generate && hexo server -s
```

### 部署命令
```bash
# 生成静态文件
hexo generate

# 部署网站
hexo deploy -generate

# 清理缓存和静态文件
hexo clean
```

### 部署到腾讯云静态网站托管
```bash
# 安装云开发CLI工具
npm i -g @cloudbase/cli

# 初始化云开发CLI
cloudbase login

# 上传到云开发静态托管中（最后的参数为云开发环境ID）
cloudbase hosting:deploy public -e blog-178078
```
  

## 格式

Front-matter是文件开头以 `---` 包裹的区域，用来指定页面或文章的配置，支持以下配置：

    ---
    title: {{ title }}  # 文章标题
    date: {{ date }}    # 新建日期
    updated:            # 更新日期
    tags:               # 文章标签
    categories:         # 文章分类
    description:        # 文章描述
    comments: true      # 显示评论
    reward: true        # 显示赞赏
    mathjax: false      # 显示公式
    ---

需要注意的是分类具有顺序性和层次性（父子类别），而标签则没有顺序性和层次性，如下示例：

```yaml
tags:
- 标签一
- 标签二
categories:
- 分类
- 子分类
```

当然，也可以使用 `[]` 和 `,` 组合来实现同级别的并列分类 或 并列+子分类：

```yaml
categories:
- [并列分类一]
- [并列分类二]
- [并列分类一,子分类一]
- [并列分类二,子分类二]
```


## 参考

- [Hexo官方文档](https://hexo.io/zh-cn/docs/)
- [Next官方文档](https://theme-next.org/docs/)
- [腾讯云静态网站托管](https://cloud.tencent.com/document/product/1210/43365)
