# 麒麟v10 编译 mongodb 6.0.5

### 1. 下载 gcc  及相关依赖包

```sh
1. gcc: https://gcc.gnu.org/pub/gcc/releases/gcc-9.2.0/
2. 依赖:
地址:
https://gcc.gnu.org/pub/gcc/infrastructure/

包名:
gmp-6.1.0.tar.bz2
mpfr-3.1.4.tar.gz
mpc-1.0.3.tar.gz
isl-0.18.tar.bz2
```

### 2. 编译安装gcc

```sh
yum install zlib-devel bzip2-devel openssl-devel ncurses-devel sqlite-devel readline-devel tk-devel gcc make libffi-devel bzip2 openssl-perl libcurl-devel libyaml libyaml-devel python-setuptools zlib-devel libffi-devel openssl openssl-devel libffi-devel

# 安装gcc9.2:

tar zxvf gcc-9.2.0.tar.gz

# 将以下四个包全部拷到gcc-9.2.0中
gmp-6.1.0.tar.bz2
mpfr-3.1.4.tar.gz
mpc-1.0.3.tar.gz
isl-0.18.tar.bz2

# 进入gcc-9.2.0执行命令解决依赖关系:
./contrib/download_prerequisites

# 创建编译用目录:gcc-build-9.2.0
mkdir gcc-build-9.2.0

# 进入编译用目录:
cd gcc-build-9.2.0

# 开始编译
../configure -enable-checking=release -enable-language=c,c++ -disable-multilib -prefix=/usr
make -j
make install

# 安装结束后查看gcc版本
gcc -v
```

### 3. 安装 python3

```sh
yum install python3 python3-pip python3-devel openssl-devel xz-devel

python3 -m pip install wheel
```

### 4. 编译安装mongodb

```sh
tar zxvf mongodb-src-r6.0.5.tar.gz
cd mongodb-src-r6.0.5
python3 -m pip install -r etc/pip/compile-requirements.txt

python3 buildscripts/scons.py CC=/usr/bin/gcc CXX=/usr/bin/g++ DESTDIR=/opt/mongo PREFIX=/opt/mongodb/ --link-model=static install-servers MONGO_VERSION=6.0.5 LINKFLAGS="-static-libstdc++" CFLAGS="-march=armv8-a+crc -mtune=generic" -j30 --disable-warnings-as-errors

# LINKFLAGS="-static-libstdc++"   选项可以将 gcc++ 打到二进制文件, 否则会报错: ./mongod: /lib64/libstdc++.so.6: version `GLIBCXX_3.4.26' not found (required by ./mongod)

# 删除调试信息,否则包巨大
/opt/mongo/opt/mongodb/bin
strip mongod
strip mongos
```