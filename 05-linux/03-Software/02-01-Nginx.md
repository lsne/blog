# Nginx 笔记

## 基础环境

### 基础yum包安装

1. 操作系统

```text
centos 7
```

2. 安装包

```sh
yum -y install gcc gcc-c++ autoconf pcre pcre-devel make automake
yum -y install wget httpd-tools vim
```

3. ngingx 优势

```text
IO多路复用
轻量级
CPU亲和(affinity)
sendfile
```

4. 安装

```text
进进nginx官网点download
点: Linux packages for stable version
找到对应该版本对应该操作系统的repo源文件，配置到操作系统
```

5. 操作

```text
nginx -v  版本
nginx -V  编译的参数
```

6. 安装目录

```text
/etc/logrotate.d/nginx   日志轮转，用于logrotate服务的日志切割

/etc/nginx/nginx.conf     配置文件
/etc/nginx/conf.d/default.conf

/etc/nginx/fastcgi_params        php需要
/etc/nginx/uwsgi_params          django或flask需要
/etc/nginx/scgi_params

/etc/nginx/koi-utf    编码转换的映射文件
/etc/nginx/koi-win    编码转换的映射文件
/etc/nginx/win-utf    编码转换的映射文件

/etc/nginx/mime.types     设置http协议的Content-Type与扩展名对应关系

/usr/lib/systemd/system/nginx-debug.service       用于配置出系统守护进程管理器管理方式
/usr/lib/systemd/system/nginx.service
/etc/sysconfig/nginx
/etc/sysconfig/nginx-debug

/usr/lib64/nginx/modules          nginx模块目录
/etc/nginx/modules

/usr/sbin/nginx                    Nginx服务的启动管理终端命令
/usr/sbin/nginx-debug

/usr/share/doc/nginx-1.12.0/COPYRIGHT    使用手册
/usr/share/man/man8/nginx.8.gz

/var/cache/nginx                        nginx的缓存目录

/var/log/nginx                        nginx的日志目录
```

7. 编译参数

```text
--prefix=/etc/nginx                    #安装路径
--sbin-path=/usr/sbin/nginx
--modules-path=
--conf-path=
--error-log-path=
--pid-path=
--lock-path=

--http-client-body-temp-path=/var/cache/nginx/client_temp      #执行对应模块时,Nginx所保留的临时性文件
--http-proxy-temp-path=/var/cache/nginx/proxy_temp
--http-fastcgi-temp-path=/var/cache/nginx/fastcgi_temp
--http-uwsgi-temp-path=/var/cache/nginx/uwsgi_temp
--http-scgi-temp-path=/var/cache/nginx/scgi_temp

--user=nginx     #Nginx进程启动的用户和组
--group=nginx

--with-cc-opt=parameters     设置额外的参数将被添加到CFLAGS变量
--with-ld-opt=parameters     设置附加的参数,链接系统库
```
