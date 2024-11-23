# 编译安装

#### 内核参数调整

```toml
# vim /etc/sysctl.conf

# 有说从pg9.3开始使用/dev/shm分配共享内存，不受shmmax参数控制了
kernel.shmmax = 68719476736                   # (默认) # 最大共享内存段大小
kernel.shmall = 4294967296                    # 可以使用的共享内存的总量
kernel.shmmni = 4096                          # 整个系统共享内存段的最大数目
kernel.sem = 5010064128000501001280           # 每个信号对象集的最大信号对象数
fs.file-max = 7672560                         # 文件句柄的最大数量
net.ipv4.ip_local_port_range = 9000 65000     # 应用程序可使用的IPv4随机端口范围
net.core.rmem_default = 1048576               # 套接字接收缓冲区大小的缺省值
net.core.wmem_default = 262144                # 套接字发送绶冲区大小的缺省值
net.core.wmem_max = 1048576                   # 套接字发送缓冲区大小的最大值

# sysctl -p # 使配置生效
```

#### 创建用户

```sh
groupadd postgres
useradd -g postgres postgres
```

#### 环境变量配置

> `vim /home/postgres/.bash_profile`

```sh
export PGPORT=1922
export PG_HOME=/usr/local/pg12.2
export PGDATA=$PG_HOME/data
export LD_LIBRARY_PATH=$PG_HOME/lib
export LANG=en_US.utf8
export PATH=$PG_HOME/bin:$PATH
```

#### 源码编译安装所需要的依赖

```sh
readline
flex
bison


最小依赖: gcc gcc-c++ zlib-devel readline-devel
其他依赖: perl-ExtUtils-Embed pam-devel libxml2-devel libxslt-devel openldap-devel python-devel openssl-devel cmake
```

#### 下载源码包

```sh
wget https://www.postgresql.org/ftp/source/v12.6/postgresql-12.6.tar.gz
tar zxvf postgresql-12.6.tar.gz
```
#### 设置目录权限并切换到源码目录

```sh
mkdir /usr/local/pg12.16
chown postgres:postgres /usr/local/pg12.16

su - postgres

cd postgresql-12.16
```
#### 配置编译参数

```sh
# 简单配置编译参数
./configure --prefix=/usr/local/pg12.16

# 复杂配置编译参数
./configure --prefix=/data1/server --with-systemd --with-extra-version="dbup"  --with-system-tzdata=/usr/share/zoneinfo LDFLAGS=-Wl,-rpath=\'\$\$ORIGIN/../lib\',--disable-new-dtags --disable-rpath --with-openssl [--without-readline]

# ./configure 可选参数
--prefix=/dir   # 指定安装路径
--with-python   # 对 python 进行扩展支持
--with-perl     # 对 perl 进行扩展支持
--with-libxml   # 对 xml 进行扩展支持
--with-pgport   # 指定端口号
--with-systemd  # 使用 systemd 管理启动进程
--with-system-tzdata # 使用系统时区, 而不是 pgsql 内置时区
--with-tcl
--with-pam
--without-ldap
--with-libxslt
--enable-thread-safety
--with-wal-blocksize=16
--with-blocksize=8 # 默认 8K
--enable-dtrace    # 生产环境不要加
--enable-debug     # 生产环境不要加
--with-extra-version="-dbup"  # 指定额外版本号, 示例为改版本改为: 12.6-dbup
--with-openssl                # 对 openssl 进行扩展支持, 需要提前安装openssl:  yum install -y openssl-devel  openssl
--disable-rpath # 必须填写, 添加后,  /usr/local/pg12.16/bin/ 目录下的命令, 会优先从 /usr/local/pg12.16/lib/ 寻找 lib.so 依赖
--without-readline  # 会禁止使用 readline, 导致psql 进入postgres库后, 不能上下翻页查找历史命令, 不能回退字符等;  但在 centos7 系统中默认的 libreadline.so.6 有漏洞会被扫描出来, 所以需要加上这个参数禁用。 麒麟系统上的是 libreadline.so.7 好像没这个漏洞了, 可以不用指定这个参数

--with-blocksize
# 默认 8K 适用于大多数场景
# 如果经常做插入, 数据量增长非常快, 调大一些
# 如果经常小数据查询, 经常更新, 内存不是非常大, 设置小一些

LDFLAGS
# 是一个环境变量，用于指定链接器的选项。您可以在编译 PostgreSQL 时通过设置 `LDFLAGS` 来传递额外的链接选项。
# 添加额外的库路径：使用 `-L` 选项，例如 `LDFLAGS="-L/path/to/libs"`。
# 添加特定的链接器选项，例如 `-Wl,--no-as-needed`，控制链接器的行为。

# LDFLAGS=-Wl,-rpath=\'\$\$ORIGIN/../lib\',--disable-new-dtags 的作用:
-Wl       # 告诉编译器将后面的选项传递给链接器（`ld`）
-rpath    # 这个选项用于设置运行时库搜索路径
$$ORIGIN  # 占位符, 表示运行程序所在目录
-rpath='$$ORIGIN/../lib' # 表示运行程序所在目录的上级目录下的lib目录
--disable-new-dtags      # 库的搜索顺序将优先考虑 `RPATH`，而不会受到环境变量（如 `LD_LIBRARY_PATH`）的影响
```

#### 编译安装

> 编译方式一:

```sh
# 编译 pgsql
make
# make check
# make install # 会有调试信息, 二进制文件会非常大, 生产环境建议用 make install-strip
make install-strip

# 编译插件
cd contrib
make
make install
```

> 编译方式二:

```sh
gmake world   # 编译 pgsql 和 contirb 目录下所有自带的插件
gmake check-world # 检查, 需要在普通用户下执行, 可选, 耗时比较长
gmake install-world # 安装
```

#### 初始化数据库

```sh
/usr/local/pg12.16/bin/initdb -D /pgdata -E UTF8 --data-checksums --locale=en_US.utf8 [--pwfile=/opt/.pwdfile] [-W]

# -W 表示初始化时, 交互提示输入超级用户的密码
# 不使用 -W, 直接将密码写到一个文件里, 然后用 --pwfile 参数指定密码文件也可以
```

#### 启动数据库

```sh
pg_ctl -D $PGDATA start
```

### 复制依赖库文件

> [!WARNING] 有问题,会影响操作系统启动
> 将各个命令所需要的依赖库文件, 复制到程序下的lib/目录(下面是实现脚本)  
> 这一步不要执行, 会出问题。 但具体会出什么问题忘记了。好像是 systemctl 相关的 `.so` 库文件版本不对, 导致操作系统都不能 ssh 了。 应该是改了全局的环境变量, 回头测试一下只在 postgres5432.service 文件里加相关环境变量试试

```sh
#!/usr/bin/env bash
# @Author : lsne
# @Date : 2021-08-20 18:47
 
dir="/data1/server"
 
for cmd in $(ls ${dir}/bin/);do
    ldd ${dir}/bin/${cmd} > ${cmd}.ldd.log
    while read line; do
        lib_name=$(echo $line | awk '{print $1}')
        lib_path=$(echo $line | awk '{print $3}')
        if [ "${lib_path}AA" == "AA" ];then
            continue
        fi
        if [ "$(echo $lib_path | grep -c data1 )" -eq 1 ];then
            continue
        fi
        #echo $lib_name $lib_path
        cp ${lib_path} ${dir}/lib/
    done < ${cmd}.ldd.log
done
```
