# Docker笔记

### 阿里云docker仓库地址

```linux
https://dev.aliyun.com/search.html
```

## Linux Namespaces


命名空间 | 系统调用参数 | 隔离内容 | 内核版本
---|--- |---|---
UTS  | CLONE_NEWUTS | 主机名和域名 | 2.6.19
IPC  | CLONE_NEWIPC | 信号量,消息队列和共享内存 | 2.6.19
PID  | CLONE_NEWPID | 进程编号 | 2.6.24
NetWork  | CLONE_NEWNET | 网络设备，网络栈, 端口等 | 2.6.29
Mount  | CLONE_NEWNS | 挂载点(文件系统) | 2.4.19
User  | CLONE_NEWUSER | 用户和用户组 | 3.8

## 原理

```
Control Groups, CGroups  -- 控制以上6种命名空间,限制资源
LinuX Container, LXC  -- 用来操作cgroups的一堆命令行工具, 如: lxc-create

docker 对 lxc 的二次封装和整理
```

### Docker 配置文件

#### 1. Docker 配置加速镜像

> 不好使, 后来改方案了

```sh
创建文件
vim /etc/docker/daemon.json
{
	"registry-mirrors": ["https://registry.docker-cn.com"]
}
保存后,重启docker: systemctl restart docker
```
    
#### 2. 自己做镜像(将调试工具等打进去), 放到私有仓库

#### 3. 在docker运行的程序一定要在前台运行, 不能在后台运行. 

#### 4. 有一个linux操作系统镜像: alpine 有时间研究一下

### 查看 dockerfile 时编辑的历史命令:

```sh
docker image history --no-trunc postgres:15.2 
```

### docker 导出导入

```sh
# 把镜像(image)导, 镜像不用运行。包含所有父层，以及所有标签+版本
docker save 304034605/redis-cluster-operator:v0.0.1 -o redis-cluster-operator.tar.gz
docker load -i redis-cluster-operator.tar.gz

# 从当前正在启动运行中的容器(container)中导出.没有任何图层/历史记录, 容器快照将会丢弃所有的历史记录和元数据信息
docker export
docker import 
```

### docker 命令

```sh
# 运行并进入容器
docker run -it redis:6.0.16 /bin/bash
```

#### 1. docker 版本信息和基本信息,在镜像仓库搜索镜像

```sh
docker version
	查看docker版本信息
	
docker info
	查看docker状态, 正在运行几个容器,暂停几个,停止几个,存储类型,配置的加速镜像网址等
	
docker search
	在镜像仓库搜索镜像
	
docker start -i -a <b1>
	启动已经停止的容器
	
docker stop <b1>
	关闭容器
	
docker kill <b1>
	kill -9 容器
	
docker rm <b1>
	删除停止状态的容器
	
docker logs <b1>

docker top <b1>
	显示容器使用了CPU等情况
	
docker status
	显示各个容器内存的使用情况
	
docker inpect <b1>
	查看镜像状态,比如输出信息中的CMD框里,表示镜像启动后运行的命令
	
docker save -o abc.gz mydocker/web2 mydocker/web
	打包保存镜像
	
docker load -i abc.gz
	导入镜像
```
    
#### 2. docker image 以及命令分组之前的用法

```sh
docker image pull
docker pull
docker pull <registry>[:<port>]/[<namespace>/]<name>:<tag>
	将镜像下载到本地
		
docker image ls
docker image ls --no-trunc
docker images
	列出本地所有的镜像
	
docker image rm
docker rmi
	删除一个镜像
		
docker login -u <user> -p <password> <SERVER>
docker image push <mydocker/web>
docker push <mydocker/web>
	登录仓库,并上传镜像
	
如果上传到其他仓库如阿里云等, 需要修改镜像标签,标签需要加上阿里云仓库的url地址
docker logout
docker login -u <user> -p <password> <SERVER>
...

```

#### 3. docker container 

```sh
docker container ls
docker ps
	列出所有容器
	
docker container exec -it redis1 /bin/sh
docker exec -it redis1 /bin/sh
	进入容器的shell终端
	
docker container start
docker container stop

docker container port web1 
	展示端口映射关系
```

#### 4. docker run  && docker container run 

```sh
docker run --name
	给容器起一个名字
	
docker run -it 
	交互式启动, 进入交互式接口
	
docker run --rm
	停止容器时自动删除
	
docker run -d 
	后台运行

docker run -e
	设置环境变量,可以修改在dockerfile中设置的变量

docker run --name b1 -it busybox:latest 

docker run --network 
	设置容器的网络模式,详情请看后面 <docker 网络> 部分的第6点 -- 设置网络模式
	
docker run -v 
	挂载数据目录，详情请看后面 <docker 存储卷> 部分
	
docker run --name b1 -rm busybox:latest cat /data/web/index.html
	不运行默认命令，而是改为运行最后指定的命令，运行结束后自动关闭容器
```
    
#### 5. docker network

```sh
docker network ls
	给容器起一个名字
	
docker run -t
	交互式启动,打开一个终端??
	
```
    
## docker 做镜像

#### 1. 基于容器制作, commit 命令

```sh
1. 启动容器
	docker run web1

2. 进入容器,然后对容器做预期的修改操作
	docker exec -it web1 /bin/sh 
	
3. 创建镜像
	docker commit -p web1
	
4. 给制作完成了的镜像打标签
	docker tag 9988df5ac287 mydocker/web:v0.1
	
5. 制作镜像,修改镜像的运行命令,并直接打标签
	docker commit -a "My <my@qq.com>" -c 'CMD ["/bin/httpd","-f","-h", "/data/html"]' -p web1 mydocker/web2:v0.2-1
	
```

#### 2. 基于 dockerfile 制作,  build 命令

#### 3. Docker Hub automated builds (还是基于dockerfile的)

## docker 网络

#### 1. 默认有三种网络支持

```text
bridge    默认为 net bridge
host      与宿主机共享3个底层的命名空间
none      没有网络
```
    
#### 2. 查看bridge连接情况
    
```sh
# 1. 安装bridge-utils工具
yum install -y bridge-utils

# 2. 执行命令查看
brctl show
```
    
#### 3. 指定启动的容器使用哪种网络
    
```sh
docker container run --network 
```
    
#### 4. 查看容器或任意一个docker对象的详细信息

```sh
docker network inspect bridge
docker container inspect web
```
    
#### 5. 手动操作名称空间 ip 命令

```sh
yum install -y iproute

ip netns help

ip netns add r1
ip netns set
ip netns list
ip netns exec <ns> ifconfig

创建虚拟网卡
ip link add name veth1.1 type veth peer name veth1.2

查看
ip link sh 

把veth1.2网卡移动到r1的命名空间
ip link set dev veth1.2 netns r1

激活网卡
ifconfig veth1.1 10.10.10.10/16 up

```

#### 6. 设置网络模式
    
```sh
# 给容器设置 网络链接模式，域名，dns等
docker run --name web1 -it -rm --network bridge -h t1.hostname.com --dns 114.114.114.114 busybox:latest

# 共享web容器的网络命名空间，即IP会和web1的完全一样,相当于在一台机器上。 但是文件系统等其他资源没有共享
# 在容器web2 上执行ifconfig 和 在容器web1上执行ifconfig 看到的信息完全一样
docker run --name web2 -it --network container:web1

# 使用host模式网络, 即和宿主机共用网络命名空间
# 即在容器上执行ifconfig 和 在宿主机上执行ifconfig显示的是相同的内容
docker run --name web3 -it --network host

# 对外暴露端口
docker run -p ip:port:containerPort
```

#### 7. 自定义docker0桥的网络属性信息

```json
// vim /etc/docker/daemon.json
{
	"bip": "192.168.1.5/24",
	"fixed-cidr": "10.20.0.0/16",
	"fixed-cidr-v6": "2001:db8::/64",
	"mtu": 1500,
	"default-gateway": "10.20.1.1",
	"default-gateway-v6": "2001:db8:abcd::89",
	"dns": ["10.20.1.2","10.20.1.3"]
}
```

#### 8.  监听一个端口, 可以用其他机器上的docker命令管理本机的容器

```sh
vim /etc/docker/daemon.json
{
	"hosts": ["tcp://0.0.0.0:2375", "unix:///var/run/docker.sock"]
}

# 重启docker进程，然后可以用其他机器上的docker -H 命令j进行操作(--host)

docker -H 10.209.32.135:2375 container run --name web1 nginx:lastest
```
    
#### 9.  创建网络

```sh
docker network create -d bridge --subnet "127.26.0.0/16" --gateway "172.26.0.1" mybr0

docker network ls

ifconfig

ip link set dev br-234324 name docker1 #改接口改名
```
    
## docker 存储卷

1. docker有两种卷类型

```sh
# 1. Bind mount volume (绑定挂载卷)
#    指定<宿主机上的数据目录>:<容器内挂载点>
docker container run -it --name bbox1 -v /data1:/data busybox

# 2. Dodker-managed volume (docker管理)
# docker管理的，只需要指定容器内的挂载点是什么，docker会自动在宿主机上创建一个空目录进行挂载
# 一般情况，宿主机上的目录为 /var/lib/docker/vfs/dir/<some volume ID>
docker container run -it --name bbox2 -v /data busybox

# 3. 第三种是直接从一个已经存在的容器中复制卷的映射关系
docker container run -it --name bbox3 --volumes-from bbox1 busybox
```
    
2. 查看挂载卷

```sh
# inspect 的输出信息是个json字符串，可以用-f 参数进行过滤
docker inspect -f {{.Mounts}} web2
```

## Docker私有registry

#### 1. 创建私有仓库有两种方法

```text
1. docker 把 registry 做成了一个镜像, 可以直接下载,然后run -v 挂载一个存储卷目录
2. yum install docker-registry
	yum这个实际是一个Python开发的一个web程序
3. harbor 是vmware在docker-registry 的基础上做的二次开发。 企业级私有镜像
```
    
#### 2. yum之后, 修改配置文件,启动服务

```text
vim /etc/docker-distribution/registry/config.yml
rootdirectory: /var/lib/registry
http:
	addr: :5000
	
systemctl start docker-distribution
```
    
#### 3. 推镜像

```text
1. 重新给镜像打tag
docker tag myweb:v0.3-11 node02.magedu.com:5000/myweb:v0.3-11

docker push node02.magedu.com:5000/myweb:v0.3-11
	push 默认用https协议,所以会报错
	可以修改/etc/docker/daemon.json 中的 "insecure-registries":[],进行修改
	"insecure-registries":["node02.magedu.com:5000"]
	systemctl restart docker  #这里修改和重启的是客户端
	
然后可以就可以上传了，pull的机器上也需要修改daemon.json文件并重启docker
```

#### 4. harbor

```text
因为harbor 需要用到mysql redis等多个应用.
如果所有应用都用docker启动, 也需要先后顺序等。
所以需要用到 Docker Compose 编排

yum install docker-compose 
https://github.com/goharbor/harbor

vim docker-compose.yml  #编排工具
vim harbor.cfg
./install.sh

然后就可以使用了, 所有docker机器配置/etc/docker/daemon.json 中的 "insecure-registries"

docker login node02.magedu.com
Username:
Password:

docker push node02.magedu.com/devel/myweb

docker-compose pause
	停止所有compase中指定的容器
```

## Docker资源限制

#### 1. 默认没有任何资源限制

#### 2. 依赖于内核的Linux capabilities支持

#### 3. limit 选项

```sh
--oom-kill-disable 禁止被oom杀掉,需要与 -m  一块使用

# 限制容器使用的CPU和内存
docker container run -m -c
```
    
#### 4. docker-stress-ng
    
```sh
# 测试用镜像
# --vm表示压测内存
docker run --name stress -it --rm -m 256m lorel/docker-stress-ng:latest stress --vm 2   

# --cpu表示压测CPU
docker run --name stress -it --rm -m 256m --cpus 2 lorel/docker-stress-ng:latest stress --cpu 2 
```

## 问题处理

####  docker 批量删除容器

```sh
docker stop $(docker ps -q)

docker rm $(docker ps -aq)
```