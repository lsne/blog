---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "我的随笔"
  text: "风雨蹉跎十二载"
  tagline: 刚毕业前几年由于各种原因没有记录笔记, 之后的工作学习笔记全在这里了。将笔记做到页面上方便以后使用时可以随时随地查看。
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