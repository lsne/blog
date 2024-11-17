# element-ui

vue3+elementPlus
https://github.com/lin-xin/vue-manage-system
https://github.com/vbenjs/vue-vben-admin
https://github.com/chuzhixin/vue-admin-better

## 安装 vue-cli

```
npm install -g vue-cli --registry=http://registry.npm.taobao.org
```

## 创建项目

```
vue create element-test --registry=http://registry.npm.taobao.org
```

## 安装 element-ui

```
cd element-test
npm install element-ui -S --registry=http://registry.npm.taobao.org
```

## Vue 插件

```
vim element-test/src/main.js
加入:
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'

Vue.use(ElementUI)
```

## 按需要加载

```
npm install babel-plugin-component -D --registry=https://registry.npm.taobao.org

vim element-test/babel.config.js

module.exports = {
  presets: [
    '@vue/cli-plugin-babel/preset'
  ],
  plugins: [
    [
      'component',
      {
        "libraryName": "element-ui",
        "styleLibraryName": "theme-chalk"
      }
    ]
  ]
}

```

## 插件引用

```
重新创建项目

cd 
vue add element --registry=http://registry.npm.taobao.org
```
