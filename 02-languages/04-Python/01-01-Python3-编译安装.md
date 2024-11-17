# Python3 编译安装和创建虚拟环境

## 编译安装 Python

#### 1. 下载源码包

```
// 在这个页面找到对应版本的源码，然后下载
https://www.python.org/downloads/source/
```

#### 2. 安装编译用到的依赖包

> ubuntu 环境

```shell
# pkg-config 工具在 ubuntu 环境编译时开启 --enable-optimizations 参数时会用到
sudo apt-get install make pkg-config zlib1g-dev libffi-dev libssl-dev libcurl4-openssl-dev libbz2-dev
```

> centos 环境

```bash
yum install libffi-devel openssl-devel libcurl-devel bzip2-devel
```

#### 3. 对源码解压后进行编译安装

```shell
tar zxvf Python-3.11.5.tgz

cd Python-3.11.5

# ubuntu 可以加 --enable-optimizations;  centos系列 gcc 版本太低，要去掉 --enable-optimizations 参数
./configure --prefix=/usr/local/python0311 --enable-optimizations

make && make install
```

#### 4. 添加 普通开发用户的 PATH 路径

```sh
vim ~/.bashrc

export PYROOT=/usr/local/python0311
# PATH
export PATH=$PYROOT/bin:$PATH

source ~/.bashrc
```

#### 5. 添加国内源

> 国内源地址

```
阿里云:  http://mirrors.aliyun.com/pypi/simple/
中国科技大学:  https://pypi.mirrors.ustc.edu.cn/simple/
豆瓣(douban):  http://pypi.douban.com/simple/
清华大学:  https://pypi.tuna.tsinghua.edu.cn/simple/
中国科学技术大学:  http://pypi.mirrors.ustc.edu.cn/simple/
```

> 以设置阿里云的源为例

```sh
pip3 config set global.index-url https://mirrors.aliyun.com/pypi/simple
pip3 config set install.trusted-host https://mirrors.aliyun.com
```

#### 6. Python 项目安装依赖

> 也可以在每次安装依赖时都手动指定国内源

```shell
pip install virtualenv -i http://pypi.douban.com/simple/ --trusted-host pypi.douban.com
```

> 安装 `requirements.txt` 文件中的依赖

```shell
pip install -r requirements.txt
```

#### 手动安装依赖包的方式

```shell
# 在这里找到 pyxxx.whl 的对应版本文件, 并下载  
http://www.lfd.uci.edu/~gohlke/pythonlibs/#pyxxx  
  
# 然后安装
pip install /home/lsne/download/pyxxx-1.4.4-cp36-cp36m-linux_x86_64.whl
```
#### 7. 完成

## 创建和使用虚拟环境

#### 1. 创建虚拟环境

```sh
# 进入项目根目录
cd testpy

# 创建虚拟环境,  一般将虚拟环境放在项目根目录
python3 -m venv .venv

# 创建虚拟环境时, 将系统默认的 python 环境中安装的依赖包同步创建到虚拟环境中
/usr/bin/python3 -m venv --system-site-packages .venv

# 或 创建虚拟环境放在家目录(虚拟环境放在 项目根目录 或 用户家目录 二选一)
python3 -m venv ~/.venv/dbamanager
```

#### 2. 激活虚拟环境

```sh
source .venv/bin/activate

# 或 
source ~/.venv/dbamanager/bin/activate
```

#### 3. 使用虚拟环境, 安装依赖

```sh
pip install requests
```

#### 4. 退出虚拟环境

```sh
deactivate
```

## 古早的虚拟环境使用


> [!WARNING] 废弃
> 这个虚拟环境太古老了, 看老项目时可能会遇到, 新项目一般还是建议使用 venv 创建虚拟环境


> 安装虚拟环境

```shell
./bin/pip3.7 install virtualenv -i http://pypi.douban.com/simple/ --trusted-host pypi.douban.com
./bin/pip3.7 install virtualenvwrapper -i http://pypi.douban.com/simple/ --trusted-host pypi.douban.com
```

> 创建并使用虚拟环境

```shell
./bin/virtualenv /usr/local/virtualenv/flask_py3 -p /usr/local/python37/bin/python3.7 --no-site-packages

进入虚拟环境
source /usr/local/virtualenv/dbamanager/bin/activate

退出虚拟环境
deactivate

    ```

> 3. 或先配置虚拟环境然后用mkvirtualenv命令(不过这一个发现用的是系统默认环境，我的默认环境是2.6)

```shell
mkdir ~/.virtualenvs
vim ~/.bashrc
export WORKON_HOME=$HOME/.virtualenvs
source /usr/local/python37/bin/virtualenvwrapper.sh

source ~/.bashrc

mkvirtualenv /usr/local/virtualenv/flask_py37
```
## VSCode 相关设置

### 插件

```
Python
pylint
yapf
```