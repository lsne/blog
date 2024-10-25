import { DefaultTheme, defineConfig } from 'vitepress'

export default defineConfig({
  base: "/blog/",
  head: [['link', { rel: 'icon', href: '/blog/favicon.ico' }]],
  title: "随笔",
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
      level : "deep" // 可以是: [1,2,3,4,5,6] | 'deep' | false
    },
    editLink: {
      pattern: 'https://github.com/lsne/blog/master/:path',
      text: '在 Github 上编辑此页面'
    },
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
      '/05-services/': { base: '/05-services/', items: sidebarServices() },
      '/06-other/': { base: '/02-other/', items: sidebarOther() },
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/lsne/blog' }
    ]
  }
})

function nav(): DefaultTheme.NavItem[] {
  return [{
    text: '环境与工具',
    items: [{
        text: '系统环境',
        link: '/01-tools/01-env/01-Windows-环境准备'
      },{
        text: '开发工具',
        link: '/01-tools/02-tools/01-01-系统盘制作工具'
      }
    ]},{
    text: '开发语言',
    items: [{
        text: 'C & C++',
        link: '/02-languages/01-C和C++/01-01-C++开发环境准备'
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
        link: '/05-services/02-linux/getting-started'
      },{
        text: 'prometheus',
        link: '/05-services/03-prometheus/getting-started'
      }]},{
    text: "其他",
    link: '/06-other/getting-started'
  }]
}

function sidebarTools(): DefaultTheme.SidebarItem[] {
  return [{
    text: '系统环境',
    base: '/01-tools/01-env/',
    // collapsed 参数:
    // 不写, 则子目录永远展开
    // 值为: false, 则子目录默认展开状态, 可点击闭合
    // 值为: true, 则子目录默认闭合状态, 可点击展开
    collapsed: false,
    items: [
      { text: 'Windows 环境准备', link: '01-Windows-环境准备' },
      { text: 'Ubuntu 环境准备', link: '02-Ubuntu-环境准备' }
    ]
  },{
    text: '开发工具',
    base: '/01-tools/02-tools/',
    collapsed: false,
    items: [
      { text: '系统盘制作工具', link: '01-01-系统盘制作工具' },
      { text: '代理工具', link: '01-02-代理工具' }
    ]
  },{
    text: '本站文档',
    // collapsed: false,
    items: [
      { text: '环境与工具', base: '/01-tools/01-env/', link: '01-Windows-环境准备' },
      { text: '开发语言', base: '/02-languages/01-C和C++/', link: '01-01-C++开发环境准备' },
      { text: '存储与数据库', base: '/03-databases/01-ceph/getting-started', link: 'getting-started' },
      { text: 'kubernetes', base: '/04-kubernetes/getting-started', link: 'getting-started' },
      { text: '系统与软件', base: '/05-services/02-linux/', link: 'getting-started' },
      { text: '其他', base: '/06-other/', link: 'getting-started' }
    ]
  }]
}

function sidebarLanguages(): DefaultTheme.SidebarItem[] {
  return [{
    text: '系统环境',
    base: '/01-tools/01-env/',
    // collapsed 参数:
    // 不写, 则子目录永远展开
    // 值为: false, 则子目录默认展开状态, 可点击闭合
    // 值为: true, 则子目录默认闭合状态, 可点击展开
    collapsed: false,
    items: [
      { text: 'Windows 环境准备', link: '01-Windows-环境准备' },
      { text: 'Ubuntu 环境准备', link: '02-Ubuntu-环境准备' }
    ]
  },{
    text: '开发工具',
    base: '/01-tools/02-tools/',
    collapsed: false,
    items: [
      { text: '系统盘制作工具', link: '01-01-系统盘制作工具' },
      { text: '代理工具', link: '01-02-代理工具' }
    ]
  },{
    text: '本站文档',
    // collapsed: false,
    items: [
      { text: '环境与工具', base: '/01-tools/01-env/', link: '01-Windows-环境准备' },
      { text: '开发语言', base: '/02-languages/01-C和C++/', link: '01-01-C++开发环境准备' },
      { text: '存储与数据库', base: '/03-databases/01-ceph/getting-started', link: 'getting-started' },
      { text: 'kubernetes', base: '/04-kubernetes/getting-started', link: 'getting-started' },
      { text: '系统与软件', base: '/05-services/02-linux/', link: 'getting-started' },
      { text: '其他', base: '/06-other/', link: 'getting-started' }
    ]
  }]
}

function sidebarDatabases(): DefaultTheme.SidebarItem[] {
  return [{
    text: '系统环境',
    base: '/01-tools/01-env/',
    // collapsed 参数:
    // 不写, 则子目录永远展开
    // 值为: false, 则子目录默认展开状态, 可点击闭合
    // 值为: true, 则子目录默认闭合状态, 可点击展开
    collapsed: false,
    items: [
      { text: 'Windows 环境准备', link: '01-Windows-环境准备' },
      { text: 'Ubuntu 环境准备', link: '02-Ubuntu-环境准备' }
    ]
  },{
    text: '开发工具',
    base: '/01-tools/02-tools/',
    collapsed: false,
    items: [
      { text: '系统盘制作工具', link: '01-01-系统盘制作工具' },
      { text: '代理工具', link: '01-02-代理工具' }
    ]
  },{
    text: '本站文档',
    // collapsed: false,
    items: [
      { text: '环境与工具', base: '/01-tools/01-env/', link: '01-Windows-环境准备' },
      { text: '开发语言', base: '/02-languages/01-C和C++/', link: '01-01-C++开发环境准备' },
      { text: '存储与数据库', base: '/03-databases/01-ceph/getting-started', link: 'getting-started' },
      { text: 'kubernetes', base: '/04-kubernetes/getting-started', link: 'getting-started' },
      { text: '系统与软件', base: '/05-services/02-linux/', link: 'getting-started' },
      { text: '其他', base: '/06-other/', link: 'getting-started' }
    ]
  }]
}

function sidebarKubernetes(): DefaultTheme.SidebarItem[] {
  return [{
    text: '系统环境',
    base: '/01-tools/01-env/',
    // collapsed 参数:
    // 不写, 则子目录永远展开
    // 值为: false, 则子目录默认展开状态, 可点击闭合
    // 值为: true, 则子目录默认闭合状态, 可点击展开
    collapsed: false,
    items: [
      { text: 'Windows 环境准备', link: '01-Windows-环境准备' },
      { text: 'Ubuntu 环境准备', link: '02-Ubuntu-环境准备' }
    ]
  },{
    text: '开发工具',
    base: '/01-tools/02-tools/',
    collapsed: false,
    items: [
      { text: '系统盘制作工具', link: '01-01-系统盘制作工具' },
      { text: '代理工具', link: '01-02-代理工具' }
    ]
  },{
    text: '本站文档',
    // collapsed: false,
    items: [
      { text: '环境与工具', base: '/01-tools/01-env/', link: '01-Windows-环境准备' },
      { text: '开发语言', base: '/02-languages/01-C和C++/', link: '01-01-C++开发环境准备' },
      { text: '存储与数据库', base: '/03-databases/01-ceph/getting-started', link: 'getting-started' },
      { text: 'kubernetes', base: '/04-kubernetes/getting-started', link: 'getting-started' },
      { text: '系统与软件', base: '/05-services/02-linux/', link: 'getting-started' },
      { text: '其他', base: '/06-other/', link: 'getting-started' }
    ]
  }]
}

function sidebarServices(): DefaultTheme.SidebarItem[] {
  return [{
    text: '系统环境',
    base: '/01-tools/01-env/',
    // collapsed 参数:
    // 不写, 则子目录永远展开
    // 值为: false, 则子目录默认展开状态, 可点击闭合
    // 值为: true, 则子目录默认闭合状态, 可点击展开
    collapsed: false,
    items: [
      { text: 'Windows 环境准备', link: '01-Windows-环境准备' },
      { text: 'Ubuntu 环境准备', link: '02-Ubuntu-环境准备' }
    ]
  },{
    text: '开发工具',
    base: '/01-tools/02-tools/',
    collapsed: false,
    items: [
      { text: '系统盘制作工具', link: '01-01-系统盘制作工具' },
      { text: '代理工具', link: '01-02-代理工具' }
    ]
  },{
    text: '本站文档',
    // collapsed: false,
    items: [
      { text: '环境与工具', base: '/01-tools/01-env/', link: '01-Windows-环境准备' },
      { text: '开发语言', base: '/02-languages/01-C和C++/', link: '01-01-C++开发环境准备' },
      { text: '存储与数据库', base: '/03-databases/01-ceph/getting-started', link: 'getting-started' },
      { text: 'kubernetes', base: '/04-kubernetes/getting-started', link: 'getting-started' },
      { text: '系统与软件', base: '/05-services/02-linux/', link: 'getting-started' },
      { text: '其他', base: '/06-other/', link: 'getting-started' }
    ]
  }]
}

function sidebarOther(): DefaultTheme.SidebarItem[] {
  return [{
    text: '其他',
    collapsed: false,
    items: [
      { text: '简介', link: 'dbup-introduction' },
      { text: '快速开始', link: 'dbup-getting-started' }
    ]
  },{
    text: '本站文档',
    // collapsed: false,
    items: [
      { text: '环境与工具', base: '/01-tools/01-env/', link: '01-Windows-环境准备' },
      { text: '开发语言', base: '/02-languages/01-C和C++/', link: '01-01-C++开发环境准备' },
      { text: '存储与数据库', base: '/03-databases/01-ceph/getting-started', link: 'getting-started' },
      { text: 'kubernetes', base: '/04-kubernetes/getting-started', link: 'getting-started' },
      { text: '系统与软件', base: '/05-services/02-linux/', link: 'getting-started' },
      { text: '其他', base: '/06-other/', link: 'getting-started' }
    ]
  }]
}