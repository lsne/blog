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

### 7. 配置 package.json 文件

```
// 1. 添加
 "main": "main.ts",  
 
// 2. 添加:
  "scripts": {
        "start": "nodemon --exec electron . --watch ./ --ext .js,.html,.css,.vue"
  }
```

#### 7.1 修改后, 配置文件如下:

```
{
  "name": "elecvue",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "main": "main.ts",  
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc && vite build",
    "preview": "vite preview",
    "start": "nodemon --exec electron . --watch ./ --ext .js,.html,.css,.vue"
  },
  "dependencies": {
    "vue": "^3.3.4"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^4.2.3",
    "electron": "^26.2.4",
    "electron-win-state": "^1.1.22",
    "nodemon": "^3.0.1",
    "typescript": "^5.0.2",
    "vite": "^4.4.5",
    "vue-tsc": "^1.8.5"
  }
}

```

### 8. 配置 CSP: `vim index.html`

```
// 在 <title> 之前添加以下一行

<meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self' 'unsafe-inline'">
```

### 9. 创建 preload 目录和文件, 编辑: `vim preload/index.ts`

```
console.log(0)
```

### 10. 编辑 `vim main.ts`

```
// import WinState from 'electron-win-state'
// import { app, BrowserWindow } from 'electron'  // 改用 require

const WinState = require('electron-win-state').default
const { app, BrowserWindow } = require('electron')
const path = require('path')

const winState = new WinState({
  defaultWidth: 1000,
  defaultHeight: 800,
  // other winState options, see below
})

const createWindow = () => {
  const win = new BrowserWindow({
    ...winState.winOptions,
    webPreferences: {
      preload: path.resolve(__dirname, './preload/index.ts')
    }
  })

  win.loadURL('http://localhost:3000')

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

### 11. 启动

```
npm start
```