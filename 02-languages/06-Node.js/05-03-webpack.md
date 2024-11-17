# webpack

***

## nrm

#### 1.  安装nrm

```javascript
//nrm是一个提供可用的nodejs npm源地址的工具
//全局安装

npm i nrm -g

```

#### 2.  nrm 使用

```javascript
nrm ls
nrm use
```

## cnpm

#### 1.  安装cnpm

```javascript
//cnpm是一个npm包安装工具,因为npm源地址为国外地址,所以淘宝做了cnpm,cnpm源与官方源10分钟同步一次
//全局安装

npm i cnpm -g
```

## webpack

#### 1.  安装 webpack

```javascript
//webpack 是一个web构建工具

//全局安装
npm i webpack -g

//安装到项目依赖
npm i webpack --save-dev
```

#### 2.  使用

```javascript
webpack ./src/main.js ./dist/bundle.js
```

#### 3.  配置文件

```javascript
const path = require('path')
module.exports = {
    entry: path.join(_dirname,'./src/main.js'),
    output: {
        path:  path.join(_dirname,'./dist')
        filename: 'bundle.js'
    }
}
    ```

#### 4.  webpack-dev-server

```javascript
//每次修改代码后都要执行webpack太麻烦，可以用webpack-dev-server解决这个问题

#### 1. 安装
npm i webpack-dev-server -D

```

#### 5.  html-webpack-plugin

```javascript
//根据模板文件生产内存中的首页

#### 1. 安装
cnpm i html-webpack-plugin -D
```

#### 6.  webpack 使用 vue 模板

```javascript
#### 1. 安装插件
cnpm i vue-loader vue-template-compiler -D

#### 2. 在配置文件中,新增loader配置
module: {
    rules: [
        { test:/\.vue$/, use:'vue-loader'}
    ]
}

#### 3. 每个模板单独作为一个文件,文件以.vue结尾

#### 4. 在main.js中倒入.vue文件，然后用render渲染模板

import login from './login.vue'

render: function(createElements) {
    return createElements(login)
}

//render 函数简写
render: c => c(login)
```

### mint-ui安需导入

#### 1.  安装插件

```javascript
npm install babel-plugin-component -D
```

#### 2.  修改 .babelrc 文件

```javascript
//增加以下代码
{
    “plugins”:[["component",[
    {
        "libraryName":"mint-ui",
        "style":true
    }
    ]]]
}
```

#### 3.  按需部导入

```javascript
import { Button } from 'mint-ui'
Vue.component(Button.name,Button)
```

#### 4.  vscode 安装一些工具:

```javascript
vetur
Vue2 snippets
```

#### 5.  d

