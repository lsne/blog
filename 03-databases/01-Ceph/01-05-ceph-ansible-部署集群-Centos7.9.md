# ceph-ansible 部署 nautilus 版 集群 集群

## 环境准备

### 一. 机器列表

```
mytestceph02v.cpp.bjat.lsne.cn 10.57.93.156
mytestceph01v.cpp.bjat.lsne.cn 10.57.93.155
mytestceph03v.cpp.bjat.lsne.cn 10.57.93.154
```

## 机器初始化

### 一. 修改内核参数

> 如果data盘为ssd. 则内核参数中做更改。 否则忽略
> 原因: https://access.redhat.com/documentation/zh-cn/red_hat_enterprise_linux/7/html/7.2_release_notes/storage

#### 1. 编辑: `/etc/default/grub`

```
GRUB_CMDLINE_LINUX一行中添加
scsi_mod.use_blk_mq=y dm_mod.use_blk_mq=y    
```

#### 2. 生成新的启动文件

```sh
grub2-mkconfig -o /boot/grub2/grub.cfg
```

#### 3. 重启

### 二. 时间同步设置

> 略

### 三. 安装 docker 

```sh
yum install -y docker && systemctl restart docker && systemctl enable docker

# 可提前将要安装的 ceph 镜像版本 pull 下来
docker image pull quay.io/ceph/ceph:v14.2.22
```

### 四. 安装 pip 并升级

```sh
yum install python-pip

# 先升级到 18.1 再升级, 直接升级到最新版本好像会报错
pip install --upgrade pip==18.1 -i http://pypi.douban.com/simple/ --trusted-host pypi.douban.com
pip install --upgrade pip -i http://pypi.douban.com/simple/ --trusted-host pypi.douban.com
```

### 五. 安装 ceph-common

#### 1. 配置 yum 源: `vim /etc/yum.repos.d/ceph.repo`

```sh
[ceph]
name=ceph
baseurl=http://mirrors.aliyun.com/ceph/rpm-nautilus/el7/x86_64/
gpgcheck=0

[ceph-noarch]
name=cephnoarch
baseurl=http://mirrors.aliyun.com/ceph/rpm-nautilus/el7/noarch/
gpgcheck=0
```

#### 2. 安装 ceph-common

```sh
# 配置 yum 源, 然后
yum install ceph-common
```

## 部署集群

### 一. 部署集群

#### 1. 下载 ceph-ansible 源码, 并切到 v6.0.28.7 分支

> v6.0.28 将 ansible 升级到了 2.10 但是有问题安装会报错。 v6.0.28.7 又把 ansible 降级到了 2.9

```sh
# 设置代理
export http_proxy=http://proxy.lsne.cn:3128
export https_proxy=http://proxy.lsne.cn:3128

# 下载代码, 切分支
git clone https://github.com/ceph/ceph-ansible.git
cd ceph-ansible
git checkout v6.0.28.7

# 取消代理
unset http_proxy
unset https_proxy
```

#### 2. 下载依赖包

```sh
pip install -r requirements.txt -i http://pypi.douban.com/simple/ --trusted-host pypi.douban.com
```

#### 3. 下载 ansible 依赖包

```sh
ansible-galaxy install -r requirements.yml
```

#### 4. 编辑主机列表文件: `vim host`

```
[mons]
mytestceph01v.cpp.bjat.lsne.cn
mytestceph02v.cpp.bjat.lsne.cn
mytestceph03v.cpp.bjat.lsne.cn

[osds]
mytestceph01v.cpp.bjat.lsne.cn
mytestceph02v.cpp.bjat.lsne.cn
mytestceph03v.cpp.bjat.lsne.cn

[mdss]
mytestceph01v.cpp.bjat.lsne.cn
mytestceph02v.cpp.bjat.lsne.cn
mytestceph03v.cpp.bjat.lsne.cn

[rgws]
mytestceph01v.cpp.bjat.lsne.cn
mytestceph02v.cpp.bjat.lsne.cn
mytestceph03v.cpp.bjat.lsne.cn

[mgrs]
mytestceph01v.cpp.bjat.lsne.cn
mytestceph02v.cpp.bjat.lsne.cn
mytestceph03v.cpp.bjat.lsne.cn
```

#### 5. 编辑 playbook

##### 5.1 从模板文件克隆

```sh
cp site-container.yml.sample newceph.yaml
```

##### 5.2 编辑文件: `vim newceph.yaml`

```
# 启用要部署哪些组件
- hosts:
  - mons
  - osds
  - mdss
  - rgws
  - mgrs
```

#### 6. 编辑环境变量文件

##### 6.1 创建要安装的组件的环境变量文件

```
mv group_vars/all.yml.sample group_vars/all.yml
mv group_vars/osds.yml.sample group_vars/osds.yml
```

##### 6.2 编辑变量文件: `vim group_vars/all.yml`

```yaml
dummy:
monitor_interface: eth0
ip_version: ipv4
public_network: 10.57.93.0/24
cluster_network: 10.57.93.0/24
radosgw_interface: eth0
ceph_conf_overrides:
  client:
    rbd_cache_max_dirty: 100663296
    rbd_cache_max_dirty_age: 5
    rbd_cache_size: 134217728
    rbd_cache_target_dirty: 67108864
    rbd_cache_writethrough_until_flush: True
  global:
    cluster: mycephcluster
    public_network: 10.57.93.0/24
    cluster_network: 10.57.93.0/24
    mon_initial_members: mytestceph01v,mytestceph02v,mytestceph03v
    mon_host: 10.57.93.155,10.57.93.156,10.57.93.154
    auth_cluster_required: cephx
    auth_service_required: cephx
    auth_client_required: cephx
    ms_bind_ipv6: false
    mon_allow_pool_delete: true
    osd_journal_size: 1024
    osd_pool_default_size: 3
    osd_pool_default_min_size: 1
    osd_pool_default_pg_num: 1024
    osd_pool_default_pgp_num: 1024
    osd_crush_chooseleaf_type: 1
  mgr:
    mgr_stats_threshold: 0
  osd:
    bdev_async_discard: True
    bdev_enable_discard: True
    bluestore_block_db_size: 161061273600
    bluefs_shared_alloc_size: 262144
    bluestore_min_alloc_size_hdd: 262144
    filestore_commit_timeout: 3000
    filestore_fd_cache_size: 2500
    filestore_max_inline_xattr_size: 254
    filestore_max_inline_xattrs: 6
    filestore_max_sync_interval: 10
    filestore_op_thread_suicide_timeout: 600
    filestore_op_thread_timeout: 580
    filestore_op_threads: 10
ceph_docker_image: "ceph/daemon"  # 一定要用 ceph/daemon,不能用 ceph/ceph
ceph_docker_image_tag: latest-nautilus
ceph_docker_registry: quay.io
containerized_deployment: True
dashboard_admin_password: 123456
grafana_admin_password: 123456
```

##### 6.3 编辑: `vim group_vars/osds.yml`

```yaml
dummy:
lvm_volumes:
  - data: /dev/sdb
    db: /dev/sdd
  - data: /dev/sdc
    db: /dev/sde
```

#### 7. 执行部署

```sh
ansible-playbook -i host newceph.yaml
```

### 二. osd 扩容

#### 1. 编辑