# electron 项目初始化

## 1. 初始化项目

```
pnpm init
pnpm install electron -D
pnpm install nodemon -D
```

## 2. 编辑 package.josn

```
{
  "name": "testelectron",
  "version": "1.0.0",
  "description": "",
  "main": "main.js",    // 修改入口文件
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "start": "nodemon --exec electron . --watch ./ --ext .js,.html,.css,.vue"    // 添加运行方式， 添加监听文件路径和文件类型(默认只监听js)
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "devDependencies": {
    "electron": "^26.2.4",
    "nodemon": "^3.0.1"
  }
}
```

## 3. 测试: 编辑`vim main.js`

```
const { app, BrowserWindow } = require('electron')

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1000,
    height: 800
  })

  // win.loadURL('http://jx.1000phone.net')  // 加载网址页面做为应用程序
  win.loadFile('index.html')      // 加载本地文件作为应用程序
  
  win.webContents.openDevTools()  // 打开开发者工具
}

app.whenReady().then(createWindow)
```

## 4. 主进程生命周期函数

### 生命周期常用列表

```
before-quit // 退出之前
browser-window-blur // 失去焦点
browser-window-focus // 获得焦点
```

### app 常用函数

```
app.quit() // 退出程序
app.getPath('desktop') 获取桌面路径

```

### 示例: 退出时判断是 mac 系统则执行退出指令
```
const { app, BrowserWindow } = require('electron')

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1000,
    height: 800
  })

  // win.loadURL('http://jx.1000phone.net')
  win.loadFile('index.html')

  win.webContents.openDevTools()
}


app.whenReady().then( () => {
  createWindow()

  // 生命周期 
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0 ) {
      createWindow()
    }
  })
})

// 生命周期 
app.on('window-all-closed', () => {      // 监听 程序关闭
  if (process.platform === 'darwin') {   // mac 系统不会自动退出，所以需要手动判断如果是mac系统, 需要手动执行 app.quit() 退出程序
    app.quit()
  }
})
```
## 5. BrowserWindow 相关

### 例举一些常用的

```
const apth = require('path')
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1000,   //窗口宽度
    height: 800,   // 窗口高度
    x: 100,        // 窗口距离屏幕左上角位置
    y: 100,        // 窗口距离屏幕左上角位置
    frame: false,  // 没有标题栏, 没有图标栏和关闭 最小化等按钮那一栏。如果想实现拖动窗口效果，需要添加 css 样式。 请看后面示例中对 index.html 和 app.css 文件的修改
    titleBarStyle: 'hidden',  // 不显示最上一栏的同时，将最小化，关闭等三个按钮显示出来
    show: false,  // 默认不打开程序窗口. 后后通过 win.show() 打开
    backgroundColor: '#6435c9',   // 背景颜色

  })

  win.loadURL('http://jx.1000phone.net')

// 等准备好之后，再打开程序。比如本示例中，等 http://jx.1000phone.net 网页全部加载完成之后再打开程序
  win.on('ready-to-show', () => {
    win.show()
  })

  win.webContents.openDevTools()

  win.on('ready-to-show', () => {
    win.show()
  })
  
  const win2 = new BrowserWindow({
      width: 600,
      height: 400,
      parent: win,  // 指定父窗口为 win 
      modal: true  // 固定窗口
  })
  
  win2.loadURL('https://www.baidu.com')
}


app.whenReady().then( () => {
  createWindow()

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0 ) {
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

```
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {  // 判断当前打开的窗口个数
        createWindow()
    }
})


secWindow.on('closed', () => {
    mainWindow.maximize()    // 窗口最大化
})

```

### 示例 - 关闭标题栏, 实现拖动窗体移动窗口的效果

#### 1. 编辑 `index.html`

```
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self' 'unsafe-inline'">
    <!-- 添加下面这一行 -->
    <link rel="stylesheet" href="./app.css">  
    <title>Document</title>
  </head>
  <body>hello</body>
  <input type="range" name="range" min="0" max="10">
  <button id="btn">send</button>
  <script src="./renderer/app.js"></script>
</html>
```

#### 2. 编辑样式: `app.css`

```
html {
  height: 100%;
}

body {
  height: 100%;
  user-select: none;
  -webkit-app-region: drag;
}

/* 当窗口中其他按钮或组件不需要出发窗体拖拽效果时, 需要加上 no-drag 样式; 下面是 input 标签不加 no-drag 样式的示例 */
input {
  -webkit-app-region: no-drag;
}
```

## 6. 在渲染进程中使用 node 模块

### 6.1 测试过程

#### 6.1.1 创建 index.html 文件

```
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self' 'unsafe-inline'">
    <title>Document</title>
    <script src="./renderer/app.js"></script>
  </head>
  <body>hello</body>
</html>
```

#### 6.1.2 编辑: `vim main.js`
```
const apth = require('path')
const { app, BrowserWindow } = require('electron')
const path = require('path')

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      // 通过 preload 预先加载对操作系统文件的操作
      preload: path.resolve(__dirname, './preload.js')
    }
  })

  win.loadFile('index.html')

  win.webContents.openDevTools()
}


app.whenReady().then( () => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0 ) {
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

#### 6.1.3 编辑: `vim preload.js`

```
const { contextBridge } = require('electron')

// 通过 contextBridge 将 node 模块注入渲染层
contextBridge.exposeInMainWorld('myApi', {
  platform: process.platform
})
```

#### 6.1.4 编辑: `vim ./renderer/app.js`

```
// 在渲染进程使用主进程注入的变量
console.log(window.myApi)
```

## 7. 主进程与渲染进程的通信

### `ipcMain` 和 `ipcRenderer`

#### 7.1 使用方法

##### `Main Prcess`

```
ipcMain.handle('my-invokable-ipc', async (event, ...args) => {
  const result = await somePromise(...args)
  return result
})
```

##### `Renderer Process`

```
async () => {
  const result = await ipcRenderer.invoke('my-invokable-ipc', arg1, arg2)
  // ...
}
```

#### 7.2 示例

##### 7.2.1 编辑: `vim index.html`

```
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self' 'unsafe-inline'">
    <title>Document</title>
  </head>
  <body>hello</body>
  <button id="btn">send</button>
  <script src="./renderer/app.js"></script>
</html>
```

##### 7.2.2 编辑: `vim main.js`

```
const apth = require('path')
const { app, BrowserWindow, ipcMain } = require('electron')    // 导入 ipcMain
const path = require('path')

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      // 通过 preload 预先加载对操作系统文件的操作
      preload: path.resolve(__dirname, './preload.js')
    }
  })

  // win.loadURL('http://jx.1000phone.net')
  win.loadFile('index.html')

  win.webContents.openDevTools()
}


app.whenReady().then( () => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0 ) {
      createWindow()
    }
  })
})


app.on('window-all-closed', () => {      
  if (process.platform === 'darwin') {
    app.quit()
  }
})

// 定义 send-event 事件以及处理函数
ipcMain.handle('send-event', (event, msg) => {
    return msg
})
```

##### 7.2.3 编辑: `vim preload.js`

```
// 导入 ipcRenderer
const { contextBridge, ipcRenderer } = require('electron')

// 本函数去调用主进程的 send-event 事件, 同时自己又可以被渲染进程调用
const handleSend = async () => {
  let fallback = await ipcRenderer.invoke('send-event', 'hahahahaha')
  console.log(fallback)
}


// 通过 contextBridge 将 node 模块注入渲染层。 向外暴露
contextBridge.exposeInMainWorld('myApi', {
  platform: process.platform,
  handleSend
})
```

##### 7.2.4 编辑: `vim renderer/app.js`

```
// 监听 id 为 btn 按钮的点击事件
document.querySelector('#btn').addEventListener('click', () => {
  window.myApi.handleSend()
})
```

## 8. 用户对窗口进行大小位置调整后, 关闭程序。下次再打开还是同样的位置同样的大小

### 8.1 需要安装额外的包

```
// 保存窗口状态
pnpm install electron-win-state
```

### 8.2.1 使用方式一: 引入包，并使用

```
<!--import WinState from 'electron-win-state'-->

const WinState = require('electron-win-state').default

const browserWindow = WinState.createBrowserWindow({
    width: 800,
    height: 600,
    // your normal BrowserWindows options...
})
```

### 8.2.2 使用方式一: 手动管理

```
const winState = new WinState({
    defaultWidth: 800,
    defaultHeight: 600,
    // other winState options, see below
})

const browserwindow = new BrowserWindow({
    ...winState.winOptions,
    // your normal BrowserWindow options...
})

winState.manage(this.browserWindow)
```

### 8.2.3 示例

```
const apth = require('path')
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const WinState = require('electron-win-state').default



const createWindow = () => {

  const winState = new WinState({
    defaultWidth: 800,
    defaultHeight: 600,
  })

  const win = new BrowserWindow({
    ...winState.winOptions,
    // width: 1000,        // 使用 winState 之后, 这里就不能手动写 width, height, x, y 等宽高信息了
    // height: 800,
    frame: false,
    show: false,
    webPreferences: {
      // 通过 preload 预先加载对操作系统文件的操作
      preload: path.resolve(__dirname, './preload.js')
    }
  })

  // win.loadURL('http://jx.1000phone.net')
  win.loadFile('index.html')

  win.webContents.openDevTools()

  win.on('ready-to-show', () => {
    win.show()
  })

  winState.manage(win)
}


app.whenReady().then( () => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0 ) {
      createWindow()
    }
  })
})


app.on('window-all-closed', () => {      
  if (process.platform === 'darwin') {
    app.quit()
  }
})

ipcMain.handle('send-event', (event, msg) => {
    return msg
})
```

## 9. webContents 在 BrowserWindows 里控制浏览器的一些资源

```
const wc = win.webContents
wc.on('did-finish-load', () => {    //当所有资源加载完毕, 执行动作
    console.log('finished.')
})
wc.on('dom-ready', () => {
    console.log('dom-ready.')
})

wc.on('new-windows', () => {          //监测是否打开了新窗口
    console.log('dom-ready.')
})  

wc.on('context-menu', (e, params) => { //监听鼠标右键，右键之后, console.log 输出信息, 并且通过 wc.executeJavaScript 注入 javascript 脚本, 打开一个告警对话框
console.log('Context menu opened on: ${params.mediaType} at x:${params.x} y:${params.y}')
wc.executeJavaScript(`alert('${params.selectionText}')`)
})

```

### 9.2 示例

#### 9.2.1 编辑 main.js

```
const apth = require('path')
const { app, BrowserWindow, ipcMain, webContents } = require('electron')
const path = require('path')
const WinState = require('electron-win-state').default



const createWindow = () => {

  const winState = new WinState({
    defaultWidth: 800,
    defaultHeight: 600,
  })

  const win = new BrowserWindow({
    ...winState.winOptions,
    // width: 1000,        // 使用 winState 之后, 这里就不能手动写 width, height, x, y 等宽高信息了
    // height: 800,
    frame: false,
    show: false,
    webPreferences: {
      // 通过 preload 预先加载对操作系统文件的操作
      preload: path.resolve(__dirname, './preload.js')
    }
  })

  // win.loadURL('http://jx.1000phone.net')
  win.loadFile('index.html')

  // 创建 webContents 对象
  const wc = win.webContents
  wc.openDevTools()

  // 监听资源加载完成
  wc.on('did-finish-load', () => {
    console.log('finished.')
  })

  win.webContents.openDevTools()

  win.on('ready-to-show', () => {
    win.show()
  })

  winState.manage(win)
}


app.whenReady().then( () => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0 ) {
      createWindow()
    }
  })
})


app.on('window-all-closed', () => {      
  if (process.platform === 'darwin') {
    app.quit()
  }
})

ipcMain.handle('send-event', (event, msg) => {
    return msg
})
```

## 10. dialog - 对话框

### 10.1 点击右键 - 打开展示桌面目录的对话框
```
  wc.on('context-menu', (e, params) => {
    dialog.showOpenDialog({
      buttonLabel: 'ok',
      defaultPath: app.getAppPath('desktop'),
      properties: ['multiSelections', 'createDirectory', 'openFile', 'openDirectory']
    }).then((result) => {
      console.log(result.filePaths)
    })
  })
```

### 10.2 dialog 列举

```
dialog.showOpenDialog()  // 选择文件对话框
dialog.showSaveDialog()  // 保存文件对话框
dialog.showMessageBox()  // 消息提示对话框
```

## 11. 快捷键

### 11.1 快捷键

```
const { app, BrowserWindow, ipcMain, webContents, dialog, globalShortcut } = require('electron')

const createWindow = () => {

  const win = new BrowserWindow()

  win.loadFile('index.html')

  // globalShortcut.register('G', () => {    //注册 G 为快捷键
  globalShortcut.register('CommandOrControl+Y', () => {  // 注册 Ctrl + Y 为快捷键
    console.log("g")
    globalShortcut.unregister('CommandOrControl+Y')  // 注销 Ctrl + Y 快捷键
  })
}


app.whenReady().then( () => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0 ) {
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

## 12. 自定义菜单

```
const { app, BrowserWindow, ipcMain, webContents, dialog, globalShortcut, Menu } = require('electron')

const mainMenu = Menu.buildFromTemplate([
  {
    label: 'electron',
    submenu: [
      {
        label: 'menu-1',
        submenu: [
          {
            label: 'submenu-1'
          }, {
            label: 'submenu-2'
          }
        ]
      }, {
        label: 'menu-2',
      }, {
        label: 'Edit',
        submenu: [           // 使用系统自定义的角色功能
          {role: 'undo'},
          {role: 'redo'},
          {role: 'copy'},
          {role: 'paste'},
        ]
      }
    ]
  }, {
    label: '动作',   // 自定义菜单
    submenu: [
      {
        label: 'DevTools',     
        role: 'toggleDevTools'   // 使用 electron 提供的功能
      }, {
        role: 'togglefullscreen'
      },{
        label: 'Greet',
        click: () => {            // 自定义功能
          console.log('hello')
        },
        accelerator: 'Shift+Alt+G'  // 定义快捷键
      }
    ]
  }
])

const createWindow = () => {

  const win = new BrowserWindow()

  win.loadFile('index.html')

  globalShortcut.register('G', () => {
    console.log("g")
  })

  Menu.setApplicationMenu(mainMenu)
}


app.whenReady().then( () => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0 ) {
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

### 12.1 菜单按钮与后端main进程通信

#### 12.1.1 编辑: `mainMenu.js`

```
const { Menu, dialog } = require('electron')


const mainMenu = (args, cb) => {
  return Menu.buildFromTemplate([
    {
      label: 'electron',
      submenu: [
        {
          label: 'menu-1',
          submenu: [
            {
              label: 'submenu-1'
            }, {
              label: 'submenu-2'
            }
          ]
        }, {
          label: 'menu-2',
        }, {
          label: 'Edit',
          submenu: [           // 使用系统自定义的角色功能
            {role: 'undo'},
            {role: 'redo'},
            {role: 'copy'},
            {role: 'paste'},
          ]
        }
      ]
    }, {
      label: '动作',   // 自定义菜单
      submenu: [
        {
          label: 'DevTools',     
          role: 'toggleDevTools'   // 使用 electron 提供的功能
        }, {
          role: 'togglefullscreen'
        },{
          label: 'Greet',
          click: () => {            // 自定义功能
            dialog.showMessageBox({
              title: args,            // 使用主进程传递过来的消息
              message: args,
              detial: 'Message details.',
              buttons: answers
            }).then(({response}) => {
              console.log(`User selected: ${answers[response]}`)
            })
          },
          accelerator: 'Shift+Alt+G'  // 定义快捷键
        }, {
          label: '测试返回给主进程消息',
          click: () => {           
            cb('hello electron.')     // 返回给主进程消息
          }
        }
      ]
    }
  ])
}

module.exports = mainMenu
```

#### 12.1.2 编辑: `vim main.js`

```
const { app, BrowserWindow, ipcMain, webContents, dialog, globalShortcut, Menu } = require('electron')
const mainMenu = require('./mainMenu')



const createWindow = () => {

  const win = new BrowserWindow()

  win.loadFile('index.html')

  globalShortcut.register('G', () => {
    console.log("g")
  })

  Menu.setApplicationMenu(mainMenu('我的消息窗口', (args) => {
    console.log(args)
  }))
}


app.whenReady().then( () => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0 ) {
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

#### 12.3 Context Menus 上下级菜单(右键菜单)

```
const { app, BrowserWindow, ipcMain, webContents, dialog, globalShortcut, Menu } = require('electron')
const mainMenu = require('./mainMenu')

let contextMenu = Menu.buildFromTemplate([
  { label: 'Item 1' },
  { role: 'editMenu' }
])

const createWindow = () => {
  const win = new BrowserWindow()

  win.loadFile('index.html')

  globalShortcut.register('G', () => {
    console.log("g")
  })

  const wc = win.webContents
  wc.on('context-menu', (e, params) => {  // 右键菜单的创建
    contextMenu.popup()
  })

  Menu.setApplicationMenu(mainMenu('我的消息窗口', (args) => {
    console.log(args)
  }))
}


app.whenReady().then(() => {
  createWindow()

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

## 13 托盘

### 13.1 简单示例

#### 13.1.1 编辑: `vim tray.js`

```
const { Tray, app, Menu } = require('electron')

function createTray(app, win) {
  const tray = new Tray('02.png')
  tray.setToolTip('我的应用')
  tray.on('click', (e) => {
    if (e.shiftKey) {          // 按 shift + 鼠标左键单击, 则退出应用程序
      app.quit()
    } else {
      win.isVisible() ? win.hile(): win.show() // 单击鼠标，隐藏，显示窗口
    }
  })

  tray.setContextMenu(Menu.buildFromTemplate([    //单机鼠标, 弹出菜单
    {label: 'item1'},
    {label: 'item2'}
  ]))
}

module.exports = createTray
```

#### 13.1.2 编辑: `vim main.js`

```
const { app, BrowserWindow } = require('electron')
const createTray = require('./tray')

const createWindow = () => {
  const win = new BrowserWindow()

  win.loadFile('index.html')

  win.webContents.openDevTools()

  createTray(app, win)
}


app.whenReady().then(() => {
  createWindow()

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

## 14. 剪切板

