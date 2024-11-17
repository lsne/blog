# 二进制部署 ceph 集群 - Ubuntu 22.04

## 配置建议

### 一. 硬件

#### 1. CPU 

```
每个 OSD 2个逻辑处理器
```

#### 2. 内存

> 不要开交换分区
##### 2.1 Monitor 和 Manager 机器内存

```
# 按集群规模

最多100个OSD: 32G # 但建议不要这么小。 最好使用 64G 起步
最多300个OSD: 64G
300个以上OSD: 128G

# 也可以考虑调整以下参数
mon_osd_cache_size
rocksdb_cache_size
```

##### 2.2 OSD 机器内存


> `osd_memory_target` 参数表示每个 OSD 使用的内存大小, 默认为 4GB

```
建议 osd_memory_target = 8GB

建议操作系统预留至少 20% 的额外内存, (实际上要预留 30% 以上)

OSD释放内存和内核回收内存之间有时间间隔, 所以OSD有可能会用超 osd_memory_target 设置的值

不建议将 osd_memory_target 设置为低于 2GB。 Ceph 可能无法将内存消耗保持在 2GB 以下，并且性能可能会极其缓慢。

将内存目标设置在 2GB 到 4GB 之间通常可行，但可能会导致性能下降：除非活动数据集相对较小，否则可能需要在 IO 期间从磁盘读取元数据。

当有许多（小）对象或处理大（256GB/OSD 或更多）数据集时，将 osd_memory_target 设置为高于 4GB 可以提高性能。 对于快速 NVMe OSD 来说尤其如此。
```

#### 3.  磁盘

##### 1.1 使用 SSD 的组件

```
强烈建议以下节点或池子使用 SSD 磁盘存储

1. Monitor && Manager 机器
2. CephFS  元数据池
3. CephRGW 索引池
4. 每个 HDD OSD 的 - BlueStore WAL+DB (可以只设置 DB 为 SSD, 因为 WAL 默认会优先使用 DB)

建议
每个 SATA 接口的 SSD 磁盘给 4-5 个 HDD OSD 提供 WAL+DB 分区
每个 NVMe 接口的 SSD 磁盘给 10 个 HDD OSD 提供 WAL+DB 分区
不过最终还是要看SSD磁盘容量大小,  防止元数据溢出
```

##### 1.2 大容量 HDD 磁盘的使用

```
大于 8TB 的驱动器可能最适合存储对性能完全不敏感的大文件/对象
```

##### 1.3 尽量不要使用磁盘控制器

```
Disk controllers (HBAs) 
RAID 模式 (IR) HBA 可能比简单的“JBOD”(IT) 模式 HBA 表现出更高的延迟。
写入缓存和备用电池会大幅增加硬件和维护成本。 
许多 RAID HBA 可以配置 IT 模式“个性”或“JBOD 模式”以简化操作。
```

##### 1.4 关闭磁盘断电保护功能的写入缓存

```
可以通过磁盘基准测试做一下对比
一般情况, 关闭写缓存, 使用直写模式更快, 效果更好。
```

##### 1.4 磁盘基准测试

> 确保被测试的磁盘上无数据, 否则数据会丢失

```
# 4kB 随机写入性能测量
fio --name=/dev/sdX --ioengine=libaio --direct=1 --fsync=1 --readwrite=randwrite --blocksize=4k --runtime=300
```

### 二. 系统设置

> 不要开交换分区

#### 1. 关闭大页

```sh
function init_huge_page() {
    echo 0 >/proc/sys/vm/zone_reclaim_mode
    echo never >/sys/kernel/mm/transparent_hugepage/enabled
    echo never >/sys/kernel/mm/transparent_hugepage/defrag
    sed -i "/\/sys\/kernel\/mm\/transparent_hugepage\/enabled/d" /etc/rc.local
    sed -i "/\/sys\/kernel\/mm\/transparent_hugepage\/defrag/d" /etc/rc.local
    echo "echo never > /sys/kernel/mm/transparent_hugepage/enabled" >>/etc/rc.local
    echo "echo never > /sys/kernel/mm/transparent_hugepage/defrag" >>/etc/rc.local
}
```

#### 3. MDS 内存参数

> `mds_cache_memory_limit`

```
建议至少 1G
```

#### 4. OSD 机器内存

> 不要开交换分区
> `osd_memory_target` 参数表示每个 OSD 使用的内存大小, 默认为 4GB

```
建议 osd_memory_target = 8GB

建议操作系统预留至少 20% 的额外内存

OSD释放内存和内核回收内存之间有时间间隔, 所以OSD有可能会用超 osd_memory_target 设置的值

不建议将 osd_memory_target 设置为低于 2GB。 Ceph 可能无法将内存消耗保持在 2GB 以下，并且性能可能会极其缓慢。

将内存目标设置在 2GB 到 4GB 之间通常可行，但可能会导致性能下降：除非活动数据集相对较小，否则可能需要在 IO 期间从磁盘读取元数据。

当有许多（小）对象或处理大（256GB/OSD 或更多）数据集时，将 osd_memory_target 设置为高于 4GB 可以提高性能。 对于快速 NVMe OSD 来说尤其如此。
```

#### 5. 每个 OSD 150 个 PG

## 物理环境准备

#### 机器信息

> 由于环境不允许, 这里只有一块网卡, 所以只能混合使用了, IP1, IP2 都是同一块网卡的一个IP。 实际生产环境中, 尽量使用两块网卡

| 角色        | 主机名                | IP1           | IP2           | 磁盘                      |
| --------- | ------------------ | ------------- | ------------- | ----------------------- |
| mon01,osd | mytestceph11v.bjat | 10.57.144.235 | 10.57.144.235 | sdb,sdc,sdd,sde,sdf,sdg |
| mon02,osd | mytestceph12v.bjat | 10.57.144.236 | 10.57.144.236 | sdb,sdc,sdd,sde,sdf,sdg |
| mon03,osd | mytestceph13v.bjat | 10.57.144.237 | 10.57.144.237 | sdb,sdc,sdd,sde,sdf,sdg |

#### 每台机器环境

- [ ] - Python3 (ubuntu 22.04 自带)
- [ ] - Systemd (系统自带)
- [ ] - chrony or NTP (时间同步)
- [ ] - LVM2 (用于配置存储设备)


## 系统环境准备

### 一. 初始化系统环境

#### 1. 设置时区

```Shell
ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
```

#### 2. 安装时间同步工具: `chrony`

##### 2.1 安装

```Shell
apt install chrony
```

##### 2.2 编辑配置文件

> `vim /etc/chrony/chrony.conf`

###### 2.2.1 删除以下行

```Shell
pool ntp.ubuntu.com        iburst maxsources 4
pool 0.ubuntu.pool.ntp.org iburst maxsources 1
pool 1.ubuntu.pool.ntp.org iburst maxsources 1
pool 2.ubuntu.pool.ntp.org iburst maxsources 2
```

###### 2.2.2 添加以下行

> ntp 服务器: `ntp1.lsne.cn` 需要根据个人实际情况进行替换, 或找公网上阿里云等大厂提供的 ntp 服务器也行

```
pool ntp1.lsne.cn iburst maxsources 4
```

##### 2.3 重启 `chrony`

```Shell
systemctl restart chrony
```

### 二. 设置源文件

> debian Q 版: `17.2` , 官方以及其他第三方的源地址有问题, 报错 `does not have a Release file` 
> debian R 版: `18.2`， 官方表示: `debian 系统有 bug 导致无法在 debian 系统上构建 ceph 集群` 等待 debian 稳定版解决此 bug

```Shell
sudo mkdir -m 0755 -p /etc/apt/keyrings

# 添加 GPG 密钥:
curl -fsSL http://mirrors.ustc.edu.cn/ceph/keys/release.asc | sudo gpg --dearmor -o /etc/apt/keyrings/ceph.gpg

# 添加源文件:
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/ceph.gpg] http://mirrors.ustc.edu.cn/ceph/debian-17.2.7/ $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/ceph.list > /dev/null

```

### 三. 安装 ceph 相关包

```Shell
sudo apt-get update

# 可根据节点角色, 选择性安装单个包
sudo apt-get install ceph-osd ceph-mon ceph-mds ceph-mgr radosgw
sudo apt-get install s3cmd    # 操作对象存储使用的 linux 命令行工具
sudo apt-get install ceph-fuse  # 挂载 cephFS 使用的工具
sudo apt-get install ceph-mgr-dashboard  # ceph 的管理页面, 不需要不安装
```


## Monitor & Manager 组件

> 官方建议: 每个运行着 ceph-mon 进程的机器上都应该同时运行一个 ceph-mgr 守护进程
> 这里将 Monitor 和 Manager 组件放在一起

### 一. 初始化集群 - 创建第一个 `Monitor` 节点

> 在 `mytestceph11v` 节点操作

#### 1. 生成集群 fsid

```Shell
root@mytestceph11v:/data/new-ceph# uuidgen
66668888-6666-8888-6666-888866668888
```

#### 2. 创建 ceph 配置文件

> ## `vim /etc/ceph/ceph.conf`

```toml
[global]
# fsid 不能在 mon 配置库里配置
# 使用 ceph-volume lvm batch 创建 osd 时需要用到本地配置文件的 fsid
fsid = 66668888-6666-8888-6666-888866668888
mon_host = [v2:10.57.144.235:3300/0,v1:10.57.144.235:6789/0] [v2:10.57.144.236:3300/0,v1:10.57.144.236:6789/0] [v2:110.57.144.237:3300/0,v1:10.57.144.237:6789/0]
mon_initial_member = mytestceph11v,mytestceph11v,mytestceph11v

[mon]
# mon_data 参数不能在 mon 配置库里配置
mon_data = /data/ceph-mon/data
log_file = /data/ceph-mon/logs/mon.log
# 不配置 public_network 在启动第二个 mon 节点加入集群时会报错
# 在 mon 配置库里设置 public_network 参数也不行。必须在本地配置文件里配置
public_network = 10.57.0.0/16
cluster_network = 10.57.0.0/16

[mgr]
# mgr_data 参数不能在 mon 配置库里配置
mgr_data = /data/ceph-mgr/data
log_file = /data/ceph-mgr/logs/mgr.log
```

##### ~~下面这个是老版本集群使用, 新集群配置项都写到 mon 配置库~~

```toml
[global]
fsid = 66668888-6666-8888-6666-888866668888
mon_host = [v2:10.57.144.235:3300/0,v1:10.57.144.235:6789/0] [v2:10.57.144.236:3300/0,v1:10.57.144.236:6789/0] [v2:110.57.144.237:3300/0,v1:10.57.144.237:6789/0]
mon_initial_member = mytestceph11v,mytestceph11v,mytestceph11v

osd pool default size = 3
osd pool default min size = 1
mon_osd_down_out_interval = 900
 
public_network = 10.57.0.0/16
cluster_network = 10.57.0.0/16
 
[mon]
mon osd min down reporters = 13
mon osd down out interval = 600
mon compact on start = true
mon_data = /data/ceph/mon
keyring = /data/ceph/mon/keyring

[mgr]
mgr_data = /data/ceph/mgr
keyring = /data/ceph/mgr/keyring

[osd]
osd max backfills = 3
osd recovery max active = 1000
osd recovery op priority = 1
osd_pg_object_context_cache_count = 1024
osd_recovery_max_single_start = 200
osd_memory_target = 2147483648
osd_delete_sleep = 200
osd_target_transaction_size = 64
osd_backfill_scan_max = 2048
```

#### 3. 创建目录

> `/data/temp-create-new-ceph-cluster` 保存创建集群时生成的一些密钥和配置文件, 只在集群搭建过程中使用
> `/data/ceph-mon/{data,logs}` 目录为 Monitor 实例数据目录
> `/data/ceph-mgr/{data,logs}` 目录为 Manager 实例数据目录

```sh
# 临时目录, 保存创建集群时生成的一些密钥和配置文件
mkdir -p /data/temp-create-new-ceph-cluster
chown ceph:ceph -R /data/temp-create-new-ceph-cluster
cd /data/temp-create-new-ceph-cluster

# ceph-mon 和 ceph-mgr 进程的数据目录和日志目录
mkdir -p /data/ceph-mon/data
mkdir -p /data/ceph-mon/logs
mkdir -p /data/ceph-mgr/data
mkdir -p /data/ceph-mgr/logs

# 修改所属用户
chown ceph:ceph -R /data/ceph-mon
chown ceph:ceph -R /data/ceph-mgr
```

#### 4. 创建 `bootstrap-osd` 密钥

```Shell
sudo -u ceph ceph-authtool --create-keyring /var/lib/ceph/bootstrap-osd/ceph.keyring --gen-key -n client.bootstrap-osd --cap mon 'profile bootstrap-osd' --cap mgr 'allow r'
```

#### 5. 创建 `client.admin` 密钥

```Shell
sudo ceph-authtool --create-keyring /etc/ceph/ceph.client.admin.keyring --gen-key -n client.admin --cap mon 'allow *' --cap osd 'allow *' --cap mds 'allow *' --cap mgr 'allow *'

chown ceph:ceph /etc/ceph/ceph.client.admin.keyring
sudo setfacl -m u:lsne:r /etc/ceph/ceph.client.admin.keyring
```

#### 6. 创建 monitor 密钥, 并将 `bootstrap-osd` 和 `client.admin` 密钥都导入 monitor 密钥

```Shell
sudo -u ceph ceph-authtool --create-keyring /data/temp-create-new-ceph-cluster/ceph.mon.keyring --gen-key -n mon. --cap mon 'allow *'

sudo ceph-authtool /data/temp-create-new-ceph-cluster/ceph.mon.keyring --import-keyring /etc/ceph/ceph.client.admin.keyring
sudo ceph-authtool /data/temp-create-new-ceph-cluster/ceph.mon.keyring --import-keyring /var/lib/ceph/bootstrap-osd/ceph.keyring
```

#### 7. 创建 monitor 节点的 map 文件

> --add 参数后不能跟复杂格式,  只能是`主机名 IP`, 如: `--add mytestceph11v 10.57.144.235`
> --addv 参数后可以跟复杂格式, 如: `--addv mytestceph11v '[v2:10.57.144.235:3300/0,v1:10.57.144.235:6789/0]'`
> --add 参数 和  --enable-all-features 参数同时使用, 效果相当于 --addv 复杂格式

```Shell
sudo monmaptool --create --addv mytestceph11v '[v2:10.57.144.235:3300/0,v1:10.57.144.235:6789/0]' --fsid 66668888-6666-8888-6666-888866668888 /data/temp-create-new-ceph-cluster/monmap

# 或
monmaptool --create --add mytestceph11v 10.57.144.235 --enable-all-features --fsid 66668888-6666-8888-6666-888866668888 /data/temp-create-new-ceph-cluster/monmap

# 查看生成的 monmap 文件信息
monmaptool --print monmap
```

#### 8. 通过 密钥 和 monmap 文件初始化 mon 进程实例, 并启动实例

```sh
sudo -u ceph ceph-mon --mkfs -i $(hostname -s) --monmap /data/temp-create-new-ceph-cluster/monmap --keyring /data/temp-create-new-ceph-cluster/ceph.mon.keyring

systemctl start ceph-mon@$(hostname -s)
systemctl enable ceph-mon@$(hostname -s)
```

#### 9. 创建 mgr 密钥, 并启动 mgr 进程实例

```sh
sudo -u ceph ceph auth get-or-create mgr.$(hostname -s) mon 'allow profile mgr' osd 'allow *' mds 'allow *' -o /data/ceph-mgr/data/keyring

systemctl start ceph-mgr@$(hostname -s)
systemctl enable ceph-mgr@$(hostname -s)
```

#### 10. 设置配置参数

```sh
# 网络参数是否设置看情况
# ceph config set global public_network '10.57.0.0/16'
# ceph config set global cluster_network '10.57.0.0/16'
ceph config set global osd_pool_default_size 3
ceph config set global osd_pool_default_min_size 1
ceph config set global mon_osd_down_out_interval 900

# mon
ceph config set mon mon_osd_min_down_reporters 13
ceph config set mon mon_osd_down_out_interval 600
ceph config set mon mon_compact_on_start true
# 设置为 host 后, 主机宕机不会自动迁移数据
ceph config set mon mon_osd_down_out_subtree_limit 'host'

# mgr prometheus 监控相关
ceph config set mgr mgr/prometheus/stale_cache_strategy return
ceph config set mgr mgr/prometheus/scrape_interval 60
ceph config set mgr mgr/prometheus/rbd_stats_pools *
ceph config set mgr mgr/prometheus/rbd_stats_pools_refresh_interval 300

# prometheus 相关参数需要 disable 后重新 enable 生效
ceph mgr module disable prometheus
ceph mgr module enable prometheus

# osd 相关参数
ceph config set osd osd_recovery_op_priority 1
ceph config set osd osd_pg_object_context_cache_count 1024
#ceph config set osd osd_memory_target 2147483648
ceph config set osd osd_memory_target 939524096
ceph config set osd osd_target_transaction_size 64

# osd backfills 速度:  rgw 集群版
ceph config set osd osd_max_backfills 3
ceph config set osd osd_recovery_max_active 1000
ceph config set osd osd_recovery_max_single_start 200
ceph config set osd osd_backfill_scan_max 2048
ceph config set osd osd_delete_sleep 200

# osd backfills 速度:  rbd 集群版
ceph config set osd osd_max_backfills 3
ceph config set osd osd_recovery_max_active 5
ceph config set osd osd_recovery_max_single_start 1
ceph config set osd osd_backfill_scan_max 512
ceph config set osd osd_delete_sleep 200
```

### 二. 扩容 Monitor 节点

>  在 `mytestceph12v` 和 `mytestceph13v` 节点操作

#### 1.  创建 `ceph.conf` 和 `ceph.client.admin.keyring`

> 需要将第一个 Monitor 节点 `mytestceph11v` 机器上的 `ceph.conf` 和 `ceph.client.admin.keyring` 拷贝过来

```Shell
scp root@mytestceph11v:/etc/ceph/ceph.conf /etc/ceph/
scp root@mytestceph11v:/etc/ceph/ceph.client.admin.keyring /etc/ceph/

chown ceph:ceph /etc/ceph/ceph.conf
chown ceph:ceph /etc/ceph/ceph.client.admin.keyring
chmod 600 /etc/ceph/ceph.client.admin.keyring
```

#### 2 创建数据目录

```Shell
# 临时目录, 保存创建集群时生成的一些密钥和配置文件
mkdir -p /data/temp-create-new-ceph-cluster
chown ceph:ceph -R /data/temp-create-new-ceph-cluster
cd /data/temp-create-new-ceph-cluster

# ceph-mon 和 ceph-mgr 进程的数据目录和日志目录
mkdir -p /data/ceph-mon/data
mkdir -p /data/ceph-mon/logs
mkdir -p /data/ceph-mgr/data
mkdir -p /data/ceph-mgr/logs

# 修改所属用户
chown ceph:ceph -R /data/ceph-mon
chown ceph:ceph -R /data/ceph-mgr
```

#### 3. 从 ceph 集群下载 `mon 密钥` 和 `mon map`

```Shell
ceph auth get mon. -o /data/temp-create-new-ceph-cluster/ceph.mon.keyring
ceph mon getmap -o /data/temp-create-new-ceph-cluster/monmap
```

#### 4. 通过 密钥 和 monmap 文件初始化 mon 进程实例, 并启动实例

>  `ceph-mon --mkfs` 操作初始化数据目录的同时, 也会将节点加入集群
> 不执行 `ceph-mon --mkfs` 操作。启动后不会加入集群

```sh
sudo -u ceph ceph-mon --mkfs -i $(hostname -s) --monmap /data/temp-create-new-ceph-cluster/monmap --keyring /data/temp-create-new-ceph-cluster/ceph.mon.keyring

systemctl start ceph-mon@$(hostname -s)
systemctl enable ceph-mon@$(hostname -s)
```

#### 5. 创建 mgr 密钥, 并启动 mgr 进程实例

```sh
sudo -u ceph ceph auth get-or-create mgr.$(hostname -s) mon 'allow profile mgr' osd 'allow *' mds 'allow *' -o /data/ceph-mgr/data/keyring

systemctl start ceph-mgr@$(hostname -s)
systemctl enable ceph-mgr@$(hostname -s)
```
### 三. 移除 Monitor 节点

#### 1. 移除 mgr 实例

```Shell
systemctl stop ceph-mgr@$(hostname -s)
systemctl disable ceph-mgr@$(hostname -s)

rm -rf /data/ceph/mgr
```

#### 2. 移除 Monitor 节点

```Shell
systemctl stop ceph-mon@$(hostname -s)
systemctl disable ceph-mon@$(hostname -s)

ceph mon remove $(hostname -s)
```

### 四. 强制移除故障的 mon 节点

> 无法形成仲裁的 mon, 需要强制恢复

#### 1. 停止所有 mon 实例

```Shell
systemctl stop ceph-mon@$(hostname -s)
```

#### 2. 将 monmap 导出

```sh
ceph-mon -i $(hostname -s) --extract-monmap /data/temp-create-new-ceph-cluster/monmap.ext
```

#### 3. 从 map 中删除有问题的 mon 节点

```sh
monmaptool /data/temp-create-new-ceph-cluster/monmap.ext --rm mytestceph12v
```

#### 4. 将修改后的 monmap 导入集群

```sh
ceph-mon -i $(hostname -s) --inject-monmap /data/temp-create-new-ceph-cluster/monmap.ext
```

#### 5. 启动正常的 mon 节点

```sh
systemctl start ceph-mon@$(hostname -s)
```

## OSD 组件

### 一. 添加 osd 节点

#### 1.  创建 `ceph.conf` 和 `bootstrap-osd` 用户的密钥文件: `ceph.keyring`

> 需要将第一个 Monitor 节点 `mytestceph11v` 机器上的 `ceph.conf` 和 `ceph.client.admin.keyring` 拷贝过来
> 并且需要 `/var/lib/ceph/bootstrap-osd/ceph.keyring` 文件


```Shell
scp root@mytestceph11v:/etc/ceph/ceph.conf /etc/ceph/
scp root@mytestceph11v:/var/lib/ceph/bootstrap-osd/ceph.keyring /var/lib/ceph/bootstrap-osd/ceph.keyring

chown ceph:ceph /etc/ceph/ceph.conf
chown ceph:ceph /var/lib/ceph/bootstrap-osd/ceph.keyring
chmod 600 /var/lib/ceph/bootstrap-osd/ceph.keyring
```

##### 1.2 可能需要对ssd盘分区

###### 一块磁盘分5个区

```
parted /dev/sdb mklabel gpt
parted /dev/sdb mkpart primary ext4 0% 20%
parted /dev/sdb mkpart primary ext4 20% 40%
parted /dev/sdb mkpart primary ext4 40% 60%
parted /dev/sdb mkpart primary ext4 60% 80%
parted /dev/sdb mkpart primary ext4 80% 100%
```

###### 一块磁盘分6个区

```
parted /dev/sdb mklabel gpt
parted /dev/sdb mkpart primary ext4 0% 16%
parted /dev/sdb mkpart primary ext4 16% 32%
parted /dev/sdb mkpart primary ext4 32% 48%
parted /dev/sdb mkpart primary ext4 48% 64%
parted /dev/sdb mkpart primary ext4 64% 80%
parted /dev/sdb mkpart primary ext4 80% 96%
```
#### 2. 创建 osd

> 创建的同时, 会启动 osd 进程, 并将 osd 加入集群
> 创建 osd 之前, 建议先对磁盘进行清理: `ceph-volume lvm zap --destroy /dev/sdb /dev/sde`

#### 2.0 可能需要提前对


```sh
# 创建 osd 块设备, 不指定单独的 db 分区
sudo ceph-volume lvm create --bluestore --data /dev/sdg

# 创建 osd 块设备, 同时指定单独的 db 分区
# db 分区为 块设备大小的 1% ~ 4% ,  如果是 RGW, 要大于 4% 
sudo ceph-volume lvm create --bluestore --data /dev/sde --block.db /dev/sdb
```

##### 2.2 方式二: 两阶段创建 osd

```Shell
# 准备
sudo ceph-volume lvm prepare --bluestore --data /dev/sdf --block.db /dev/sdc

# 查看磁盘信息
sudo ceph-volume lvm list

====== osd.4 =======

  [block]       /dev/ceph-9c656a75-bb09-44b4-889b-3c30955abf80/osd-block-aa61b537-a9e3-403f-a98f-2e14e2ff3139

      block device              /dev/ceph-9c656a75-bb09-44b4-889b-3c30955abf80/osd-block-aa61b537-a9e3-403f-a98f-2e14e2ff3139
      block uuid                AyRe0R-dN0n-JhCg-VfrQ-my4u-w1Ti-vpRwPA
      cephx lockbox secret
      cluster fsid              66668888-6666-8888-6666-888866668888
      cluster name              ceph
      crush device class
      db device                 /dev/ceph-e0fc4207-a0b6-4ee1-b7c4-194a9561fbbc/osd-db-f02deb92-2f3b-4d8a-af51-fb3e79097167
      db uuid                   Td0IV1-KmQM-mdIp-0oqY-lzzE-DZD3-L10eb7
      encrypted                 0
      osd fsid                  aa61b537-a9e3-403f-a98f-2e14e2ff3139
      osd id                    4
      osdspec affinity
      type                      block
      vdo                       0
      devices                   /dev/sdf

  [db]          /dev/ceph-e0fc4207-a0b6-4ee1-b7c4-194a9561fbbc/osd-db-f02deb92-2f3b-4d8a-af51-fb3e79097167

      block device              /dev/ceph-9c656a75-bb09-44b4-889b-3c30955abf80/osd-block-aa61b537-a9e3-403f-a98f-2e14e2ff3139
      block uuid                AyRe0R-dN0n-JhCg-VfrQ-my4u-w1Ti-vpRwPA
      cephx lockbox secret
      cluster fsid              66668888-6666-8888-6666-888866668888
      cluster name              ceph
      crush device class
      db device                 /dev/ceph-e0fc4207-a0b6-4ee1-b7c4-194a9561fbbc/osd-db-f02deb92-2f3b-4d8a-af51-fb3e79097167
      db uuid                   Td0IV1-KmQM-mdIp-0oqY-lzzE-DZD3-L10eb7
      encrypted                 0
      osd fsid                  aa61b537-a9e3-403f-a98f-2e14e2ff3139
      osd id                    4
      osdspec affinity
      type                      db
      vdo                       0
      devices                   /dev/sdc
      
# 激活 OSD 进程
sudo ceph-volume lvm activate 4 aa61b537-a9e3-403f-a98f-2e14e2ff3139
```

##### 2.3 方式三:  批量创建 osd

```sh
# ceph 会自动将两个 db-devices 设备分成 6 个分区, 每个设备3个分区, 对应前面的 6 个 block 磁盘
ceph-volume lvm batch --bluestore /dev/sdd /dev/sde /dev/sdf /dev/sdg /dev/sdh /dev/sdi --db-devices /dev/sdb /dev/sdc

ceph-volume lvm batch --crush-device-class hdd --bluestore /dev/sdb /dev/sdc /dev/sdd

ceph-volume lvm batch --crush-device-class ssd --bluestore /dev/sde /dev/sdf /dev/sdg
```

### 二. 替换 OSD

> 替换 OSD 与删除 OSD 的不同之处在于，在 OSD 被销毁以进行替换后，替换的 OSD 的 ID 和 CRUSH 映射条目必须保持完整。

#### 1. 确保销毁是安全的

```sh
while ! ceph osd safe-to-destroy osd.6 ; do sleep 10 ; done
```

#### 2. 销毁

```sh
ceph osd destroy 6 --yes-i-really-mean-it
```

#### 2.1 销毁后 osd 并未剔除集群, 状态从 up 变成了 destroyed

```sh

ceph osd tree

ID  CLASS  WEIGHT   TYPE NAME              STATUS     REWEIGHT  PRI-AFF
-1         0.23434  root default
-3         0.11717      host mycephosd01v
 0    hdd  0.03909          osd.0                 up   1.00000  1.00000
 3    hdd  0.03909          osd.3                 up   1.00000  1.00000
 4    hdd  0.03899          osd.4                 up   1.00000  1.00000
-5         0.07808      host mycephosd02v
 1    hdd  0.03909          osd.1                 up   1.00000  1.00000
 5    hdd  0.03899          osd.5                 up   1.00000  1.00000
-7         0.03909      host mycephosd03v
 2    hdd  0.03909          osd.2                 up   1.00000  1.00000
 6               0  osd.6                  destroyed         0  1.00000
```

#### 3. 新磁盘 - 上线前清理

```sh
ceph-volume lvm zap /dev/sdf
```

#### 4. 使用销毁的 osd id 准备新磁盘

```sh
ceph-volume lvm create --osd-id 6 --data /dev/sdf
```

#### 5. 观察数据迁移情况

```sh
ceph -w
```

### 三. 移除 osd 节点

#### 1. 将 osd 在集群中 out

```sh
# 手动将权重设置为0
ceph osd crush reweight osd.4 0

# 等待数据均衡完成
ceph -s

# 调整 osd 为 out 状态
ceph osd out 4

# 观察到 out 之后这个 osd 的权重为 0 了
ceph osd tree
```

#### 2. 观察迁移情况

> 迁移完成后, 再进行下一步操作( 也许上一步 reweight 调整为 0 时已经等待了数据迁移完成)

```sh
ceph -w
```

#### 3. 停止对应的 osd 进程

> stop 后,  ceph osd tree 中此 osd 会变成 down 状态

```sh
ssh mytestceph12v
systemctl disable ceph-osd@4
systemctl stop ceph-osd@4
```

#### 4. 移除 osd 

```sh
# 删除 osd, 同时会清理 crush
ceph osd purge 4 --yes-i-really-mean-it

# 或 ( purge 4 和  purge osd.4 效果相同)
ceph osd purge osd.4
```

### 四. 移除 osd 机器

> 如果 osd 机器上所有 osd 全部被删除, 需要将该机器在 carsh rule 里删除

```Shell
# 从 carsh rule map 里删除 osd 机器
ceph osd crush rm mytestceph12v
```

## PG 自动缩放


```sh
# 查看 .mgr 池子是否开启 PG 自动缩放
ceph osd pool get .mgr pg_autoscale_mode

# 关闭 .mgr 池子 PG 自动缩放
ceph osd pool set .mgr pg_autoscale_mode off

# 全局关闭所有池子 PG 自动缩放
ceph osd pool set noautoscale
```

## crush rule

#### Class 相关

```sh
# 删除 class
ceph osd crush rm-device-class 3 7 11

# 添加 class
ceph osd crush set-device-class nvme 3 7 11

# 查看当前都有哪些 class
ceph osd crush class ls

# 手动创建 class, 一般不用手动创建, 给 osd 设置一个新的 class 时, 会自动创建
ceph osd crush class create nvme
```

### 一. 创建规则

#### 1. 创建 Crush map 的 root bucket

```sh
ceph osd crush add-bucket myroot01 root
```

#### 2. 创建 Crush map 的 rack bucket, 并将 rack 加入指定的 root bucket

```sh
# 创建 rack
ceph osd crush add-bucket myrack01 rack
ceph osd crush add-bucket myrack02 rack
ceph osd crush add-bucket myrack03 rack

# 将 rack 加入 root
ceph osd crush move myrack01 root=myroot01
ceph osd crush move myrack02 root=myroot01
ceph osd crush move myrack03 root=myroot01
```

#### 3. 将 osd host 机器移动到指定的 rack bucket

```sh
ceph osd crush move mytestceph11v rack=myrack01
ceph osd crush move mytestceph12v rack=myrack02
ceph osd crush move mytestceph13v rack=myrack03
```

#### 4. 创建 复制 模式 Crush 规则

```sh
ceph osd crush rule create-replicated rule-hdd01 myroot01 rack hdd
ceph osd crush rule create-replicated rule-ssd01 myroot01 rack ssd

# 解释:
# ceph osd crush rule create-replicated：表示创建一个复制式 Crush 规则。
# rule-hdd01：是要创建的 Crush 规则的名称，这里是 sata_rule1。
# myroot01：是 Crush map 中的根名称，这里是 sata_root01。
# rack：是 Crush map 中的 bucket 类型，这里是 rack，表示这个规则会在 rack 这个层级上进行数据分布。
# hdd:  是 OSD 的  class 类型
```

#### 5. 创建 纠删码(EC) 模式 Crush 规则

```sh
# 创建 纠删码 配置文件
ceph osd erasure-code-profile set my_ec_profile k=6 m=3 crush-failure-domain=rack crush-root=sata_root01

# 创建 纠删码模式的 Crush 规则
ceph osd crush rule create-erasure sata_ec_rule1 my_ec_profile
```

#### 6. 使用 Crush 规则示例

```sh
# 将池子: .mgr 设置为  
ceph osd pool set .mgr crush_rule rule-ssd01

# 创建池子: default.rgw.buckets.data, 并使用 ec 规则
ceph osd pool create default.rgw.buckets.data 4096 4096 erasure my_ec_profile

# 创建池子: default.rgw.buckets.non-ec 并使用 复制 规则
ceph osd pool set default.rgw.buckets.non-ec crush_rule sata_rule1
```

## RGW 组件

### 一. 创建 rgw 使用的 pool

```sh
ceph osd pool create .rgw.root 16 16 rule-ssd01
ceph osd pool create default.rgw.control 16 16 rule-ssd01
ceph osd pool create default.rgw.meta 16 16 rule-ssd01
ceph osd pool create default.rgw.log 16 16 rule-ssd01
ceph osd pool create default.rgw.buckets.non-ec 16 16 rule-ssd01

# rgw 索引使用 ssd 池子, rgw 数据使用 sata 池子副本模式
ceph osd pool create default.rgw.buckets.index 64 64 rule-ssd01
ceph osd pool create default.rgw.buckets.data 512 512 rule-hdd01

# rgw 索引使用 sata 池子, rgw 数据使用 sata 池子 EC 模式
# ceph osd pool create default.rgw.buckets.index 512 512 sata_rule1
# ceph osd pool create default.rgw.buckets.data 1024 1024 erasure my_ec_profile

# 设置池子的应用类型
ceph osd pool application enable .rgw.root rgw
ceph osd pool application enable default.rgw.control rgw
ceph osd pool application enable default.rgw.meta rgw
ceph osd pool application enable default.rgw.log rgw
ceph osd pool application enable default.rgw.buckets.data rgw
ceph osd pool application enable default.rgw.buckets.index rgw
ceph osd pool application enable default.rgw.buckets.non-ec rgw
```

### 二. 添加 rgw 节点

#### 1. ceph 集群添加参数

```sh
ceph config set client rgw_s3_auth_use_rados true
ceph config set client rgw_s3_auth_use_keystone false
# ceph config set client rgw_s3_auth_aws4_force_boto2_compat false
ceph config set client rgw_s3_auth_use_ldap false
ceph config set client rgw_s3_success_create_obj_status 0
ceph config set client rgw_relaxed_s3_bucket_names false
ceph config set client rgw_s3_auth_use_sts true
ceph config set client rgw_cache_expiry_interval 3600
ceph config set client rgw_cache_lru_size 200000
ceph config set client rgw_op_thread_suicide_timeout 30
```

#### 1. 创建 数据目录

```sh
mkdir -p /data/ceph-rgw/data
mkdir -p /data/ceph-rgw/logs
chown ceph:ceph -R /data/ceph-rgw
```

#### 2. 修改配置文件

> 添加以下参数

```toml
[client]
rgw_data = /data/ceph-rgw/data
log_file = /data/ceph-rgw/logs/rgw.log
rgw_frontends = beast port=7480 ssl_port=443 ssl_certificate=/cert/a.crt
```

##### ~~下面这个是老版本集群使用, 新集群配置项都写到 mon 配置库~~

```toml
[client]
rgw_data = /data/ceph/rgw
# keyring = /data/ceph/rgw/keyring  # 不能加这个参数, 加完 ceph -s 命令就不能用了. 不写这个参数, rgw 启动时自动在 rgw_data 目录找 keyring
log file = /data/logs/rgw/rgw.log
rgw_frontends = beast port=7480 ssl_port=443 ssl_certificate=/cert/a.crt
rgw_s3_auth_use_rados = true
rgw_s3_auth_use_keystone = false
rgw_s3_auth_aws4_force_boto2_compat = false
rgw_s3_auth_use_ldap = false
rgw_s3_success_create_obj_status = 0
rgw_relaxed_s3_bucket_names = false
rgw_s3_auth_use_sts =true
#debug_rgw = 20
rgw_cache_expiry_interval = 3600
rgw_cache_lru_size = 200000
rgw op thread suicide timeout = 30
```

#### 3. 创建 rgw 密钥

```sh
# client.rgw.mytestceph11v 中的 rgw.mytestceph11v 在启动时使用
sudo -u ceph ceph auth get-or-create client.rgw.$(hostname -s) osd 'allow rwx' mon 'allow rw' -o /data/ceph-rgw/data/keyring
```

#### 4. 启动

```sh
# ceph-radosgw@rgw.mytestceph11v 中的 rgw.$(hostname -s) 与密钥名称保持一致
systemctl start ceph-radosgw@rgw.$(hostname -s)
```

#### 5. 创建用户

```sh
# 指定 --system 创建管理员用户
radosgw-admin user create --uid=admin --display-name=admin --system

# 创建普通用户
radosgw-admin user create --uid myuser01 --display-name "my friest username Demo"
```

#### 5. 测试

> 参考 radosgw-admin 命令和 s3cmd 工具的使用

## MDS 组件

### 一. 创建 mds 节点

#### 1. 创建数据目录

```sh
mkdir -p /data/ceph-mds/data
mkdir -p /data/ceph-mds/logs
chown ceph:ceph -R /data/ceph-mds
```

#### 2. 修改配置文件

> 添加以下参数

```toml
[mds]
mds_data = /data/ceph-mds/data
log_file = /data/ceph-mds/logs/mds.log
```

#### 3. 创建 密钥

```sh
sudo -u ceph ceph auth get-or-create mds.$(hostname -s) osd "allow rwx" mds "allow *" mon "allow profile mds" -o /data/ceph-mds/data/keyring
```

#### 5. 启动

```sh
systemctl start ceph-mds@$(hostname -s)
```

#### 6. 测试mds

> 由于不使用 cephfs, 在 ceph -s 状态里不会显示 mds 相关信息
> 所以这里创建一个 fs 测试 mds 是否可用

```sh
ceph osd pool create myfsmeta 16 16 rule-ssd01
ceph osd pool create myfsdata 16 16 rule-hdd01
ceph fs new myfs myfsmeta myfsdata

# 然后再 ceph -s 就可以看到 mds 状态了

ceph -s
```
