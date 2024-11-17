# Redis 知识点总结  
  
---  
## 新特性  
  
redis5.0 : 19 个 5个  
redis4.0 : 7 个  
  
| 版本                                                                                               | 新特性                                                                                                                 |     |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | --- |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; |                                                                                                                     |     |
| redis6.0                                                                                         | 新增 Bitmaps, HyperLogLog, Geographic(3.2版本就添加了) 数据类型                                                                 |     |
| redis5.0                                                                                         | 新增 Stream 数据类型                                                                                                      |     |
| redis5.0                                                                                         | redis-cli 中的集群管理器从 Ruby (redis-trib.rb) 移植到了 C 语言代码。执行 `redis-cli --cluster help` 命令以了解更多信息                         |     |
| redis5.0                                                                                         | 许多包含子命令的命令现在都有一个 HELP 子命令                                                                                           |     |
| redis5.0                                                                                         | 动态的 HZ(Dynamic HZ) 平衡空闲 CPU 使用率和响应性                                                                                 |     |
|                                                                                                  |                                                                                                                     |     |
| redis4.0                                                                                         | PSYNC2: 新的一种主从复制同步机制                                                                                                |     |
| redis4.0                                                                                         | 混合RDB + AOF模式                                                                                                       |     |
| redis4.0                                                                                         | 增加modules功能,可以自己开发相关模块                                                                                              |     |
| redis4.0                                                                                         | Lazyfree机制，延迟删除大key，降低删除操作对系统资源的占用影响(Lazyfree一共有3个命令：UNLINK：异步删除key;FLUSHDB ASYNC：异步清空当前DB;FLUSHALL ASYNC：异步清空所有DB) |     |
| redis4.0                                                                                         | 慢日志加了显示客户端IP:PORT的                                                                                                  |     |
| redis4.0                                                                                         | MEMORY内存分析命令                                                                                                        |     |
| redis4.0                                                                                         | 基于LFU的热点key发现机制                                                                                                     |     |
|                                                                                                  |                                                                                                                     |     |
| redis3.2                                                                                         | 如果过期键多,主节点删除不过来.则从节点过期数据可以被读到. 3.2版本在从节点读key时也判断过期条件避免这一现象                                                          |     |
| redis3.0                                                                                         | Redis Cluster                                                                                                       |     |
| redis2.8                                                                                         | config rewrite 命令可以将config set 持久化到配置文件中                                                                            |     |
| redis2.8                                                                                         | Redis Sentinel第二版，相比于Redis2.6的Redis Sentinel，此版本已经变成生产可用                                                            |     |
  
## 工作中遇到的问题  
  
|版本|问题|原因|解决方法|  
|-|-|-|-|  
| redis  | response err / 或频繁连接超时 | 大量慢查询 或 某一个很大的查询hgetall 造成redis端口堵塞 或 连接数被打满 | 联系业务处理 |  
| redis  | response err | CPU饱 或 aof 刷盘.或 fork子进程影响, CPU竞争,内存交换,网络问题 | 数据量/ 磁盘IO压力等 |  
| redis  | unexpected end of stream | 一个命令返回的数据量太大/timeout超时 | 调整参数 或 建议业务分批次获取数据 |  
| redis  | VIP | 长连接中通过VIP连接,网络异常导致VIP与SERVER端连接断开.但业务还保持连接  | 提醒业务重启应用 并建议业务在代码逻辑里加入连接探测功能 |  
| redis  | 内存满 | 从库同步延迟导致输出缓冲区暴涨  | 如果可以,断掉同步|  
| redis  | 自动清库 | 设置了淘汰策略,库里只有一个key, 内存满后自动淘汰  |  
| redis | 磁盘坏阻塞主进程(2秒) | Asynchronous AOF fsync is taking too long (disk is busy). Writing the AOF buffer
without waiting for fsync to complete, this may slow down Redis |
| redis  | shutdown不保存rdb | 配置文件不设置save参数,则shutdown不保存rdb  |
| redis cluster | 一个集群只有一个key (list 或 set zset) | 导致cluster没启作用|
| redis4.0  | psync2 |级联同步级联节点上的写入不会同步到后面的从库 |  
| redis cluster | flushdb 执行时间太长, 超过健康检查导致自动切主, 数据又回来了|
  
## 基础知识  

## Stream

它是一个新的强大的支持多播的可持久化的消息队列，作者坦言Redis Stream狠狠地借鉴了Kafka的设计  
消息是持久化的，Redis重启后，内容还在  

### 参数  
  
|参数设置|说明|  
|-|-|  
| slowlog-log-slower-than | 微秒 |  
| slowlog-max-len | 慢查询队列长度 |  
| auto-aof-rewrite-min-size | 重写aof的最小aof文件大小, 默认64M |  
| auto-aof-rewrite-percentage | 重写aof要超过上一次aof重写后基础大小的百分比 |  
| repl-disable-tcp-nodelay | 开启后,主节点会合并较小的TCP数据包从而节省带宽,发送间隔取决于linux内核, 一般默认是40ms |  
| slave-read-only = yes | 从库只读, 这个参数在集群状态下无效果, 可以用 readonly. 在客户端设置?? |  
| repl-timeout | 默认60秒,主从同步时,rdb从生成到从库接受完的时间 |  
| mem_fragmentation_ratio | 状态值,内存碎片率 |  
| cluster-enabled | 集群开启参数 |  
| cluster-config-file | 集群配置文件 |  
| cluster-require-full-coverage | 设置为no,集群某一部分槽不可用,其他槽继续处理访问请求 |  
  
### 命令  
  
|命令|说明|  
|-|-|  
| bgsave | fork子进程进行 rdb文件的生成 |  
| bgrewriteaof | 重写aof |  
| psync runid offset | 手动部分复制 |  
| cluster slaves{nodeId} | 反回主节点下所有从节点信息 |  
| cluster failover | 手动故障转移 |  
| redis-trib.rb call | 在集群所有节点上执行命令 |  
  
## redis 主从复制  
  
1. slaveof 异步命令, 执行后,只保存主节点信息,然后直接返回  
2. 内部每秒定时任务发现存在新的主库,尝试建立网络连接(socket套接字,专门用于接受主节点发送的命令)  
3. 每秒的定时任务会无限重试,直到连接成功或slaveof no one  
4. 发送ping命令给主节点,检查套接字是否可用, 主节点是否可以接受命令  
5. 权限验证  
6. 同步数据集psync,psync2, 全量则主库rdb, 增量则在复制积压缓冲区中找位置传送命令  
7. 命令持续复制  
  
运行ID 重启后会改变, 因为如果主库重启后加载了不同的aof或rdb.  从库继续增量复制的话,数据就乱了  
  
增量复制:  
  
1. 由于网络等原因造成的同步中断  
2. 主从连接恢复时,从库检查主库的运行ID.  
3. 运行ID一样.则在主库的复制积压缓冲区找到从库当前复制的位置,重写发送复制命令  
4. 如果找不到,重写全量同步  
  
心跳:  
主节点每10秒ping从库  
从节点每1秒给主节点上报自身偏移量  
  
slave-read-only = yes #最好不要修改  
  
slaveof no one  
    1. 断开与主节点复制关系  
    2. 从节点晋升为主节点  
  
## redis cluster  
  
Redis Cluser采用虚拟槽分区，所有的键根据哈希函数映射到0~16383整数槽内  
  
### 限制  
  
    1. 批量操作,只支持相同slot值的批量操作  
    2. 多key事物,同上  
    3. 只有db0  
    4. 一个key只能在一个slot, hash等之类的不能拆分feild分别存  
    5. 复制只支持一层  
  
### 集群搭建  
  
    1. cluster meet 节点握手, 发送meet,接受pong,之后定期ping/pong. (Gossip协议消息,每秒通讯10次)  
    2. cluster info 查看集群状态  
    3. cluster addslots {0...5461}  分配槽  
    4. cluster replicate cfb28ef1deee4e0fa78da86abe5d24566744411e 挂载主从关系  
    5. cluster nodes 查看集群节点和槽映射的变化  
  
### 用 redis-trib.rb 搭建  
  
    1. redis-trib.rb create --replicas 1 127.0.0.1:6481 127.0.0.1:6482 ......  创建集群  
    2. redis-trib.rb check  
  
### 扩容和缩绒  
  
    1. 增加节点  
        redis-trib.rb add-node 127.0.0.1:6385 127.0.0.1:6379  
    2. 迁移槽  
        redis-trib.rb reshard host:port --from <arg> --to <arg> --slots <arg> --yes --timeout <arg> --pipeline <arg>  
    3. 删除节点  
        redis-trib.rb del-node 127.0.0.1:6379 4fa7eac4080f0b667ffeab9b87841da49b84a6e4 #从节点 6384 id 和主节点ID都要执行一次  
  
## 原理  
  
### 内存  
  
对象内存  
输入缓冲无法控制,最大空间为1G,超过将断开连接  
输出缓冲,有三个客户端类型可以配置(普通,从库,订阅)  
复制积压缓冲区  
AOF缓冲区  
  
### 内存回收策略  
  
1. 删除过期key  
    惰性删除: 客户端读取带过期属性的key时,如果已经超过过期时间,会执行删除操作,并返回空  
    定期删除: 定时任务默认每秒10次(hz参数控制), 采用自适应算法,根据键过期比例使用快慢两种速率  
        随机扫描20个key,如果超过25%个key过期,则循环取20个key判断然后删除过期的key. 直到取出的20个key过期的不到25% 或 执行了25ms超时  
        如果上一次删除是超时,则redis触发内部事件之前,再次以快模式运行回收过期键任务,快模式超时时间为1ms,2秒内只能运行1次  
  
2. 内存溢出控制策略  
    noeviction：默认策略，不会删除任何数据.拒绝写入  
    volatile-lru：根据LRU算法删除设置了超时属性（expire）的键，直到腾出足够空间为止。如果没有可删除的键对象，回退到noeviction策略。  
    allkeys-lru：根据LRU算法删除键，不管数据有没有设置超时属性，直到腾出足够空间为止。  
    allkeys-random：随机删除所有键，直到腾出足够空间为止。  
    volatile-random：随机删除过期键，直到腾出足够空间为止。  
    volatile-ttl：根据键值对象的ttl属性，删除最近将要过期数据。如果没有，回退到noeviction策略。  
  
3. 共享对象池  
    开启最大内存,和淘汰策略后无效  
  
### 删除策略  
  
定时删除：Redis主节点在内部定时任务会循环采样一定数量的键，当发现采样的键过期时执行del命令，之后再同步给从节点  
  
### 慢查询  
  
slow get 10  
    ID  
    时间戳  
    命令耗时  
    执行的clientIP  
    执行的命令和参数  
  
### redis-cli  
  
    --rdb  
        生成rdb文件,并传送到执行 redis-cli --rdb 命令的机器上,可用于备份  
  
    --bigkeys  
        用scan对键采样,分析大key  
  
    --stat  
        实时获取redis重要的统计信息  
  
    --raw   
        显示格式化后的内容,比如中文  
  
### 事物(不支持回滚,所以遇到错误之前的语句会执行成功)  
    watch key  #确保key没有被修改  
    multi   #相当于begin  
    exec    #相当于commit  
  
### 生成RDB时机  
  
    fork 子进程操作不会复制父进程占用的整个内存空间  
        但是会复制父进程的空间内存页表(即元数据)  
  
    redis-check-dump rdb检查工具  
    1. save 相关配置  
    2. 从节点复制  
    3. 执行 debug reload  
    4. shutdown 时,如果没有开启AOF  
  
### aof  
  
    redis-check-aof--fix 修复aof工具  
    所有写入命令追加到aof缓冲匀,根据参数配置进行刷盘  
    定期重写 -- aof重新缓冲区保存重写时进来的新命令  
    刷盘机制:  
        每次命令都刷盘  
        每秒刷盘  
        由系统负责  
    如果磁盘性能不行,刷盘比较慢. 主线程每秒刷盘.如果检测到上一次刷盘时间是2秒之前,则阻塞主线程.直到上一次和这一次刷盘完成  
  
## 1. aof 与 rdb 备份恢复对比  
  
|类型|数据量|文件大小|dump时间|load时间|  
|-|-|-|-|-|  
|aof|34G|29G|2分半|3分半|  
|rdb|34G|24G|7分半|4分半|  

## IO 多路复用  

IO多路复用指的就是 事件驱动  
linux内核监听所有连接进来的fd, 当某个fd有读写请求时,通知redis处理.  
使用事件通知机制来触发。通过epoll_ctl注册fd，一旦fd就绪就会通过callback回调机制来激活对应fd，进行相关的I/O操作。

将用户socket对应的fd注册进epoll，然后epoll帮你监听哪些socket上有消息到达，这样就避免了大量的无用操作。此时的socket应该采用非阻塞模式

非阻塞I/O，Redis使用epoll作为I/O多路复用技术的实现，再加上Redis自身的事件处理模型将epoll中的连接、读写、关闭都转换为事件，不在网络I/O上浪费过多的时间
  
select poll epoll这三个是常用的IO复用的系统调用。select和poll本质相同，都对同时监听的fd有数量限制，因为他们涉及大量文件描述符的数组被整体复制于用户态和内核的地址空间之间，而不论这些文件描述符是否就绪，因此它的开销随着文件描述符数量的增加而线性增大。  
  
epoll  
epoll涉及三个系统调用，epoll用来创建epollfd文件描述符（之后要close），epoll_ctl用来注册每个描述符及其等待的事件，epoll_wait监听epollfd上注册的事件，内核负责把数据复制到这个 events 数组中。  