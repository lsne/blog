# NVM Nodejs 安装

## NVM 安装

#### 1.  下载安装

```sh
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash
```

#### 2.  移动nvm目录

```sh
mv .nvm /usr/local/nvm
```

#### 3.  设置nvm环境变量: vim /etc/bashrc

```sh
export NVM_DIR="/usr/local/nvm"
export NVM_HOME="/usr/local/nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
export NVM_NODEJS_ORG_MIRROR=https://npm.taobao.org/mirrors/node
```

#### 4.  列出可安装版本

```sh
nvm ls-remote
```

#### 5.  列出本地版本

```sh
nvm list
```

#### 6.  安装

```sh
nvm install v10.14.2
```



> [!WARNING] 不好用
> 最后发现不好用，安装模块老是安装到家目录，还是用二进制直接安装好用

## node npm 设置

#### 1.  更新npm版本

```sh
npm install npm@latest -g
```

#### 2.  本地安装

```sh
#在哪个目录下执行npm install ,就会在哪个目录下生成一个node_modules目录来存放npm install安装的代码
npm install 包名
```

#### 3.  全局安装

```sh
#全局安装后,这个包名就可以作为命令行工具中的命令使用
#单纯的在代码里require('')使用，不需要执行全局安装
npm install 包名 -g
```

#### 4.  初始化package.json文件

```sh
#根据提示一步一步生成
npm init

#回车直接生成,各种参数默认
npm init -y
```

#### 5.  列出所有可更新的node\_modules模块

```sh
npm outdated
```

#### 6.  安装package.json文件里的所有依赖包

```sh
npm install

#只安装生产环境依赖包:
npm install --production
#或使用环境变量
NODE_ENV=production
npm install
```

#### 7.  安装时更新package.json文件

```sh
npm install 包名 --save
npm install 包名 --save-dev
common options: [--save-prod|--save-dev|--save-optional] [--save-exact] [--no-save]
```

