# Windows Nodejs 安装

## 环境安装

#### 1. 下载安装 C++ 桌面环境

```
1. 下载c++ 开发环境框架 
https://visualstudio.microsoft.com/zh-hans/downloads/
选择 Community -- 免费下载, 然后开始安装
工作负荷: 使用 C++ 的桌面开发
语言包: 中文(简体), 英文
```

#### 2. 下载 Python 包并安装

```
https://www.python.org/downloads/

# 自定义安装, 添加 PATH, 安装到所有用户
```

#### 3. 下载二进制 nodejs 包并安装

```
https://nodejs.org/en
```


#### 4. 修改缓存路径(可选)

```shell
# 提前创建好这两个目录

npm config set prefix "D:\work\node\node_global"

npm config set cache "D:\work\node\node_cache"
```

#### 5. 改为阿里云镜像源

```shell
# 设置源
npm config set registry https://registry.npm.taobao.org/ --global

# 这个执行失败了。 而且好像也不影响设置的源
# npm config set disturl https://npm.taobao.org/dist --global

# 查看源
npm config get registry
```

## 安装 pnpm

#### 1. 安装  pnpm

```shell
npm install pnpm --global
```

#### 2. 设置 pnpm 国内源

> windows 系统需要以管理员运行 powershell 执行 `set-ExecutionPolicy RemoteSigned` 设置权限


```shell
// 查看, 应该已经在上面使用 npm 的时候设置好了
pnpm config get registry

// 如需要设置, 执行:
pnpm config set registry https://registry.npm.taobao.org/ --global

// 如果需要下载 electron
pnpm config set electron_mirror http://npm.taobao.org/mirrors/electron/
pnpm config set global-bin-dir ~/bin/
pnpm install electron
```

## 创建项目

#### 方式一: 非交互, 使用模板

```shell
# pnpm create vite <项目名称> --template vue-ts

# 示例
pnpm create vite testvue3 --template vue-ts
```

#### 方式二: 交互, 根据提示输入信息

```shell
pnpm create vite

✔ Project name: … testvue4
✔ Select a framework: › Vue
✔ Select a variant: › TypeScript
```

#### 安装依赖包

```shell
pnpm install
```

#### 配置监听地址

> `vim vite.config.ts`

```ts
// 添加 server 部分
export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: 8866
  }
})
```

#### 配置启动打开浏览器: `如果机器没有图形界面不要设置`

> `vim package.json`

```json
// vite 后添加 --open 参数, 会在启动时打开浏览器。 但远程开发的时候, 远程的开发机器一般没有图形界面也没有浏览器, 指定 --open 参数后, 启动会报错
  "scripts": {
    "dev": "vite --open",
  }
```

#### 运行测试

```shell
pnpm run dev
```
