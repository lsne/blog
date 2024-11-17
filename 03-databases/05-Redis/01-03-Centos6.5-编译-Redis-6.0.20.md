# centos 6.5 编译 redis 6.0.20

## 编译 gcc 5.3.0 

### 1. 下载 gcc 5.3.0 包, 解压,进入目录

```sh
wget http://ftp.gnu.org/gnu/gcc/gcc-5.3.0/gcc-5.3.0.tar.gz

tar zxvf gcc-5.3.0.tar.gz

# 改个目录名, 原目录名做为编译成功之后的安装路径
mv gcc-5.3.0 gcc-5.3.0-build
mkdir gcc-5.3.0

cd gcc-5.3.0-build
```

### 2. 编译前执行准备脚本

> 不执行会报错说缺少包

```
./contrib/download_prerequisites
```

### 3. 创建编译目录,进入目录进行编译

```sh
mkdir gcc-build-5.3.0
cd gcc-build-5.3.0/

../configure --prefix=/root/redis/ls/gcc-5.3.0 --disable-multilib
make -j4
make install
```

## 编译 redis 6.0.20 

### 1. 下载 redis 源码包

```sh
wget https://github.com/redis/redis/archive/refs/tags/6.0.20.tar.gz
```


### 2. 解压, 然后编译

```sh
tar zxvf redis-6.0.20.tar.gz
cd redis-6.0.20
CC=/root/redis/ls/gcc-5.3.0/bin/gcc make
```

### 3. 完成

