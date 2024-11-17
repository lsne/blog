# VitePress 搭建个人网站

### 初始化 VitePress 项目

#### 1. 环境准备

```
Node.js 18 及以上版本
```

Node.js 环境搭建请看环境搭建文档

#### 2. 创建项目

```bash
mkdir blog
cd blog
```

#### 3. 创建 `.gitignore` 文件

> `vim .gitignore`

```
node_modules
.DS_Store
dist
.vitepress/dist
dist-ssr
*.local
.eslintcache
report.html
vite.config.*.timestamp*

yarn.lock
npm-debug.log*
.pnpm-error.log*
.pnpm-debug.log
tests/**/coverage/

# Editor directories and files
.idea
*.suo
*.ntvs*
*.njsproj
*.sln
tsconfig.tsbuildinfo
```

#### 4. 初始化项目

```bash
pnpm init
pnpm add -D vitepress
pnpm install -D markdown-it-mathjax3   #如果需要支持 math 数学函数, 则需要安装此插件
pnpm vitepress init
```

#### 5. 创建 `public` 目录并添加图标文件

```bash
mkdir public

favicon.ico            // 浏览器标签图标
vitepress-logo-large.webp  // 网页首页图片
vitepress-logo-mini.svg    // 网页图标
```

#### 6. 修改 `index.md` 主页

> `vim index.md`

```md
---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "我的随笔"
  text: "风雨蹉跎十二载"
  tagline: 刚毕业前几年由于各种原因没有记录笔记, 之后的工作学习笔记全在这里了。将笔记做到页面上方便以后使用时可以随时随地查看。
  image:
      src: /vitepress-logo-large.webp
      alt: VitePress
  actions:
    - theme: brand
      text: 开发语言
      link: /02-languages/01-C++/01-01-C++开发环境准备
    - theme: alt
      text: 数据库
      link: /03-databases/02-mysql/getting-started
    - theme: brand
      text: kubernetes
      link: /04-kubernetes/getting-started
    - theme: alt
      text: Linux 系统
      link: /05-services/02-linux/getting-started

features:
  - icon: 📝
    title: '开发语言'
    details: 'C, C++, Rust, Go, Python, Shell, Node.js'
    link: /02-languages/01-C++/01-01-C++开发环境准备
  - icon: 🚀
    title: '存储与数据库'
    details: Ceph, MySQL, PostgreSQL, MongoDB, Redis, ElasticSearch, Clickhouse, etcd
    link: /03-databases/02-mysql/getting-started
  - icon: ☸️
    title: 'kubernetes'
    details: k8s 相关技术积累
    link: /04-kubernetes/getting-started
  - icon: ⚙️
    title: 'Linux 系统'
    details: Linux 相关技术积累
    link: /05-services/02-linux/getting-started
---
```

#### 7. 创建样式文件

```bash
mkdir -p .vitepress/theme/style
touch .vitepress/theme/style/var.css
touch .vitepress/theme/index.ts
```

#### 8. 创建样式并引用

> 创建样式: `vim .vitepress/theme/style/var.css`

```css
:root {
    --vp-home-hero-name-color: transparent;
    --vp-home-hero-name-background: -webkit-linear-gradient(120deg, #bd34fe 30%, #41d1ff);
  
    --vp-home-hero-image-background-image: linear-gradient(-45deg, #bd34fe 50%, #47caff 50%);
    --vp-home-hero-image-filter: blur(44px);
  }
  
  @media (min-width: 640px) {
    :root {
      --vp-home-hero-image-filter: blur(56px);
    }
  }
  
  @media (min-width: 960px) {
    :root {
      --vp-home-hero-image-filter: blur(68px);
    }
  }
```

> 引用样式: `vim .vitepress/theme/index.ts`

```ts
import Theme from "vitepress/theme";
import './style/var.css'

export default {
    ...Theme
}
```
#### 9. 修改配置文件

> `vim .vitepress/config.mts`

```ts
import { DefaultTheme, defineConfig } from 'vitepress'

export default defineConfig({
  base: "/blog/",
  head: [['link', { rel: 'icon', href: '/blog/favicon.ico' }]],
  title: "我的随笔",
  description: "风雨蹉跎十二载",
  markdown: {
    math: true,
    // lineNumbers: true // 代码块显示行号
  },
  themeConfig: {
    logo: '/vitepress-logo-mini.svg',
    nav: nav(),
    footer: {
      message: '基于 MIT 许可发布',
      copyright: `版权所有 © 2024-${new Date().getFullYear()} 刘赛男`
    },
    docFooter: {
      prev: '上一页',
      next: '下一页'
    },
    outline: {
      label: '页面导航',
      level : 'deep' // 可以是: [1,2] | [1,3] | [2,4] | 'deep' | false  // [2,5] 表示展示 2,3,4,5 级标题
    },
    // editLink: {   // 每次部署都会从私有仓库拷贝全量的笔记软件, 这里的在线编辑没有意义
    //   pattern: 'https://github.com/lsne/blog/master/:path',
    //   text: '在 Github 上编辑此页面'
    // },
    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'medium'
      }
    },
    sidebar: {
      '/01-tools/': { base: '/01-tools/', items: sidebarTools() },
      '/02-languages/': { base: '/02-languages/', items: sidebarLanguages() },
      '/03-databases/': { base: '/03-databases/', items: sidebarDatabases() },
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/lsne/blog' }
    ]
  }
})

function nav(): DefaultTheme.NavItem[] {
  return [{
    text: '环境与工具',
    link: '/01-tools/01-Windows-环境准备'
  },{
    text: '开发语言',
    items: [{
        text: 'C & C++',
        link: '/02-languages/01-C++/01-01-C++开发环境准备'
      },{
        text: 'Rust',
        link: '/02-languages/02-Rust/01-Rust-安装'
      },{
        text: 'Go',
        link: '/02-languages/03-Go/01-Go-安装'
      }]},{
    text: "存储与数据库",
    items: [{
        text: 'Ceph',
        link: '/03-databases/01-ceph/getting-started'
      },{
        text: 'MySQL',
        link: '/03-databases/02-mysql/getting-started'
      },{
        text: 'PostgreSQL',
        link: '/03-databases/03-postgresql/getting-started'
      }]}]
}

function sidebarTools(): DefaultTheme.SidebarItem[] {
  return [{
    text: '系统环境与工具',
    base: '/01-tools/',
    // collapsed 参数:
    // 不写, 则子目录永远展开
    // 值为: false, 则子目录默认展开状态, 可点击闭合
    // 值为: true, 则子目录默认闭合状态, 可点击展开
    collapsed: false,
    items: [
      { text: '系统盘制作工具', link: '01-01-系统盘制作工具' },
      { text: '代理工具', link: '01-02-代理工具' },
      { text: 'Windows 环境准备', link: '02-01-Windows-环境准备' },
      { text: 'Ubuntu 环境准备', link: '02-02-Ubuntu-环境准备' },
    ]
  },{
    text: '本站文档库',
    items: [
      { text: '环境与工具', base: '/01-tools/', link: '05-01-Git-使用' },
      { text: '开发语言', base: '/02-languages/01-C++/', link: '01-01-C++开发环境准备' },
      { text: '存储与数据库', base: '/03-databases/01-ceph/', link: '01-01-二进制部署-Ceph-集群-Ubuntu-22.04' }
    ]
  }]
}

function sidebarLanguages(): DefaultTheme.SidebarItem[] {
  return [{
    text: 'C & C++',
    base: '/02-languages/01-C++/',
    collapsed: false,
    items: [
      { text: 'C++开发环境准备', link: '01-01-C++开发环境准备' },
      { text: 'C-C++开源库整理', link: '01-02-C-C++开源库整理' },
      { text: '编译 和 make', link: '03-01-编译和make' },
      { text: 'C语言常见问题和在C++中的处理', link: '03-02-C语言常见问题和在C++中的处理' },
      { text: 'CC-基本语法', link: '03-03-CC-基本语法' },
    ]
  },{
    text: 'Rust',
    base: '/02-languages/02-Rust/',
    collapsed: false,
    items: [
      { text: 'Rust 开发环境准备', link: '01-01-Rust-开发环境准备' },
      { text: 'Rust 开源库整理', link: '01-02-Rust-开源库整理' },
      { text: 'Rust 交叉编译', link: '03-01-Rust-交叉编译' },
      { text: 'Rust 基础语法', link: '03-03-Rust-基础语法' },
    ]
  },{
    text: '本站文档库',
    items: [
      { text: '环境与工具', base: '/01-tools/', link: '05-01-Git-使用' },
      { text: '开发语言', base: '/02-languages/01-C++/', link: '01-01-C++开发环境准备' },
      { text: '存储与数据库', base: '/03-databases/01-ceph/', link: '01-01-二进制部署-Ceph-集群-Ubuntu-22.04' }
    ]
  }]
}

function sidebarDatabases(): DefaultTheme.SidebarItem[] {
  return [{
    text: 'Ceph',
    base: '/03-databases/01-Ceph/',
    collapsed: false,
    items: [
      { text: '二进制部署 Ceph 集群 - Ubuntu 22.04', link: '01-01-二进制部署-Ceph-集群-Ubuntu-22.04' },
      { text: 'Ubuntu 环境准备', link: '02-Ubuntu-环境准备' }
    ]
  },{
    text: 'MySQL',
    base: '/03-databases/02-MySQL/',
    collapsed: false,
    items: [
      { text: 'MySQL 基本操作', link: '03-01-MySQL-基本操作' },
    ]
  },{
    text: '本站文档库',
    items: [
      { text: '环境与工具', base: '/01-tools/', link: '05-01-Git-使用' },
      { text: '开发语言', base: '/02-languages/01-C++/', link: '01-01-C++开发环境准备' },
      { text: '存储与数据库', base: '/03-databases/01-ceph/', link: '01-01-二进制部署-Ceph-集群-Ubuntu-22.04' }
    ]
  }]
}
```

#### 10. 创建目录结构以及 `.md` 文件

> 根据 mypress/.vitepress/config.mts 配置文件中的定义, 创建 markdown 文档的目录结构和 .md 文件, 然后编写 markdown 文档

#### 11. 开发环境运行测试

```bash
pnpm docs:dev --host 0.0.0.0
```

### 部署 VitePress 到 Nginx

#### 1. 编译为静态文件

```bash
pnpm docs:build

# 编译完成后, 静态文件在: .vitepress/dist 目录
```

#### 2. 编辑 nginx 配置文件

> `vim /etc/nginx/conf.d/vitepress.conf`

```nginx
server {
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    listen 80;
    server_name _;
    index index.html;

    location /blog {
        # content location
        root /home/ls/workspace/blog;

        # exact matches -> reverse clean urls -> folders -> not found
        try_files $uri $uri.html $uri/ =404;

        # non existent pages
        error_page 404 /404.html;

        # a folder without index.html raises 403 in this setup
        error_page 403 /404.html;

        # adjust caching headers
        # files in the assets folder have hashes filenames
        location ~* ^/assets/ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

#### 3. 启动 nginx

```bash
systemctl restart nginx
```

### 部署 VitePress 到 GitHub Pages

#### 1. 创建 `workflows` 文件

> `mkdir -p .github/workflows`
> `vim .github/workflows/deploy.yml`

```yaml
# 构建 VitePress 站点并将其部署到 GitHub Pages 的示例工作流程
#
name: 部署 VitePress 到 GitHub Pages

on:
  # 在针对 `main` 分支的推送上运行。如果你
  # 使用 `master` 分支作为默认分支，请将其更改为 `master`
  push:
    branches: [main]

  # 允许你从 Actions 选项卡手动运行此工作流程
  workflow_dispatch:

# 设置 GITHUB_TOKEN 的权限，以允许部署到 GitHub Pages
permissions:
  contents: read
  pages: write
  id-token: write

# 只允许同时进行一次部署，跳过正在运行和最新队列之间的运行队列
# 但是，不要取消正在进行的运行，因为我们希望允许这些生产部署完成
concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  # 构建工作
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0 # 如果未启用 lastUpdated，则不需要
      - uses: pnpm/action-setup@v3 # 如果使用 pnpm，请取消此区域注释
        with:
          version: 9
      # - uses: oven-sh/setup-bun@v1 # 如果使用 Bun，请取消注释
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm # 或 pnpm / yarn
      - name: Setup Pages
        uses: actions/configure-pages@v4
      - name: Install dependencies
        run: pnpm install # 或 pnpm install / yarn install / bun install
      - name: Build with VitePress
        run: pnpm docs:build # 或 pnpm docs:build / yarn docs:build / bun run docs:build
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: .vitepress/dist

  # 部署工作
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    needs: build
    runs-on: ubuntu-latest
    name: Deploy
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### 部署 VitePress 到 Gitlab Page


> [!WARNING] 未测试
> 由于内网镜像以及内网依赖问题, 未在 gitlab 环境测试成功, 后续有机会再试试

#### 1. 创建 `.gitlab-ci.yml` 文件

```yml
image: node:20
pages:
  cache:
    paths:
      - node_modules/
  script:
    # - apk add git # 如果你使用的是像 alpine 这样的小型 docker 镜像，并且启用了 lastUpdated，请取消注释
    - npm install -g pnpm
    - pnpm install
    - pnpm run docs:build
  artifacts:
    paths:
      - public
  only:
    - master
```