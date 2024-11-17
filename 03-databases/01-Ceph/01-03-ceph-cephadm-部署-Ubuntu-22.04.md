# cephadm 部署 ceph 集群

## 环境准备

### 0. 环境要求

- Python3 (ubuntu 22.04 自带)
- Systemd (系统自带)
- Docker (可查看部署 k8s 时的 docker 安装步骤)
- chrony or NTP (时间同步)
- LVM2 (用于配置存储设备)

### 1. 机器信息

> 由于环境不允许, 这里只有一块网卡, 所以只能混合使用了, IP1, IP2 都是同一块网卡的一个IP。 实际生产环境中, 应该使用两块网卡

| 角色    | 主机名                                     | IP1           | IP2           | SSD 磁盘   | HDD 磁盘             |
| ----- | --------------------------------------- | ------------- | ------------- | -------- | ------------------ |
| mon01 | myk8smaster01v.lsne.cn | 10.49.174.214 | 10.49.174.214 |          |                    |
| mon02 | myk8smaster02v.lsne.cn | 10.49.174.215 | 10.49.174.215 |          |                    |
| mon03 | myk8smaster03v.lsne.cn | 10.49.174.213 | 10.49.174.213 |          |                    |
| osd01 | myk8snode01v.lsne.cn   | 10.49.174.216 | 10.49.174.216 | sdb, sdc | sdd, sde, sdf, sdg |
| osd02 | myk8snode02v.lsne.cn   | 10.49.174.220 | 10.49.174.220 | sdb, sdc | sdd, sde, sdf, sdg |
| osd03 | myk8snode03v.lsne.cn   | 10.49.174.218 | 10.49.174.218 | sdb, sdc | sdd, sde, sdf, sdg |
| osd04 | myk8snode04v.lsne.cn   | 10.49.174.219 | 10.49.174.219 | sdb, sdc | sdd, sde, sdf, sdg |

## 机器初始化

### 1. 停止默认时间同步

```sh
svc -d /service/ntpsync
mv /da1/s/ops/pantheon/tools/seco/ntpsync /da1/s/ops/pantheon/tools/seco/bak.ntpsync.bak
sed -i 's/exec/#exec/g' /service/ntpsync/run
kill -9 $(pgrep -f ntpsync)
```

### 2. 所有机器设置时间同步

#### 2.1 设置时区

```sh
ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
```

#### 2.2 安装 chrony

```sh
apt install chrony
```

##### 2.3 配置时间同步, 编辑配置文件

##### 2.3.1 删除以下行

```
pool ntp.ubuntu.com        iburst maxsources 4
pool 0.ubuntu.pool.ntp.org iburst maxsources 1
pool 1.ubuntu.pool.ntp.org iburst maxsources 1
pool 2.ubuntu.pool.ntp.org iburst maxsources 2
```

##### 2.3.2 添加以下行

```
pool ntp1.lsne.cn iburst maxsources 4
```

#### 2.4 重启 chrony

```sh
systemctl restart chrony
```

### 3. 所有机器安装 python3

> 详情后补

### 4. 安装软件包

#### 4.1 设置源文件

```sh
wget -q -O- 'http://mirrors.ustc.edu.cn/ceph/keys/release.asc' | sudo apt-key add -

sudo apt-add-repository "deb http://mirrors.ustc.edu.cn/ceph/debian-reef/ $(lsb_release -sc) main"
```

### 4.2 安装 ceph 和 cephadm 命令

```sh
sudo apt-get update

DEBIAN_FRONTEND=noninteractive apt install -y ceph-common cephadm

# cephadm 也可以使用 curl 安装
curl --silent --remote-name --location https://github.com/ceph/ceph/raw/reef/src/cephadm/cephadm
chmod u+x cephadm
mv cephadm /usr/sbin/
```

### 4.3 第二种方式使用 ceph 命令

```sh
# 如果不安装  ceph-common 包, 则机器上没有 ceph 命令.
# 这时如果想使用 ceph 命令, 可以进入 docker image 镜像容器, 使用容器里的命令

cephadm --image quay.io/ceph/ceph:v18.2.0 shell
```

## 安装docker

### 1. 卸载旧版本

```sh
sudo apt-get remove docker docker-engine docker.io containerd runc
sudo apt-get purge docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin docker-ce-rootless-extras

sudo rm -rf /var/lib/docker
sudo rm -rf /var/lib/containerd
```

### 2. 安装必备软件

```sh
sudo apt-get update
sudo apt-get install ca-certificates curl gnupg lsb-release
```

### 3. 设置 apt 源

```sh
sudo mkdir -m 0755 -p /etc/apt/keyrings

# 添加 Docker 官方 GPG 密钥:
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# 添加 Docker 的 APT 仓库:
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
  
# 刷新仓库缓存
sudo apt-get update
```

### 4. 安装 docker

```sh
#列出可用版本号
apt-cache madison docker-ce | awk '{ print $3 }'

5:23.0.1-1~ubuntu.22.04~jammy
5:23.0.0-1~ubuntu.22.04~jammy
5:20.10.23~3-0~ubuntu-jammy
5:20.10.22~3-0~ubuntu-jammy
5:20.10.21~3-0~ubuntu-jammy
5:20.10.20~3-0~ubuntu-jammy
5:20.10.19~3-0~ubuntu-jammy
5:20.10.18~3-0~ubuntu-jammy
5:20.10.17~3-0~ubuntu-jammy
5:20.10.16~3-0~ubuntu-jammy
5:20.10.15~3-0~ubuntu-jammy
5:20.10.14~3-0~ubuntu-jammy
5:20.10.13~3-0~ubuntu-jammy

# 指定版本安装
VERSION_STRING=5:20.10.17~3-0~ubuntu-jammy
sudo apt-get install docker-ce=$VERSION_STRING docker-ce-cli=$VERSION_STRING containerd.io docker-buildx-plugin docker-compose-plugin

mkdir -p /data/docker
mkdir -p /etc/docker

vim /etc/docker/daemon.json
{
  "data-root": "/data/docker"
}

```

### 4.1 配置代理

```sh
mkdir -p /etc/systemd/system/docker.service.d/
vim /etc/systemd/system/docker.service.d/http-proxy.conf
[Service]
Environment="HTTP_PROXY=http://static-proxy.lsne.cn:3128"
Environment="HTTPS_PROXY=http://static-proxy.lsne.cn:3128"
Environment="NO_PROXY=localhost,127.0.0.1,lsne.cn,127.0.0.0/8,10.0.0.0/8,172.17.0.0/16,192.168.0.0/16"
```

### 5. 重启docker

```sh
systemctl daemon-reload
systemctl restart docker.service
```

## Monitor 组件

### 一. 初始化集群 - 创建第一个 mon 节点

#### 1. 创建目录

```sh
mkdir -p /data/ceph/{config,data,logs}
```

#### 2. 编辑 ceph 镜像仓库

> 以及仓库的认证用户密码 (不需要就不用创建)

> 使用 `cephadm bootstrap --registry-json /data/ceph/config/registry.json` 参数可以指定 docker 仓库

>  编辑文件: `vim /data/ceph/config/registry.json`

```json
{"url":"registry.example.com:5000", "username":"username", "password":"password"}
```

#### 3. 生成集群 fsid

```sh
lsne@myk8smaster03v:~$ uuidgen
66666666-8888-8888-8888-666666666666
```

#### 4. 创建 ceph 集群配置文件

> `vim /data/ceph/config/ceph.conf`

> 使用 `cephadm bootstrap --config /data/ceph/config/ceph.conf` 可以指定使用的配置文件
> 修改 fsid, public_network, cluster_network 等

```toml
[client]
rbd_cache_max_dirty = 100663296
rbd_cache_max_dirty_age = 5
rbd_cache_size = 134217728
rbd_cache_target_dirty = 67108864
rbd_cache_writethrough_until_flush = True

# Please do not change this file directly since it is managed by Ansible and will be overwritten
[global]
cluster = mycephcluster
fsid = 66666666-8888-8888-8888-666666666666
public_network = 10.49.172.0/22      # 这里一定要写正确的网络地址, 要不会报错
cluster_network = 10.49.172.0/22     # 这里一定要写正确的网络地址, 要不会报错
ms_bind_ipv6 = false
# ceph 18.2.0 好像不需要 mon_initial_members 参数了
# mon_initial_members = myk8smaster01v,myk8smaster02v,myk8smaster03v
mon_host = [v2:10.49.174.214:3300/0,v2:10.49.174.215:3300/0,v2:10.49.174.213:3300/0,v1:10.49.174.214:6789/0,v1:10.49.174.215:6789/0,v1:10.49.174.213:6789/0]
# R版 - 认证方式在部署之前需要注释掉, 要不然会执行失败
#auth_client_required = none
#auth_cluster_required = none
#auth_service_required = none
#auth_supported = none
mon_allow_pool_delete = true
mon_max_pg_per_osd = 600
mon_osd_down_out_interval = 8640000
osd_pool_default_crush_rule = -1
osd_pool_default_min_size = 1
osd_pool_default_size = 3

[mon]
# 这里 mon_data 添加之后部署失败
#mon_data = /data1/ceph/mondata
auth_allow_insecure_global_id_reclaim = false

[mgr]
# 这里 mgr_data 添加之后部署失败
#mgr_data = /data1/ceph/mgrdata
mgr_stats_threshold = 0

[osd]
bdev_async_discard = True
bdev_enable_discard = True
bluestore_block_db_size = 161061273600
bluefs_shared_alloc_size = 262144
bluestore_min_alloc_size_hdd = 262144
filestore_commit_timeout = 3000
filestore_fd_cache_size = 2500
filestore_max_inline_xattr_size = 254
filestore_max_inline_xattrs = 6
filestore_max_sync_interval = 10
filestore_op_thread_suicide_timeout = 600
filestore_op_thread_timeout = 580
filestore_op_threads = 10
filestore_queue_max_bytes = 1048576000
filestore_queue_max_ops = 50000
filestore_wbthrottle_enable = False
journal_max_write_bytes = 1048576000
journal_max_write_entries = 1000
journal_queue_max_bytes = 1048576000
journal_queue_max_ops = 3000
max_open_files = 327680
osd memory target = 10737418240
osd_client_message_cap = 10000
osd_enable_op_tracker = False
osd_heartbeat_grace = 60
osd_heartbeat_interval = 15
osd_journal_size = 20480
osd_max_backfills = 1
osd_op_num_shards_hdd = 32
osd_op_num_threads_per_shard_ssd = 1
osd_op_thread_suicide_timeout = 600
osd_op_thread_timeout = 580
osd_op_threads = 10
osd_recovery_max_active = 3
osd_recovery_max_single_start = 1
osd_recovery_thread_suicide_timeout = 600
osd_recovery_thread_timeout = 580
osd_scrub_begin_hour = 2
osd_scrub_end_hour = 6
osd_scrub_load_threshold = 5
osd_scrub_sleep = 2
osd_scrub_thread_suicide_timeout = 600
osd_scrub_thread_timeout = 580
rocksdb_perf = True
```

#### 5. 初始化 mon 节点


```sh
sudo cephadm -v --image quay.io/ceph/ceph:v18.2.0 bootstrap --allow-overwrite --ssh-user=lsne --fsid="66666666-8888-8888-8888-666666666666" --config="/data/ceph/config/ceph.conf" --output-dir="/data/ceph/data/" --mon-ip="10.49.174.213" --skip-pull --allow-fqdn-hostname --skip-monitoring-stack
```

##### 5.1 参数解释

```sh
# 初始化节点, 同时指定监控镜像(ceph v18.2.0 默认使用 podman 启动, 想使用 docker 需要加一个参数 --docker)
sudo cephadm -v --docker --image quay.io/ceph/ceph:v18.2.0 \
bootstrap \
--allow-overwrite \
--ssh-user=lsne \
# --registry-json="/data/ceph/config/registry.json" \  # 不需要密码就不要写。不然会报错
--config="/data/ceph/config/ceph.conf" \
--output-dir="/data/ceph/data/" \
--mon-ip="10.49.174.213" \           # 这里必须写本机IP, 不然会报错无法分配地址
--skip-pull \
--allow-fqdn-hostname \
--skip-monitoring-stack
#--ssh-private-key          # 使用已有ssh密钥, 不自动生成
#--ssh-public-key           # 使用已有ssh密钥, 不自动生成
# --registry-url            # 和 --registry-json 二选一
# --registry-username       # 和 --registry-json 二选一
# --registry-password       # 和 --registry-json 二选一
# --cluster-network "10.49.172.0/22"    # 可以在 ceph.conf 里指定
# --registry-json /data/ceph/config/registry.json  # 不用密码就不用写
# --manage-etc-ceph-conf # 最新版本(Quincy) 不支持了, 没办法自动更新配置文件, 只能手动更新
# --log-to-file /data/ceph/logs/ceph.log  # 最新版本(Quincy) 不支持了, 日志文件没办法指定了
# --enable-prometheus-module  # 最新版本(Quincy) 不支持了, 只能手动搭建 prometheus 相关组件
# --grafana-image "ecr-sh.yun.lsne.cn/ceph/ceph-grafana:6.6.2"  # 最新版本(Quincy) 不支持了
# --prometheus-image "ecr-sh.yun.lsne.cn/ceph/prometheus:v2.18.1"  # 最新版本(Quincy) 不支持了
# --alertmanager-image "ecr-sh.yun.lsne.cn/ceph/alertmanager:v0.20.0"  # 最新版本(Quincy) 不支持了
# --node-exporter-image "ecr-sh.yun.lsne.cn/ceph/node-exporter:v0.18.1"  # 最新版本(Quincy) 不支持了
```

##### 5.2 相关参数解释
```sh
cephadm 相关参数:
cephadm --verbose, -v   # Show debug-level log messages (default: False)
cephadm --image         # 指定 ceph 镜像文件
cephadm --docker        # ceph v18.2.0 默认使用 podman 启动, 想使用 docker 需要加一个参数 --docker

cephadm bootstrap 相关参数(被注释的是因为在最新 Quincy 版本中不再支持的选项):
--mon-ip="10.249.104.21"            # 指定 monitor ip (关键参数 客户端应该是连接这地址)
--mon-ip="[fd00:203::287]"          # 指定 monitor ip (ipv6 模式)
--cluster-network   				# 指定集群内部通信使用的网络(例: 10.90.90.0/24 or fe80::/64), 可以在 ceph.conf 配置文件里指定
--skip-pull							# 跳过 pull 拉去镜像
--skip-dashboard    				# 跳过 dashboard
--allow-fqdn-hostname 				# 是否允许使用 FQDN（Fully Qualified Domain Name，全限定域名）作为主机名
--ssh-user          				# 指定部署用的用户
--registry-json						# 指定 ceph 镜像所在的仓库地址,用户名,密码
--config            				# 指定 ceph 配置文件
# --manage-etc-ceph-conf 			# 控制 cephadm 是否要根据当前运行 Ceph 集群的节点自动更新 /etc/ceph/ceph.conf 文件
--output-dir        				# 指定集群信息写到哪里(默认 /etc/ceph )
--allow-overwrite   				# 允许覆盖 output-dir 所指定的目录里的信息
# --log-to-file       				# 指定日志文件路径
#--ssh-private-key                  # 使用已有ssh密钥, 不自动生成
#--ssh-public-key                   # 使用已有ssh密钥, 不自动生成
--skip-monitoring-stack  			# 跳过监控部署
# --enable-prometheus-module 		# 使用 prometheus 模块
# --grafana-image    				# 指定 grafana 镜像
# --prometheus-image				# 指定 prometheus 镜像
# --alertmanager-image				# 指定 alertmanager 镜像
# --node-exporter-image				# 指定 node exporter 镜像
```

##### 5.3 部署完成, dashboard 的访问密码

```
URL: https://master03:8443/
User: admin
Password: 123456
```

##### 5.4 部署完成,  ceph 命令查看状态

```sh
# 进入容器
sudo /usr/sbin/cephadm shell --fsid 66666666-8888-8888-8888-666666666666 -c /data/ceph/data/ceph.conf -k /data/ceph/data/ceph.client.admin.keyring

# 在容器里执行
ceph -s


# 或者直接使用本地命令
ceph -s -c /data/ceph/data/ceph.conf -k /data/ceph/data/ceph.client.admin.keyring
```

#### 6. 查看集群机器

```sh
ceph -c /data/ceph/data/ceph.conf -k /data/ceph/data/ceph.client.admin.keyring orch host ls
```

#### 7. 设置 `_admin` 和 `mon` 标签

```sh
ceph -c /data/ceph/data/ceph.conf -k /data/ceph/data/ceph.client.admin.keyring orch host label add myk8smaster03v.lsne.cn _admin,mon
```

#### 8. 移除标签

```sh
# 删除标签(这里不执行, 只是记录一下命令)
ceph orch host label rm myk8smaster02v.lsne.cn _admin/mon -k /data/ceph/data/ceph.client.admin.keyring
```

### 二. 添加物理主机

#### 1. 添加主机

```sh
# 禁用自动部署 mon 和 mgr 节点, 要不然添加机器后会自动创建
ceph -c /data/ceph/data/ceph.conf -k /data/ceph/data/ceph.client.admin.keyring orch apply mon --unmanaged
ceph -c /data/ceph/data/ceph.conf -k /data/ceph/data/ceph.client.admin.keyring orch apply mgr --unmanaged

# 设置互信
ssh-copy-id -f -i /data/ceph/data/ceph.pub lsne@myk8smaster01v.lsne.cn
ssh-copy-id -f -i /data/ceph/data/ceph.pub lsne@myk8smaster02v.lsne.cn
ssh-copy-id -f -i /data/ceph/data/ceph.pub lsne@myk8snode01v.lsne.cn
ssh-copy-id -f -i /data/ceph/data/ceph.pub lsne@myk8snode02v.lsne.cn
ssh-copy-id -f -i /data/ceph/data/ceph.pub lsne@myk8snode03v.lsne.cn
ssh-copy-id -f -i /data/ceph/data/ceph.pub lsne@myk8snode04v.lsne.cn

ceph -c /data/ceph/data/ceph.conf -k /data/ceph/data/ceph.client.admin.keyring orch host add myk8smaster01v.lsne.cn --labels=_admin,mon
ceph -c /data/ceph/data/ceph.conf -k /data/ceph/data/ceph.client.admin.keyring orch host add myk8smaster02v.lsne.cn --labels=_admin,mon
ceph -c /data/ceph/data/ceph.conf -k /data/ceph/data/ceph.client.admin.keyring orch host add myk8snode01v.lsne.cn --labels=osd
ceph -c /data/ceph/data/ceph.conf -k /data/ceph/data/ceph.client.admin.keyring orch host add myk8snode02v.lsne.cn --labels=osd
ceph -c /data/ceph/data/ceph.conf -k /data/ceph/data/ceph.client.admin.keyring orch host add myk8snode03v.lsne.cn --labels=osd
ceph -c /data/ceph/data/ceph.conf -k /data/ceph/data/ceph.client.admin.keyring orch host add myk8snode04v.lsne.cn --labels=osd
```

#### 2. 移除主机(如果有需要)

```sh
# 检查是否安全
ceph -c /data/ceph/data/ceph.conf -k /data/ceph/data/ceph.client.admin.keyring orch host ok-to-stop myk8snode04v.lsne.cn

# 停止服务
ceph -c /data/ceph/data/ceph.conf -k /data/ceph/data/ceph.client.admin.keyring orch daemon stop mon.myk8snode04v
ceph -c /data/ceph/data/ceph.conf -k /data/ceph/data/ceph.client.admin.keyring orch daemon rm mon.myk8snode03v --force
ceph -c /data/ceph/data/ceph.conf -k /data/ceph/data/ceph.client.admin.keyring orch host rm myk8snode03v.lsne.cn --force
```

### 三. 扩容 mon 节点

#### 1. 禁止自动部署 mon,mgr 节点, 要不然添加机器后会自动创建

```sh
ceph -c /data/ceph/data/ceph.conf -k /data/ceph/data/ceph.client.admin.keyring orch apply mon --unmanaged
ceph -c /data/ceph/data/ceph.conf -k /data/ceph/data/ceph.client.admin.keyring orch apply mgr --unmanaged
```

#### 2. 添加互信

> 若已经添加则忽略

```sh
ssh-copy-id -f -i /data/ceph/data/ceph.pub lsne@myk8smaster01v.lsne.cn
```

#### 3. 新机器添加到集群

> 若已经添加则忽略

```sh
ceph -c /data/ceph/data/ceph.conf -k /data/ceph/data/ceph.client.admin.keyring orch host add myk8smaster01v.lsne.cn --labels=_admin,mon
```

#### 4. 部署 mon 实例

```sh
ceph -c /data/ceph/data/ceph.conf -k /data/ceph/data/ceph.client.admin.keyring orch daemon add mon myk8smaster02v.lsne.cn:10.49.174.215
```

#### 5. 查看

```sh
ceph -c /data/ceph/data/ceph.conf -k /data/ceph/data/ceph.client.admin.keyring orch ps --daemon_type=mon

# 或
ceph -s -c /data/ceph/data/ceph.conf -k /data/ceph/data/ceph.client.admin.keyring

# 或
ceph -c /data/ceph/data/ceph.conf -k /data/ceph/data/ceph.client.admin.keyring orch ls
```

### 四. 移除 mon 节点

#### 1. 查看所有 mon

```sh
ceph -c /data/ceph/data/ceph.conf -k /data/ceph/data/ceph.client.admin.keyring orch ls

ceph -c /data/ceph/data/ceph.conf -k /data/ceph/data/ceph.client.admin.keyring orch ps --daemon_type=mon
```

#### 2. 移除 mon

```sh
ceph -c /data/ceph/data/ceph.conf -k /data/ceph/data/ceph.client.admin.keyring orch daemon rm mon.myk8smaster02v --force
```

## Manager 组件

### 一. 添加 mgr 实例

#### 1. 禁止自动部署 mon,mgr 节点, 要不然添加机器后会自动创建

```sh
ceph -c /data/ceph/data/ceph.conf -k /data/ceph/data/ceph.client.admin.keyring orch apply mon --unmanaged
ceph -c /data/ceph/data/ceph.conf -k /data/ceph/data/ceph.client.admin.keyring orch apply mgr --unmanaged
```

#### 2. 添加互信

> 若已经添加则忽略

```sh
ssh-copy-id -f -i /data/ceph/data/ceph.pub lsne@myk8smaster01v.lsne.cn
```

#### 3. 新机器添加到集群

> 若已经添加则忽略

```sh
ceph -c /data/ceph/data/ceph.conf -k /data/ceph/data/ceph.client.admin.keyring orch host add myk8smaster01v.lsne.cn --labels=_admin,mon
```

#### 4. 添加 mgr 实例

```sh
ceph -c /data/ceph/data/ceph.conf -k /data/ceph/data/ceph.client.admin.keyring orch daemon add mgr myk8smaster02v.lsne.cn:10.49.174.215
```

#### 5. 查看

```sh
ceph -c /data/ceph/data/ceph.conf -k /data/ceph/data/ceph.client.admin.keyring orch ps --daemon_type=mgr

# 或
ceph -s -c /data/ceph/data/ceph.conf -k /data/ceph/data/ceph.client.admin.keyring

# 或
ceph -c /data/ceph/data/ceph.conf -k /data/ceph/data/ceph.client.admin.keyring orch ls
```

### 二. 移除 mgr 节点

#### 1. 查看所有 mon

```sh
ceph -c /data/ceph/data/ceph.conf -k /data/ceph/data/ceph.client.admin.keyring orch ls

ceph -c /data/ceph/data/ceph.conf -k /data/ceph/data/ceph.client.admin.keyring orch ps --daemon_type=mgr
```

#### 2. 移除 mon

```sh
ceph -c /data/ceph/data/ceph.conf -k /data/ceph/data/ceph.client.admin.keyring orch daemon rm mgr.myk8smaster02v.dfknpg
```

## OSD 组件

> 严禁使用 `ceph orch apply osd --all-available-devices` 将所有可用设备配置为OSD


### 一. 添加 osd 节点

#### 1. 列出所有可用的设备

```sh
ceph -c /data/ceph/data/ceph.conf -k /data/ceph/data/ceph.client.admin.keyring orch device ls
```

##### 1.1 ceph 认为设备可用条件

```
如果存储设备同时满足以下条件，则认为该存储设备可用:

设备必须没有分区。

设备不能有任何LVM状态。

设备不能被安装。

设备不能包含文件系统。

设备不能包含Ceph BlueStore OSD。

设备容量必须大于5gb。
```

##### 1.2 如果想看 “Health”, “Ident”, and “Fault” 三个字段, 可设置mgr参数开启

```sh
# 开启参数(开启这个参数可能会导致 osd 不稳定, 频繁复位等问题, 生产环境不建议开启)
ceph -c /data/ceph/data/ceph.conf -k /data/ceph/data/ceph.client.admin.keyring config set mgr mgr/cephadm/device_enhanced_scan true

# 使用 --wide 查看
ceph -c /data/ceph/data/ceph.conf -k /data/ceph/data/ceph.client.admin.keyring orch device ls --wide
```

#### 2. 指定设备创建 osd

```sh
ceph -c /data/ceph/data/ceph.conf -k /data/ceph/data/ceph.client.admin.keyring orch daemon add osd myk8snode01v.lsne.cn:/dev/sdb
```

### 二. 激活 osd

> 将扫描所有现有磁盘的 OSD 并部署相应的守护进程。

```
# 将现有的主机故障修复(重装系统)后需要重新激活
ceph cephadm osd activate
```

### 三. 添加 osd 节点: 配置文件方式

#### 1. 创建 class

```sh
ceph -c /data/ceph/data/ceph.conf -k /data/ceph/data/ceph.client.admin.keyring osd crush get-device-class ssd
```

#### 2. 创建配置文件

```yaml
service_type: osd
service_id: osd_using_paths
placement:
  hosts:
    - myk8snode02v.lsne.cn
    - myk8snode03v.lsne.cn
    - myk8snode04v.lsne.cn
# crush_device_class: ssd     # 指定规则, 这里指定将应用到下面 spec.data_devices.paths 中的所有设备
spec:
  data_devices:
    paths:
    - path: /dev/sdc
      crush_device_class: hdd     # 也可以单独对一个磁盘指定规则
    - path: /dev/sdd
      crush_device_class: ssd
  db_devices:
    paths:
    - /dev/sde
  wal_devices:    # 如果没有 wal_devices, 则默认使用 db_devices
    paths:
    - /dev/sdf
```

#### 3. 预览效果

```sh
ceph -c /data/ceph/data/ceph.conf -k /data/ceph/data/ceph.client.admin.keyring orch apply -i osd.add --dry-run
```

#### 4. 实际执行

```sh
ceph -c /data/ceph/data/ceph.conf -k /data/ceph/data/ceph.client.admin.keyring orch apply -i add_osd.yaml
```

## RGW 组件

### 一. (不推荐)方式一: 添加 rgw 节点

#### 1. 创建标签

```sh
ceph -c /data/ceph/data/ceph.conf -k /data/ceph/data/ceph.client.admin.keyring orch host label add myk8smaster01v.lsne.cn rgw
ceph -c /data/ceph/data/ceph.conf -k /data/ceph/data/ceph.client.admin.keyring orch host label add myk8smaster02v.lsne.cn rgw
ceph -c /data/ceph/data/ceph.conf -k /data/ceph/data/ceph.client.admin.keyring orch host label add myk8smaster03v.lsne.cn rgw
```

#### 2. 创建 rgw

```sh
# 不建议使用, 在任意节点上创建
ceph orch apply rgw foo

# 不建议使用, 在有 rgw 标签的所有机器上都创建, 每个机器上会创建两个 rgw 进程
ceph orch apply rgw foo '--placement=label:rgw count-per-host:2' --port=8000
```

### 二. (推荐)方式二: 通过 yaml 文件创建 rgw 节点

#### 1.1 创建 rgw.yaml

```yaml
root@myk8smaster03v:/home/lsne# cat rgw.yaml
service_type: rgw
service_id: default.default
placement:
  hosts:
  - myk8smaster01v.lsne.cn=rgw1
ssl: False
spec:
  rgw_frontend_port: 7480
  
```

#### 1.2 找到 active 的 mgr 节点, 并编辑配置文件

```sh
ceph -s

vim /var/lib/ceph/66666666-8888-8888-8888-666666666666/mgr.myk8smaster03v.kacqcd/config

# 添加以下内容

[client.rgw.default.default.rgw1]
host = myk8smaster01v.lsne.cn
keyring = /var/lib/ceph/radosgw/ceph-rgw.default.default.rgw1/keyring
rgw_thread_pool_size = 512
rgw_frontends = civetweb port=7480+443s ssl_certificate=/etc/ceph/ceph-rgw.pem
rgw_s3_auth_use_rados = true
rgw_s3_auth_use_keystone = false
rgw_s3_auth_aws4_force_boto2_compat = false
rgw_s3_auth_use_ldap = false
rgw_s3_success_create_obj_status = 0
rgw_relaxed_s3_bucket_names = false
rgw_s3_auth_use_sts = true
rgw_cache_expiry_interval = 3600
rgw_op_thread_suicide_timeout = 30
```

#### 1.3 重启 active 的 mgr 

```sh
podman restart 5602b0aa3ae4
```

#### 1.4 创建 rgw

```sh
ceph -c /data/ceph/data/ceph.conf -k /data/ceph/data/ceph.client.admin.keyring orch apply -i rgw.yaml
```

#### 3.1 绑定网络创建

```yaml
service_type: rgw
service_id: foo
placement:
  label: rgw
  count_per_host: 2
networks:
- 192.169.142.0/24
spec:
  rgw_frontend_port: 8080
```

##### 3.2 传递到 rgw 前端

```yaml
service_type: rgw
service_id: foo
placement:
  label: rgw
  count_per_host: 2
spec:
  rgw_realm: myrealm
  rgw_zone: myzone
  rgw_frontend_type: "beast"
  rgw_frontend_port: 5000
  rgw_frontend_extra_args:
  - "tcp_nodelay=1"
  - "max_header_size=65536"
```

##### 3.3 创建

```sh
# 干跑
ceph orch apply -i rgw.yaml --dry-run

# 创建
ceph orch apply -i rgw.yaml
```

## MDS 组件

### 一. 添加 mds 节点

#### 0. 创建标签

```sh
ceph -c /data/ceph/data/ceph.conf -k /data/ceph/data/ceph.client.admin.keyring orch host label add myk8smaster01v.lsne.cn mds
ceph -c /data/ceph/data/ceph.conf -k /data/ceph/data/ceph.client.admin.keyring orch host label add myk8smaster02v.lsne.cn mds
ceph -c /data/ceph/data/ceph.conf -k /data/ceph/data/ceph.client.admin.keyring orch host label add myk8smaster03v.lsne.cn mds
```

#### 1. 方式一
```sh
# 在所有包含  mds 标签的机器上, 创建名为 foo 的 mds 守护进程
ceph fs volume create foo --placement="label:mds"
```

#### 2. 方式二

##### 2.1 创建文件: `vim mds.yaml`

```sh
service_type: mds
service_id: fs_name
placement:
  count: 3
  label: mds
```

##### 2.2 执行创建

```sh
# 干跑
ceph orch apply -i mds.yaml --dry-run

# 创建
ceph orch apply -i mds.yaml
```

#### 3. 查看 mds 

```sh
ceph  -c /data/ceph/data/ceph.conf -k /data/ceph/data/ceph.client.admin.keyring fs volume ls
```

#### 4. 删除

```sh
ceph fs volume rm <vol_name> [--yes-i-really-mean-it]
```

#### 5. 重命名

```sh
ceph fs volume rename <vol_name> <new_vol_name> [--yes-i-really-mean-it]
```