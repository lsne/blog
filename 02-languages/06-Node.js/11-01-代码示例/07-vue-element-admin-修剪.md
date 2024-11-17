# VUE-ELEMENT-ADMIN 修剪

#### 下载依赖报错 `templates not found`

```
npm ERR! code 128
npm ERR! Command failed: D:\Program Files\Git\cmd\git.EXE clone --mirror -q git://github.com/adobe-webplatform/eve.git C:\Users\yantx\AppData\Roaming\npm-cache\_cacache\tmp\git-clone-8a6c5246\.git --config core.longpaths=true
npm ERR! warning: templates not found C:\Users\yantx\AppData\Local\Temp\pacote-git-template-tmp\git-clone-c2479bd8
npm ERR! fatal: read error: Invalid argument
npm ERR!

npm ERR! A complete log of this run can be found in:
npm ERR! C:\Users\yantx\AppData\Roaming\npm-cache\_logs\2019-10-17T07_24_32_665Z-debug.log
复制代码
```

```
git config --global http.sslverify "false"

如果还不行，就手动安装 node-sass 
 npm install node-sass
```

## 根目录

1. .env.development

```javascript
# VUE_APP_BASE_API = '/dev-api'
VUE_APP_BASE_API = 'http://localhost:8866/api/v2/dbm'
```

2. .env.production

```javascript
# VUE_APP_BASE_API = '/dev-api'
VUE_APP_BASE_API = 'http://localhost:8866/api/v2/dbm'
```

3. .env.staging

```javascript
# VUE_APP_BASE_API = '/stage-api'
VUE_APP_BASE_API = 'http://localhost:8866/api/v2/dbm'
```

4. .eslintrc.js

```javascript
11行，增加:
jquery:true,
```

5. package.json

```javascript
55行，增加:
"jquery": "^3.4.0",

90行，增加:
"expose-loader": "^0.7.5",
```

6. vue.config.js

```javascript
第4行,增加:
const webpack = require('webpack')

第14行,修改:
const port = 8865 // dev port

第51行到56行,增加:
    plugins: [
    new webpack.ProvidePlugin({
        jQuery: 'jquery',
        $: 'jquery'
    })
    ],
```

## src/ 目录

1. settings.js 文件

```javascript
title: '数据库管理平台',
showSettings: false,
tagsView: false,
fixedHeader: true,
sidebarLogo: false,

```

## src/api/

1. 替换user.js 文件
2. 增加operational.js文件
3. 增加后续增加的API文件

## src/components/Breadcrumb

1. 修改index.vue

```javascript
33~37 行,注释
```

## src/icons/svg

1. 增加8个图标文件，后续有可能还会增加

```javascript
checkup.svg
crontab.svg
database.svg
elasticsearch.svg
mongodb.svg
operational.svg
oplog.svg
redis.svg
```

## src/router

1. 替换index.js 文件

## src/router/modules

1. 删除现有的所有文件:

```javascript
charts.js
components.js
```

2. 增加如下文件

```javascript
checkup.js
crontab.js
elasticsearch.js
mongodb.js
mysql.js
operational.js
oplog.js
redis.js
userinfo.js
```

## src/store/modules

1. 修改user.js

```javascript
第39 ~ 42行
        // setToken(data.token)
        // resolve()
        setToken(response.token, response.exp)
        resolve(response)

第59 ~ 65,75,77行，
        // const { roles, name, avatar, introduction } = data
        const { roles, name, status, avatar, introduction } = data

        if (status === 1 || status === 3) {
        this.dispatch('user/logout')
        reject('未激活或账户被禁用!')
        } else {
        ...
        setToken(response.token, response.exp)
        ...
        }

```

## src/styles

1. 增加文件 dataStatistics.css
2. element-variables.scss 文件末尾增加:

```javascript
.switchStyle .el-switch__label {
position: absolute;
display: none;
color: #fff;
}
.switchStyle .el-switch__label--left {
z-index: 9;
left: 6px;
}
.switchStyle .el-switch__label--right {
z-index: 9;
left: -17px;
}
.switchStyle .el-switch__label.is-active {
display: block;
}
.switchStyle.el-switch .el-switch__core,
.el-switch .el-switch__label {
width: 50px !important;
}
```

3. index.scss 增加

```javascript
第10行:
background-color: #f4f4f4;

```

4. transition.scss 修改

```javascript
第17，33，43 行:
transition: all .25s;
```

5. variables.scss

```javascript
第16~26行:
// $menuBg:#304156;
// $menuHover:#263445;

// $subMenuBg:#1f2d3d;
// $subMenuHover:#001528;

$menuBg:#495060;
$menuHover:#263445;

$subMenuBg:#363e4f;
$subMenuHover:#001528;
```

## src/utils

1. auth.js 文件

```javascript
第9,10行
export function setToken(token, exp) {
return Cookies.set(TokenKey, token, { expires: exp })

如果传入的exp是秒级时间戳,则应该改为
export function setToken(token, exp) {
return Cookies.set(TokenKey, token, { expires: new Date(exp * 1000) })
```

2. request.js 文件

```javascript
第49行
if (res.code !== 0) {
```

3. validate.js 文件

```javascript
第18~21行:
// const valid_map = ['admin', 'editor']
// return valid_map.indexOf(str.trim()) >= 0
const reg = /^[a-zA-Z0-9\-\_]+$/
return reg.test(str.trim())
```

## src/views 目录

1. 删除以下目录

```javascript
charts
clipboard
components-demo
documentation
error-log
example
excel
guide
icons
nested
pdf
permission
tab
table
theme
zip
```

2. 增加以下目录,后续有新的开发需求还会增加

```javascript
checkup
crontab
dashboard
elasticsearch
login
mongodb
mysql
operational
oplog
redis
userinfo
```

---
# VUE-ELEMENT-ADMIN 修改部分2

---

## 部署

```
nodejs 只能使用 14.xx , 版本再高就会出现不兼容情况

如果安装 raphael eve 报错, 则用这两行命令替换一下
git config --global url."https://github.com/nhn/raphael.git".insteadOf ssh://git@github.com/nhn/raphael.git
git config --global url."https://github.com/adobe-webplatform/eve.git".insteadOf ssh://git@github.com/adobe-webplatform/eve.git

删除 pakcage.json 里的


实在不行就安装cnpm 然后用cnpm进行安装

npm install -g cnpm --registry=https://registry.npm.taobao.org
cnpm install --registry=https://registry.npm.taobao.org
```


## 项目精简

1. src/views 目录下, 只保留以下4个目录,其余的全部删除

```
dashboard
error-page
login
redirect

```

2. 删除route路由 和 其他

```
src/router/index.js 删除不要路由
src/router/modules 删除目录
src/vendor 删除
```

3. 如果是线上项目,建议将 components 的内容也进行清理, 以免影响访问速度


## 配置

1. src/settings.js

```
title: '小慕读书'
...
...
```

2. src/vue.config.js

```

```

## 修改

1. src/utils/request.js

```
service.interceptors.response.use(
  response => {
    const res = response.data

    if (res.code !== 0) {
      const errMsg = res.msg || '请求失败'
      Message({
        message: errMsg,
        type: 'error',
        duration: 5 * 1000
      })
      if (res.code === 50008 || res.code === 50012 || res.code === 50014) {
        MessageBox.confirm('Token 已失效，是否重新登录', '确认登出', {
          confirmButtonText: '重新登录',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          store.dispatch('user/resetToken').then(() => {
            location.reload()
          })
        })
      }
      return Promise.reject(new Error(errMsg))
    } else {
      return res
    }
  },
  error => {
    const { msg } = error.response.data
    Message({
      message: msg || '请求失败',
      type: 'error',
      duration: 5 * 1000
    })
    return Promise.reject(error)
  }
)
```

2. src/main.js

```
删除:

import { mockXHR } from '../mock'
if (process.env.NODE_ENV === 'production') {
    mockXHR()
}
```

3. vue.config.js 

```
删除:

proxy: {
      // change xxx-api/login => mock/login
      // detail: https://cli.vuejs.org/config/#devserver-proxy
      [process.env.VUE_APP_BASE_API]: {
        target: `http://localhost:${port}/mock`,
        changeOrigin: true,
        pathRewrite: {
          ['^' + process.env.VUE_APP_BASE_API]: ''
        }
      }
    },
    after: require('./mock/mock-server.js')
    
    
(/ 改为 . 应该是没有必要改的直接把 dist 做为nginx资源的根目录就可以)
publicPath: '/',

改为

publicPath: '.',
```

4. .env.development & .env.production 修改api地址


## 自带组件

1. 吸顶效果

```
<sticky>

</sticky>

import Sticky from 'src/components'
export default {
    components: {Sticky},
    props: {
        props: {
            isEdit: Boolean
        }
    }
}
```

2. 输入框效果 MDinput
3. 
