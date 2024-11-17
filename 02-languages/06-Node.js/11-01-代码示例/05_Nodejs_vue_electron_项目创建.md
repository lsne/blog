# vue3 + electron 项目创建

## 创建 vue 项目

### 1. 创建项目

```
# pnpm create vite <项目名称> --template vue-ts

# 示例
pnpm create vite elecvue --template vue-ts
```


### 2. 安装依赖包

```
pnpm install
```

### 3. 配置监听地址

#### 编辑: `vim vite.config.ts`

```
// 添加 server 部分
export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: 8866
  }
})
```

### 4. 配置启动打开浏览器: `如果机器没有图形界面不要设置`

#### 编辑: `vim package.json`

```
// vite 后添加 --open 参数, 会在启动时打开浏览器。 但远程开发的时候, 远程的开发机器一般没有图形界面也没有浏览器, 指定 --open 参数后, 启动会报错
  "scripts": {
    "dev": "vite --open",
  }
```

###  5. 运行测试

```
pnpm run dev
```

### 6. 安装 electron 相关包

```
pnpm install -D electron electron-builder nodemon
pnpm install electron-win-state
```

### 7. 修改 package.json 文件


```
// 删除以下一行
  "type": "module",
```

### 8. 配置 CSP: `vim index.html`

```
// 在 <title> 之前添加以下一行

<meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self' 'unsafe-inline'">
```

### 9. 创建 preload 目录和文件, 编辑: `vim src/preload/index.ts`

```
console.log(0)
```

### 10. 编辑 `vim background.ts`

```
import WinState from 'electron-win-state'
import { app, BrowserWindow } from 'electron' 
import path from 'path'

// const WinState = require('electron-win-state').default
// const { app, BrowserWindow } = require('electron')
// const path = require('path')

const winState = new WinState({
  defaultWidth: 1000,
  defaultHeight: 800,
  // other winState options, see below
})

const createWindow = () => {
  const win = new BrowserWindow({
    ...winState.winOptions,
    webPreferences: {
      preload: path.resolve(__dirname, '../src/preload/index.ts')    //这里的文件, build 之后找不到. 以后再研究一下
    }
  })

  if( process.argv[2] ) {
    win.loadURL(process.argv[2])
  } else {
    win.loadFile('index.html')
  }

  win.webContents.openDevTools()

  winState.manage(win)
}

app.whenReady().then(() => {
  createWindow(),

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      }
    })
})



app.on('window-all-closed', () => {
  if (process.platform === 'darwin') {
    app.quit()
  }
})
```

### 11. 创建插件目录和插件文件

```
mkdir plugins
touch plugins/vite.electron.build.ts
touch plugins/vite.electron.dev.ts
```

### 12. 编辑 `vim plugins/vite.electron.dev.ts`

```
// 开发环境的插件 electron

import type { Plugin } from 'vite'
import type { AddressInfo } from 'net'
import { spawn } from 'child_process'
import fs from 'node:fs'

const buildBackground = () => {
  require('esbuild').buildSync({
    entryPoints: ['src/background.ts'],
    bundle: true,
    outfile: 'dist/background.js',
    platform: 'node',
    target: 'node20',
    external: ['electron']
  })
}

// vite 插件要求必须导出一个对象，对象必须有 name 属性
// 在这个对象有很多钩子
export const ElectronDevPlugin = (): Plugin => {
  return {
    name: 'electron-dev',
    configureServer(server) {
      // electron 不认识 ts 文件, 所以要编译成 js
      buildBackground()
      server?.httpServer?.once('listening', () => {
        // 读取 vite 服务的信息
        const addressInfo = server.httpServer?.address() as AddressInfo
        // 拼接 ip 地址， 给 electron 启动服务的时候用
        const IP = `http://localhost:${addressInfo.port}`

        // 第一个参数是 electron 的入口文件
        // require('electron') 返回的是一个路径
        // 进程传参发送给 electron IP 地址
        let ElectronProcess = spawn(require('electron'), ['dist/background.js', IP])
        fs.watchFile('src/background.ts', () => {
          ElectronProcess.kill()
          buildBackground()
          ElectronProcess = spawn(require('electron'), ['dist/background.js', IP])
          ElectronProcess.stderr.on('data', (data) => {
            console.log('日志', data.toString())
          })
        })
        console.log(IP)
      })
    }
  }
}
```

### 13. 编辑: `vim plugins/vite.electron.build.ts`

```
import type { Plugin } from 'vite'
import fs from 'node:fs'
import * as ElectronBuilder from 'electron-builder'
import path from 'path'

const buildBackground = () => {
  require('esbuild').buildSync({
    entryPoints: ['src/background.ts'],
    bundle: true,
    outfile: 'dist/background.js',
    platform: 'node',
    target: 'node20',
    external: ['electron']
  })
}

// build 打包, 需要先等 vite 打完包之后生成 dist/index.html 在执行 electron-builder 打包
export const ElectronBuildPlugin = (): Plugin => {
  return {
    name: 'electron-build',
    closeBundle() {
      buildBackground()
      // electron-builder 需要在 package.json 中指定 main 属性
      const json = JSON.parse(fs.readFileSync('package.json', 'utf-8'))
      json.main = 'background.js'
      fs.writeFileSync('dist/package.json', JSON.stringify(json, null, 4))
      // bug electron-builder 会下载垃圾文件, 解决这个bug需要创建假的node_modules
      // 但我自己感觉可以改根目录的 package.json 文件 main = 'dist/background.js' . 这样就不会出现在 dist/ 目录下创建 node_modules 目录的情况了
      fs.mkdirSync('dist/node_modules')

      ElectronBuilder.build({
        config: {
          directories: {
            output: path.resolve(process.cwd(), 'release'),
            app: path.resolve(process.cwd(), 'dist')
          },
          files: ['**/*'],
          asar: true,
          appId: 'com.example.app',
          productName: 'vite-electron',
          nsis: {
            oneClick: false,  // 取消一键安装
            allowToChangeInstallationDirectory: true, // 允许用户选择安装目录
          }
        }
      })
    }
  }
}
```

### 14. 编辑: `vim tsconfig.node.json`

> 向 include 属性中添加 plugins/ 目录下的 ts 文件

```
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts", "plugins/**/*.ts"]
}
```

### 15. 编辑: `vim vite.config.ts`

> 向 plugins 属性中添加 ElectronDevPlugin() 插件 和 ElectronBuildPlugin() 插件, 然后修改 base 属性为相对路径

```
import { defineConfig } from 'vite'
import { ElectronDevPlugin } from './plugins/vite.electron.dev'
import { ElectronBuildPlugin } from './plugins/vite.electron.build'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(),
  ElectronDevPlugin(),
  ElectronBuildPlugin()
  ],
  base: './', // 默认是绝对路径 / 改成相对路径， 不然 build 会白屏
  server: {
    host: '0.0.0.0',
    port: 8866
  }
})
```

### 15. 启动

```
pnpm run dev
```

### 16. build

```
pnpm run build
```