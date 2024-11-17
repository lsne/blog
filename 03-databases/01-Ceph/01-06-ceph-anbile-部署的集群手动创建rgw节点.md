# 给现有的ceph-anbile部署的集群手动创建rgw节点

## 要扩容的机器

```
oss33.cpp.zzt.lsne.cn 10.252.134.146
```

## 扩容步骤

### 1. 在集群管理节点创建 rgw 用户

> 在有 ceph 管理员权限的机器上执行

```sh
ceph auth get-or-create client.rgw.oss33.rgw0 osd 'allow rwx' mon 'allow rw'
```

### 2. 将生成的 rgw 用户密钥复制到 oss33

```sh
mkdir /var/lib/ceph/radosgw/ceph-rgw.oss33.rgw0/
vim /var/lib/ceph/radosgw/ceph-rgw.oss33.rgw0/keyring
```
### 3. 创建环境变量文件

```
vim /var/lib/ceph/radosgw/ceph-rgw.oss33.rgw0/EnvironmentFile
INST_NAME=rgw0
INST_PORT=8080
```

### 4. 创建证书文件

> 去现有的 rgw 节点相同位置, 将证书内容复制过来

```sh
mkdir /etc/ceph/certs
vim /etc/ceph/certs/_.yun.lsne.cn_chained.crt
```

### 5. 配置文件添加配置: `vim /etc/ceph/ceph.conf`

```sh
[client.rgw.oss33.rgw0]
host = oss33
keyring = /var/lib/ceph/radosgw/ceph-rgw.oss33.rgw0/keyring
log file = /var/log/ceph/ceph-rgw-oss33.rgw0.log
rgw_frontends = civetweb port=443s  ssl_certificate=/etc/ceph/certs/_.yun.lsne.cn_chained.crt
rgw_thread_pool_size = 512
rgw_dynamic_resharding = false
rgw_s3_auth_use_rados = true
rgw_s3_auth_use_keystone = false
rgw_s3_auth_aws4_force_boto2_compat = false
rgw_s3_auth_use_ldap = false
rgw_s3_success_create_obj_status = 0
rgw_relaxed_s3_bucket_names = false
rgw_s3_auth_use_sts =true
rgw_cache_expiry_interval = 3600
rgw op thread suicide timeout = 30
```

### 6. 创建 service 文件: `/etc/systemd/system/ceph-radosgw@.service`

> 注意,将文件中的所有 oss33 替换为新机器名

```sh
[Unit]
Description=Ceph RGW
After=docker.service

[Service]
EnvironmentFile=/var/lib/ceph/radosgw/ceph-%i/EnvironmentFile
ExecStartPre=-/usr/bin/docker stop ceph-rgw-oss33-${INST_NAME}
ExecStartPre=-/usr/bin/docker rm ceph-rgw-oss33-${INST_NAME}
ExecStart=/usr/bin/docker run --rm --net=host \
  --memory=128372m \
  --cpu-quota=800000 \
  -v /var/lib/ceph:/var/lib/ceph:z \
  -v /etc/ceph:/etc/ceph:z \
  -v /var/run/ceph:/var/run/ceph:z \
  -v /etc/localtime:/etc/localtime:ro \
  -v /da1/var/log/ceph:/var/log/ceph:z \
  -e CEPH_DAEMON=RGW \
  -e CLUSTER=ceph \
  -e RGW_NAME=oss33.${INST_NAME} \
  -e RGW_CIVETWEB_PORT=${INST_PORT} \
  -e CONTAINER_IMAGE=ecr-sh.yun.lsne.cn/ceph/daemon:lsne-master-nautilus-centos-7-x86_64-2 \
  --name=ceph-rgw-oss33-${INST_NAME} \
   \
  ecr-sh.yun.lsne.cn/ceph/daemon:lsne-master-nautilus-centos-7-x86_64-2
ExecStopPost=-/usr/bin/docker stop ceph-rgw-oss33-${INST_NAME}
Restart=always
RestartSec=10s
TimeoutStartSec=120
TimeoutStopSec=15

[Install]
WantedBy=multi-user.target
```

### 7. 启动

```sh
systemctl start ceph-radosgw@rgw.oss33.rgw0.service
```