# RGW 常用命令

### 1. 用户管理命令

#### 1.1 获取用户信息

```sh
radosgw-admin user info --uid=myuser001
```

#### 1.2 创建用户

```sh
radosgw-admin user create --uid={username} --display-name="{display-name}" [--email={email}]

# 示例
radosgw-admin user create --uid=myuser001 --display-name="我的第一个用户" --email=myuser001@example.com

# 示例(创建用户时指定 access 和 secret)
radosgw-admin user create --uid='my-test-user' --display-name="my test user" --access-key="2QBGE1G3MNJZCO33S0QN" --secret-key="MdVFiEb7yiqmfEz2BC2z541aR7OiDJitOvf0l1KN"
```


#### 1.3 创建子用户

```sh
radosgw-admin subuser create --uid={uid} --subuser={uid} --access=[ read | write | readwrite | full ]

# 示例
radosgw-admin subuser create --uid=myuser001 --subuser=myuser001:swift001 --access=full
```

#### 1.4 修改用户

```sh
# 修改 display-name
radosgw-admin user modify --uid=myuser001 --display-name="John E. Doe"
```

#### 1.5 修改子用户

```sh
radosgw-admin subuser modify --uid=myuser001 --subuser=myuser001:swift001 --access=full
```

#### 1.6 暂停用户

> 禁用用户也会禁用所有子用户

```sh
radosgw-admin user suspend --uid=myuser001
```

#### 1.7 启用用户

```sh
radosgw-admin user enable --uid=myuser001
```

#### 1.8 删除用户

```sh
radosgw-admin user rm --uid=myuser001

# --purge-data  # 清除所有数据
# --purge-keys  # 清除所有密钥
```

#### 删除子用户

```sh
radosgw-admin subuser rm --subuser=johndoe:swift

# --purge-keys  # 清除所有密钥
```

#### 1.9 给用户添加 S3 访问密钥对

> 一个用户可以有多个 S3 访问密钥对

```sh
radosgw-admin key create --uid='my-test-user' --key-type=s3 --access-key '2QBGE1G3MNJZCO33S0QM' --secret-key MdVFiEb7yiqmfEz2BC2z541aR7OiDJitOvf0l1KM
```

#### 1.10 给用户添加 swift 密钥

> 一个子用户只能有一个swift 密钥

```sh
radosgw-admin key create --subuser=foo:bar --key-type=swift --secret-key barSecret
```

#### 1.11 将子用户与 S3 密钥对关联

```sh
radosgw-admin key create --subuser=foo:bar --key-type=s3 --access-key barAccessKey --secret-key barSecretKey
```

#### 1.12 删除一个 S3 密钥对

```sh
radosgw-admin key rm --uid=foo --key-type=s3 --access-key=fooAccessKey
```

#### 1.13 删除一个 swift 密钥

```sh
radosgw-admin key rm --subuser=foo:bar --key-type=swift
```

#### 1.14 向用户添加管理权限

```sh
radosgw-admin caps add --uid={uid} --caps={caps}

# --caps="[users|buckets|metadata|usage|zone|amz-cache|info|bilog|mdlog|datalog|user-policy|oidc-provider|roles|ratelimit]=[\*|read|write|read, write]"

# 示例
radosgw-admin caps add --uid=johndoe --caps="users=*;buckets=*"
```

#### 1.15 删除管理权限

```sh
radosgw-admin caps rm --uid=johndoe --caps={caps}
```

### 2. 配额管理

```sh
--bucket      指定最大 bucket 数量
--max-objects 指定最大对象数
--max-size    指定最大使用空间 B/K/M/G/T

--quota-scope 设置配额的范围: 
				bucket: 给指定的 bucket 限制配额
				user:   给用户下所有bucket限制总配额
```

#### 2.1 查看配额

```sh
radosgw-admin user info --uid=<uid>
```

#### 2.2 设置用户最大 bucket 数量

```sh
radosgw-admin user modify --uid user001 --max-buckets=8000
```

#### 2.3 设置配额参数

```sh
# 设置用户配额
radosgw-admin quota set --quota-scope=user --uid=<uid> [--max-objects=<num objects>] [--max-size=<max size>]

# 设置桶配额
radosgw-admin quota set --uid=<uid> --quota-scope=bucket [--max-objects=<num objects>] [--max-size=<max size]

# 示例
radosgw-admin quota set --quota-scope=user --uid=johndoe --max-objects=1024 --max-size=1024B
```

#### 2.4 启用禁用配额

```sh
# 启用 user 配额
radosgw-admin quota enable --quota-scope=user --uid=<uid>

# 禁用 user 配额
radosgw-admin quota disable --quota-scope=user --uid=<uid>

# 启用 bucket 配额
radosgw-admin quota enable --quota-scope=bucket --uid=<uid>

# 禁用 bucket 配额
radosgw-admin quota disable --quota-scope=bucket --uid=<uid>
```

#### 2.7 查看用户使用量

```sh
radosgw-admin user stats --uid=<uid> [--sync-stats]

# --sync-stats 会强制更新配额统计信息, 以获取最新的使用情况
```

#### 2.8 参数设置默认配额

> 设置默认配额参数只对新用户有效, 对现有用户没影响

```sh
rgw_bucket_default_quota_max_objects
rgw_bucket_default_quota_max_size
rgw_user_default_quota_max_objects
rgw_user_default_quota_max_size
```

#### 2.9 配额缓存

```sh
rgw_bucket_quota_ttl
rgw_user_quota_bucket_sync_interval
rgw_user_quota_sync_interval
```

增加这些值将使配额操作更加高效, 但代价是增加多个 RGW 实例可能不一致具有最新配额设置的可能性。 减小这些值会使多个 RGW 实例更接近完美的配额同步。

如果所有三个值都设置为 0 ，则配额缓存将被有效禁用，并且多个实例将具有完美的配额执行。 

#### 2.10 查看全局配额

```sh
radosgw-admin global quota get
```

#### 2.11 设置全局配额

```sh
radosgw-admin global quota set --quota-scope bucket --max-objects 1024
radosgw-admin global quota enable --quota-scope bucket
radosgw-admin global quota disable --quota-scope bucket

# 对多站点多区域的 rgw 集群, 需要执行以下命令刷新配置 (只有 global 模式下的配置需要)
period update --commit
```

### 3. 速率限制管理

```sh
每分钟最大 read ops
每分钟最大 write ops
每个 user 每分钟 read 字节数
每个 user 每分钟 write 字节数
每个 bucket 每分钟 read 字节数
每个 bucket 每分钟 write 字节数

# 读请求: GET, HEAD
# 写请求: 除 GET, HEAD 之外的所有其他请求
```


> [!NOTE] Title
> 速率设置是针对单个 rgw 实例生效的, 如果有多个 rgw 实例, 可以根据实际情况除以 rgw 实例数量

```sh
--bucket 限制存储桶速率
--uid 限制用户速率
--max-read-ops 每个 RGW 实例每分钟读取的操作数。 0 值禁用限制。
--max-read-bytes 每个 RGW 实例每分钟的读取字节数。 0 值禁用限制。
--max-write-ops 每个 RGW 实例每分钟的最大写入操作数。 0 值禁用限制
--max-write-bytes 每个 RGW 实例每分钟的最大写入字节数。 0 值禁用限制。

--ratelimit-scope 选项设置速率限制的范围
					anonymous: 匿名选项适用于未经身份验证的用户。仅适用于全局速率限制。
					user:
					bucket:
```

#### 3.1 查看速率限制


```sh
# 查看全局 速率限制
radosgw-admin global ratelimit get

# 查看 user: myuser001 的速率限制
radosgw-admin ratelimit get --ratelimit-scope=user --uid=myuser001

# 查看 bucket: mybucket001 的速率限制
radosgw-admin ratelimit get --ratelimit-scope=bucket --bucket=mybucket001
```

#### 3.2 启用禁用速率

```sh
# 启用 user 速率
radosgw-admin ratelimit enable --ratelimit-scope=user --uid=myuser001

# 禁用 user 速率
radosgw-admin ratelimit disable --ratelimit-scope=user --uid=myuser001

# 启用 bucket 速率
radosgw-admin ratelimit enable --ratelimit-scope=bucket --bucket=mybucket001

# 禁用 bucket 速率
radosgw-admin ratelimit disable --ratelimit-scope=bucket --bucket=mybucket001

```sh

#### 3.2 限制 user 速率

```sh
radosgw-admin ratelimit set --ratelimit-scope=user --uid=<uid> <[--max-read-ops=<num ops>] [--max-read-bytes=<num bytes>] [--max-write-ops=<num ops>] [--max-write-bytes=<num bytes>]>

# 示例
radosgw-admin ratelimit set --ratelimit-scope=user --uid=johndoe --max-read-ops=1024 --max-write-bytes=10240
```

#### 3.3 限制 bucket 速率

```sh
radosgw-admin ratelimit set --ratelimit-scope=bucket --bucket=<bucket> <[--max-read-ops=<num ops>] [--max-read-bytes=<num bytes>] [--max-write-ops=<num ops>] [--max-write-bytes=<num bytes>]>

# 示例
radosgw-admin ratelimit set --ratelimit-scope=bucket --bucket=mybucket --max-read-ops=1024 --max-write-bytes=10240
```

#### 3.4 全局速率

```sh
# 全局 bucket 速率限制
radosgw-admin global ratelimit set --ratelimit-scope bucket --max-read-ops=1024
radosgw-admin global ratelimit enable --ratelimit-scope bucket

# 全局 user 速率限制
radosgw-admin global ratelimit set --ratelimit-scope user --max-read-ops=1024
radosgw-admin global ratelimit enable --ratelimit-scope user

# 全局 anonymous 速率限制
radosgw-admin global ratelimit set --ratelimit-scope=anonymous --max-read-ops=1024
radosgw-admin global ratelimit enable --ratelimit-scope=anonymous

# 最后如果是多站点模式, 需要执行以下命令刷新配置(只有 global 模式下的配置需要)
period update --commit
```

### 4. 用户使用情况

```sh
# 开启用户使用情况统计参数(需重启 rgw 实例)
[client.rgw.xxx]
rgw_enable_usage_log = true
```

#### 4.1 使用方式

```sh
radosgw-admin usage xxx --start-date=

# 命令有:
radosgw-admin usage show
radosgw-admin usage trim

# 参数有:
--start-date
--end-date
--show-log-entries
```

#### 4.2 查看统计信息

```sh
radosgw-admin usage show --uid=myuser01 --start-date=2024-03-01 --end-date=2024-04-07

# 显示所有用户(去掉 -uid 参数)
radosgw-admin usage show --show-log-entries=false
```

#### 4.3 消减统计信息

> 开启 rgw 统计信息会占用存储空间

```sh
# 删除 2010 年的统计日志
radosgw-admin usage trim --start-date=2010-01-01 --end-date=2010-12-31

# 删除 myuser01 用户的所有统计日志
radosgw-admin usage trim --uid=myuser01

# 删除 myuser01 用户 2013 年之前的所有统计日志
radosgw-admin usage trim --uid=myuser01 --end-date=2013-12-31
```

## 其他命令

#### 1. 查看 rbd 文件 IO状态

```sh
rbd perf image iostat myrbd/lsrbd1.img

rbd perf image iotop
```

## 管理接口

#### 1. 获取 info 信息

```sh
GET /{admin}/info?format=json HTTP/1.1
Host: {fqdn}
```

#### 2. 获取 usage 信息

```sh
GET /{admin}/usage?format=json HTTP/1.1
Host: {fqdn}
```

### 其他

#### 1. 查看 bucket 生命周期, bucket 过期时间

```sh
# N 版
radosgw-admin lc get --bucket=mybucket001

# Q 版
radosgw-admin bucket lifecyclerule get --bucket=mybucket001
```

```sh
#列出集群下所有对象存储用户
radosgw-admin user list
 
#查询指定用户信息 access_key secret_key 用户限制 bucket限制等等
radosgw-admin user info --uid={user_idname}
 
#查询指定用户下的所有bucket
radosgw-admin bucket list --uid={user_idname}
 
#列出集群下所有bucket
radosgw-admin bucket list
 
#查询某bucket的元数据信息
radosgw-admin metadata get bucket:{bucketname}
 
#列出原始存储桶索引条目
radosgw-admin buckets bi list --bucket {bucketname}
 
#显示存储桶分片统计信息
radosgw-admin bucket limit check
 
#修剪rgw的usage log 修剪rgw的usage log，这是因为在长时间使用下，以往的usage log会占用ceph存储空间。在确定不需要的时间段后，通过该命令删除这部分记录。瀚海云ceph_exporter获取也需要每30天修剪一次否则无法拉出数据
radosgw-admin usage trim --uid=xxx
 
#列出bucket生命周期，低版本不可用
 radosgw-admin  lc get --bucket={bucketname}
 
#设置指定用户下的bucket对象数
radosgw-admin quota set --uid=xxx --quota-scope=bucket --bucket=xxx --max-objects=200010000
```

```sh

#创建用户
radosgw-admin user create --uid=admin --display-name=admin
 
#授予用户admin权限
radosgw-admin user modify --uid=admin --admin
  
#创建用户并指定相应的access_key、secret_key、最大允许该用户创建bucket的数
radosgw-admin user create --uid=xxx --display-name=xxx --access_key=xxx --secret=xxx --max_buckets=10
 
#设置用户允许使用的空间量 字节
radosgw-admin quota set --quota-scope=user --uid=xxx --max-size=10995116277760
 
#删除用户以及用户下的数据---谨慎操作会丢数据,最好不要这么干
radosgw-admin user rm --uid=xxx  --purge-data
 
#给用户创建一个key
radosgw-admin key create --uid=xxx --key-type=s3 --access-key xxx --secret-key xxx
 
#给用户删除一个key
radosgw-admin key rm --uid=xxx --key-type=s3 --access-key=xxx
 
#修改用户的key
radosgw-admin user modify --uid=xxx --access_key=xxx --secret=xxx
 
#可以查看指定user在某一时间段的统计信息
radosgw-admin usage show --uid=xxx
用法：radosgw-admin usage show [--uid={uid}] [--start-date={date}] [--end-date={date}] [--categories=<list>] [--show-log-entries=<flag>] [--show-log-sum=<flag>]
```
## LDAP 认证


## bucket 策略

## bucket 分片

## bucket 通知

## Role 角色管理

## 孤儿文档