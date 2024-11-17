# Docker File

## 网络问题, 在Dockerfile 文件中添加:

```dockerfile
# 解决go下载依赖包网络问题
ENV GOPROXY=https://goproxy.cn,direct

# 解决 alpine 下执行 apk 安装依赖网络问题
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

# 解决 debian 下执行 apk 安装依赖网络问题
RUN sed -i 's/deb.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list
apt-get clean
apt-get update

# 解决 ubuntu 下执行 apk 安装 依赖网络问题
RUN sed -i 's/archive.ubuntu.com/mirrors.aliyun.com/g' /etc/apt/sources.list
```


## Docker File Format

1. 必须有一个专门的目录,目录下放dockerfile文件
2. dockerfile文件首字母必须大写
3. 只有注释和指令,指令和参数( INSTRUCTION arguments ) 本身不区分大小写, 但指令部分约定俗成的大写
4. 如果需要向镜像中打包进入好多文件或程序, 这些文件必须在这个专门的目录下, 可以是下一层目录.
5. .dockerignore 打包时,不包含的包(即排除包,可以使用通配付符)
6. 整个dockerfile 是从上到下顺序执行的，所以哪个需要先启动，哪个就需要写到前面
7. 每个dockerfile 的第一个非注释行必须是FROM指令, 指定基于哪个镜像
8. docker build 生成镜像

```shell
docker build -t tinyhttpd:v0.1.1 ./
```

## Docker File Instructions

#### 1. FROM

```dockerfile
格式:
FROM <repository>[:<tag>] 或
FROM <repository>@<digest>

# Description: test image
FROM busybox:latest
FROM busybox@382d3a43

```
    
#### 2. MAINTANIER (depreacted)

```dockerfile
# 弃用, 被LABEL顶替
# 用于让Dockerfile制作者提供本人的详细信息
# Dockerfile并不限制这个指令出现的位置, 但推荐将其放置于FROM指令之后

MAINTAINER <authtor's detail>   可是任意文本信息,但约定俗成的使用作者名和邮箱
MAINTAINER "lsne <lsne@qq.com>"
```

#### 3. LABEL 

```dockerfile
LABEL <key>=<value> <key>=<value> <key>=<value> <key>=<value>

LABEL maintainer="lsne <lsne@qq.com>"
```

#### 4. COPY

```dockerfile
# 复制主机上的文件(该目录下的)到要创建的新镜像文件中
# 如果dest以/结尾,则复制到dest目录下面
COPY "<src>","<src>",..."<dest>"
    

COPY index.html /data1/web/html
```
    
#### 5. ADD

```text
类似COPY, ADD支持使用TAR文件和URL路径
直接将URL文件复制并保存为dest文件,或复制到dest/目录下
或将本地的TAR包在容器里的dest目录下展开, 如果dest不以/结尾,则只复制TAR包,不展开
```
    
#### 6. WORKDIR

```dockerfile
# 用于为Dockerfile中的所有的RUN,CMD,ENTRYPOINT,COPY,ADD指令设定工作目录

WORKDIR /usr/local/src/

```
#### 7. VOLUME

 ```docker
创建挂载点，只能是docker自动挂在模式，没办法指定对应该的宿主机目录
```

#### 8. EXPOSE

```dockerfile
# 用于为容器打开指定要监听的端口, 主要用于-P时,容器知道需要暴露哪个端口
# 只能随机映射到一个宿主机端口上(-P时)
# 可以用于当docker run -P 暴露所有端口时

EXPOSE <port>[/<protocol>] <port>[/<protocol>]
EXPOSE 1122/tcp   #其实是没有真的暴露, 只有在谱尼时使用-P,才会映射到宿主机上的一个随机端口
```
    
#### 9. ENV

```dockerfile
# 用于为镜像定义所需的环境变量, 并可被其后的其他指令调用
# 调用格式为 $variable_name 或 ${variable_name}
# 最好在 MAINTAINER 或 LABEL 之后
# 在dockerfile中定义的变量, 是可以在启动容器之后直接使用的

ENV <key> <value>
ENV <key>=<value> ...
``` 

#### 10. RUN

```dockerfile
# 用于在镜像创建时(生成镜像之前)执行的环境准备命令
RUN command1 && \
    connand2 && \
    ...
    
# 第一种格式，默认以/bin/sh -c 运行
RUN <command>

# 如果某个命令中间有空格,使用第二种格式:
RUN ["/bin/bash","-c","<comand>","<参数>"]
``` 
    
#### 11.  CMD

```dockerfile
# 用于在容器启动时,执行的命令
CMD 只能有一个, 如果有多个,只有最后一个生效

# 第一种格式，默认以/bin/sh -c 运行，但是默认用exec做了替换,所以pid还是1, 所以用docker stop 停止不了该进程，因为收不到信号
# 不过docker在启动容器的时候会默认用execmingle替换为PID为1启动
CMD <command>

# 如果某个命令中间有空格,使用第二种格式
# 不过如果executable不是以/bin/sh开始,则后面的参数不能用环境变量
# 但是以/bin/sh运行, 那么后面的实际命令PID号不是1
CMD ["<executable>","<参数1>","<参数2>"]

# 第三种, 要结合ENTRYPOINT指令, 为ENTRYPOINT指令提供默认参数
CMD ["<参数1>","<参数2>"]
```

#### 12. exec COMMAND

```dockerfile
顶替shell进程，把command进程变为进程PID为1
```
    
#### 13. ENTRYPOINT

```dockerfile
# 指定docker默认运行的命令
# 可以用CMD命令指定这个命令的参数

ENTRYPOINT <command>
ENTRYPOINT ["<executable>","<param1>","<param2>"]

# 一般情况,最好是用ENTRYPOINT启动一个脚本
ENTRYPOINT ["docker-entrypoint.sh"]

# 容器运行时可以用 --entrypoints 改变
docker container run --entrypoints 
```
    
#### 14. USER

```dockerfile
# 必须确保容器中有这个用户
USER <UID>|<username>
```
    
#### 15. HEALTHCHECK

```dockerfile
# 检查主进程的工作状态健康与否

# 拒绝任何的检查
HEALTHCHECK NONE

HEALTHCHECK [OPTIONS] CMD
    --interval=DURATION   #每间隔多长时间检查一次
    --timeout=DURATION   #超时时间
    --start-period=DURATION
    --retries=N #检查几次默认3

# 例子
HEALTHCHECK --interval=5m --timeout=3s \
	CMD curl -f http://localhost/ || exit 1
```
    
#### 16. SHELL

```dockerfile
指定用什么shell运行
```
    
#### 17. STOPSIGNAL

```dockerfile
# docker run stop 命令传递给容器的信号
STOPSIGNAL 9
```
    
#### 18. ARG

```dockerfile
# 只在build时使用,也可以在docker build 时，用 --build-arg 传过来
--build-arg <varname>=<value>

ARG <varname>=<value>
```
    
#### 19. ONBUILD

```dockerfile
用于在Dockerfile中定义一个触发器
ONBUILD 中的指令, 在build的时候不会执行。 
但是build出来的镜像做为FROM被其他人重新编辑的时候,才会执行
```