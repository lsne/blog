# CephFS

## 环境准备

#### 1. 需要两个 pool

##### 1.1 元数据池

```sh
不允许使用纠删码池作为 CephFS 元数据池, 因为元数据是使用 RADOS OMAP 数据结构存储的，而 EC 池无法存储该数据结构。
建议 PG 数量 64 或 128 , 因为元数据池子最多几G的数据。没必要设置太大
建议至少3副本, 4副本也没问题。 因为元数据占用空间很少
建议使用 NVMe 设备, 至少也要 SSD 设备
```

##### 1.2 数据池

```sh
# 如果数据池使用纠删码模式, 需要满足两点:
1. 存储类型为: BlueStore
2. 开启参数: ceph osd pool set my_ec_pool allow_ec_overwrites true
```

## 管理命令

#### 1. 查看 mds 状态

```sh
ceph mds stat
```

####  2. 启用多文件系统

> 这是目前唯一的一个全局设置参数, 并且最新的 ceph 集群默认开启

```sh
ceph fs flag set enable_multiple true
```

#### 3. 查看是否启用了多文件系统


```sh
ceph fs dump | grep enable_multiple

# 输出:
enable_multiple, ever_enabled_multiple: 1,1

# 第一个1: 表示开启状态
# 第二个1: 表示曾经开启过
```

#### 4. 将 mds 分配给指定的文件系统

```sh
# 创建 myfs 文件系统后, 可以使用以下命令将 mds.b 这个 mds 进程分配给 myfs 文件系统
ceph config set mds.b mds_join_fs myfs
```

#### 5. 创建文件系统

```sh
$ ceph fs new <fs_name> <metadata> <data> [--force] [--allow-dangerous-metadata-overlay] [<fscid:int>] [--recover]

# --force 
# 为默认数据池设置纠删码池。 不鼓励使用 EC 池作为默认数据池
# 为元数据池设置非空池（池中已包含一些对象）
# 使用特定文件系统 ID (fscid) 创建文件系统。 --force 选项需要与 --fscid 选项一起使用。

# --allow-dangerous-metadata-overlay
# 允许重用已在使用的元数据和数据池。 仅应在紧急情况下并在仔细阅读文档后执行此操作。

# --fscid
# 创建具有特定 fscid 的文件系统。 当应用程序希望文件系统的 ID 在恢复后保持稳定时（例如，在监视器数据库丢失并重建后），可以使用此方法。 因此，文件系统 ID 并不总是随着新的文件系统而不断增加。

# --recover
# 选项将文件系统等级 0 的状态设置为现有但失败。 因此，当 MDS 守护进程最终获得排名 0 时，该守护进程会读取现有的 RADOS 元数据，并且不会覆盖它。 该标志还阻止备用 MDS 守护程序加入文件系统。
```

#### 6. 设置默认挂在的文件系统

```sh
# 只有当创建了多个文件系统时, 可以使用此命令指定默认文件系统
ceph fs set-default
```

#### 7. 向指定的文件系统添加数据池

```sh
ceph fs add_data_pool <file system name> <pool name/id>
```

#### 8. 从指定的文件系统删除数据池

> 池中的任何数据将丢失
> 默认数据池不可删除

```sh
ceph fs rm_data_pool <file system name> <pool name/id>
```

#### 9. 修改文件系统名

> 授权指定文件系统的用户会受到影响

```sh
ceph fs rename <file system name> <new file system name> [--yes-i-really-mean-it]
```

#### 10. 查看当前存在的文件系统以及数据池

```sh
ceph fs ls
```

#### 11. 查看文件系统设置的所有标志

```sh
ceph fs lsflags <file system name>
```

#### 12. 转储指定版本(默认当前)的FSMap

> 包括所有文件系统设置、MDS 守护进程及其持有的等级，以及备用 MDS 守护进程的列表

```sh
ceph fs dump [epoch]
```

#### 13. 删除文件系统

> 从 FSMap 中擦除有关文件系统状态的信息。 元数据池和数据池不受影响，必须单独销毁。

```sh
ceph fs rm <file system name> [--yes-i-really-mean-it]
```

#### 14. 查看指定文件系统信息

> 

```sh
ceph fs get <file system name>
```

#### 15. 设置文件系统参数

```sh
ceph fs set <file system name> <var> <val>

# 示例: 限制文件大小, 默认1T, 0 表示只能创建空文档
# 如果文件太大, 当 MDS 在统计或删除等操作期间尝试枚举对象时，有可能会导致 MDS 负载。
ceph fs set myfs max_file_size 1099511627776
```

#### 16. 关闭集群

> MDS 守护程序的关闭方式是将日志刷新到元数据池并停止所有客户端 I/O。

```sh
ceph fs set <fs_name> down true
```

#### 17. 开启集群

> 这也将恢复 max_mds 之前的值

```sh
ceph fs set <fs_name> down false
```


#### 18. 快速删除和关闭文件系统

> 设置文件系统标志, 防止 standbys  在文件系统上激活(joinable)

```sh
ceph fs fail <fs_name>

# 或手动设置

# 1. 可连接标志为 false
ceph fs set <fs_name> joinable false

# 2. 设置所有级别 fail
ceph mds fail <fs_name>:<n>

# 3. 如果要恢复
ceph fs set <fs_name> joinable true
```

## 操作 MDS 的命令

> 大多数操作 MDS 的命令都可以采用`<role>`参数
#### 1.  `<role>` 的三种形式, 可任意采用其中一种

```sh
<fs_name>:<rank>
<fs_id>:<rank>
<rank>
```

#### 2. 强制故障转移

> 如果 mds 进程在运行，则会重新启动

```sh
ceph mds fail <gid/name/role>
```

#### 3. 查看命令帮助

```sh
ceph tell mds.* help
```

#### 4. 向 mds 守护进程发送命令

> `ceph tell mds.*` 向所有 mds 守护进程发送命令

```sh
ceph tell mds.<daemon name> command ...
```


#### 5. 获取 MDS 元数据

```sh
ceph mds metadata <gid/name/role>
```

##### 6. 将文件系统等级标记为已修复

> 命令不会更改 MDS, 标记为损坏的文件系统 rank

```sh
ceph mds repaired <role>
```

#### 7. 设置客户端必须支持的特性

```sh
ceph fs required_client_features <fs name> add reply_encoding
ceph fs required_client_features <fs name> rm reply_encoding
```

#### 8. 列出特性

```sh
ceph fs feature ls
```

#### 9. 从失败的 mds 集群中删除一个 mds rank

```sh
ceph mds rmfailed
```

#### 10. 将文件系统状态重置为默认值

```sh
ceph fs reset <file system name>
```

#### 11. 配置待机重放

> 跟随 active MDS 的元数据日志，以便在 active MDS 不可用时减少故障转移时间
> 每个 active MDS 只能有一个待机重放节点

```sh
# 这里指定的是文件系统名, 不是 mds 进程名
ceph fs set myfs allow_standby_replay true
```

#### 12. 禁止本文件系统的备用MDS给其他文件系统使用

> 如果 active MDS 故障, 优先使用本文件系统的备份用MDS， 其次使用未指定 `mds_join_fs` 的备用MDS, 最后会使用其他文件系统的备用MDS
> 如果不想叫本文件系统的备用MDS给其他文件系统使用, 则可以设置以下参数

```sh
ceph fs set <fs name> refuse_standby_for_another_fs true
```

## 缓存配置


| 参数                                    | 默认值    | 说明                                                      |
| ------------------------------------- | ------ | ------------------------------------------------------- |
| mds_cache_memory_limit                | 4Gi    | 缓存最大内存使用量                                               |
| mds_cache_reservation                 | 0.05   | 缓存维护的缓存预留.默认: 5%                                        |
| mds_health_cache_threshold            | 1.5    | 缓存超出多少警告.默认: 150%                                       |
| mds_cache_trim_threshold              | 256Ki  | 从缓存中删除元数据信息: 可修剪的 dentry 数量阈值. 防止缓存修剪导致影响业务             |
| mds_cache_trim_decay_rate             | 1.0    | 从缓存中删除元数据信息: 调整 MDS 缓存节流的衰减率. 防止缓存修剪导致影响业务。 值越大, 删除速度越慢 |
| 客户端召回:                                |        |                                                         |
| mds_recall_max_caps                   | 30000B | 在给定召回事件中从单个客户端召回的最大功能数                                  |
| mds_recall_max_decay_threshold        | 128Ki  | 会话中调用的上限限制的衰减阈值                                         |
| mds_recall_max_decay_rate             | 1.5    | 会话中召回上限的节流衰减率                                           |
| mds_recall_global_max_decay_threshold | 128Ki  | 全局召回上限的衰减阈值                                             |

## FS Volumes 卷

#### 1. 创建卷

> 以卷名 `myvolume`为例
> 将自动创建一个元数据池: `cephfs.myvolume.meta 32 32 replicated_rule`
> 将自动创建一个    数据池: `cephfs.myvolume.data 32 32 replicated_rule`
> 将自动创建一个文件系统: `myvolume`
> 如果是 cephadm 部署, 将自动创建 mds,  如果是手动部署, 需要提前准备好可用的 mds 实例


```sh
ceph fs volume create <vol_name> [placement]

# placement 指定 MDS
```

#### 2. 删除卷

> 删除卷, 同时会尝使用启用的 ceph-mgr Orchestrator 模块删除 MDS 守护程序
> 删除卷后，如果在同一集群上创建新文件系统并且正在使用子卷接口，建议重新启动 ceph-mgr

```sh
ceph fs volume rm <vol_name> [--yes-i-really-mean-it]
```

#### 3. 查看所有卷

```sh
ceph fs volume ls
```

#### 4. 重命名

> 重命名逻辑卷动作太重了:
> 1. 重命名 MDS 服务(如果使用了cephadm)
> 2. 重命名文件系统
> 3. 将文件系统的数据和元数据池上的应用程序标记更改为 <new_vol_name>
> 4. 重命名文件系统的元数据和数据池。


> [!WARNING] 用户权限修改
> 为 <vol_name> 授权的 CephX ID 必须为 <new_vol_name> 重新授权。 使用这些 ID 的客户端正在进行的任何操作都可能会中断。 确保卷上禁用镜像。


```sh
ceph fs volume rename <vol_name> <new_vol_name> [--yes-i-really-mean-it]
```


#### 5. 获取 卷 的信息

```sh
ceph fs volume info vol_name [--human_readable]

# --human_readable 以 KB/MB/GB 为单位展示
```


## FS 子卷组

> 新版本 ceph fs 子卷组不在支持快照

#### 1. 创建子卷组

> 即使子卷组已经存在,  该命令也会返回成功

```sh
ceph fs subvolumegroup create <vol_name> <group_name> [--size <size_in_bytes>] [--pool_layout <data_pool_name>] [--uid <uid>] [--gid <gid>] [--mode <octal_mode>]

# <vol_name> 为父卷名称
# <group_name> 为要创建的子卷组的名称
```

#### 2. 删除子卷组

```sh
ceph fs subvolumegroup rm <vol_name> <group_name> [--force]

# --force 不存在则返回删除成功, 否则会报错
```

#### 3. 查看子卷组路径

```sh
ceph fs subvolumegroup getpath <vol_name> <group_name>
```

#### 4. 查看指定卷上的子卷组

```sh
ceph fs subvolumegroup ls <vol_name>
```

#### 5. 查看子卷组元数据

```sh
ceph fs subvolumegroup info <vol_name> <group_name>
```
#### 6. 查看文件系统上是否存在子卷组

> 只检查是否存在自定义组，而不检查是否存在默认组

```sh
ceph fs subvolumegroup exist <vol_name>
```

#### 7. 调整子卷组大小

```sh
ceph fs subvolumegroup resize <vol_name> <group_name> <new_size> [--no_shrink]

# new_size 指定要调整到多大
# --no_shrink 防止缩小到当前使用大小以下
```

#### 8. 删除子卷组快照

> 新版本 ceph fs 子卷不在支持快照

```sh
ceph fs subvolumegroup snapshot rm <vol_name> <group_name> <snap_name> [--force]

# --force 卷组不存在时, 也返回删除成功
```

#### 9. 查看子卷组快照

```sh
ceph fs subvolumegroup snapshot ls <vol_name> <group_name>
```

## FS 子卷

#### 1. 创建子卷

> 默认情况下, 子卷在默认卷组中创建, 即使存在, 也返回创建成功

```sh
$ ceph fs subvolume create <vol_name> <subvol_name> [--size <size_in_bytes>] [--group_name <subvol_group_name>] [--pool_layout <data_pool_name>] [--uid <uid>] [--gid <gid>] [--mode <octal_mode>] [--namespace-isolated]
```

#### 2. 删除子卷

> 该命令删除子卷及其内容。 它分两步完成此操作。 首先，它将子卷移动到垃圾文件夹，然后异步清除其内容

```sh
ceph fs subvolume rm <vol_name> <subvol_name> [--group_name <subvol_group_name>] [--force] [--retain-snapshots]

# --force 不存在则返回删除成功, 否则会报错
# --retain-snapshots 保留子卷快照. 可以使用 ceph fs subvolume create 重新创建保留快照的子卷. 保留的快照可用作克隆源来重新创建子卷，或克隆到较新的子卷。
```

#### 3. 调整子卷大小

```sh
ceph fs subvolume resize <vol_name> <subvol_name> <new_size> [--group_name <subvol_group_name>] [--no_shrink]

# new_size 指定要调整到多大, 通过将 inf 或无限作为“new_size”传递，可以将子卷的大小调整为无限（但稀疏）的逻辑大小。
# --no_shrink 防止缩小到当前使用大小以下
```

#### 4. 授权 cephx auth ID，即对 fs 子卷的读/读写访问权限

```sh
ceph fs subvolume authorize <vol_name> <sub_name> <auth_id> [--group_name=<group_name>] [--access_level=<access_level>]
```

#### 5. 取消授权 cephx auth ID，即对 fs 子卷的读/读写访问权限

```sh
 ceph fs subvolume deauthorize <vol_name> <sub_name> <auth_id> [--group_name=<group_name>]
```


#### 6. 列出有访问指定子卷的身份ID

```sh
ceph fs subvolume authorized_list <vol_name> <sub_name> [--group_name=<group_name>]
```

#### 7. 根据身份ID和 mount 的子卷

```sh
ceph fs subvolume evict <vol_name> <sub_name> <auth_id> [--group_name=<group_name>]
```

#### 8. 获取子卷路径

```sh
ceph fs subvolume getpath <vol_name> <subvol_name> [--group_name <subvol_group_name>]
```

#### 9. 获取子卷信息

```sh
ceph fs subvolume info <vol_name> <subvol_name> [--group_name <subvol_group_name>]
```


#### 10. 列出子卷

> 已经删除, 但保留了快照的子卷也会列出

```sh
 ceph fs subvolume ls <vol_name> [--group_name <subvol_group_name>]
```

#### 11. 检查是否存在子卷

```sh
ceph fs subvolume exist <vol_name> [--group_name <subvol_group_name>]
```


#### 12. 设置子卷自定义元数据键值对

> 如果 key 存在, 则替换为新值
> 快照和克隆都不会保留自定义元数据

```sh
ceph fs subvolume metadata set <vol_name> <subvol_name> <key_name> <value> [--group_name <subvol_group_name>]
```

#### 13. 获取子卷上自定义元数据

```sh
 ceph fs subvolume metadata get <vol_name> <subvol_name> <key_name> [--group_name <subvol_group_name>]
```

#### 14. 查看子卷上所有自定义元数据

```sh
ceph fs subvolume metadata ls <vol_name> <subvol_name> [--group_name <subvol_group_name>]
```

#### 15. 删除子卷上自定义元数据

```sh
ceph fs subvolume metadata rm <vol_name> <subvol_name> <key_name> [--group_name <subvol_group_name>] [--force]

# --force 不存在也返回成功
```

#### 16. 创建子卷快照

```sh
ceph fs subvolume snapshot create <vol_name> <subvol_name> <snap_name> [--group_name <subvol_group_name>]
```

#### 17. 删除子卷快照

> 如果快照保留子卷中的最后一个快照被删除，则该子卷也会被删除

```sh
ceph fs subvolume snapshot rm <vol_name> <subvol_name> <snap_name> [--group_name <subvol_group_name>] [--force]

# --force 快照不存在也返回成功
```

#### 18. 查看子卷的所有快照

```sh
ceph fs subvolume snapshot ls <vol_name> <subvol_name> [--group_name <subvol_group_name>]
```

#### 19. 获取快照信息

```sh
ceph fs subvolume snapshot info <vol_name> <subvol_name> <snap_name> [--group_name <subvol_group_name>]
```

#### 20. 在快照上自定义元数据

```sh
ceph fs subvolume snapshot metadata set <vol_name> <subvol_name> <snap_name> <key_name> <value> [--group_name <subvol_group_name>]
```

#### 21. 获取快照上元数据

```sh
ceph fs subvolume snapshot metadata get <vol_name> <subvol_name> <snap_name> <key_name> [--group_name <subvol_group_name>]
```

#### 22. 查看所有快照上设置的自定义元数据

```sh
ceph fs subvolume snapshot metadata ls <vol_name> <subvol_name> <snap_name> [--group_name <subvol_group_name>]
```

#### 23. 删除快照上的自定义元数据

```sh
ceph fs subvolume snapshot metadata rm <vol_name> <subvol_name> <snap_name> <key_name> [--group_name <subvol_group_name>] [--force]
```

## 克隆快照

#### 1. 不推荐


> [!WARNING] 不推荐命令
> 在克隆之前保护快照是 Nautilus 版本的先决条件，为此目的引入了保护/取消保护快照的命令。 此先决条件以及保护/取消保护的命令已被弃用，并且可能会从未来版本中删除。


```sh
# subvolume info 命令查看是否需要执行此命令

ceph fs subvolume snapshot protect <vol_name> <subvol_name> <snap_name> [--group_name <subvol_group_name>]
ceph fs subvolume snapshot unprotect <vol_name> <subvol_name> <snap_name> [--group_name <subvol_group_name>]
```

#### 2. 启动克隆操作

> 子卷快照克隆命令依赖配置参数 snapshot_clone_no_wait

```sh
ceph fs subvolume snapshot clone <vol_name> <subvol_name> <snap_name> <target_subvol_name>
```

#### 3. 指定快照的源子卷所在组

> 克隆时, 如果快照的源子卷不是在默认组, 则需要指定源组

```sh
ceph fs subvolume snapshot clone <vol_name> <subvol_name> <snap_name> <target_subvol_name> --group_name <subvol_group_name>
```

#### 4. 指定克隆到哪个新组


```sh
ceph fs subvolume snapshot clone <vol_name> <subvol_name> <snap_name> <target_subvol_name> --target_group_name <subvol_group_name>
```

#### 5. 克隆时指定池布局

```sh
ceph fs subvolume snapshot clone <vol_name> <subvol_name> <snap_name> <target_subvol_name> --pool_layout <pool_layout>
```

#### 6. 检查克隆状态

```sh
ceph fs clone status <vol_name> <clone_name> [--group_name <group_name>]
```

#### 7. 配置最大克隆并发数

```sh
ceph config set mgr mgr/volumes/max_concurrent_clones <value>
```

## 固定子卷和子卷组到指定的MDS

#### 1. 固定子卷和子卷组到MDS

```sh
# 固定子卷组
ceph fs subvolumegroup pin <vol_name> <group_name> <pin_type> <pin_setting>

# 固定子卷
ceph fs subvolume pin <vol_name> <group_name> <pin_type> <pin_setting>
```

#### 2. 在子卷组上设置分布式固定策略

> 将为“csi”子卷组启用分布式子树分区策略。 这将导致组内的每个子卷自动固定到文件系统上的可用等级之一。

```sh
ceph fs subvolumegroup pin cephfilesystem-a csi distributed 1
```

## 配额


> [!NOTE] 配额
> CephFS 允许在文件系统中的任何目录上设置配额。 配额可以限制目录层次结构中该点下存储的字节数或文件数。


> [!NOTE] 配额生效前提
> 1. 配额不精确
> 2. 配额生效依赖客户端, 在低 linux 内核中无效. 即使在高内核中,  客户端如果不主动根据配额限制写入, 设置的配额也将无效
> 3. 配额在内核客户端 4.17 及更高版本中实现。 用户空间客户端（libcephfs、ceph-fuse）支持配额。 Linux 内核客户端 >= 4.17 支持 CephFS 配额，但仅限在imit+ 集群上。 内核客户端（甚至是最新版本）将无法处理旧集群上的配额，即使它们可能能够设置配额扩展属性。
> 4. 内核客户端, 需要访问配额的目录 inode 的父级才能强制执行配额
> 	创建这种用户: 

```sh
ceph auth get-or-create client.guest mds 'allow r path=/home/volumes, allow rw path=/home/volumes/group' mgr 'allow rw' osd 'allow rw tag cephfs metadata=*' mon 'allow r'
```

#### 1. 设置配额

```sh
setfattr -n ceph.quota.max_bytes -v 100000000 /some/dir     # 100 MB
setfattr -n ceph.quota.max_files -v 10000 /some/dir         # 10,000 files

# 或
setfattr -n ceph.quota.max_bytes -v 100K /some/dir          # 100 KiB
setfattr -n ceph.quota.max_bytes -v 5Gi /some/dir           # 5 GiB
```

#### 2. 查看配额

```sh
getfattr -n ceph.quota.max_bytes /some/dir
getfattr -n ceph.quota.max_files /some/dir
```


> [!NOTE] 注意
> 对 CephFS 目录运行 getfattr /some/dir -d -m - 将不会打印任何 CephFS 扩展属性。 这是因为 CephFS 内核和 FUSE 客户端在 listxattr(2) 系统调用中隐藏了此信息。 相反，可以通过运行 `getfattr /some/dir -n ceph.<some-xattr>` 查看特定的 CephFS 扩展属性。


#### 3. 删除配额

```sh
setfattr -n ceph.quota.max_bytes -v 0 /some/dir
setfattr -n ceph.quota.max_files -v 0 /some/dir

# 查看删除效果
getfattr /some/dir -n ceph.quota.max_bytes
getfattr dir1/ -n ceph.quota.max_files
```

---
## 客户端

#### 1. 是否允许客户端在运行时应用

> 某些客户端配置可以在运行时应用。 要检查配置选项是否可以在运行时应用（受客户端影响）

```sh
ceph config help debug_client
```

#### 2. 更新客户端配置选项

> 这会更改所有客户端的给定配置

```sh
ceph config set client debug_client 20/20
```

#### 3. 列出一些常用参数

| 参数                | 默认值  | 说明                                                                    |
| :---------------- | ---- | :-------------------------------------------------------------------- |
| client_acl_type   |      | 目前只能设置 posix_acl, 仅在fuse_default_permissions设置为false时生效               |
| client_cache_mid  | 0.75 | 设置客户端缓存中点。 中点将最近最少使用的列表分为热列表和暖列表。                                     |
| client_cache_size | 16Ki | Set the number of inodes that the client keeps in the metadata cache. |

## 授权

#### 1. 授权指定目录的读写权限

```sh
ceph fs authorize <fs_name> client.<client_id> <path-in-cephfs> rw

# 示例
# 限制 foo 用户仅在文件系统 cephfs_a 的 bar 目录中写入
ceph fs authorize cephfs_a client.foo / r /bar rw

# 要将 foo 用户完全限制在 bar 目录
ceph fs authorize cephfs_a client.foo /bar rw
```

#### 2. MOUNT 时将客户端限制在指定的子目录

```sh
ceph-fuse -n client.<client_id> <mount-path> -r *directory_to_be_mounted*

# 示例
# 限制 foo 用户限制到 mnt/bar 目录
ceph-fuse -n client.foo mnt -r /bar
```

#### 3. 空间配额

```sh
默认情况: 如果设置了配额: client 端执行 df 时看到的是配额大小
client 可以设置显示整个文件系统大小: client quota df = false  
```


#### 4. 布局和配额权限(p)

> 布局和配额权限需要拥有 mds: p 权限标志
> 以下权限中, client.0 可以修改文件系统 cephfs_a 上的布局和配额，但 client.1 不能

```sh
client.0
    key: AQAz7EVWygILFRAAdIcuJ12opU/JKyfFmxhuaw==
    caps: [mds] allow rwp
    caps: [mon] allow r
    caps: [osd] allow rw tag cephfs data=cephfs_a

client.1
    key: AQAz7EVWygILFRAAdIcuJ12opU/JKyfFmxhuaw==
    caps: [mds] allow rw
    caps: [mon] allow r
    caps: [osd] allow rw tag cephfs data=cephfs_a
```

#### 5. 创建删除快照权限(s)

> 当功能字符串还包含“p”标志时，“s”标志必须出现在其后面（除“rw”之外的所有标志都必须按字母顺序指定）
> 以下权限: client.0可以在文件系统cephfs_a的bar目录中创建或删除快照

```sh
client.0
    key: AQAz7EVWygILFRAAdIcuJ12opU/JKyfFmxhuaw==
    caps: [mds] allow rw, allow rws path=/bar
    caps: [mon] allow r
    caps: [osd] allow rw tag cephfs data=cephfs_a
```

#### 6. 网络限制

> 只允许 10.0.0.0/8 网段访问

```sh
client.foo
  key: *key*
  caps: [mds] allow r network 10.0.0.0/8, allow rw path=/bar network 10.0.0.0/8
  caps: [mon] allow r network 10.0.0.0/8
  caps: [osd] allow rw tag cephfs data=cephfs_a network 10.0.0.0/8
```

#### 7. 文件系统权限

> 只允许访问指定的文件系统

#### 8. MDS 通信限制

> 通过为特定文件系统添加 MDS caps

#### 9. 限制 root 用户执行写操作

> 禁止 uid=0 或 gid=0 的客户端执行写访问操作，例如 rm、rmdir、rmsnap、mkdir、mksnap。 
> 该模式允许 root 客户端执行读取操作。

```sh
ceph fs authorize a client.test_a / rw root_squash /volumes rw
```

#### 10. 将现有 client 用户添加新 caps

> R 版开始有的功能

```sh
# 创建用户
ceph fs authorize a client.x / rw

# 再次执行, 提示没有更新(以前会报错)
ceph fs authorize a client.x / rw

# 添加 caps
ceph fs authorize a client.x /dir1 rw

# 添加另外一个文件系统的访问权限
ceph fs authorize b client.x / rw
```

#### 11. 授权和更新授权操作不会删除任何已经授予的权限

---
## mount 挂在 cephfs 文件系统

### 一. 先决条件

> 挂载机器必须有: ceph.conf 文件
> 挂载机器必须有: 权访问 MDS 的 CephX 用户的密钥环

#### 1. 创建 `ceph.conf`


`vim /etc/ceph/ceph.conf`

```sh
# minimal ceph.conf for 41e02e26-02f3-4eab-97b4-3e01a7e03c85
[global]
	fsid = 41e02e26-02f3-4eab-97b4-3e01a7e03c85
	mon_host = [v2:10.57.144.235:3300/0,v1:10.57.144.235:6789/0] [v2:10.57.144.236:3300/0,v1:10.57.144.236:6789/0][v2:10.57.144.237:3300/0,v1:10.57.144.237:6789/0]
```

`chmod 644 /etc/ceph/ceph.conf`
#### 2. 创建一个可访问的用户

```sh
# ceph 集群机器
ceph fs authorize myfs client.myfsuser001 / rw

# mount 机器
vim /etc/ceph/ceph.client.myfsuser001.keyring
chmod 600 /etc/ceph/ceph.client.foo.keyring
```


### 二. 内核挂载

> 内核挂载 比 FUSE 挂载性能高

#### 1. `mount.ceph` 帮助程序

```sh
> `mount.ceph` 可以使用户挂载时, 省略一些参数选项
> `mount.ceph` 命令由 ceph 软件包安装, 查看是否存在: `stat /sbin/mount.ceph`
> `mount.ceph` 在执行 mount 命令时, 会帮助自动传递 monitor 和 keyring 
> 至少要使用 `4.x` 以上内核
```

#### 2. 挂载命令格式

```sh
mount -t ceph {device-string}={path-to-mounted} {mount-point} -o {key-value-args} {other-args}
```

#### 3. 示例

```sh
mount -t ceph myfsuser001@41e02e26-02f3-4eab-97b4-3e01a7e03c85.myfs=/ /myfs -o mon_addr=10.57.144.235:6789/10.57.144.236:6789/10.57.144.237:6789,secret=AQCymAJmtNsrFxAAcdwW1XPtlQILG5GEhBROXw==

# 其中格式: <name>@<fsid>.<fs_name> 解析
# name 为 cephfs 用户名, 示例中是: myfsuser001
# fsid 为 ceph 集群的 fsid, 示例中是: 41e02e26-02f3-4eab-97b4-3e01a7e03c85
# fs_name 为要挂载的 cephfs 集群中的文件系统名, 示例中是: myfs

# -o 参数解析
# mon_addr 为 ceph 集群monitor地址, 多个以 / 分割
# secret 为 name 用户名所使用的密钥,  这里是: myfsuser001 用户的密钥
```

#### 4. 简写

> 当安装了 `mount.ceph` 命令, 并且创建了 `/etc/ceph/ceph.conf` 和 `/etc/ceph/ceph.client.<name>.keyring` 文件时,  monitor 地下, FSID, secret 可以省略

```sh
mount -t ceph myfsuser001@.myfs=/ /myfs
```

#### 5. 密钥可以单独保存到文件, 并在 mount 时指定该文件

```sh
cat myfsuser001.secret
AQCymAJmtNsrFxAAcdwW1XPtlQILG5GEhBROXw==

mount -t ceph myfsuser001@.myfs=/ /myfs -o secretfile=myfsuser001.secret
```

#### 6. 集群关闭 `CephX`

> 集群关闭 `CephX` 身份认证, 则 `mount` 时可以省略任何与认证有关的参数, 但用户名需要保留

```sh
mount -t ceph myfsuser001@.myfs=/ /myfs
```


#### 7. 挂载 子目录

```sh
mount -t ceph myfsuser001@.myfs=/volumes/mysubvol001/ /myfs
```

#### 8. 旧语法

```sh
mount -t ceph 10.57.144.235:6789,10.57.144.236:6789,10.57.144.237:6789:/volumes/mysubvol001/ /myfs -o ,fs=myfs,name=myfsuser001,secret=AQCymAJmtNsrFxAAcdwW1XPtlQILG5GEhBROXw==

# mds_namespace 参数与 fs 参数等效, 但新版本中 mds_namespace 参数已经弃用
# 集群中如果只有一个文件系统名称, 则可以省略
# 文件中如果有多个文件系统名称, 省略则为默认文件系统, 默认文件系统默认为: cephfs
```

#### 9. 持久化

> `vim /etc/fstab`

```sh
# 格式
{name}@.{fs_name}=/ {mount}/{mountpoint} ceph [mon_addr={ipaddress},secret=secretkey|secretfile=/path/to/secretfile],[{mount.options}]  {fs_freq}  {fs_passno}

# 示例
cephuser@.cephfs=/     /mnt/ceph    ceph    mon_addr=192.168.0.1:6789,noatime,_netdev    0       0
```

### 三. FUSE 挂载

> FUSE 挂载 比 内核挂载 性能低  
> 但 FUSE 客户端更易于管理，尤其是在升级 CephFS 时。
> 使用 ceph-fuse 方式挂载后, linux操作系统将启动一个 ceph-fuse 进程

#### 1. 需要先安装 `ceph-fuse` 命令

```sh
# 安装 ceph-fuse 命令
```

#### 2. 挂载命令格式

```sh
ceph-fuse {mountpoint} {options}
```

#### 3. 示例

```sh
ceph-fuse --id myfsuser001 /myfs

或
ceph-fuse -n client.myfsuser001 /myfs
```

#### 4. 指定密钥 `keyring`

```sh
ceph-fuse --id myfsuser001 -k /etc/ceph/ceph.client.myfsuser001.keyring /myfs
```

#### 5. 指定 `mon` 节点

```sh
ceph-fuse --id myfsuser001 -m 10.57.144.235:6789 /myfs
```

#### 6. 挂载子目录

```sh
ceph-fuse --id myfsuser001 -r /volumes/mysubvol001/ /myfs
```

#### 7. 指定非默认文件系统

> 也可以将 `client_fs` 写到 `ceph.conf` 配置文件中

```sh
ceph-fuse --id myfsuser001 --client_fs mycephfs2 /myfs
```

#### 8. 持久化

> `vim /etc/fstab`

```sh
#DEVICE PATH       TYPE      OPTIONS
none    /mnt/mycephfs  fuse.ceph ceph.id={user-ID}[,ceph.conf={path/to/conf.conf}],_netdev,defaults  0 0
none    /mnt/mycephfs  fuse.ceph ceph.id=myuser,_netdev,defaults  0 0
none    /mnt/mycephfs  fuse.ceph ceph.id=myuser,ceph.conf=/etc/ceph/foo.conf,_netdev,defaults  0 0

# 挂载子目录
none    /mnt/mycephfs  fuse.ceph ceph.id=myuser,ceph.client_mountpoint=/path/to/dir,_netdev,defaults  0 0
```


## cephfs-shell

> 与 cephfs 对话的类似 shell 的工具

#### 1. 安装  `cephfs-shell`

::: code-group

```shUbuntu 22.04
apt install cephfs-shell
```

```shCentos 7
# centos 环境未验证
# 安装依赖
python3 -m venv venv && source venv/bin/activate && pip3 install cmd2 colorama

# 安装 cephfs-shell
source vstart_environment.sh && source venv/bin/activate && python3 ../src/tools/cephfs/shell/cephfs-shell

# 或
yum install cephfs-shell
```

:::

#### 2. 使用

> 在linux命令行直接运行 `cephfs-shell` 即可进入交互终端

```sh
root@mytestceph11v:/home/lsne# cephfs-shell
CephFS:~/>>> 

# -b, --batch FILE 指定批处理文件的路径
# -c, --config FILE 指定  cephfs-shell.conf 配置文件路径
-f, --fs FS 指定要连接的 cephfs 的文件系统名称


# 输入 quit 或按 Ctrl + D 退出交互
```

> 在linux命令行运行类似 `cephfs-shell ls` 后面跟着`cephfs-shell`命令, 则非交互执行后面的命令, 将结果输出到linux标准输出

```sh
root@mytestceph11v:/home/lsne# cephfs-shell ls
testdir/      testdir002/   testfile001      volumes/ 
```

#### 3. 在 `cephfs-shell` 中查看本地目录

> 在命令前加 `!` 即可查看本地文件

```sh
# 查看本机 /tmp/ 目录
CephFS:~/>>> !ls /tmp/
```

#### 4. 查看远程操作系统上的文件

```sh
CephFS:~/>>> ls
```

#### 5. 创建目录

```sh
mkdir [-p] [-m 0755] newdir

# -p 递归创建
# -m 指定权限
```

#### 6. 查看指定目录及子目录的总大小

```sh
cephfs-shell getxattr volumes ceph.dir.rbytes
```

#### 7. 查看指定目录及子目录的总文件数量

```sh
cephfs-shell getxattr volumes ceph.dir.rfiles
```

## 文件布局

> 制其内容如何映射到 Ceph RADOS 对象, 即使用哪个数据池等
> 可以使用 `virtual extended attributes` 或 `xattrs` 设置和读取布局
> `xattrs` 属性名称根据文件是常规文件还是目录有所变化

#### 1. 文件属性名称

```sh
常规文件的属性名: ceph.file.layout
目录的属性名: ceph.dir.layout
```

#### 2. 查看指定文件的布局

```sh
# 查看布局的所有属性
getfattr -n ceph.file.layout /myfs/testfile001

# 或只看这个文件的 pool 信息
getfattr -n ceph.file.layout.pool  /myfs/testfile001
```

#### 3. 修改布局

```sh
setfattr -n ceph.dir.layout.stripe_count -v 2 dir
```

#### 4. json 格式返回布局信息

> 如果没有为指定的目录设置布局, 则直接 `getfattr` 将会报错
> 可以使用 `getfattr -n ceph.dir.layout.json --only-values` , 将向上遍历目录路径, 找到具有布局的最近的祖先目录，并以 json 格式返回

```sh
getfattr -n ceph.dir.layout.json --only-values /myfs/volumes
```

#### 5. 使用 setfattr 修改布局字段

> 当使用setfattr修改文件的布局字段时，该文件必须为空，否则会出现错误。

```sh
$ ceph osd lspools
0 rbd
1 cephfs_data
2 cephfs_metadata

$ setfattr -n ceph.file.layout.stripe_unit -v 1048576 file2
$ setfattr -n ceph.file.layout.stripe_count -v 8 file2
$ setfattr -n ceph.file.layout.object_size -v 10485760 file2
$ setfattr -n ceph.file.layout.pool -v 1 file2  # Setting pool by ID
$ setfattr -n ceph.file.layout.pool -v cephfs_data file2  # Setting pool by name
$ setfattr -n ceph.file.layout.pool_id -v 1 file2  # Setting pool by ID
$ setfattr -n ceph.file.layout.pool_name -v cephfs_data file2  # Setting pool by name
```

#### 6. 删除手动设置的布局

> 删除后, 以父目录的布局为准

```sh
setfattr -x ceph.dir.layout mydir
```

## 多个活动的MDS


> [!NOTE] 作用
> 拥有许多客户端、可能在许多单独目录上工作的工作负载
> 应用程序并行执行大量元数据操作时, 可能会导致单个 MDS 上出现瓶颈, 这时可以配置多个活动 MDS 守护程序


## 其它

### 查看 mds 有哪些 session

```sh
ceph daemon mds.`hostname` session ls
```