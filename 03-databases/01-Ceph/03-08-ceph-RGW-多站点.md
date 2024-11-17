
# RGW 多站点

## 多站点

```
regions 又称: multi-zone-group, 包含一个或多个 zone group
zone group: 包含一个或多个 zone; group 中所有 zone 可以互相做副本
zone: 包含一个或多个 ceph-radosgw 示例
```

## 将单个站点系统迁移到多站点
### 一. 多站点 - 创建 master zone


> [!NOTE] 注意  
> 红帽官档上说 1~6 步需要在 `cephadm shell ` 中执行, 但演示环境不是使用 `cephadm` 部署的集群

#### 1. 创建 regions

```sh
radosgw-admin realm create --rgw-realm=NAME --default

# 示例
radosgw-admin realm create --rgw-realm=movies --default
```

#### 2. 重命名默认`区域`和 `zonegroup`

```sh
radosgw-admin zonegroup rename --rgw-zonegroup default --zonegroup-new-name=NEW_ZONE_GROUP_NAME

radosgw-admin zone rename --rgw-zone default --zone-new-name us-east-1 --rgw-zonegroup=ZONE_GROUP_NAME
```

#### 3. 配置主要 zonegroup

> 使用 realm 或 zonegroup 名称替换 `NAME`
> 使用 zonegroup 中的完全限定域名替换 `FQDN`。

```sh
radosgw-admin zonegroup modify --rgw-realm=REALM_NAME --rgw-zonegroup=ZONE_GROUP_NAME --endpoints http://FQDN:80 --master --default
```

#### 4. 创建 rgw 的管理员用户

```sh
radosgw-admin user create --uid="{user-name}" --display-name="{Display Name}" --system

# 从 rgw 节点需要用户密钥进行认证

# 示例
radosgw-admin user create --uid="synchronization-user" --display-name="Synchronization User" --system
```

#### 5. 配置主区域

> 使用 realm、zonegroup 或 zone name 替换 `NAME`。
> 使用 zonegroup 中的完全限定域名替换 `FQDN`。

```sh
radosgw-admin zone modify --rgw-realm=REALM_NAME --rgw-zonegroup=ZONE_GROUP_NAME \
                            --rgw-zone=ZONE_NAME --endpoints http://FQDN:80 \
                            --access-key=ACCESS_KEY --secret=SECRET_KEY \
                            --master --default
```

#### 6. 更新配置文件

```sh
ceph config set client.rgw.SERVICE_NAME rgw_realm REALM_NAME
ceph config set client.rgw.SERVICE_NAME rgw_zonegroup ZONE_GROUP_NAME
ceph config set client.rgw.SERVICE_NAME rgw_zone PRIMARY_ZONE_NAME
```

##### 6.1 示例

```sh
ceph config set client.rgw.rgwsvcid.mons-1.jwgwwp rgw_realm test_realm
ceph config set client.rgw.rgwsvcid.mons-1.jwgwwp rgw_zonegroup us
ceph config set client.rgw.rgwsvcid.mons-1.jwgwwp rgw_zone us-east-1
```

#### 7. 提交

```sh
radosgw-admin period update --commit
```

#### 8. 启动 rgw 

```sh
systemctl start ceph-radosgw@rgw.`hostname -s`
systemctl enable ceph-radosgw@rgw.`hostname -s`
```

### 二. 多站点 - 创建 Secondary Zone


> [!WARNING] 注意
>  必须在 主区域组的主区域中执行相关的元数据操作(如: 创建用户, 设置配额等)  
> 
>  master zone 和 second zone 可以从 RESTful API 接收 bucket 操作，但 second zone 将存储桶操作重定向到 master zone。如果 master zone 停机，则存储桶操作将失败。  
>
>  如果使用 `theradosgw-admin` CLI 创建存储桶，则必须在 master zone group 的 master zone 中的主机上执行，否则存储桶不会同步到其他 zone group 和 zone。

#### 1. 从主机拉取 Realm

> 使用 master zone group 中 master zone 的 URL 路径、访问密钥和机密，将域拉取到主机。
> 若要拉取非默认域，可使用 ``--rgw-realm 或 `--realm-` id`` 配置选项来指定域。

```sh
radosgw-admin realm pull --url=URL_TO_PRIMARY_ZONE_GATEWAY --access-key=ACCESS_KEY --secret-key=SECRET_KEY

# 示例
radosgw-admin realm pull --url=http://10.74.249.26:80 --access-key=LIPEYZJLTWXRKXS9LPJC --secret-key=IsAje0AVDNXNw48LjMAimpCpI7VaxJYSnfD0FFKQ
```

#### 2. 从主机拉取主要 period 配置

```sh
radosgw-admin period pull --url=URL_TO_PRIMARY_ZONE_GATEWAY --access-key=ACCESS_KEY --secret-key=SECRET_KEY

# 示例
radosgw-admin period pull --url=http://10.74.249.26:80 --access-key=LIPEYZJLTWXRKXS9LPJC --secret-key=IsAje0AVDNXNw48LjMAimpCpI7VaxJYSnfD0FFKQ
```

#### 3. 创建 zone

```sh
radosgw-admin zone create --rgw-zonegroup=_ZONE_GROUP_NAME_ --rgw-zone=_SECONDARY_ZONE_NAME_ --endpoints=http://_RGW_SECONDARY_HOSTNAME_:_RGW_PRIMARY_PORT_NUMBER_1_ --access-key=_SYSTEM_ACCESS_KEY --secret=_SYSTEM_SECRET_KEY [--read-only]

# 示例
radosgw-admin zone create --rgw-zonegroup=us --rgw-zone=us-east-2 --endpoints=http://rgw2:80 --access-key=LIPEYZJLTWXRKXS9LPJC --secret-key=IsAje0AVDNXNw48LjMAimpCpI7VaxJYSnfD0FFKQ
```

#### 4. 删除


> [!ERROR] 不要删除
> 如果默认zone有数据, 则不要删除, 否则会导致数据丢失

##### 4.1 删除默认区

```sh
radosgw-admin zone delete --rgw-zone=default
```

##### 4.2 删除默认池

```sh
ceph osd pool rm default.rgw.control default.rgw.control --yes-i-really-really-mean-it
ceph osd pool rm default.rgw.data.root default.rgw.data.root --yes-i-really-really-mean-it
ceph osd pool rm default.rgw.gc default.rgw.gc --yes-i-really-really-mean-it
ceph osd pool rm default.rgw.log default.rgw.log --yes-i-really-really-mean-it
ceph osd pool rm default.rgw.users.uid default.rgw.users.uid --yes-i-really-really-mean-it
```

#### 5. 修改 ceph 配置

```sh
ceph config set client.rgw.SERVICE_NAME rgw_realm REALM_NAME
ceph config set client.rgw.SERVICE_NAME rgw_zonegroup ZONE_GROUP_NAME
ceph config set client.rgw.SERVICE_NAME rgw_zone SECONDARY_ZONE_NAME
```

##### 5.1 示例

```sh
ceph config set client.rgw.rgwsvcid.mons-1.jwgwwp rgw_realm test_realm
ceph config set client.rgw.rgwsvcid.mons-1.jwgwwp rgw_zonegroup us
ceph config set client.rgw.rgwsvcid.mons-1.jwgwwp rgw_zone us-east-2
```

#### 6. 提交更改

```sh
radosgw-admin period update --commit
```

#### 7. 启动示例

```sh
systemctl start ceph-FSID@DAEMON_NAME
systemctl enable ceph-FSID@DAEMON_NAME
```

### 三. 故障切换和灾难恢复


### 四. 多区域不复制

### 五. 同一个存储集群中配置多区域

### 六. 多站点同步策略

### 七. 多站点 -  常用命令

#### 1. 检查同步状态

```sh
radosgw-admin sync status
```

#### 2. 查看 zonegroup 和 zone 信息

```sh
radosgw-admin zonegroup get
radosgw-admin zone get
```

#### 3. 增加 placement target 

```sh
radosgw-admin zonegroup placement add \
      --rgw-zonegroup default \
      --placement-id temporary

radosgw-admin zone placement add \
      --rgw-zone default \
      --placement-id temporary \
      --data-pool default.rgw.temporary.data \
      --index-pool default.rgw.temporary.index \
      --data-extra-pool default.rgw.temporary.non-ec
```

#### 4. 添加存储类别

```sh
radosgw-admin zonegroup placement add \
      --rgw-zonegroup default \
      --placement-id default-placement \
      --storage-class GLACIER

radosgw-admin zone placement add \
      --rgw-zone default \
      --placement-id default-placement \
      --storage-class GLACIER \
      --data-pool default.rgw.glacier.data \
      --compression lz4
```

#### 5. 自定义 placement 

```sh
radosgw-admin zonegroup placement default \
      --rgw-zonegroup default \
      --placement-id new-placement
```

#### 6. 使用 placement

```sh
radosgw-admin user modify \
      --uid <user-id> \
      --placement-id <default-placement-id> \
      --storage-class <default-storage-class> \
      --tags <tag1,tag2>
```

#### 7. 客户端使用 placement 和 存储类别

```
需要添加 http 请求头:
S3接口:
<LocationConstraint>default</LocationConstraint>
<LocationConstraint>default:new-placement</LocationConstraint>
S3 接口 存储类别 请求头 - X-Amz-Storage-Class: xxx

SWIFT 接口 placement 请求头 - X-Storage-Policy: new-placement
SWIFT 接口 存储类别 请求头 - X-Object-Storage-Class:  xxx
```

## 多站点同步策略

