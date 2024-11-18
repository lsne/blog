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
    link: '/01-tools/05-01-Git-使用'
  },{
    text: '开发语言',
    items: [{
        text: 'C & C++',
        link: '/02-languages/01-C++/01-02-C++开发环境准备'
      },{
        text: 'Rust',
        link: '/02-languages/02-Rust/01-01-Rust-开发环境准备'
      },{
        text: 'Go',
        link: '/02-languages/03-Go/01-01-Go-开发环境准备'
      },{
        text: 'Python',
        link: '/02-languages/04-Python/01-01-Python3-编译安装'
      },{
        text: 'Shell',
        link: '/02-languages/05-Shell/03-02-Shell-语法和特殊字符'
      },{
        text: 'Node.js',
        link: '/02-languages/06-Node.js/01-01-Node.js-安装部署'
      }]},{
    text: "存储与数据库",
    items: [{
        text: 'Ceph',
        link: '/03-databases/01-Ceph/01-01-Ceph-部署须知'
      },{
        text: 'MySQL',
        link: '/03-databases/02-MySQL/00-01-MySQL-知识点总结'
      },{
        text: 'PostgreSQL',
        link: '/03-databases/03-PostgreSQL/01-03-PostgreSQL-编译安装'
      },{
        text: 'MongoDB',
        link: '/03-databases/04-MongoDB/00-01-MongoDB-知识点总结'
      },{
        text: 'Redis',
        link: '/03-databases/05-Redis/00-01-Redis-知识点总结'
      },{
        text: 'ElasticStack',
        link: '/03-databases/06-ElasticStack/01-01-ElasticStack-安装部署'
      },{
        text: 'Clickhouse',
        link: '/03-databases/07-Clickhouse/02-01-Clickhouse-安装部署'
      },{
        text: 'etcd',
        link: '/03-databases/08-etcd/02-01-etcd-部署'
      },{
        text: '达梦8',
        link: '/03-databases/09-达梦8/02-01-达梦8-单机安装'
      }]},{
    text: "kubernetes",
    link: '/04-kubernetes/01-Kubernetes-基础/01-01-二进制-部署-k8s-Centos7.9'
  },{
    text: "系统与软件",
    link: '/05-linux/02-Linux/03-03-Linux-笔记'
  }]
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
      { text: 'Gogs 部署手册', link: '06-01-Gogs-部署手册' },
      { text: 'Hugo 搭建个人网站', link: '06-02-Hugo-搭建个人网站' },
      { text: 'VitePress 搭建个人网站', link: '06-03-VitePress-搭建个人网站' },
      { text: '虚拟机共享网络给宿主机', link: '07-01-虚拟机共享网络给宿主机' },
      { text: '华为云搭建 VPN 服务器', link: '07-02-华为云搭建-VPN-服务器' },
    ]
  },{
    text: '本站文档库',
    items: [
      { text: '环境与工具', base: '/01-tools/', link: '05-01-Git-使用' },
      { text: '开发语言', base: '/02-languages/01-C++/', link: '01-02-C++开发环境准备' },
      { text: '存储与数据库', base: '/03-databases/01-Ceph/', link: '01-02-ceph-二进制部署-Ubuntu-22.04' },
      { text: 'kubernetes', base: '/04-kubernetes/01-Kubernetes-基础/', link: '01-01-二进制-部署-k8s-Centos7.9' },
      { text: '系统与软件', base: '/05-linux/02-Linux/', link: '03-03-Linux-笔记' }
    ]
  }]
}

function sidebarLanguages(): DefaultTheme.SidebarItem[] {
  return [{
    text: 'C & C++',
    base: '/02-languages/01-C++/',
    collapsed: true,
    items: [
      { text: '编译', link: '01-01-编译' },
      { text: 'C++开发环境准备', link: '01-02-C++开发环境准备' },
      { text: 'C C++开源库整理', link: '02-01-C-C++开源库整理' },
      { text: 'C 基本语法', link: '03-03-C-基本语法' },
      { text: 'CC 基本语法', link: '03-04-CC-基本语法' },
      { text: 'C语言常见问题和在C++中的处理', link: '03-05-C语言常见问题和在C++中的处理' },
    ]
  },{
    text: 'Rust',
    base: '/02-languages/02-Rust/',
    collapsed: true,
    items: [
      { text: 'Rust 开发环境准备', link: '01-01-Rust-开发环境准备' },
      { text: 'Cargo 使用', link: '01-02-Cargo-使用' },
      { text: 'Rust 交叉编译', link: '01-03-Rust-交叉编译' },
      { text: 'Rust 开源库整理', link: '02-01-Rust-开源库整理' },
      { text: 'Rust 基础语法', link: '03-03-Rust-基础语法' },
      { text: 'Rust 包-错误处理-测试', link: '03-04-Rust-包-错误处理-测试' },
      { text: 'Rust 智能指针-并发-高级特性', link: '03-05-Rust-智能指针-并发-高级特性' },
    ]
  },{
    text: 'Go',
    base: '/02-languages/03-Go/',
    collapsed: true,
    items: [
      { text: 'Go 开发环境准备', link: '01-01-Go-开发环境准备' },
      { text: 'git pre commit', link: '01-02-git-pre-commit' },
      { text: 'Go 开源库整理', link: '02-03-Go-开源库整理' },
      { text: 'dep 和 mod', link: '03-01-dep-和-mod' },
      { text: 'Go 常用语法', link: '03-03-Go-常用语法' },
      { text: 'Go Test', link: '03-04-Go-Test' },
      { text: 'go ppro', link: '03-05-go-ppro' },
      { text: 'gorm', link: '05-01-gorm' },
      { text: 'Casbin', link: '05-02-Casbin' },
      { text: 'go xml', link: '05-03-go-xml' },
      { text: 'gin', link: '05-04-gin' },
      { text: 'grpc 和 go micro', link: '05-05-grpc-和-go-micro' },
      { text: 'etcd 使用', link: '05-06-etcd-使用' },
      { text: 'Go 工具整理', link: '11-01-Go-工具整理' },
    ]
  },{
    text: 'Python',
    base: '/02-languages/04-Python/',
    collapsed: true,
    items: [
      { text: 'Python3 编译安装', link: '01-01-Python3-编译安装' },
      { text: 'Python 开源库整理', link: '02-01-Python-开源库整理' },
      { text: '常用语句和小工具', link: '05-01-常用语句和小工具' },
      { text: 'Python gRPC', link: '05-02-Python-gRPC' },
      { text: 'Python pymysql', link: '05-03-Python-pymysql' },
      { text: 'Python ceph', link: '05-04-Python-ceph' },
    ]
  },{
    text: 'Shell',
    base: '/02-languages/05-Shell/',
    collapsed: true,
    items: [
      { text: 'Shell 语法和特殊字符', link: '03-02-Shell-语法和特殊字符' },
      { text: 'Shell 笔记', link: '03-03-Shell-笔记' },
    ]
  },{
    text: 'Node.js',
    base: '/02-languages/06-Node.js/',
    collapsed: true,
    items: [
      { text: 'Node.js 安装部署', link: '01-01-Node.js-安装部署' }, 
      { text: 'Windows Node.js 安装', link: '01-02-Windows-Node.js-安装' },
      { text: 'Node.js 新项目初始化', link: '01-03-Node.js-新项目初始化' },
      { text: 'Node.js require import 区别', link: '01-04-Node.js-require-import-区别' },
      { text: 'nvm Node.js 安装', link: '01-04-nvm-Node.js-安装' },
      { text: 'javascript 基础语法', link: '03-03-javascript-基础语法' },
      { text: 'Typescript 基础语法', link: '03-04-Typescript-基础语法' },
      { text: 'VUE2 基础语法', link: '03-05-VUE2-基础语法' },
      { text: 'VUE3 基础语法', link: '03-06-VUE3-基础语法' },
      { text: 'Vue3 快速上手', link: '03-07-Vue3-快速上手' },
      { text: 'vue-pure-admin 修剪', link: '05-01-vue-pure-admin-修剪' },
      { text: 'Node.js 常用模块', link: '05-02-Node.js-常用模块' },
      { text: 'webpack', link: '05-03-webpack' },
      { text: 'express web开发框架的使用', link: '05-04-express-web开发框架的使用' },
      { text: 'element ui', link: '05-05-element-ui' },
    ]
  },{
    text: '本站文档库',
    items: [
      { text: '环境与工具', base: '/01-tools/', link: '05-01-Git-使用' },
      { text: '开发语言', base: '/02-languages/01-C++/', link: '01-02-C++开发环境准备' },
      { text: '存储与数据库', base: '/03-databases/01-Ceph/', link: '01-02-ceph-二进制部署-Ubuntu-22.04' },
      { text: 'kubernetes', base: '/04-kubernetes/01-Kubernetes-基础/', link: '01-01-二进制-部署-k8s-Centos7.9' },
      { text: '系统与软件', base: '/05-linux/02-Linux/', link: '03-03-Linux-笔记' }
    ]
  }]
}

function sidebarDatabases(): DefaultTheme.SidebarItem[] {
  return [{
    text: 'Ceph',
    base: '/03-databases/01-Ceph/',
    collapsed: true,
    items: [
      { text: 'Ceph 部署须知', link: '01-01-Ceph-部署须知' },
      { text: 'ceph 二进制部署 Ubuntu 22.04', link: '01-02-ceph-二进制部署-Ubuntu-22.04' },
      { text: 'cephadm-部署-Ubuntu 22.04', link: '01-03-ceph-cephadm-部署-Ubuntu-22.04' },
      { text: 'ceph-deploy部署-Centos 7.9', link: '01-04-ceph-deploy-部署集群-Centos-7.9' },
      { text: 'ceph-ansible部署-Centos7.9', link: '01-05-ceph-ansible-部署集群-Centos7.9' },
      { text: 'ceph-anbile集群手动创建rgw', link: '01-06-ceph-anbile-部署的集群手动创建rgw节点' },
      { text: 'ceph集群配置文件', link: '02-01-ceph集群配置文件' },
      { text: 'ceph 常见运维场景', link: '03-01-ceph-常见运维场景' },
      { text: 'ceph 常用操作', link: '03-02-ceph-常用操作' },
      { text: 'ceph 配置', link: '03-03-ceph-配置' },
      { text: 'ceph 用户管理', link: '03-04-ceph-用户管理' },
      { text: 'ceph 集群管理命令', link: '03-05-ceph-集群管理命令' },
      { text: 'cephfs 操作命令', link: '03-06-cephfs-操作命令' },
      { text: 'ceph RBD 操作命令', link: '03-07-ceph-RBD-操作命令' },
      { text: 'ceph RGW 多站点', link: '03-08-ceph-RGW-多站点' },
      { text: 'ceph RGW 常用命令', link: '03-09-ceph-RGW-常用命令' },
      { text: 'ceph 故障排查', link: '04-01-ceph-故障排查' },
      { text: 's3cmd 工具的使用', link: '05-01-s3cmd-工具的使用' },
    ]
  },{
    text: 'MySQL',
    base: '/03-databases/02-MySQL/',
    collapsed: true,
    items: [
      { text: 'MySQL 知识点总结', link: '00-01-MySQL-知识点总结' },
      { text: 'MySQL 配置文件', link: '02-02-MySQL-配置文件' },
      { text: 'MySQL 主从同步', link: '02-05-MySQL-主从同步' },
      { text: 'MySQL MGR', link: '02-07-MySQL-MGR' },
      { text: 'MySQL 基本操作', link: '03-01-MySQL-基本操作' },
      { text: 'MySQL 备份与恢复', link: '03-04-MySQL-备份与恢复' },
      { text: 'MySQL 迁移', link: '04-01-MySQL-迁移' },
      { text: 'MySQL 问题排查', link: '04-01-MySQL-问题排查' },
      { text: 'MariaDB 安装部署', link: '11-01-MariaDB-安装部署' },
      { text: 'MariaDB 锁问题排查', link: '11-02-MariaDB-锁问题排查' },
      { text: 'MySQL 监控项整理', link: '21-02-MySQL-监控项整理' },
      { text: 'sysbench 压测', link: '21-03-sysbench-压测' },
    ]
  },{
    text: 'PostgreSQL',
    base: '/03-databases/03-PostgreSQL/',
    collapsed: true,
    items: [
      { text: 'PostgreSQL 编译安装', link: '01-03-PostgreSQL-编译安装' },
      { text: 'PostgreSQL 编译第三方插件', link: '01-04-PostgreSQL-编译第三方插件' },
      { text: 'PostgreSQL 升级', link: '01-06-PostgreSQL-升级' },
      { text: 'PostgreSQL 辅助工具', link: '02-01-PostgreSQL-辅助工具' },
      { text: 'PostgreSQL 配置文件', link: '02-02-PostgreSQL-配置文件' },
      { text: 'PostgreSQL 基础原理', link: '03-01-PostgreSQL-基础原理' },
      { text: 'PostgreSQL 参数设置', link: '03-02-PostgreSQL-参数设置' },
      { text: 'PostgreSQL 基本操作', link: '03-03-PostgreSQL-基本操作' },
      { text: 'PostgreSQL 管理操作', link: '03-04-PostgreSQL-管理操作' },
      { text: 'PostgreSQL 用户与权限', link: '03-05-PostgreSQL-用户与权限' },
      { text: 'PostgreSQL 备份恢复', link: '03-06-PostgreSQL-备份恢复' },
      { text: 'PostgreSQL 主从操作', link: '03-07-PostgreSQL-主从操作' },
      { text: 'PostgreSQL 监控项整理', link: '03-11-PostgreSQL-监控项整理' },
      { text: 'PostgreSQL 主备流复制', link: '04-01-PostgreSQL-主备流复制' },
      { text: 'PostgreSQL 问题处理', link: '04-01-PostgreSQL-问题处理' },
      { text: 'PostgreSQL vacuum 问题', link: '04-07-PostgreSQL-vacuum-问题' },
      { text: 'PostgreSQL 问题处理', link: '05-01-PostgreSQL-问题处理' },
      { text: 'PostgreSQL 锁问题排查', link: '05-02-PostgreSQL-锁问题排查' },
      { text: 'pg auto failover 编译和部署', link: '06-01-pg-auto-failover-编译和部署' },
      { text: 'pg auto failover 测试', link: '06-02-pg-auto-failover-测试' },
      { text: 'repmgr 部署', link: '07-01-repmgr-部署' },
      { text: 'patroni 常用操作', link: '09-01-patroni-常用操作' },
    ]
  },{
    text: 'MongoDB',
    base: '/03-databases/04-MongoDB/',
    collapsed: true,
    items: [
      { text: 'MongoDB 知识点总结', link: '00-01-MongoDB-知识点总结' },
      { text: '麒麟v10 编译 MongoDB 6.0.5', link: '01-01-麒麟v10-编译-MongoDB-6.0.5' },
      { text: 'MongoDB 配置文件', link: '02-02-MongoDB-配置文件' },
      { text: 'MongoDB 基本操作', link: '03-01-MongoDB-基本操作' },
      { text: 'MongoDB 索引', link: '03-02-MongoDB-索引' },
      { text: 'MongoDB 副本集 分片', link: '03-03-MongoDB-副本集-分片' },
      { text: 'MongoDB 分片集群迁移', link: '03-04-MongoDB-分片集群迁移' },
      { text: 'MongoDB 用户与权限', link: '03-04-MongoDB-用户与权限' },
      { text: 'MongoDB 导出导入', link: '03-05-MongoDB-导出导入' },
      { text: 'MongoDB 问题处理', link: '04-01-MongoDB-问题处理' },
      { text: 'MongoDB 3.4 修改 oplog 大小', link: '04-02-MongoDB-3.4-修改-oplog-大小' },
      { text: 'MongoDB 扫描空洞率', link: '05-01-MongoDB-扫描空洞率' },
      { text: 'MongoDB 扫描 chunk 大小', link: '05-02-MongoDB-扫描-chunk-大小' },
      { text: 'MongoDB 清理孤儿文档', link: '05-03-MongoDB-清理孤儿文档' },
      { text: 'MongoDB 压力测试', link: '09-01-MongoDB-压力测试' },
    ]
  },{
    text: 'Redis',
    base: '/03-databases/05-Redis/',
    collapsed: true,
    items: [
      { text: 'Redis 知识点总结', link: '00-01-Redis-知识点总结' },
      { text: 'Centos6.5 编译 Redis 6.0.20', link: '01-03-Centos6.5-编译-Redis-6.0.20' },
      { text: 'Redis 配置文件', link: '02-02-Redis-配置文件' },
      { text: 'Redis 开启 ACL 和 TLS', link: '02-03-Redis-开启-ACL-和-TLS' },
      { text: 'Redis 笔记', link: '03-01-Redis-笔记' },
      { text: 'Pika 笔记', link: '11-01-Pika-笔记' },
      { text: 'Pika 配置文件', link: '11-02-Pika-配置文件' },
    ]
  },{
    text: 'ElasticStack',
    base: '/03-databases/06-ElasticStack/',
    collapsed: true,
    items: [
      { text: 'ElasticStack 安装部署', link: '01-01-ElasticStack-安装部署' },
      { text: 'ElasticStack 基本操作', link: '01-02-ElasticStack-基本操作' },
      { text: '写性能', link: '03-04-写性能' },
    ]
  },{
    text: 'Clickhouse',
    base: '/03-databases/07-Clickhouse/',
    collapsed: true,
    items: [
      { text: 'Kafka 安装部署', link: '01-01-Kafka-安装部署' },
      { text: 'Kafka 常用操作', link: '01-02-Kafka-常用操作' },
      { text: 'Clickhouse 安装部署', link: '02-01-Clickhouse-安装部署' },
      { text: 'Clickhouse 常用操作', link: '02-02-Clickhouse-常用操作' },
      { text: 'Clickhouse 问题处理', link: '04-01-Clickhouse-问题处理' },
      { text: '日志收集链接工具', link: '11-01-日志收集链接工具' },
    ]
  },{
    text: 'etcd',
    base: '/03-databases/08-etcd/',
    collapsed: true,
    items: [
      { text: 'etcd 部署', link: '02-01-etcd-部署' },
      { text: 'etcd 停机迁移', link: '02-02-etcd-停机迁移' },
      { text: 'etcd 常用命令', link: '03-03-etcd-常用命令' },
      { text: 'etcd compact 和 内存', link: '03-06-etcd-compact-和-内存' },
      { text: 'etcd 错误处理', link: '04-01-etcd-错误处理' },
    ]
  },{
    text: '达梦8',
    base: '/03-databases/09-达梦8/',
    collapsed: true,
    items: [
      { text: '达梦8 单机安装', link: '02-01-达梦8-单机安装' },
      { text: '达梦8 单机静默安装', link: '02-02-达梦8-单机静默安装' },
      { text: '达梦8 守护集群部署', link: '02-03-达梦8-守护集群部署' },
      { text: '达梦8 读写分离部署', link: '02-04-达梦8-读写分离部署' },
      { text: '达梦8 共享存储集群', link: '02-05-达梦8-共享存储集群' },
      { text: '达梦8 monitor 使用', link: '02-06-达梦8-monitor-使用' },
      { text: '达梦 安装DEM', link: '02-10-达梦-安装DEM' },
      { text: '达梦8 dm svc 配置文件', link: '03-01-达梦8-dm-svc-配置文件' },
      { text: '达梦8 基本操作', link: '03-03-达梦8-基本操作' },
      { text: '安装 odbc', link: '03-06-安装-odbc' },
      { text: 'Oracle 单机安装', link: '11-Oracle-单机安装' },
    ]
  },{
    text: '本站文档库',
    items: [
      { text: '环境与工具', base: '/01-tools/', link: '05-01-Git-使用' },
      { text: '开发语言', base: '/02-languages/01-C++/', link: '01-02-C++开发环境准备' },
      { text: '存储与数据库', base: '/03-databases/01-Ceph/', link: '01-02-ceph-二进制部署-Ubuntu-22.04' },
      { text: 'kubernetes', base: '/04-kubernetes/01-Kubernetes-基础/', link: '01-01-二进制-部署-k8s-Centos7.9' },
      { text: '系统与软件', base: '/05-linux/02-Linux/', link: '03-03-Linux-笔记' }
    ]
  }]
}

function sidebarKubernetes(): DefaultTheme.SidebarItem[] {
  return [{
    text: 'Kubernetes 基础',
    base: '/04-kubernetes/01-Kubernetes-基础/',
    collapsed: false,
    items: [
      { text: '二进制 部署 k8s - Centos7.9', link: '01-01-二进制-部署-k8s-Centos7.9' },
      { text: 'RKE 部署 k8s - Centos 7.9', link: '01-02-RKE-部署-k8s-Centos-7.9' },
      { text: 'RKE 部署 k8s - Ubuntu 22.04', link: '01-03-RKE-部署-k8s-Ubuntu-22.04' },
      { text: 'RKE2 部署 k8s - Centos7.9', link: '01-04-RKE2-部署-k8s-Centos7.9' },
      { text: 'Kubernetes 资源清单', link: '01-05-Kubernetes-资源清单' },
      { text: 'kubeadm 部署 k8s - Centos7.9', link: '01-05-kubeadm-部署-k8s-Centos7.9' },
      { text: 'helm 安装与使用', link: '01-06-helm-安装与使用' },
      { text: 'Docker 笔记', link: '02-01-Docker-笔记' },
      { text: 'Dockerfile', link: '02-02-Dockerfile' },
      { text: 'Kubernetes 常用操作', link: '02-03-Kubernetes-常用操作' },
      { text: 'Operator 开发环境部署', link: '02-04-Operator-开发环境部署' },
      { text: 'Operator 开发常用代码', link: '02-05-Operator-开发常用代码' },
      { text: 'node crash 处理时间', link: '02-06-node-crash-处理时间' },
      { text: '问题处理', link: '04-01-问题处理' },
    ]
  },{
    text: '常用组件的使用',
    base: '/04-kubernetes/02-常用组件的使用/',
    collapsed: false,
    items: [
      { text: 'kubernetes ceph-csi 插件', link: '01-kubernetes-ceph-csi-插件' },
      { text: 'k8s-promehtues-grafana', link: '02-k8s-promehtues-grafana' },
    ]
  },{
    text: 'PostgreSQL',
    base: '/04-kubernetes/03-PostgreSQL/',
    collapsed: false,
    items: [
      { text: 'cloudnative-pg', link: '01-cloudnative-pg' },
    ]
  },{
    text: '本站文档库',
    items: [
      { text: '环境与工具', base: '/01-tools/', link: '05-01-Git-使用' },
      { text: '开发语言', base: '/02-languages/01-C++/', link: '01-02-C++开发环境准备' },
      { text: '存储与数据库', base: '/03-databases/01-Ceph/', link: '01-02-ceph-二进制部署-Ubuntu-22.04' },
      { text: 'kubernetes', base: '/04-kubernetes/01-Kubernetes-基础/', link: '01-01-二进制-部署-k8s-Centos7.9' },
      { text: '系统与软件', base: '/05-linux/02-Linux/', link: '03-03-Linux-笔记' }
    ]
  }]
}

function sidebarLinux(): DefaultTheme.SidebarItem[] {
  return [{
    text: 'Windows',
    base: '/05-linux/01-Windows/',
    collapsed: false,
    items: [
      { text: 'Windows 环境变量及脚本', link: '01-windows-环境变量及脚本' },
    ]
  },{
    text: 'Linux',
    base: '/05-linux/02-Linux/',
    collapsed: false,
    items: [
      { text: 'Linux 环境设置', link: '01-01-Linux-环境设置' },
      { text: 'ubuntu 22.04 源', link: '01-03-ubuntu-22.04-源' },
      { text: 'Linux 笔记', link: '03-03-Linux-笔记' },
      { text: 'Linux 内核参数', link: '03-04-Linux-内核参数' },
      { text: '常用操作流程', link: '03-04-常用操作流程' },
      { text: 'Linux smem 命令', link: '03-05-Linux-smem-命令' },
      { text: 'Linux chrony 时间同步', link: '03-06-Linux-chrony-时间同步' },
      { text: '隔离网络的跳板机配置', link: '04-01-隔离网络的跳板机配置' },
      { text: 'rsync', link: '09-01-rsync' },
      { text: 'cgroup', link: '09-02-cgroup' },
      { text: 'ipv6 iptables', link: '09-03-ipv6-iptables' },
      { text: '设置日志轮转 logrotate', link: '11-01-设置日志轮转-logrotate' },
    ]
  },{
    text: 'Software',
    base: '/05-linux/03-Software/',
    collapsed: false,
    items: [
      { text: 'Jenkins', link: '01-01-Jenkins' },
      { text: 'Prometheus 常用公式', link: '01-01-Prometheus-常用公式' },
      { text: 'Prometheus 安装部署', link: '01-02-Prometheus-安装部署' },
      { text: 'Prometheus 配置', link: '01-03-Prometheus-配置' },
      { text: 'Prometheus Rule', link: '01-04-Prometheus-Rule' },
      { text: 'Nginx', link: '02-01-Nginx' },
      { text: 'Loki', link: '03-01-Loki' },
      { text: 'Consul', link: '04-01-Consul' },
      { text: 'terraform', link: '05-01-terraform' },
      { text: 'influxdb', link: '06-01-influxdb' },
    ]
  },{
    text: '本站文档库',
    items: [
      { text: '环境与工具', base: '/01-tools/', link: '05-01-Git-使用' },
      { text: '开发语言', base: '/02-languages/01-C++/', link: '01-02-C++开发环境准备' },
      { text: '存储与数据库', base: '/03-databases/01-Ceph/', link: '01-02-ceph-二进制部署-Ubuntu-22.04' },
      { text: 'kubernetes', base: '/04-kubernetes/01-Kubernetes-基础/', link: '01-01-二进制-部署-k8s-Centos7.9' },
      { text: '系统与软件', base: '/05-linux/02-Linux/', link: '03-03-Linux-笔记' }
    ]
  }]
}