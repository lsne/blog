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
      '/04-kubernetes/': { base: '/04-kubernetes/', items: sidebarKubernetes() },
      '/05-linux/': { base: '/05-linux/', items: sidebarLinux() },
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
      },{
        text: 'Python',
        link: '/02-languages/04-Python/01-Python-安装'
      },{
        text: 'Shell',
        link: '/02-languages/02-Shell/01-常用语法'
      },{
        text: 'Node.js',
        link: '/02-languages/02-Rust/01-Node.js-安装'
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
      },{
        text: 'MongoDB',
        link: '/03-databases/04-mongodb/getting-started'
      },{
        text: 'Redis',
        link: '/03-databases/05-redis/getting-started'
      },{
        text: 'ElasticStack',
        link: '/03-databases/06-ElasticStack/getting-started'
      },{
        text: 'Clickhouse',
        link: '/03-databases/07-Clickhouse/getting-started'
      },{
        text: 'etcd',
        link: '/03-databases/08-etcd/getting-started'
      },{
        text: '达梦8',
        link: '/03-databases/09-dm8/getting-started'
      }]},{
    text: "kubernetes",
    link: '/04-kubernetes/getting-started'
  },{
    text: "系统与软件",
    items: [{
        text: 'Linux',
        link: '/05-linux/02-linux/getting-started'
      },{
        text: 'prometheus',
        link: '/05-linux/03-prometheus/getting-started'
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
      { text: 'Android 软件清单', link: '02-03-Android-软件清单' },
      { text: 'Linux 开发环境准备', link: '02-04-Linux-开发环境准备' },
      { text: 'Goland 环境配置', link: '03-01-Goland-环境配置' },
      { text: 'VSCode 使用', link: '03-02-VSCode-使用' },
      { text: 'Obsidian 插件', link: '03-03-Obsidian-插件' },
      { text: 'Markdown 语法格式', link: '03-04-Markdown-语法格式' },
      { text: 'Git 使用', link: '05-01-Git-使用' },
      { text: 'Hugo 搭建个人网站', link: '06-01-Hugo-搭建个人网站' },
      { text: 'VitePress 搭建个人网站', link: '06-02-VitePress-搭建个人网站' },
      { text: '虚拟机共享网络给宿主机', link: '07-01-虚拟机共享网络给宿主机' },
      { text: '华为云搭建 VPN 服务器', link: '07-02-华为云搭建-VPN-服务器' },
    ]
  },{
    text: '本站文档库',
    items: [
      { text: '环境与工具', base: '/01-tools/', link: '05-01-Git-使用' },
      { text: '开发语言', base: '/02-languages/01-C++/', link: '01-01-C++开发环境准备' },
      { text: '存储与数据库', base: '/03-databases/01-ceph/', link: '01-01-二进制部署-Ceph-集群-Ubuntu-22.04' },
      { text: 'kubernetes', base: '/04-kubernetes/', link: '01-01-二进制部署-kubernetes' },
      { text: '系统与软件', base: '/05-linux/02-linux/', link: '01-01-Linux-笔记' }
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
      { text: '存储与数据库', base: '/03-databases/01-ceph/', link: '01-01-二进制部署-Ceph-集群-Ubuntu-22.04' },
      { text: 'kubernetes', base: '/04-kubernetes/', link: '01-01-二进制部署-kubernetes' },
      { text: '系统与软件', base: '/05-linux/02-linux/', link: '01-01-Linux-笔记' }
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
      { text: '存储与数据库', base: '/03-databases/01-ceph/', link: '01-01-二进制部署-Ceph-集群-Ubuntu-22.04' },
      { text: 'kubernetes', base: '/04-kubernetes/', link: '01-01-二进制部署-kubernetes' },
      { text: '系统与软件', base: '/05-linux/02-linux/', link: '01-01-Linux-笔记' }
    ]
  }]
}

function sidebarKubernetes(): DefaultTheme.SidebarItem[] {
  return [{
    text: 'kubernetes',
    base: '/04-kubernetes/',
    collapsed: false,
    items: [
      { text: '二进制部署 kubernetes', link: '01-01-二进制部署-kubernetes' }
    ]
  },{
    text: '本站文档库',
    items: [
      { text: '环境与工具', base: '/01-tools/', link: '05-01-Git-使用' },
      { text: '开发语言', base: '/02-languages/01-C++/', link: '01-01-C++开发环境准备' },
      { text: '存储与数据库', base: '/03-databases/01-ceph/', link: '01-01-二进制部署-Ceph-集群-Ubuntu-22.04' },
      { text: 'kubernetes', base: '/04-kubernetes/', link: '01-01-二进制部署-kubernetes' },
      { text: '系统与软件', base: '/05-linux/02-linux/', link: '01-01-Linux-笔记' }
    ]
  }]
}

function sidebarLinux(): DefaultTheme.SidebarItem[] {
  return [{
    text: 'Linux',
    base: '/05-Linux/02-linux/',
    collapsed: false,
    items: [
      { text: 'Windows 环境准备', link: '01-01-Linux-笔记' },
    ]
  },{
    text: 'Prometheus',
    base: '/05-Linux/03-Prometheus/',
    collapsed: false,
    items: [
      { text: '系统盘制作工具', link: '01-01-prometheus-二进制部署' },
    ]
  },{
    text: '本站文档库',
    items: [
      { text: '环境与工具', base: '/01-tools/', link: '05-01-Git-使用' },
      { text: '开发语言', base: '/02-languages/01-C++/', link: '01-01-C++开发环境准备' },
      { text: '存储与数据库', base: '/03-databases/01-ceph/', link: '01-01-二进制部署-Ceph-集群-Ubuntu-22.04' },
      { text: 'kubernetes', base: '/04-kubernetes/', link: '01-01-二进制部署-kubernetes' },
      { text: '系统与软件', base: '/05-linux/02-linux/', link: '01-01-Linux-笔记' }
    ]
  }]
}