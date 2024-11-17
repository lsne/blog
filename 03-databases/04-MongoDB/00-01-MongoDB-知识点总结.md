# MongoDB 知识点总结  
  
## 新特性  
  
|版本|新特性|  
|-|-|  
| mongodb4.2 | 分布式事务 |  
| mongodb4.2 | 非 _id 的分片键可以更改了 |  
| mongodb4.2 | 删除了MMAPv1存储引擎 和 相关的配置参数 |  
| mongodb4.2 | db.startBalancer() 命令会自动拆分chunk |  
| mongodb4.2 | keyfile 文件改用 YAML 格式, 允许多个秘钥在文件里 |  
|||  
| mongodb4.0 | 副本集事务 |  
| mongodb4.0 | session模式 |  
| mongodb4.0 | 移除MONGODB-CR认证模式, 新增SCRAM-SHA-256|  
| mongodb4.0 | 删除了主从复制模式 |  
| mongodb4.0 | 必须开启journal 和 bind_ip |  
| mongodb4.0 | 默认的数据目录权限变了 |  
| mongodb4.0 | MongoDB等待任何正在进行的后台索引构建完成，然后再开始回滚 |  
|||  
| mongodb3.6 | 限制用户连接为指定的IP地址,增加authenticationRestrictions参数 |  
| mongodb3.6 | mongodb驱动 将所有操作与server session 相关联,增加session管理命令 |  
| mongodb3.6 | 动态调整oplog大小命令: replSetResizeOplog |  
| mongodb3.6 | 分片必须是副本集 |  
| mongodb3.6 | 分片副本集的所有成员（不仅是主副本）都维护有关块元数据的元数据 |  
|||  
| mongodb3.4 | 全量复制提前创建索引 |  
| mongodb3.4 | 分片集群中的组件可以识别在集群中的身份,必须配置 --shardsv 选项 |  
| mongodb3.4 | 3.4 的mongos 与 早期的mongod不兼容 |  
| mongodb3.4 | config 节点必须是副本集 |  
  
## 工作中遇到的问题  
  
|版本|问题|原因|解决方法|  
|-|-|-|-|  
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;||||
| mongodb | 从库CPU和负载高 | 灌数据/mongodb过期索引有大量过期数据造成的从库CPU报警 | 使用cgroup限制CPU使用 |  
| mongodb | RECOVERING | 连接数被打满造成同步失败 | 调高连接数后,重启主库 |  
| mongodb | 连接数被打满 | 系统限制 kernel.pid_max=32000 | 修改为42000 |  
| mongodb  |  分片集群upsert更新必须指定分片键条件 |||  
| mongodb  |  稀疏索引查询 | 查询记录条数不一样||  
| mongodb  |  mongodb mongos 大量连接突然进来把服务器CPU打满 和 服务器负载特别高| 3.6 版本加了一个参数,根据请求动态调整网络线程数量,并尽量做到网络IO复用 serviceExecutor=adaptive||  
| mongodb  |  mongodb4.0 新增参数，解决4.0默认实例数据目录权限不足导致sync360不可访问| ||  
| mongodb  |  chunk 太大, 手动切, 设置chunk大小也迁移不了。 |  和业务沟通后, 将数据dump出来，然后导入到其他分片, 将原来的删除||  
| mongodb 4.2 | mongos全连不进去了。对config切主后正常 | 4.2版本bug, 升级解决
| mongodb | 大量写入, 导致 128 工作线程 被打满问题|无解
|mongodb4.2 分片 | update upsert | upsert : true 如果不存 则insert, 但update条件得为片键|


## 基础知识  
  
1. .mongorc.js 文件, 启动mongo shell时自动运行  
2. $set 是upate操作的修改器,还有$inc 等 upsert操作在分片集群上用的时候必须加上分片键条件  
3. 游标10分钟没有使用,自动销毁  
4. 写入安全机制分 应答式写入 和 非应答式写入  
5. 键值是一个数组,则这个索引会被标记为多键索引  
6. 固定集合(指定大小和文档数量)  
7. 等待写入复制 db.runCommand({"getLastError":1, "w": "majority", "wtimeout": 1000})  
8. 回滚会将回滚的记录放到一个文件  
9. 副本集最多12个, 最多7个成员拥有投票权  
10. rs.freeze(1000), 在所有从节点执行,在设置时间内不允许成为主节点  
11. 强制进入维护模式: replSetMaintenanceMode  
12. allowChaining 禁用复制链, 所有成员都从主节点同步数据  
13. local.slaves 集合维护了每一个从节点和节点数据的新旧程度  
chunk size 64M 1024M,  jumbo  
journal setParameter journalCommitInterval: <2-500>ms  | getLastError: j: true 可以减少为1/3


### 持久化  
  
1. 数据文件每60秒刷新到磁盘一次  
2. 每隔100ms,或写入数据达到若干(100?)兆字节, 会将joural 日志写入磁盘  
3. 可通过getLastError, 传递 j 选项来确保写入操作的成功, j 参数会等待前一次写入操作写入到joural日志文件中.  
4. 而日日志在下一批操作写入前, 只会等待30毫秒(不加j参数则是100ms)  
5. 这样就表示, mongodb的写qps只有33了.严重影响性能,甚至不可用(可以并发操作,相当于组提交??)  
6. journalCommitInterval 设置将日志写入磁盘的时间间隔, 最小2ms. 并且,用j:true时,还会减小到这个参数值的 1/3  
7. 检验数据损坏: db.foo.validate()  
  
### 命令行设置参数  
  
|参数设置|说明|  
|-|-|  
|db.adminCommand({"setParameter": 1, "logLevel": 3})|修改日志级别,默认0, 最大最详细为5 |  
|db.adminCommand({"logRoute": 1})| 日志切割|  
|db.adminCommand({"serverStatus": 1})["recordStats"]| 内存缺页中断|  
  
## Mongodb 副本集  
  
### 成员  
  
    仲裁者  
    优先级  
    隐藏成员  
    延迟备份节点  
    无索引节点  
  
### 同步过程  
  
    1. 选择一个同步源,在local.me 为自己创建标识  
    2. 删除所有数据  
    3. 将同步源数据克隆  
    4. 同步oplog, 如果克隆过程中有数据被移动了.导致没有克隆.会重新克隆  
    5. 创建索引(3.4版本,创建索引在数据克隆之前)  
    6. 心跳2秒  
  
### 复制状态  
  
|状态|说明|  
|-|-|  
|STARTUP|刚启动,尝试加载副本集配置|  
|STARTUP2|加载完成副本集配置,如果全量重新同步,则这个状态一直持续到同步完成. 之后会进入RECOVERING状态.|  
|RECOVERING|处理耗时命令,压缩,响应replSetMaintenance 或 oplog被覆盖也会进入这个状态|  
|ARBITER|仲裁节点|  
|DOWN|不可达节点在集群上的显示|  
|UNKNOWN|不可达节点在自己节点上的显示|  
|REMOVED|被移除的节点|  
|ROLLBACK|回滚节点|  
|FATAL|发生不可挽回的错误|  
  
### 复制集命令  
  
|命令|辅助函数|说明|  
|-|-|-|  
|replSetSyncFrom|rs.syncFrom()|修改复制源|  
||||  
  
### config  
  
|key|values|说明|  
|-|-|-|  
|config.settings.allowChaining|false|如果主节点可用,所有成员都从主节点复制数据.|  
||||  
  
## Mongodb 分片集群  
  
1. 片键值不能修改  
  
## Mongodb wiredTiger 引擎原理  

### 锁  
  
    wiredTiger 是文档级锁  
    MMAP1 是集合级锁  
  
### 原子性  
  
写入数据:  
    1. 更新数据页  
    2. 更新索引页  
    3. 更新oplog数据页  
    4. 将以上三个操作写入WAL日志,即是journal日志  
  
wiredTiger 的数据并不会立即持久化,而是每分钟会做一次全量检查点. 如果没有journal,则数据库崩溃有可能会丢失1分钟的数据  
  
### 写操作  
  
    写操作会先将数据页读到内存cache中,然后用copy on write 写时复制的方式,新生成一个page, 并持久化到journal  
    每60秒,或journal达到2G, 将原始数据刷到磁盘(新配置不会写入原来的page空间,而是新空闲空间), journal产生一个检查点.  
    采用Copy on write 的方式管理修改操作, 修改操作先缓存在cache里,持久化时,修改操作不会在原来的page上进行,而是写入新分配的page, 每次checkpoint都会产生一个新的root page  
  
### 一次Checkpoint的大致流程如下  
  
    对所有的table进行一次Checkpoint，每个table的Checkpoint的元数据更新至WiredTiger.wt  
    对WiredTiger.wt进行Checkpoint，将该table Checkpoint的元数据更新至临时文件WiredTiger.turtle.set  
    将WiredTiger.turtle.set重命名为WiredTiger.turtle  
    上述过程如中间失败，Wiredtiger在下次连接初始化时,首先将数据恢复至最新的快照状态，然后根据WAL恢复数据，以保证存储可靠性。  
  
### MVCC  
  
WT 中的 MVCC 是基于 key/value 中 value 值的链表，这个链表单元中存储有当先版本操作的事务 ID 和操作修改后的值。描述如下：  
  
wt_mvcc{  
  
transaction_id:    本次修改事务的ID  
  
value:             本次修改后的值  
  
}  
  
WT 中的数据修改都是在这个链表中进行 append 操作，每次对值做修改都是 append 到链表头上，每次读取值的时候读是从链表头根据值对应的修改事务 transaction_id 和本次读事务的 snapshot 来判断是否可读，如果不可读，向链表尾方向移动，直到找到读事务能都的数据版本.  
  
### WT 事务 snapshot  
  
上面多次提及事务的 snapshot，那到底什么是事务的 snapshot 呢？其实就是事务开始或者进行操作之前对整个 WT 引擎内部正在执行或者将要执行的事务进行一次快照，保存当时整个引擎所有事务的状态，确定哪些事务是对自己见的，哪些事务都自己是不可见。说白了就是一些列事务 ID 区间。  
  
### Cgroup  
  
cgroups(Control Groups) 是 linux 内核提供的一种机制，这种机制可以根据需求把一系列系统任务及其子任务整合(或分隔)到按资源划分等级的不同组内，从而为系统资源管理提供一个统一的框架

CGroup 是将任意进程进行分组化管理的 Linux 内核功能。CGroup 本身是提供将进程进行分组化管理的功能和接口的基础结构，I/O 或内存的分配控制等具体的资源管理功能是通过这个功能来实现的。这些具体的资源管理功能称为 CGroup 子系统或控制器。CGroup 子系统有控制内存的 Memory 控制器、控制进程调度的 CPU 控制器等。运行中的内核可以使用的 Cgroup 子系统由/proc/cgroup 来确认。  
  
CGroup 提供了一个 CGroup 虚拟文件系统，作为进行分组管理和各子系统设置的用户接口。要使用 CGroup，必须挂载 CGroup 文件系统。这时通过挂载选项指定使用哪个子系统。  
  
CGroup 相关概念解释  
  
任务（task）。在 cgroups 中，任务就是系统的一个进程；  
  
控制族群（control group）。控制族群就是一组按照某种标准划分的进程。Cgroups 中的资源控制都是以控制族群为单位实现。一个进程可以加入到某个控制族群，也从一个进程组迁移到另一个控制族群。一个进程组的进程可以使用 cgroups 以控制族群为单位分配的资源，同时受到 cgroups 以控制族群为单位设定的限制；  
  
层级（hierarchy）。控制族群可以组织成 hierarchical 的形式，既一颗控制族群树。控制族群树上的子节点控制族群是父节点控制族群的孩子，继承父控制族群的特定的属性；  
  
子系统（subsystem）。一个子系统就是一个资源控制器，比如 cpu 子系统就是控制 cpu 时间分配的一个控制器。子系统必须附加（attach）到一个层级上才能起作用，一个子系统附加到某个层级以后，这个层级上的所有控制族群都受到这个子系统的控制。  

### Django

1. setting.py url.py views.py models.py  
2. 测试环境 manager.py runserver 0.0.0.0:80  
3. 生产环境 uwsgi实现了WSGI协议、uwsgi、http等协议  

api: 获取备份失败列表了, mongodb创建索引, 修改索引过期时间, redis获取大key的信息

### gin

1. 每一个请求开一个线程
2. 配置文件什么的都要自己手动设计
