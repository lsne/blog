# PostgreSQL 基础原理
## PGSQL 极限

```
单个表: 32 TB
单条记录: 1.6 TB
单个字段: 1 GB
单表字段个数: 250 ~ 1600 (取决于字段类型)
```
## PG实例结构

#### 1. 内存结构

```
独享内存(本地内存区域), 每个会话单独分配 - 包括:
	work_mem:  会话进行 order by, distinct, merge-join, hash-join 等操作会用到
	maintenance_work_mem: 会话进行 VACUUM, REINDEX 等操作会用到
	temp_buffers: 存储临时表

共享内存 - 包括:
	Shared buffer pool: 数据缓冲区
	WAL buffer: 日志缓冲区
	Commit LOG (clog): 提交日志缓冲区。 记录事务是提交状态还是回滚状态
	
进程 - 包括:

	服务器进程(postgres server process)
		- postgres -D /data 
		- 主进程, 其他所有进程都是他的子进程
	
	后端进程(backend process)
		- postgres: postgres postgres 127.0.0.1(57232) idle
		- 负责客户端与服务器的交互
		- 每一个连接都会创建一个后端进程

	后台进程 - 包括:
		- postgres: logger
		- postgres: checkpointer
			- 本身也会刷新脏块到磁盘数据文件
			- 将检查点信息更新到 wal 日志文件
			- 将检查点信息更新到 control 控制文件
			- 数据库进行热备(pg_start_backup())时, 会进行检查点操作

		- postgres: background writer # 把脏页刷新到磁盘数据文件
			- 根据的时间间隔定时刷盘
			- 脏块达到阈值时刷盘
			- 无可用内存空间时刷盘

		- postgres: walwriter             # wal 缓冲区刷到wal磁盘wal日志文件
			- 根据时间间隔定时刷盘
			- 事务提交时刷盘
			- wal buffer 三分之一满时刷盘
			- wal buffer 快满时刷盘
			- background 进程将脏页刷盘之前, 首先将 wal buffer 刷盘

		- postgres: autovacuum launcher
		- postgres: stats collector
		- postgres: logical replication launcher
		- logging collector (logger)
		- archiver
```

## pgsql 控制文件

打开数据库之前，先要打开控制文件

控制文件存放在 pg_global 表空间下, 具体目录为: $PGDATA/global/pg_control

控制文件很小。 一般就是8K,  控制文件内容尽量保持小于 512 字节

控制文件存放的内容:
1. 永久性参数
2. postgresql.conf 文件中的重要参数, 如果配置文件中相关参数被修改， 控制文件也会更新
3. 动态信息: 检查点信息, REDO 位置, WAL位置等等

### 重建配置文件:

> 工具: pg_resetwal , pgsql 10 之前是 pg_resetxlog

#### 1. 找到4个参数的值

```
# 找4个参数:
1. -l 参数: 
	XLOGFILE 强制新事务日志的最小 WAL 起始位置
    在 $PGDATA/pg_wal/ 下面创建的最大日志文件, 编号+1
    查到是: 0000000100000004000000AD, -l 参数为:
    -l 0000000100000004000000AE
    
2. -O 参数: 
	在 $PGDATA/pg_multixact/members/ 下, (最大值文件(一般就是 0000) + 1 ) * 65536 
	然后将结果转换为 16 进制, 再在末尾补4个0
	一般文件是 0000 计算出来的最终结果是: 
	-O 0x1000000000

3. -m 参数: 
	在 $PGDATA/pg_multixact/members/ 下, 最大值文件(一般就是 0000) + 1
	然后将结果末尾补4个0, 以逗号分割重复一次: 
	-m 0x00010000,0x00010000

4. -x 参数:
	在 $PGDATA/pg_xact/ 下, 最大文件编号(一般就是 0000) +1, 然后将结果末尾补4个0
	-x = 0x00010000
```

#### 2. 然后执行

```sh
touch pg_control

pg_resetwal -l 0000000100000004000000AE -O 0x1000000000 -m 0x00010000,0x00010000 -x 0x00010000 -f $PGDATA

# 执行完成会有一个警告, 忽略
启动实例
```

## WAL 文件

```
1. 每个wal 文件是 16MB
2. wal 文件名格式: 共 24 位16进制字符组成 
	1. 前8位: 表示时间线, 初始值为: 1, 每进行恢复一次会+1
	2. 中8位: 是后8位中最后两位循环一次的计数, 如下, 第4个文件, 中8位是2, 后8位的最后两位是FF, 则下一个文件的中8位就变成3, 后8位又从00开始
-rw------- 1 postgres postgres 16777216 Jan 18 01:09 0000000100000002000000FC
-rw------- 1 postgres postgres 16777216 Jan 19 04:18 0000000100000002000000FD
-rw------- 1 postgres postgres 16777216 Jan 19 04:18 0000000100000002000000FE
-rw------- 1 postgres postgres 16777216 Jan 20 06:18 0000000100000002000000FF
-rw------- 1 postgres postgres 16777216 Jan 20 06:18 000000010000000300000000
-rw------- 1 postgres postgres 16777216 Jan 21 03:16 000000010000000300000001
-rw------- 1 postgres postgres 16777216 Jan 21 03:16 000000010000000300000002
```

#### 当前使用的wal文件

pgsql 可能会一次创建多个 wal 文件, 然后从第一个开始使用, 所以有可能当前使用的wal文件比 pg_wal 目录下最大的文件编号要小

#### 查看当前 wal 文件

```sql
# 首先查看当前LSN
postgres=# SELECT pg_current_wal_lsn();
 pg_current_wal_lsn 
--------------------
 4/97000660
(1 row)

# 查看该LSN在哪个文件
postgres=# SELECT pg_walfile_name('4/97000660');
     pg_walfile_name      
--------------------------
 000000010000000400000097
(1 row)

# 组合查询
SELECT pg_walfile_name(pg_current_wal_lsn());
```

#### wal 日志文件中的数据结构

```
每16MB 大小的文件分为多个 8kb 大小的数据块
每 8kb 数据块中分: 一个页头 + 多个 XLOG record 事务记录日志
每一个 XLOG record 事务记录日志中又分为: Header + Data
```

#### wal 的 XLOG 记录包含有三种类型的数据

> 1. 数据块(Backup block)
> 2. DML 操作(经过格式化处理的 INSERT UPDATE 等 statement)
> 3. 检查点(CHECKPOINT)

#### wal 写文件触发时机

```
1. commit 提交时写 wal 日志文件
2. wal buffer 满了写 wal 文件
3. 藏块刷盘前, 写 wal 日志文件
```

#### wal 日志文件切换时机

```
1. wal 日志文件写满时切换
2. 手动触发: SELECT pg_switch_wal();
3. 配置参数: archive_mode - 基于主从复制需要时切换
```

#### wal 日志相关参数设置

#### 参数 - wal_keep_segments

```
最少保留多少个 wal 文件
```

#### 参数 - checkpoint_completion_target

```
默认为 0.5

# 公式
(( 2 + checkpoint_completion_target ) * checkpoint_segments + 1 )
```

#### wal 日志归档

```sql
-- 开启归档
ALTER SYSTEM SET archive_mod = on;

-- 设置归档命令
ALTER SYSTEM SET archive_command = 'cp %p /archives/%f'

-- %p 表示 wal 文件位置
-- %f 表示 wal 文件名保持原样
```

#### 其他 wal 参数

```
max_wal_size: 所有 wal 文件总的最大大小, 默认 1024MB
wal_segment_size: 单个 wal 文件最大大小, 默认 16MB
wal_buffer:   设置 wal 缓冲区大小, 默认 512KB
```
#### WAL 的 Full-Page Write 全页写

把数据块整个写入到WAL日志中, 是为了解决块不一致问题，保护数据的完整性
全页写会导致WAL日志膨胀, 增加额外I/O

**全页写控制参数**

```
# 默认启用状态
SELECT name,setting FROM pg_settings where name like 'full_page_writes';

# 如果文件系统能够实现 阻止部分写情况(不允许出现写半个数据块的情况), 则 pgsql 可以禁用全页写功能
```

全页写模式:
1. 非强制模式:
	最近一次检查点之后, 第一次修改的数据块会进行全页写, 在下一次检查点之前, 第二次开始, 之后的多次修改这一数据块改为记录事务到wal日志.  直到下一次检查点。
2. 强制模式:
	当用 pg_basebackup 备份时, 会自动执行强制模式, 备份期间, 被修改的数据块会全部写入WAL中。 (pg_basebackup 会自动调用 pg_start_backup() 函数)
3. 当执行 pg_start_backup() 函数时, 系统也会进入全页写模式。 执行 pg_stop_backup() 函数关闭全页写模式

## 检查点

### 检查点触发机制

1. 参数: checkpoint_timeout  # 默认 300 , 即每5分钟产生一次检查点
2. wal 日志超过 max_wal_size 大小
3. PostgreSQL 服务在 smart 或 fast 模式下关闭
4. 手动触发:  `SELECT pg_control_checkpoint();`

### 检查点参数调整

```toml
# 间隔多长时间产生一次检查点
checkpoint_timeout = 300

# 每次的检查点操作完成的时长 与 每次检查点时间间隔的比例。值范围 0 ~ 1, 默认 0.5 即默认 150 秒完成
checkpoint_completion_target = 0.7 

# 以上参数配置表示, 每 300 秒产生一次检查点. 每次检查点操作要在 300 * 0.7 = 210 秒完成。
# 如果每次检查点操作要刷盘的数据块太多, 会导致磁盘IO压力比较大, 影响数据库性能
# 适当调大 checkpoint_timeout 有可能会使同一个数据块的多次IO合并为一进行刷盘, 降低总体刷盘的IO压力
```

```toml
synchronous_commit = "on|local"

# 事务是否等待 wal 写入磁盘，再返回给客户端成功
# off    # 关闭， 不等待 wal 写入磁盘
# on    # 默认
# local  # 
# remote_write # 等待流复制的备节点接收到 wal 日志并写入备节点 wal buffer 缓存
# remote_apply # 等待流复制的备节点接收到 wal 日志, 完成事务回放, 并将 wal 日志写入磁盘文件

# 同步备机的名称参数
synchronous_standby_names = 
```

## 数据文件和块存储结构

#### 查看表对应的 oid 和 文件名

```sql
-- 首先查 db 的 oid (即 目录的名字)
SELECT datname, oid FROM pg_database;

-- 然后查表的oid和文件名
SELECT relname, oid, relfilenode FROM pg_class WHERE relname = 't1';

-- relname ： 表名
-- oid : 表oid
-- relfilenode : 对应在操作系统上的文件名. 在对表进行 TRUNCATE, REINDEX, CLUSTER 后, 会改变该值。导致与 oid 不一样。

-- 结合可以找到表在操作系统上的文件
```

#### 查看表的文件位置

```sql
SELECT pg_relation_filepath('t1');
```

```
18751      # 数据文件
18751_fsm  # Free Space Map 空闲空间地图(fsm), 所有数据块可用空间记录
18751_vm   # Visibility Map 可见性地图(vm),  vacuum 操作的时候用来提高操作效率

相关的三类文件在内部称为每个关系的分岔(fork)
	数据文件的 fork 号为: 0
	空闲文件的 fork 号为: 1
	可见性地图 fork 号为: 2
```


#### 查看数据块插件

```sql
-- pageinspect 可以看数据块中的行记录, 行头信息
CREATE EXTENSION pageinspect;

SELECT ip as tuple, t_xmin, t_xman, t_field3 as t_cid, t_ctid FROM heap_page_items(get_raw_page('t1', 0));

-- pg_freespacemap  插件: 监测块中空间使用情况, 可以做为是否要执行 full vacuum 操作的参考数据
```

## VACUUM

### vacuum 的作用

```
1. 移除死元组
	删除死元组并对每个页面的活元组进行碎片整理
	删除指向死元组的索引元组
	
2. 冷冻老的 txid - pg中事务ID(txid) 最大到 42亿。但只能用21亿
	必要时冻结老元组的 txid
	更新冻结的与系统目录( pg_database 和 pg_class ) 相关的 txid
	如有可能, 移除 clog 中不必要的部门
	
3. 其他
	更新已处理表的 FSM 和 VM
	更新几个统计数据 ( pg_stat_all_tables 等)
```

### vaccum 的处理流程

```
1. 从指定的表中获取每个表
2. 获取表的 ShareUpdateExclusiveLock 锁, 此锁允许其它事务读操作
3. 扫描所有页面以获取所有死元组, 必要时冻结旧元组
4. 如果存在, 则移除指向相应死元组的索引元组
5. 对表的每一页执行以下步骤:
	1. 移除死元组并重新分配页面中的活元组
	2. 更新目标青的相应 FSM 和 VM
6. 如果最后一页没有元组, 则截断最后一页。
7. 更新与目标表的真空处理相关的统计信息和系统目录。
8. 更新与真空处理相关的统计数据和系统目录
9. 如果可能的话, 删除不必要的文件和 clog 的页面
```

### clog 文件

clog 是提交日志, 记录事物的状态: 是提交状态，还是回滚状态, 还是运行状态

### Full VACUUM

> `Full VACUUM` 需要手动执行操作, `autovacuum` 不会自动执行

```
postgresql 会新创建表的数据文件, 将老数据文件中的块中有效数据写入新数据文件
```

### 查看当前数据块的使用情况

```sql
SELECT count(*) AS "number of pages", pg_size_pretty(cast(avg(avail) AS bigint)) AS "Av. freespace size", ROUND(100 * AVG(AVAIL)/8192, 2) AS "Av. freespace ratio" FROM pg_freespace('t1');

# 列解释
# number of pages : t1 表当前有多少个块
# Av. freespace size: t1 表中块空闲多少字节
# Av. freespace ratio: t1 表中块空闲比例
```

## Autovacuum Daemon

> 守护进程， autovacuum launcher 使用 stats collector 的后台进程收集的信息来确定 autovacuum 的候选表列表  
> autovacuum 要做两件事情: vacuum 和 analyze 

```toml
# auto vacuum 相关参数
# 这两个参数控制是否启用 autovacuum, 生产环境不能关闭
autovacuum = on
track_counts = on

vacuum_freeze_min_age # 惰性冻结使用, 默认 5千万, 超过这个值的事务将被冻结
# 举例
# 当前事物ID为: 2000,   vacuum_freeze_min_age 设置为: 1600
# 则 2000 - 1600 = 400 , 则小于 400 的事务ID将会被冻结

vacuum_freeze_table_age # 急性冻结使用, 默认1亿5千万

autovacuum_naptime # 多久执行一次, 默认1分钟
autovacuum_max_workers # 执行 autovacuum 的工作进程数量, 默认 3。 多个工作进程共用 autovacuum_vacuum_cost_limit 的资源限制

autovacuum_vacuum_threshold      # 下面因子计算完要加上这个权重, 默认 50
autovacuum_vacuum_scale_factor   # 表中死元组占比超过该值, 触发自动 vacuum, 默认 0.2
autovacuum_analyze_threshold     # 下面因子计算完要加上这个权重, 默认 50
autovacuum_analyze_scale_factor  # 表中被修改和写入的数据占总数据的比例超过该值, 触发自动 analyze, 默认 0.1

# autovacuum 对I/O的影响, 由以下几个参数控制
autovacuum_vacuum_cost_limit # 控制每次 autovacuum 使用的资源是多少, (-1, 200 等)
autovacuum_vacuum_cost_delay # 当 autovacuum 动作达到上面的资源限制时, 睡眠多久(20ms 等)
vacuum_cost_page_hit   # 读共享缓冲区中的页需要的成本(1)
vacuum_cost_page_miss  # 读不在共享缓冲区中的页需要的成本(10)
vacuum_cost_page_dirty # 在每一页中发现死元组时写入该页需要的成本(20)


log_autovacuum_min_duration # 记录 autovacuum 什么时候做, 操作了哪些表。默认 -1 不记录

# -1 表示不记录
# 0 表示记录所有的
# 250ms, 1s, 1min, 1h, 1d  表示只记录 vacuum 的时间超过该值的操作

# 共享池相关参数
shared_buffers = 256M
wal_buffers = 4M
effective_cache_size  # 默认 4G, 值越高, 优化器越倾向于走索引。不建议手动修改。
	提供一个可用于磁盘缓存的内存量的估量, 它只是一个建议值, 不会实际分配内存。 
bgwriter_delay # 后台写进程多长时间唤醒一次, 默认 200 毫秒
bgwriter_lru_maxpages # 后台进程每次最多刷新多少个块, 默认 100 个块


toast_max_chunk_size  # 最大的 chunk 大小, 默认 2KB
toast_tuple_targer    # toast压缩或移动超过该值的部分, 默认 2KB
```

#### 修改指定表的 autovacuum 因子

```sql
ALTER TABLE sch001.t1 SET (autovacuum_threshold = 10000);
ALTER TABLE sch001.t1 SET (autovacuum_vacuum_scale_factor = 0.1);

# 查看修改
\d+ sch001.t1
```

#### 为什么需要 autovacuum

```
1. 移除死元组, 防止死元组膨胀
2. 更新表的统计信息, 以便优化器使用
```

#### autovacuum 触发 vacuum 的触发条件

```
autovacuum vacuum thresold for a table = 
autovacuum_vacuum_scale_factor * number of tuples + autovacuum_vacuum_threshold 
```

#### autovacuum 触发 analyze 的触发条件

> 自上次分析以来插入/删除/更新总数超过此阈值的任何表都有资格进行  autovacuum analyze

```
autovacuum analyze threshold for a table = 
autovacuum_analyze_scale_factor * number of tuples + autovacuum_analyze_threshold
```

#### 查看表状态信息

```sql
SELECT * FROM pg_stat_all_tables where relname = 't1';
```

## 事务ID - TXID

事务ID 最大到 42亿,  但是只能用 21 亿。 用完之后重新从 0 开始

#### 查看当前TXID

```sql
SELECT txid_current();  # 每执行一次消耗一个 TXID, 但正常的 SELECT FROM t1 不会消耗 TXID
```

#### 行可见性规则

```
# 将42亿个 TxID 环绕成一个圆, 在当前TxID位置, 经过圆心将圆圈劈成两半, 
向身后倒走的 TxID 向前的 21 亿个 TxID 是 "过去的", 可见的
向身前正走的 21 亿个 TxID 是 "未来的", 不可见的
```

#### 冻结 TXID

```
冻结: 在每行数据的行头, 添加标记, 标记为冻结, 以打破环绕导致的前21亿不可见规则
解冻: 当对该行进行修改操作时, 解冻
```

```
# 惰性冻结 TxID 的定义:
	freezeLimit_txid = (OldestXmin - vacuum_freeze_min_age)

惰性模式 - lazy mode 
	AutoVacuum 操作会进行冻结操作, 每分钟都执行一次, 被选中的表都会进行vacuum 操作, 包含冻结 txid 内容. 满足(冻结 TxID 定义公式)条件的, 就会被冻结
	

# 急性冻结要满足的条件
	pg_database.datfrozenxid < ( OldestXmin - vacuum_freeze_table_age )
    # pg_database 字典表中的 datfrozenxid 字段记录曾经被冻结过的 txid。 默认 480 表示从来没有被急性冻结过

急性模式 - eager mode
```


## 事务隔离级别

#### 1. PostgreSQL 支持 3 个隔离级别

```
1. READ COMMITTED:  读已提交的事务
2. REPEATABLE READ: 可重复读
3. SERIALIZABLE:    序列化
```

#### 2. PostgreSQL 使用 多版本并发控制(MVCC) 实现事务隔离级别

```
PostgreSQL 勇过应用可见性检查规则来选择项目的适当版本
	由于 PostgreSQL 数据块中包含了未删除和已经删除的行的数据, 所以在读取数据块中行的时候, 需要一套规则来关系断哪些行能够被哪些事务所看得见, 我们称之为 - 行可见性规则
```

#### 3. 事务状态

```
事务状态一共有四种:
 - IN_PROGRESS
 - COMMITTED
 - ABORTED
 - SUB_COMMITTED
```

#### 4. 事务快照

```sql
-- 查看当前事务的快照
SELECT txid_current_snapshot();

-- 查看事务状态
SELECT txid_status(652);
```

#### 5. 以 RR 模式开启事物

```sql
START TRANSACTION ISOLATION LEVEL REPEATABLE READ;
```

## 可见性规则

#### 行头

```
t_xmin 保存插入此元组的事务的txid, 它的状态是行可见性判断关键的依据。
t_xmax 保存删除或更新此元组的事务的txid。如果此元组未被删除或更新, 则 t_max 设置为 0, 这意味着无效,  它的状态也是行也见性判断的关键依据
t_cid  当行在同一个事务里多次被修改时, 就会发生变化
t_ctid  标记被修改后, 跳到了哪一行
 
```

#### 闪回查询

```
1. 要实现闪回查询, 首先要设置参数, 控制 vacuum 时, 块中被删除的行保留的时长
```

#### clog 保存事务状态

```
用来记录事务号的状态, 主要是用来判断行的可见性。 
每个事务状态占用两个bit位。 
事务的状态有4种: IN PROGRESS, COMMITTED, ABORTED, SUB_COMMITTED。
CLOG 由一个或多个 8KB 页组成. 
CLOG 在逻辑上形成一个数组, 数组的每个元素对应事务ID号和事物状态

一个事务占用2个bit倍, 一个字节可以存放4个事务状态, 一个页块可以存放 8192 * 4 = 32768 个事务状态

当数据库启动时, 这些文件会被加载到内存中. CLOG 的信息同样会被记录到 wal 日志中, 当数据 库异常中断时, CLOG的信息会从 wal 日志还原。

CLOG 存放在缓存中, 当 checkpoint 时开始刷新到 CLOG 文件中.  当数据库关闭后, CLOG 会被写入到 $PGDATA/pg_xact 子目录中,  文件命名为 0000,0001,0002...., 单个文件最大为 256k
```

#### clog 的维护

```
数据库启动时, 加载 clog

# clog 写入 pg_xact 目录下文件的时机
1. 数据库正常关闭
2. 数据库产生检查点

Vacuum 进程会定期删除不需要的clog文件
```

#### 计算当前事务所使用的 clog 数据块的位置

```
1. 查看当前事务ID
	SELECT txid_current();  # 假如结果为: 2792228
	
2. 计算位置
	SELECT 2792228/8192*4 AS block;  # 结果为第 85 个块
	
3. 每个 clog 文件 256KB, 即 32个块。 第85个块在第 3 个 clog 文件中。 即在文件名为 0002 的文件中
```

## 内存

 PostgreSQL 通过缓冲区管理器管理内存， 缓冲区管理器分为三层

```
1. 缓冲表(buffer table layer): 
	是一个 hash table - bucket slots, 存放 Buffer_Tag 和 其在描述层的 buffer_id
	
2. 缓冲描述区(buffer descriptors layer)
	存放描述层数据结构数据, 数据中包括 Buffer_Tag 和 其在缓冲池的 buffer_id
	
3. 缓冲池(buffer pool layer)
	实际存放数据块的内存缓冲区
```

### 内存中的数据结构

#### 1. Buffer_Tag 数据结构

```
Buffer_Tag 是缓冲区表层和描述层会用到的一种数据结构
	示例: {(16821,16384,37721), 0, 7}

结构内容包括:
RelFileNode 描述了数据块的 (表对象oid, 数据库oid, 表空间oid)。
	示例中是: (16821,16384,37721)
fork number: 描述数据块的类型: [0: 表数据块, 1:可用空间地图块(FSM), 2: 可见性地图块(VM)]。
	示例中是: 0
number:      表示是数据文件中的第几个块。 
	示例中是: 7
```

#### 2. 描述层数据结构

```
结构内容包括:
Buffer_Tag
buffer_id   # 缓冲池的 buffer_id
refcount    # 被进程访问一次值 +1; 被时钟扫描一次值 -1; 为零时可以被老化淘汰出内存
usage_count # 使用的次数, 和 refcount 配合
context_lock/io_in_progress_lock
Flags:
  - dirty bit  # 被修改未刷盘
  - valid bit  # 未修改或修改后已经刷盘
  - io_in_progress bit  # 锁标志位
freeNext


# 当请求需要加载数据到内存, 而又缓冲池中又没有空闲块时, 会扫描缓冲池中的数据块是否可以踢出内存. 这就是时钟扫描, 时钟扫描时针对块的 refcount 做 -1 操作。 
如果第一次扫描没有块的 refcount 是 0, 则会继续下一次扫描, 直到扫描到为 0 的块并把他踢出内存
```

### 3 锁

#### 缓冲表锁

```
BufMappingLock 访问缓冲表时加锁, 在访问到数据块时解锁
```

#### 描述层数据结构中的锁

```
context_lock : 典型的访问限制锁。 分共享模式和独占模式
	共享模式: 读数据
	独占模式: 
	  - DML操作
	  - 物理删除元组或压缩存储页上的可用空间(vacuum 和 HOT处理)
	  - 冻结存储页中的元组

io_in_progress_lock :
	用于等待缓冲区上的I/O完成。 
	当 PostgreSQL 进程从存储器加载/写入页面数据时, 该进程在访问存储时待有相应描述符的独占 io_in_progress 锁。

spinlock : 修改描述层缓冲区时需要加的锁
	在对页面进行访问, 或者进行时钟扫描的时候
	修改 refcount 和 usage_count 的值时加 spinlock 锁
	在修改描述层脏标志位等信息也需要加 spinlock 锁
```

#### 缓冲池数据块

缓冲池中存放的数据块有以下几种类型的块

```
1. 数据文件页 - 表和索引块
2. 可用空间地图块
3. 可见性地图块
4. 缓冲区数组索引 - Buffer_ids
```

#### 缓冲区块替换机制

```
时钟扫描 (8.1 及以后的版本)
LRU 算法 (8.1 以前的版本)
```

### Ring Buffer

> 用完会释放掉

- Bulk-reading
	需要大块的缓冲池时, 如果扫描缓冲池超过 1/4 还没有找到, 则分配 256KB 环形缓冲区 
- Bulk-writing
	执行下面的SQL命令, 环形缓冲区大小为 16MB
		COPY FROM command
		CREATE TABLE AS command
		CREATE MATERIALIZED VIEW or REFRESH MATERIALIZED VIEW command
		ALTER TABLE command
- Vacuum-processing
	当自动 vacuum 进行处理时, 环缓冲区大小为 256KB

## TOAST 

全称: The OverSized Attribute Storage Technique (超大型属性存储技术)

对于用户来说不用关注这一技术实现, 使用上完全透明。

PostgreSQL 默认情况下每行(元组)的数据不允许跨页面存储。即每行数据不能超过 8KB

TOAST 适用于大对象管理,  是超长字段在 PostgreSQL 的一种存储方式, 它会将大字段值压缩或分散为多个物理行来存储。

支持 Toast 的数据类型应该是可变长度(variable-length)的类型
表中任何一个字段有 Toast, 这个表就会有一个相关联的 Toast 表, OID 被存储在 `pg_class.reltoastrelid` 里
超出的数值将会被分割为 chunks, 并且最多 toast_max_chunk_size 个字节, 默认 2KB 个字节

#### Toast 存储方式

```
PLAIN   避免压缩和行外存储
		只有非动态长度允许设置该方式, text等动态类型的字段不允许设置 PLAIN
		
MAIN    允许压缩, 尽量不进行行外存储, 压缩也无法满足时才会启动行外存储。

EXTENDED 允许行外存储和压缩。 先压缩, 如果还是太大, 就会行外存储, 默认是 EXTENDED

EXTERNAL 允许行外存储,禁止压缩。字段长度不满足 2KB 也会自动存放在行外块存储。 访问表时指定访问字段, 并且不经常访问 toast 字段, 则建议使用此存储方式
```

#### 示例

```
CREATE TABLE tt1(id int, name varchar(48), remark text);

# remark 是 text 类型, 如果行记录中该字段超过 2KB, 就会自动产生 toast 表来存储

# 修改 toast 的存储方式(一般情况不需要修改, 使用默认即可)
ALTER TABLE tt1 ALTER COLUMN remark SET STORAGE main;
```

#### Toast 表字段

```
chunk_id  表示 TOAST 表的 OID 字段
chunk_seq chunk 的序列号, 与 chunk_id 的组合唯一索引可以加速访问
chunk_data 存储 TOAST 表的实际数据
```

#### 查看 Toast 表

```
# toast 表默认放在了 pg_toast 这个 schema 下
SELECT relname, relfilenode, reltoastrelid FROM pg_class WHERE reltoastrelid in (SELECT reltoastrelid FROM pg_class WHERE relname='tt1');
```

## 窗口函数

也称 OLAP 函数或叫 分析函数
通过 PARTITION BY  分组后的记录集合称为 "窗口", 这里的窗口表示 "范围" 的意思
不指定 PARTITION BY 会将整个表当成一个"窗口"

窗口函数的应用场景

```
1. 用于分区排序
2. 动态 group by 
3. top N
4. 累计计算
5. 层次查询
```

### 创建函数分类

```
1. 聚合函数: SUM, AVG, COUNT, MAX, MIN
2. 专用窗口函数: RANK, DENSE_RANK, ROW_NUMBER

RANK : 计算排序时, 相同值会并列并占位, 比如 有两个第一名, 后一个就是第三名。
DENSE_RANK: 计算排序时, 相同值会并列, 但不会占位, 比如 有两个第一名, 后一个还是第二名
ROW_NUMBER: 计算排序时, 相同值不会并列, 比如: 两个相同值, 会是一个第一名, 一个第二名
```

### 使用方式

```
# 计算排名
SELECT ename, job, sal, 
	RANK() OVER (PARTITION BY job ORDER BY sal) AS rankin,
	DENSE_RANK() OVER (PARTITION BY job ORDER BY sal) AS dense_rank,
	DENSE_RANK() OVER (PARTITION BY job ORDER BY sal) AS row_rankin
FROM emp;

# 聚合函数求和.
# 这种方式 每行的 current_sum 值都是 上一行的 current_sum 值 + 当前行的 price 值
# 即将每行的累加值都列出来了
SELECT name, price, SUM(price) OVER (order by name) AS current_sum FROM product;

# 指定框架, 计算移动平均值
# 按 name 排序, 取当前行和当前行的前两行的 price 相加, 即把最近的3行记录相加再除以3取平均值
SELECT name,price, AVG(price) OVER (ORDER BY name ROWS 2 PRECEDING) AS moving_avg FROM product;


ROWS 指定前/后几行:
RANGE 选择范围:

PRECEDING 前面的行
FOLLOWING 后面的行

# 示例
ROWS 指定前/后几行:
ROWS BETWEEN 3 PRECEDING AND 3 FOLLOWING 表示当前行往前数3行到往后3行, 一共7行数据

RANGE 选择范围:
RANGE BETWEEN 3 PRECEDING AND 3 FOLLOWING 表示选取值在 [c3,c+3] 这个范围内的行, c为当前行。
```

## FDW 

Foreign Data Wrappers  是其他各种类型的数据库与PGSQL进行远程同步数据使用的一个插件
只有 pgsql to pgsql 才可以执行 UPDATE 和 DELETE 操作, 其他数据库只能 SELECT 和 INSERT

服务端做为实际存储数据的库。 可以是 PGSQL, MySQL, Oracle 等
客户端创建一个外部表映射到服务端的实际的表上。
在客户端的pgsql数据库里对外部表进行 SELECT, INSERT 等操作, 实际上是操作的服务端的表

#### 但看当前库有哪些 FDW 服务器

```
\des+
```

#### 将执行计划下推到远程服务器进行

```
# 第一次设置某一个参数不能有 SET
ALTER SERVER myfdw001 OPTION(use_remote_estimate 'on');

# 后续再操作该参数需要添加 SET
ALTER SERVER myfdw001 OPTION(SET use_remote_estimate 'off');
```

#### 从 pgsql 迁移到 pgsql

1. 需要在客户端安装插件

```
# 编译时需要编译源码目录 contrib 中的 postgres_fdw 插件
# 该扩展插件必须使用超级用户进行安装
create extension postgres_fdw;
```

2. 创建 fdw 服务器

```
CREATE SERVER myfdw001 FOREIGN DATA WRAPPER postgres_fdw OPTION(host 'pg-host01', port '5432', dbname 'testdb01');

OPTION 中的参数为要连接的远程 pgsql 实例的连接信息
host 远程pg实例的主机名或IP地址
port 远程pg实例的端口
dbname 远程pg实例中的库名
```

3. 授权

```
GRANT USAGE ON FOREIGN SERVER myfdw001 TO myfdw_user001;
```

4. 创建用户映射

```
# 将 myfdw_user001 用户映射为 server 端的 postgres 用户
CREATE USER MAPPING FOR myfdw_user001 SERVER pgdb OPTIONS (user 'postgres', password '123456');
```

5. 创建外部表

```
# 需要使用 myfdw_user001 用户连接到客户端pgsql库,然后进行操作
# 指定使用 server 端的哪一价目表, 并且当前的表结构要与 server 端的表结构要相同
CREATE FOREIGN TABLE emp_fdw (
EMPNO int,
ENAME varchar(10),
...
) SERVER myfdw001 OPTIONS (schema_name 'public', table_name 'emp');
```

#### 迁移表到客户端实例

```
CREATE TABLE emp as SELECT * FROM emp_fdw;
```


### 创建本地外部表

#### 将本地的 emp.csv 格式的文件映射为 pgsql 实例外部表

```
CREATE EXTENSION file_fdw;

CREATE SERVER pg_file_server001 FOREIGN DATA WRAPPER file_fdw;

CREATE FOREIGN TABLE emp file_fdw (
EMPNO int,
ENAME varchar(10),
...
) SERVER pg_file_server001 OPTION(filename '/data/emp.csv', format 'csv', header 'true', delimiter ',');
```

## 索引内部结构

```
pgsql 指定的索引:
btree
hash
gin
gist
sp-gist
brin
bloom
rum
zombodb
bitmap(greenplum extend)
```

pg 内部还支持 BitmapAnd, BitmapOr 的优化方法, 可以合并多个索引的扫描操作，从而提升多个索引数据访问的效率

#### 查看索引信息

```sql
-- 查看索引 meta 信息
SELECT * FROM BT_METAP('t1_pkey');

-- 查看指定的索引块的状态信息
-- 1 是索引块号, 比如meta信息中记录的索引 root 块是 1, 则这里查的就是索引的根块信息
SELECT * FROM bt_page_stats('t1_pkey', 1);  

-- 查看指定索引块的内容
-- 内容包含行ID(ctid) 和 索引字段的值
SELECT * FROM bt_page_items('t1_pkey', 1);  

-- 根据 ctid 查找表记录
SELECT * FROM t1 where ctid='(0,1)';
```

#### 重建索引

```sql
REINDEX INDEX t1_pkey;
```

## 执行计划与成本

### SQL 执行的5步骤

```
解析器 - 从SQL语句生成解析树
分析器 - 对解析树执行语义分析, 生成查询树
重写器 - 使用存储在规则系统中的规则, 转换查询树
规划器 - 计划者从查询树生成可以最有效地执行的计划做
执行器 - 执行器通过按计划树创建的顺序访问表和索引来执行查询
```

成本估算相关参数

```toml
# HDD 硬盘:
	seq_page_cost = 1.0  # 默认
	random_page_cost = 4.0 # 默认

# SSD 硬盘:
	seq_page_cost = 1.0  # 默认
	random_page_cost = 1.0 # SSD盘随机访问调整为和顺序访问一样

```

## 多表连接

多表连接方式

```
Nested Loop Join 嵌套循环连接
Merge Join
Hash Join 哈希连接
```

#### 开启 join 方式的参数

```sql
SET enable_hashjoin=on;
SET enable_mergejoin=on;
```

#### 查看表索引的关联度

```
SELECT tablename, attname, correlation FROM pg_stats WHERE tablename = 't1';

# 如果 correlation 值太低: 比如: 0.001  则可以将表中的数据按索引的字段的值重新顺序插入。 这样可以将 correlation 的值调整到接近1,  调整后的效果会极大优化以该索引进行范围查询的SQL语句
```

## 调优工具 - 日志分析器: pgBadger 

pgBadger 是一个 PostgreSQL 日志分析器, 