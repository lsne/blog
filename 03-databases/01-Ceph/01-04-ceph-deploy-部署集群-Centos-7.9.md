# ceph-deploy 部署 N 版 ceph 集群

[toc]

## 环境准备

> 由于环境不允许, 这里只有一块网卡, 所以只能混合使用了, IP1, IP2 都是同一块网卡的一个IP。 实际生产环境中, 应该使用两块网卡

| 角色 | 主机名 | IP1 | IP2 | 磁盘 |
| --- | --- | --- | --- | --- |
| admin   | myk8smaster04v.cpp.zzt.lsne.cn | 10.52.76.165 | 10.52.76.165 | sdb, sdc, sdd, sde |
| mgr01   | myk8smaster05v.cpp.zzt.lsne.cn | 10.52.76.166 | 10.52.76.166 | sdb, sdc, sdd, sde |
| mgr02   | myk8smaster06v.cpp.zzt.lsne.cn | 10.52.76.167 | 10.52.76.167 | sdb, sdc, sdd, sde |
| mon01   | myk8snode05v.cpp.zzt.lsne.cn   | 10.52.76.168 | 10.52.76.168 | sdb, sdc, sdd, sde |
| mon02   | myk8snode06v.cpp.zzt.lsne.cn   | 10.52.76.170 | 10.52.76.170 | sdb, sdc, sdd, sde |
| mon03   | myk8snode07v.cpp.zzt.lsne.cn   | 10.52.76.169 | 10.52.76.169 | sdb, sdc, sdd, sde |
| store01 | myk8snode08v.cpp.zzt.lsne.cn   | 10.52.76.173 | 10.52.76.173 | sdb, sdc, sdd, sde |
| store02 | myk8snode09v.cpp.zzt.lsne.cn   | 10.52.76.171 | 10.52.76.171 | sdb, sdc, sdd, sde |
| store03 | myk8snode10v.cpp.zzt.lsne.cn   | 10.52.76.172 | 10.52.76.172 | sdb, sdc, sdd, sde |


## 1. 配置操作系统环境(所有机器都执行)

### 1.1 配置操作系统时间同步(非常重要, 时间不同步可能导致整个集群瘫痪)

> 具体时间同步根据具体环境进行配置

### 1.2 创建 ceph 运维用户, 并且设置该用户可以无密码 su - root 

> 这里使用 `lsne` 用户

### 1.3 配置 ssh 互信

```sh
su - lsne

ssh-keygen

ssh-copy-id lsne@admin
ssh-copy-id lsne@mgr01
ssh-copy-id lsne@mgr02
ssh-copy-id lsne@mon01
ssh-copy-id lsne@mon02
ssh-copy-id lsne@mon03
ssh-copy-id lsne@store01
ssh-copy-id lsne@store02
ssh-copy-id lsne@store03
```

### 1.4 配置 ceph.repo 源: `vim /etc/yum.repos.d/ceph.repo`

```toml
[ceph]
name=Ceph packages for $basearch
baseurl=https://download.ceph.com/rpm-nautilus/el7/$basearch
enabled=1
priority=2
gpgcheck=1
gpgkey=https://download.ceph.com/keys/release.asc

[ceph-noarch]
name=Ceph noarch packages
baseurl=https://download.ceph.com/rpm-nautilus/el7//noarch
enabled=1
priority=2
gpgcheck=1
gpgkey=https://download.ceph.com/keys/release.asc

[ceph-source]
name=Ceph source packages
baseurl=https://download.ceph.com/rpm-nautilus/el7/SRPMS
enabled=0
priority=2
gpgcheck=1
gpgkey=https://download.ceph.com/keys/release.asc
```

##### 1.4.1 或者指向阿里云的 yum 源

```sh
curl -o /etc/yum.repos.d/CentOS-Base.repo http://mirrors.aliyun.com/repo/Centos-7.repo
curl -o /etc/yum.repos.d/epel.repo http://mirrors.aliyun.com/repo/epel-7.repo


https://mirrors.aliyun.com/ceph/rpm-nautilus/el7/x86_64/?spm=a2c6h.25603864.0.0.c5314373IIbxY1
```

### 1.5 安装需要的 ceph 相关软件包

> 可以忽略, 在后面通过 ceph-deploy install 进行远程安装


```sh
# 可根据节点角色, 选择性安装单个包
yum install ceph-osd ceph-mon ceph-mds ceph-radosgw ceph-mgr
yum install s3cmd    # 操作对象存储使用的 linux 命令行工具
yum install ceph-fuse  # 挂在 cephFS 使用的工具 
yum install ceph-mgr-dashboard  # ceph 的管理页面, 不需要不安装
```

## 2. 安装 ceph 集群(在 admin 节点操作)

### 2.1 安装 pip 命令并使用 pip 命令安装 ceph-deploy

```sh
yum install python-pip

pip install ceph-deploy


# 如果 pip install 时访问 pypi.python.org 超时，可以设置 linux 代理。 或者使用 pip 的国内源

export http_proxy=http://proxy.lsne.cn:3128
export https_proxy=http://proxy.lsne.cn:3128
```

### 2.2 切换到 ceph 运维用户

```sh
su - lsne
```

### 2.3 创建配置文件目录, 并切到目录

```sh
mkdir ~/ceph-cluster

cd ~/ceph-cluster
```

### 2.4 创建集群

```sh
ceph-deploy new --public-network 10.52.76.0/24 --cluster-network 10.52.76.0/24 myk8snode05v.cpp.zzt.lsne.cn myk8snode06v.cpp.zzt.lsne.cn myk8snode07v.cpp.zzt.lsne.cn
```

### 2.5 在监控节点安装 mon 包

> 如果已经使用 yum 安装, 则忽略

```sh
# 远程在所有节点安装所有包(这里写的简称, 需要替换为具体的主机名)
ceph-deploy install --release nautilus mon01 mon02 mon03 mgr01 mgr02 store01 store02 store03

# 只在 mon01 节点安装 ceph-monitor 包, 如果不加 --mon 参数, 则会安装所有的ceph包
ceph-deploy install --no-adjust-repos --nopgpcheck --mon myk8snode05v.cpp.zzt.lsne.cn

# 远程安装时, 指定源仓库
[root@ceph31 ~]# /usr/bin/ceph-deploy  --username lsne install  --repo-url 'http://10.249.104.66:8080/' --gpg-url 'http://10.249.104.66:8080/keys/release.asc'    ceph31.cpp.bjmc.lsne.cn

```

### 2.6 创建 monitor 节点

```sh
# --overwrite-conf 强制覆盖现有的Ceph配置文件
ceph-deploy --overwrite-conf mon create-initial
```

### 2.7 将配置密钥发送到 指定节点的 /etc/ceph 目录

> 主要是方便在目标机器上执行 ceph 操作时能正常执行。可选择性发送

```sh
ceph-deploy admin myk8smaster04v.cpp.zzt.lsne.cn
ceph-deploy admin myk8smaster05v.cpp.zzt.lsne.cn
ceph-deploy admin myk8smaster06v.cpp.zzt.lsne.cn
ceph-deploy admin myk8snode05v.cpp.zzt.lsne.cn
ceph-deploy admin myk8snode06v.cpp.zzt.lsne.cn
ceph-deploy admin myk8snode07v.cpp.zzt.lsne.cn
ceph-deploy admin myk8snode08v.cpp.zzt.lsne.cn
ceph-deploy admin myk8snode09v.cpp.zzt.lsne.cn
ceph-deploy admin myk8snode10v.cpp.zzt.lsne.cn
```

### 2.8 设置密钥文件 ceph 用户可见

```sh
sudo setfacl -m u:lsne:r /etc/ceph/ceph.client.admin.keyring
```

### 2.9 可以在 mon01 节点查看 ceph 状态

```sh
ceph -s
```

### 2.10 忽略警告: `mons are allowing insecure global_id reclaim`

```sh
ceph config set mon auth_allow_insecure_global_id_reclaim false
```

### 2.11 在管理节点安装 mgr 包

> 如果已经使用 yum 安装, 则忽略

```sh
ceph-deploy install --mgr myk8smaster05v.cpp.zzt.lsne.cn
```

### 2.12  创建运行 mgr 实例

```sh
ceph-deploy mgr create myk8smaster04v.cpp.zzt.lsne.cn
ceph-deploy mgr create myk8smaster05v.cpp.zzt.lsne.cn
ceph-deploy mgr create myk8smaster06v.cpp.zzt.lsne.cn
```

### 2.13 查看集群状态, 已经有了 mgr 节点

```sh
ceph -s
```

### 2.14 启用 prometheus 模块

> 启用后默认打开 9283 端口

```sh
ceph mgr module enable prometheus
```

### 2.13 在存储节点安装 osd 包

> 如果已经使用 yum 安装, 则忽略

```sh
ceph-deploy install --release nautilus --osd myk8snode08v.cpp.zzt.lsne.cn myk8snode09v.cpp.zzt.lsne.cn myk8snode10v.cpp.zzt.lsne.cn
```

### 2.14 显示磁盘列表

```sh
ceph-deploy disk list myk8snode08v.cpp.zzt.lsne.cn
```

### 2.15 向集群添加 osd 实例

```sh
ceph-deploy --overwrite-conf osd create myk8snode08v.cpp.zzt.lsne.cn --data /dev/sdb
```

### 2.16 查看 osd 实例

```sh
ceph -s
ceph osd ls
ceph osd status
```

### 2.17 向集群添加其他 osd 实例

```sh
ceph-deploy --overwrite-conf osd create myk8snode08v.cpp.zzt.lsne.cn --data /dev/sdc
ceph-deploy --overwrite-conf osd create myk8snode08v.cpp.zzt.lsne.cn --data /dev/sdd
ceph-deploy --overwrite-conf osd create myk8snode08v.cpp.zzt.lsne.cn --data /dev/sde

ceph-deploy --overwrite-conf osd create myk8snode09v.cpp.zzt.lsne.cn --data /dev/sdb
ceph-deploy --overwrite-conf osd create myk8snode09v.cpp.zzt.lsne.cn --data /dev/sdc
ceph-deploy --overwrite-conf osd create myk8snode09v.cpp.zzt.lsne.cn --data /dev/sdd
ceph-deploy --overwrite-conf osd create myk8snode09v.cpp.zzt.lsne.cn --data /dev/sde

ceph-deploy --overwrite-conf osd create myk8snode10v.cpp.zzt.lsne.cn --data /dev/sdb
ceph-deploy --overwrite-conf osd create myk8snode10v.cpp.zzt.lsne.cn --data /dev/sdc
ceph-deploy --overwrite-conf osd create myk8snode10v.cpp.zzt.lsne.cn --data /dev/sdd
ceph-deploy --overwrite-conf osd create myk8snode10v.cpp.zzt.lsne.cn --data /dev/sde
```

### 2.18 添加和卸载 1 个 mon 节点

```sh
# 添加
ceph-deploy mon add myk8smaster05v.cpp.zzt.lsne.cn

# 添加完成后, 不会同步修改配置文件. 需要手动修改配置文件，然后推送到所有节点
vim ceph.conf
mon_host = 1.1.1.1,2.2.2.2,3.3.3.3

# 推送
ceph-deploy --overwrite-conf config push myk8snode{5,6,7,8,9,10}v myk8smaster0{4,5,6}v

# 删除
ceph-deploy mon destroy myk8smaster05v.cpp.zzt.lsne.cn
```


## 3. 安装对象存储组件(按需安装)

### 3.1 安装 radosgw

```sh
ceph-deploy rgw create myk8smaster05v.cpp.zzt.lsne.cn
ceph-deploy --overwrite-conf rgw create myk8smaster04v.cpp.zzt.lsne.cn
ceph-deploy --overwrite-conf rgw create myk8smaster06v.cpp.zzt.lsne.cn
```

### 3.2 测试

```sh
curl http://myk8smaster05v.cpp.zzt.lsne.cn:7480
```

### 3.3 修改默认端口

### 3.3.1 修改配置文件: `vim ~/cephcluster/ceph.conf`
```toml
# 添加
[client.rgw.myk8smaster05v.cpp.zzt.lsne.cn]
rgw_frontends = "civetweb port=80"

# 也可以添加证书, 通过 https 访问
# rgw_frontends = "civetweb port=443s ssl_certificate=/etc/ceph/private/keyandcert.pem"
```

### 3.3.2 推送到远程并覆盖

```sh
ceph-deploy --overwrite-conf config push myk8smaster04v.cpp.zzt.lsne.cn myk8smaster05v.cpp.zzt.lsne.cn myk8smaster06v.cpp.zzt.lsne.cn myk8snode05v.cpp.zzt.lsne.cn myk8snode06v.cpp.zzt.lsne.cn myk8snode07v.cpp.zzt.lsne.cn myk8snode08v.cpp.zzt.lsne.cn myk8snode09v.cpp.zzt.lsne.cn myk8snode10v.cpp.zzt.lsne.cn
```

### 3.3.3 重启 ceph-radosgw.target 服务

```sh
systemctl restart ceph-radosgw.target
```

## 4. 安装 cephfs 组件(按需安装)

### 4.1 安装 mds

```sh
ceph-deploy mds create myk8snode07v.cpp.zzt.lsne.cn
ceph-deploy mds create myk8snode08v.cpp.zzt.lsne.cn
ceph-deploy mds create myk8snode09v.cpp.zzt.lsne.cn
```

## 5. 启动 ceph-mgr-dashboard (按需启动)

### 5.1 启动

```sh
ceph mgr module enable dashboard

不行就加强制
ceph mgr module enable dashboard --force
```

### 5.2 查看启用的模块

```sh
ceph mgr module ls | less
```

### 5.3 启用ssl自签名

```sh
ceph dashboard create-self-signed-cert
```

### 5.4 也可以创建证书, 然后导入

```sh
# 创建证书
openssl req -new .....

# 导入
ceph dashboard set-ssl-certificate -i dashboard.crt
ceph dashboard set-ssl-certificate-key -i dashboard.key
```

### 5.5 配置端口

```sh
ceph config set mgr mgr/dashboard/server_addr 1.1.1.1
ceph config set mgr mgr/dashboard/server_port 8080
ceph config set mgr mgr/dashboard/ssl_server_port 8443
```

### 5.6 查看配置

```sh
ceph mgr services
```

### 5.7 创建用户, 并授予 administrator 角色

```sh
ceph dashboard ac-user-createt myadminuser01 123456 administrator
```


## 运维操作

### 添加磁盘

#### 查看目标机器上的磁盘列表

```sh
ceph-deploy disk list myk8snode08v
```

#### 清理磁盘分区等信息, 会清除磁盘上所有数据

```sh
ceph-deploy disk zap myk8snode08v.cpp.zzt.lsne.cn /dev/sdb /dev/sdc
```

#### 扩容 osd

```sh
ceph-deploy --overwrite-conf osd create myk8snode09v.cpp.zzt.lsne.cn --data /dev/sde
```