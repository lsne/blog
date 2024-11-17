# Ceph 块设备

#### rbd 相关命令格式

```sh
rbd [commands] {pool-name}/{image-name}
rbd [commands] {pool-name}/{image-name}@{snap-name}
```

## 基础命令

#### 1. 创建有块设备访问权限的用户

```sh
# 命令语法格式
ceph auth get-or-create client.{ID} mon 'profile rbd' osd 'profile {profile name} [pool={pool-name}][, profile ...]' mgr 'profile rbd [pool={pool-name}]'

# 示例
ceph auth get-or-create client.qemu mon 'profile rbd' osd 'profile rbd pool=vms, profile rbd-read-only pool=images' mgr 'profile rbd pool=images'
```

#### 2. 创建个池子

```sh
ceph osd pool create myrbd 16 16 sata_rule1
```

### 一. 基本操作

#### 1. 使用密钥文件

```sh
rbd --id admin --keyring /etc/ceph/ceph.keyring [commands]
rbd --name client.admin --keyring /etc/ceph/ceph.keyring [commands]
```

#### 2. 创建 rbd 文件

> 指定的 size 大小, 在使用到之前不使用物理存储

```sh
rbd create --size 2G myrbd/lsrbd1.img

# 不指定池, 则使用默认的: rbd 池
rbd create --size 2G lsrbd1.img
# 等效于
rbd create --size 2G rbd/lsrbd1.img
```

#### 3. 查看池中的块设备文件

```sh
rbd ls myrbd
```

#### 5. 查看块设备文件信息

```sh
rbd info myrbd/lsrbd1.img
```
#### 6. 增加大小

```sh
rbd resize --size 2048 myrbd/lsrbd1.img
```

#### 7. 减小大小

```sh
rbd resize --size 2048 myrbd/lsrbd1.img --allow-shrink
```
#### 8. 删除块设备文件

```sh
rbd rm myrbd/lsrbd2.img
```

### 二.  RBD 回收站

#### 1. 查看延迟删除块设备文件

```sh
rbd trash ls myrbd
```

#### 2. 推迟删除块设备(删除后放入回收站)

```sh
rbd trash mv myrbd/lsrbd1.img
```

#### 3. 将 RBD 文件移动到回收站, 并设置过期时间

```sh
rbd trash mv myrbd/lsrbd2.img --expires-at 20231017
rbd trash mv myrbd/testcrush.img --expires-at 20231017
```

#### 4. 从回收站恢复

```sh
rbd trash restore myrbd/171575621e04
```

#### 5. 恢复时重命名

```sh
rbd trash restore myrbd/171575621e04 --image lsrbd1_new.img
```

#### 三. 快照


> [!NOTE] 快照前停止IO操作
> 快照过程中如果有IO操作, 可能需要 经过 fsck 才能再次挂载  
> 要停止IO, 可以使用冻结文件命令: fsfreeze  
> 虚拟机: qemu-guest-agent 创建快照时自动冻结文件系统

###### 低版本快照特性的指定

> 低版本 Ceph 集群可能需要在创建 rbd 文件时, 指定支持快照的参数: `--image-feature layering` 才能使用快照功能

```sh
rbd create lstest/lsrbd3.img --image-feature layering --size 10G
```

#### 1. 查看 rbd 文件现有快照列表

```sh
rbd snap ls myrbd/lsrbd1.img
```

#### 2. 创建快照

> 回滚之前需要先 umount 盘, 否则看不到回滚后的内容

```sh
rbd snap create {pool-name}/{image-name}@{snap-name}

# 示例
rbd snap create myrbd/lsrbd1.img@snap_20240328
```

#### 3. 回滚到指定快照

```sh
rbd snap rollback {pool-name}/{image-name}@{snap-name}

# 示例
rbd snap rollback myrbd/lsrbd1.img@snap_20240328
```

#### 4. 删除快照

```sh
rbd snap rm {pool-name}/{image-name}@{snap-name}

# 示例
rbd snap rm myrbd/lsrbd1.img@snap_20240328
```

#### 5. 删除指定rbd文件的所有快照

```sh
rbd snap purge {pool-name}/{image-name}

# 示例
rbd snap purge myrbd/lsrbd1.img
```

#### 6. 克隆

> Ceph 只支持对 `格式2` 类型的 RBD 文件进行克隆, 如果创建 RBD 文件时指定了 `--image-format 1` 则不支持克隆操作

#### 7. 保护快照

> 被保护的快照无法删除
> > 对重要数据, 如操作系统镜像文件, 需要做快照, 并保护起来, 阻止快照被删除

```sh
rbd snap protect {pool-name}/{image-name}@{snapshot-name}

# 示例
rbd snap protect myrbd/lsrbd1.img@snap_20240328
```

#### 8. 取消保护

> 取消快照保护需要没有基于快照的克隆文件. 否则: rbd: unprotecting snap failed: (16) Device or resource busy

```sh
rbd snap unprotect myrbd/lsrbd1.img@snap_20240328
```

#### 9. 克隆快照

> 必须先 `protect` 保护快照, 才能进行克隆
> 克隆操作可以将快照克隆到其他 pool 里

```sh
rbd clone {pool-name}/{parent-image-name}@{snap-name} {pool-name}/{child-image-name}

# 示例 - 克隆到本池
rbd clone myrbd/lsrbd3.img@lsrbd3_template myrbd/lsrbd_c1.img

# 示例 - 跨池克隆
rbd clone myrbd/lsrbd3.img@lsrbd3_template pool001/lsrbd_c1.img
```

#### 10. 查看克隆文件详情

```sh
rbd info myrbd/lsrbd_c1.img
```

#### 11. 查看快照都克隆出去了哪些文件

```sh
rbd children myrbd/lsrbd1.img@snap_20240328
```

#### 12. 分离克隆文件

> 解除 `克隆文件` 与 `原快照` 之间的依赖关系

```sh
rbd flatten {pool-name}/{image-name}

# 示例
rbd flatten pool001/lsrbd_c1.img
```

## RBD 独占锁(排它锁)

```sh
1. 防止多个进程以不协调的方式访问同一 Rados 块设备
2. 独占锁在虚拟化（它们防止虚拟机破坏彼此的写入）和 RBD 镜像（它们是基于日志的镜像中记录日志和基于快照的镜像中快速生成增量差异的先决条件）中大量使用
```

#### 1. 创建独享锁的 rbd 文件

```sh
方式一: 使用 rbd_default_features 配置选项
方式二: rbd create --image-feature --image-shared
```

#### 2. 禁用客户端之间的自动锁定转换

```sh
# 在获取排他锁时指定 RBD_LOCK_MODE_EXCLUSIVE 标志
rbd --exclusive
```

#### 3. 黑名单

```sh
处理突然终止的线程连接, 防止这样的线程拿到锁一直不释放
为了使阻止列表发挥作用，客户端必须具有 osd 阻止列表功能。 此功能包含在配置文件 rbd 功能配置文件中。通常应在使用 RBD 的所有 Ceph 客户端身份上进行设置

osd blocklist

```sh


> [!Warning] Warning
> 以下几部分都未整理完成

## MIRRORING (异步跨集群同步 rbd 文件)




> RBD 文件可以在两个 Ceph 集群之间异步 mirroring 传输数据
> 需要有两个集群的访问权限(两个集群都要创建用户)

### 一. 基于日志(J版本)

```sh
使用 RBD 日志映像功能来确保集群之间的时间点、崩溃一致的复制
rbd 文件的每次写入都会先写日志, 远程集群会读取日志并在本地重放写入操作
由于对 RBD 映像的每次写入都会导致对 Ceph 集群的两次写入，因此在使用 RBD 日志映像功能时，预计写入延迟会几乎加倍。
```

### 二. 基于快照(Q版本)

```sh
定期计划或手动创建的 RBD 映像镜像快照来在集群之间复制崩溃一致的 RBD 映像
远程集群将确定两个镜像快照之间的任何数据或元数据更新，并将增量复制到镜像的本地副本。
借助 RBD 快速差异图像功能，可以快速确定更新的数据块，而无需扫描完整的 RBD 图像。 
由于此模式不像日志那样细粒度，因此在故障转移场景期间使用之前需要同步两个快照之间的完整增量。 
任何部分应用的增量集都将在故障转移时回滚。
```

### MIRRORING 可以配置为单向和双向复制


```sh
单向复制：当数据仅从主集群镜像到辅助集群时，rbd-mirror 守护进程仅在辅助集群上运行。
双向复制：当数据从一个集群上的主映像镜像到另一个集群上的非主映像（反之亦然）时，rbd-mirror 守护进程会在两个集群上运行。
```

#### 1. 启用 pool 复制

```sh
rbd mirror pool enable [--site-name {local-site-name}] {pool-name} {mode}

# mode 有 pool 和 image 两种

# 示例(启用 pool 镜像)
rbd --cluster site-a mirror pool enable --site-name site-a image-pool image
rbd --cluster site-b mirror pool enable --site-name site-b image-pool image
```

#### 2. 关闭 pool 复制

```sh
rbd mirror pool disable {pool-name}

# 示例
rbd --cluster site-a mirror pool disable image-pool
rbd --cluster site-b mirror pool disable image-pool
```

#### 3. 启用 image 复制

```sh
rbd mirror image enable {pool-name}/{image-name} {mode}

# mode 有 journal 和 snapshot 两种

# 示例
$ rbd --cluster site-a mirror image enable image-pool/image-1 snapshot
$ rbd --cluster site-a mirror image enable image-pool/image-2 journal
```

#### 4. 启用 rbd 文件的日志功能

> 需要先启用 排他锁

```sh
rbd feature enable {pool-name}/{image-name} {feature-name}

# 示例
$ rbd --cluster site-a feature enable image-pool/image-1 journaling
```
#### 5. 关闭 image 复制

```sh
rbd mirror image disable {pool-name}/{image-name}

# 示例
rbd --cluster site-a mirror image disable image-pool/image-1
```


#### 6. BOOTSTRAP PEERS

```sh
为了让 rbd-mirror 守护进程发现其对等集群，必须注册对等点并创建用户帐户。 
可以使用: 
rbd mirror pool peer bootstrap create
rbd mirror pool peer bootstrap import
```

##### 6.1 创建一个令牌

```sh
rbd mirror pool peer bootstrap create [--site-name {local-site-name}] {pool-name}

# 示例(输出一个令牌)
rbd --cluster site-a mirror pool peer bootstrap create --site-name site-a image-pool

# 示例输出:
eyJmc2lkIjoiOWY1MjgyZGItYjg5OS00NTk2LTgwOTgtMzIwYzFmYzM5NmYzIiwiY2xpZW50X2lkIjoicmJkLW1pcnJvci1wZWVyIiwia2V5IjoiQVFBUnczOWQwdkhvQmhBQVlMM1I4RmR5dHNJQU50bkFTZ0lOTVE9PSIsIm1vbl9ob3N0IjoiW3YyOjE5Mi4xNjguMS4zOjY4MjAsdjE6MTkyLjE2OC4xLjM6NjgyMV0ifQ==
```

##### 6.2 导入另外一个集群的令牌

```sh
rbd mirror pool peer bootstrap import [--site-name {local-site-name}] [--direction {rx-only or rx-tx}] {pool-name} {token-path}

# 示例:
$ cat <<EOF > token
eyJmc2lkIjoiOWY1MjgyZGItYjg5OS00NTk2LTgwOTgtMzIwYzFmYzM5NmYzIiwiY2xpZW50X2lkIjoicmJkLW1pcnJvci1wZWVyIiwia2V5IjoiQVFBUnczOWQwdkhvQmhBQVlMM1I4RmR5dHNJQU50bkFTZ0lOTVE9PSIsIm1vbl9ob3N0IjoiW3YyOjE5Mi4xNjguMS4zOjY4MjAsdjE6MTkyLjE2OC4xLjM6NjgyMV0ifQ==
EOF
$ rbd --cluster site-b mirror pool peer bootstrap import --site-name site-b image-pool token
```

##### 6.3 或者手动创建用户

> 略

#### 7. image 文件的提升和降级

> 略

## image 实时迁移

> RBD镜像文件可以在同一集群内的不同池之间实时迁移

## rbd 持久只读缓存

## RBD 持久写入日志缓存

## rbd 镜像文件加密

> krbd 内核模块目前不支持加密

```sh

```sh