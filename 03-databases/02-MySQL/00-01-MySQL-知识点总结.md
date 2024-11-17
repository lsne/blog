# Mysql 知识点总结


## 改表工具: pt gh-ost

## 新特性

| 版本               | 新特性                                                                                                         |
| ---------------- | ----------------------------------------------------------------------------------------------------------- |
|                  |                                                                                                             |
| mysql8.0.22？21   | GTID支持 create table select                                                                                  |
| mysql8.0         | 副本集模式还未实现                                                                                                   |
| mysql8.0.22      | start slave 改成 start replica                                                                                |
| mysql8.0         | 默认字符集从latin1变成了utf8mb4                                                                                      |
| mysql8.0         | 事物性数据字典,系统表全部改为innodb引擎的表,新实例不包含任何MyISAM表, .frm db.opt等都删除了                                                 |
| mysql 8.0        | 创建用户需要分开执行 create user / grant all . 直接授权时设置密码会提示语法错误                                                       |
| mysql8.0         | 增加角色管理, 一个角色是多个权限的集合                                                                                        |
| mysql8.0         | 专门端口用于管理连接，当连接数打满时可以用于连接数据库进行管理                                                                             |
| mysql8.0         | 隐藏索引,降序索引,函数索引. 不在对group by 进行隐式排序,如需要排序，必须显式加上order by 子句                                                  |
| mysql8.0         | 原子DDL操作, drop table t1,t2; 如果t2不存在,则t1不会被删除                                                                 |
| mysql8.0         | 自增列持久化, 写入到redo log, 不会出现自增列值重复问题                                                                           |
|                  |                                                                                                             |
| mysql5.7.17      | MGR 组复制                                                                                                     |
| mysql5.7         | 主从同步 order\_commit binlog 多了last\_commit,从库根据last\_commit分组进行多线程复制                                          |
| mysql5.7         | 默认使用Dynamic 行格式, 大字段只在原记录保存20个字节的指针, 之前是用compact格式,原记录保存768字节的前缀                                            |
| mysql5.7         | 新增 sys 库, 结合 information 和 performance 整理出让人容易理解的结果                                                         |
| mysql5.7         | 多源复制(即多个主库)                                                                                                 |
| mysql5.7         | 批量页面刷盘, 双写机制新增加了一个文件,用innodb\_parallel\_doublewrite\_path 参数控制                                              |
| mysql5.7         | 的线ddl ,rename index name. 好像不能是主键                                                                           |
| mysql5.7.6       | 内置ngram全文解析器,全文索引支持中文,日文,韩文分词                                                                               |
| mysql5.6         | 多线程同步-分库                                                                                                    |
| mysql5.6         | GTID 复制                                                                                                     |
| mysql5.6         | Online DDL                                                                                                  |
| mysql5.6         | master.info relay-log.info 可以存储在表里                                                                          |
| mysql5.6         | 开始支持延迟复制                                                                                                    |
| mysql5.6         | innodb也开始支持全文索引                                                                                             |
| mysql5.6         | Multi-Range Read 范围查询,按辅助索引取出索引值后,再按主键顺序排序,然后取数据页. 可以合并数据页.减少热数据页换出                                         |
| mysql5.6         | Index Condition Pushdown (ICP), 在判断条件的同时判断是否可以进行where条件过滤,将过滤操作放到了存储引擎层, 像 like '%abc%', 过滤的前提是条件是索引可以覆盖的范围 |
| mysql5.6         | 组提交(group commit)???                                                                                        |
|                  |                                                                                                             |
| mysql5.5         | 新增 performance\_schema 库,用于收集数据库性能参数                                                                        |

## 工作中遇到的问题

| 版本               | 问题以及原因                                                                                                                                                              | 解决方法                                                                                                          |    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | :- |
|                  |                                                                                                                                                                     |                                                                                                               |    |
| mysql            | 一个表多次创建索引                                                                                                                                                           | 把所有创建删除索引操作放到一个sql执行                                                                                          |    |
| mysql5.6         | 5.6中主库大量写操作,导致从库延迟                                                                                                                                                  | 5.6也没有什么好办法,先跟业务商量下看能不能做肖峰处理,我们公司也没有上5.7版本,如果有的话可以直接升级到5.7版本, 5.7版本有ordered\_commit提交,从库根据last\_commit进行多线程同步 |    |
| mysql5.6         | 大量删除,没有主键,ROW格式BINLOG.导致从库延迟非常大                                                                                                                                     | 因为从库没有索引,所以对于同步过来的每一行记录都需要全表扫描                                                                                |    |
| mysql5.6         | 有外键的表,更新A表,阻塞B表的情况                                                                                                                                                  |                                                                                                               |    |
| mysql5.6         | 小版本问题, mysql5.6.35 没问题, 迁移到 mysql5.6.47 导致 数据丢失切不报错, 因为5.6.47的 load data 有问题                                                                                        |                                                                                                               |    |
| mysql5.6         | enum('F','M','N') 枚举字段, 但是值为空字符串'',gh-ost改表失败                                                                                                                       |                                                                                                               |    |
| mysql5.6         | --set-gtid-purged=OFF                                                                                                                                               |                                                                                                               |    |
| mysql5.6         | mysqldump 导出后,  用mysql < a.sql 导入, 由于没有用户,导致视图导入失败 DEFINER=`eolinkertest`@`10.249.175.16`                                                                           | 修改为新库有的用户和IP后解决                                                                                               |    |
| mysql5.6         | 主从都开启event导致同步问题                                                                                                                                                    | 将从库event禁用                                                                                                    |    |
| mysql5.6         | 1709 - Index column size too large. The maximum column size is 767 bytes., Time: 0.034000s   | set global innodb_file_format = BARRACUDA; set global innodb_large_prefix = ON; CREATE TABLE ROW_FORMAT=DYNAMIC;                                                                                                  |    |
| mysql5.6         | mysqldump: Error 2020: Got packet bigger than 'max\_allowed\_packet'                                                                                                | mysqldump 命令加参数 --max\_allowed\_packet=1024M                                                                  |    |
| mysql5.6         | mysqldump: Error 2013: Lost connection to MySQL server during query when dumping table `mail` at row: 1754283                                                       | set global net\_write\_timeout = 28800; set global net\_read\_timeout = 28800;                                |    |
| mysql5.7         | mysqldump: Error 2013: Lost connection to MySQL server during query when dumping table `mail` at row: 1754283                                                       | innodb_force_recovery 启动后, mysqldump 报错, repair, optimeze 全失败, 只能忽略该表进行备份                                |    |
| mysql5.6         | mysql < a.sql 导数据出现 MySQL SERVER has gone away                                                                                                                      | set global max\_allowed\_packet= 1024*1024*1024;                                                              |    |
| mysql 5.6        | innodb\_large\_prefix=ON 还是报错 Index column size too large                                                                                                           | 创建表时加上 ROW\_FORMAT=DYNAMIC                                                                                    |    |
| mysql 5.7        | 自增主键用完, 导致 on duplicate key update 失效                                                                                                                               | 解决: alter table host modify column id bigint unsigned not null auto\_increment;                               |    |
| mysql5.7         | 应用出问题,频繁重启,导致频繁连接mysql过程中中断,报错 mysql  Host '' is blocked because of many connection errors;                                                                         | 解决办法: set global max\_connect\_errors = 500; flush hosts;                                                     |    |
| mysql8.0         | 将 mysqldmp时不加 gtid-purge参数的备份导入mysql后, mysql从库同步异常                                                                                                                  | 重做从库                                                                                                          |    |
| mysql8.0         | clone 插件                                                                                                                                                            | 不同步 myisam表,也不报错                                                                                              |    |
| mysql8.0         | 主从都有定时任务, 导致同步IO线程中断, 主从的binlog里都有这个删除操作的事务, 从库自己定时任务里执行了删除操作，又接收到主库传过来的删除操作                                                                                        | 从库关闭计划任务进程                                                                                                    |    |
| mysql8.0         | 开启binlog后,创建函数或触发器需要super权限                                                                                                                                         | 要么创建函数时指定函数类型, 要么将log\_bin\_trust\_function\_creators 参数设置为1(有可能会导致主从有问题)                                     |    |
| mysql8.0         |  Waiting for table metadata lock   | select * from  information_schema.innodb_trx; 然后kill运行的事务
| mysql8.0         | sql 不走where索引, 去走了order by 字段的索引, 非常慢, 必须用force强制走where里的索引                                                                                                         | 用force index解决, 看下面的例1                                                                                        |    |
| mysql8.0         | join sql 在mysql5.6版本 0.03秒, 在mysql8.0 要 13秒                                                                                                                         | set global optimizer\_switch='derived\_merge=off'; 后正常; 该参数用来控制优化器是否合并衍生表或视图的。作用就是对join (select)表连接合并         |    |
| golang web       | 返回值有可能是nil 有可能是空map， 所以要统一，不然返回调用端不好处理                                                                                                                              |                                                                                                               |    |
| mysql8.0         | php 连 8.0的utf8mb4 有问题, 需要修改, 但官方写的动态参数, 我 set global 后不生效, 重启数据库后生效                                                                                                 | 怀疑是官方bug。  应用是直接连不上，不存在没有新建连接问题                                                                               |    |
| mysql8.0         | mysqlimport: Error: 1227 Access denied; you need (at least one of) the SUPER, SYSTEM\_VARIABLES\_ADMIN or SESSION\_VARIABLES\_ADMIN privilege(s) for this operation | GRANT SESSION\_VARIABLES\_ADMIN ON *.* TO 'user'@'specific-host';                                             |    |
| mysql5.7         | dyhinc 行格式 265个字段导致报错 8126 长度限制                                                                                                                                     | 一个块 16K, 一个块至少要存两行数据。 但是可以设置 set innodb_strict_mode = off; 取消严格模式进行创建。 这样会执行成功并且给出一个 warning。 严重不建议                                                               |    |
| mysql 8.0        | alter table 后 Waiting for table metadata lock 问题                                                                                                                    | alter 时有大量事务导致                                                                                                |    |

    例1:
    SELECT * FROM `ytc_ip_address` WHERE ip_start_int <= 908379413 and ip_start_int >= 908279413 and ip_end_int >= 908379413 and ip_end_int <= 908479413 ORDER BY `ytc_ip_address`.`es_id` LIMIT 1

    如果where有索引，order by也有索引, 默认情况下，先执行where，扫描用到的索引，找出符合条件的行，再按照order by在内存中进行排序。

    但是如果在1的情况下，有limit，并且limit比较小, 则会先执行order by，扫描用到的索引，再回表判断where是否符合条件。取够limit条符合条件的行就返回了，并不会扫描完所有索引。

    优化方式用强制索引 force index()
    SELECT * FROM `ytc_ip_address` force index(wangzhicheng_start) WHERE ip_start_int <= 908379413 and ip_start_int >= 908279413 and ip_end_int >= 908379413 and ip_end_int <= 908479413 ORDER BY `ytc_ip_address`.`es_id` LIMIT 1;

## 基础知识

### 参数

| 参数                                       | 值                       | 说明                                                                                  |
| ---------------------------------------- | ----------------------- | ----------------------------------------------------------------------------------- |
| innodb\_fast\_shutdown                   | 1                       | 数据库关闭时,将所有脏页刷新到磁盘                                                                   |
| innodb\_lru\_scan\_depth                 | 1024                    | LRU列表中可用页的数量                                                                        |
| innodb\_max\_dirty\_pages\_pct           | 75                      | 缓冲池中脏页的最大比例,超过后,强制checkpoint                                                        |
| innodb\_io\_capacity                     | 200                     | 磁盘IO的吞吐量(即每次刷新脏页的数量),默认200 (每次合并插入缓冲的数据为这个值的 5%)                                    |
| innodb\_adaptive\_flushing               |                         | 自适应刷新 脏页在buffer pool占比例比设置的小时,根据redo log 生成的快慢也做一定的刷新                               |
| innodb\_purge\_batch\_size               | 20                      | 每次full purge 回收undo页的数量                                                             |
| innodb\_change\_buffering                | all                     | 控制开启的change buffer,默认all为开启所有(inserts,deletes,purges,changes,all,none)              |
| innodb\_change\_buffer\_max\_size        | 25                      | change buffer最大使用内存的数量, 默认25表示最大使用buffer pool的 1/4                                  |
| innodb\_flush\_neighbors                 | 0                       | 刷新一个页时,会检查所在区(extent)的所有页,如果是脏页,一起刷新.固态硬盘建议设置为 0 关闭此特性                              |
| innodb\_file\_per\_table                 | ON                      | 每个表一个表空间,.ibd文件                                                                     |
| innodb\_online\_alter\_log\_max\_size    | 128M                    | 5.6版本在线改表缓冲大小                                                                       |
| innodb\_old\_blocks\_pct                 |                         | midpoint 在LRU列表中的位置,默认5/8, 可以设置为 37                                                 |
| innodb\_old\_blocks\_time                |                         | 页读取到Midpoint位置后,要等多久才会被加入到LRU列表的热端, 比如设置为 1000                                      |
| innodb\_stats\_persistent                | OFF                     | 是否将analyze table统计结果保存到磁盘上                                                          |
| innodb\_stats\_on\_metadata              | OFF                     | 执行show index from 等元数据相关命令时,是否重新计算统计信息                                              |
| innodb\_stats\_persistent\_sample\_pages | 20                      | 如果 innodb\_stats\_persistent 设置为 NO ,表示执行analyze table 时,每次采样页数量                    |
| innodb\_stats\_transient\_sample\_pages  | 8                       | 表示每次采样的页数量, 包括执行show index 等命令                                                      |
| read\_rnd\_buffer\_size                  | 256k                    | 设置 Multi-Range Read 时的缓冲区大小                                                         |
| innodb\_autoinc\_lock\_mode              | 1                       | 如果设置为2,任何插入语句都是通过互斥量进行自增的,但这样对statement的binlog格式复制有可能出现从库数据不一致问题,所以必须使用row格式的binlog |
| innodb\_locks\_unsafe\_for\_binlog       | 1                       | 关闭间隙锁(gap lock)                                                                     |
| innodb\_lock\_wait\_timeout              | 50                      | 锁等待超时                                                                               |
| innodb\_rollback\_on\_timeout            | 1                       | 锁等待超时是否回滚                                                                           |
| slave\_parallel\_type                    | database/logical\_clock | 主从并行复制模式                                                                            |
| innodb\_autoinc\_lock\_mode              | 1                       | 自增长模式,默认为1                                                                          |
| binlog\_max\_flush\_queue\_time          | 0                       | 默认0, 推荐默认,用来控制组提交 flush阶段中等待的时间                                                     |
| innodb\_doublewrite\_batch\_size         | 120                     | 每个buffer pool 实例里的每个双写缓存的大小(单位页)                                                    |

### 常用命令

| 命令                       | 表                           | 说明                   |
| ------------------------ | --------------------------- | -------------------- |
| show engines\G           | information\_schema.engines | 查看当前mysql所支持的存储引擎    |
| show index from \<table> |                             | 查看索引                 |
| analyze table            |                             | 重新统计表索引的Cardinality值 |
| flush privileges         | 刷新授权表                       |                      |

### 连接方式

| 连接方式      | 说明                     |
| --------- | ---------------------- |
| TCP/IP套接字 | mysql会先检查一张权限视图 (user) |
| UNIX域套接字  | 不是一个网络协议               |

### 行记录格式

    Antelope:  
        Compact  
        Redundant  
    Barracuda:  
        Compressed  
        Dynamic  

    新记录格式对于BLOB等大类型,只保留20个字节的指针,老格式保留768节点的前缀  

### 数据页的结构

    File Header 文件头  
    Page Header 页头  
    Infimun 和 Supremum Records  
    User Records  
    Free Space  
    Page Directory  
    File Trailer     (存储校验checksum信息和LSN,来判断页中数据的一致性和是否有损坏, innodb每次从磁盘取页都会做checksum检查)   

### ACID

原子性 atomicity\
一致性 consistency\
隔离性 isolation\
持久性 durability

### profile 记录每个SQL在mysql内部执行的各个阶段的资源消耗情况

耗时\
cpu消耗\
I/O消耗\
page faults\
CS

### ssd iops高的盘,参数调优

```
1. innodb_flush_neighbors = 0 # 关闭邻近页刷新功能
2. innodb_io_capacity  # 调大IO吞吐量参数, 每秒刷盘时, 刷新脏页的数量
```

### 锁

    状态:  
        %table_locks_immediate% 立即获取锁
        %table_locks_waited%   表锁等待
        innodb_row_lock_waits
        Innodb_row_lock_current_waits

    服务器层加锁:
        lock tables t1 read[,write];

    创建锁监控表,排查锁问题
        use test;
        create table innodb_lock_monitor(a int) engine=innodb;
        show [engine] innodb status\G;
        tail –f mysql.err

    IS 意向共享锁  
    IX 意向排他锁  
    S  共享锁  
    X  排他锁  
    GAP 间隙锁  锁定一个范围  
    Next-Key Lock: 锁定一个范围,并且锁定 记录本身   
    AUTO-INC locking    自增锁  采用了一种特殊的表锁机制,执行完需要自增长值的sql语句后立即释放  
        获取方式 select max(auto_inc_col) from t for update; 然后+1  
        自增长的列必须是单列索引(或第一列为自增列的复合索引), 一个表只能有一个自增列  
        5.1.22 开始  轻量级互斥量的自增长实现机制, 用参数 innodb_autoinc_lock_mode 控制参数选项:  
            0 : 5.1.22 版本之前的实现方式,用AUTO-INC Locking  
            1 : 对在插入前能确定插入行数的操作, 会用互斥量(mutex), 对内存中的计数器进行累加  
                对不确定行数的,还是用AUTO-INC Locking, 这个锁不释放. 对内存计数器方式的操作也不能执行  
            2 : 所有类型操作都用互斥量,但会有两个问题: 
                1. 对于批量导入不确定行数的操作,自增长的值可能不是连续的  
                2. 基于statement语句格式的复制,会出现问题.必须用row格式  

    外键  
        1. 如果外键没有加索引, innodb会自动加一个索引  
        2. 对于外键的插入或更新,会对父表select加 lock in share mode, 而不是非锁定读  

    一致性非锁定读 -- 在读已经提交的,和可重复读隔离级别下的默认读方式,但读快照的定义不同  

    幻像问题:  
        如果session A 执行 select * from t where a > 2 for update;  
        这时session B insert 4;  
        如果没有间隙锁, 则A只锁定了 大于 2 的表里已经存在的现有记录, 所以A再次执行同样的查询时,结果会不一样.  
        但 for update就是为了不允许其他事物更新而使自己在本事物内结果一致的.  
        现在其他事物影响了自己的查询结果. 这样的结果是不可取的  
        所以有了间隙锁  

    MVCC 多版本并发控制 
    隔离级别  
        读未提交事物 脏读  
        读已经提交事物 不可重复读  
        可重复读  
        序列化  

### 线程独享缓冲

binlog\_cache\_size  默认32K?? 1-2M\
thread\_stack\
sort\_buffer\_size\
join\_buffer\_size\
net\_buffer\_length #客户端返回结果集缓存, 最大为 max\_allowed\_packet 参数大小\
Max\_allowed\_packet\
tmp\_table\_size\
bulk\_insert\_buffer\_size

read\_buffer\_size\
read\_rnd\_buffer\_size

### 线程共享

query\_cache\_size\
thread\_cache\_size\
table\_open\_cache\
table\_definition\_cache

innodb\_buffer\_pool\_size\
innodb\_additional\_mem\_pool\_size\
innodb\_log\_buffer\_size  8-16M

key\_buffer\_size

\###　sys 库

sys库是 information\_schema 和 performance\_schema 的结合,开启 performance\_schema 库会使mysql整体性能下降10%. 谨慎使用

| 表                                    | 用途           |
| ------------------------------------ | ------------ |
| schema\_table\_statistics            | 可以查看表访问量情况   |
| schema\_redundant\_indexes           | 冗余索引         |
| schema\_unused\_indexes              | 未使用索引        |
| schema\_auto\_increment\_columns     | 表自增ID监控      |
| statements\_with\_full\_table\_scans | 监控全表扫描的sql语句 |
| io\_global\_by\_file\_by\_bytes      | 磁盘IO消耗情况     |

### 数据组织方式

    表空间  
    段(segment)  
    区,或叫簇.一个区就是1M的空间,即64个块. innodb一次申请4~5个区来保证区中页的连续性  
    页,默认16K  

### 数据页

    文件头
    块头
    数据区
    空闲区
    数据目录
    块尾

### redo log 页

    块头
    块体
    块尾

### IO线程默认10个, 1个 insert buffere ,一个 log ,4个读,4个写

### 其他

1.  cardinality 触发条件\
    自上次统计后,表中1/16的数据已经发生过变化\
    stat\_modified\_counter > 2000 000 000,  表中记录发生变化的次数大于20亿\
    执行show index from table; show table status; 语句 以及访问 formation\_schema下的tables和statistics会触发统计(如果innodb\_stats\_on\_metadata)

## Mysql 复制

    sql_slave_skip_counter = 1  
    等于1时,跳过到遇到commit或rollback为止  
    大于1时,跳过event,直到为1时,看上一条规则执行  

    master.info  已经保存到relay log 里的主库上的binlog点位
    relay-log.info 保存从库已经把relay-log重放到哪里的点位

    binlog_cache_disk_use
    binlog_cache_use

## Mysql GTID复制

### 跳过一个事物

    stop slave;  
    set GTID_NEXT='b2a4xxxxx:8';  
    begin;commit;  
    set GTID_NEXT='AUTOMATIC';  
    start slave;  

### 切主

    stop slave;  
    change master to master_host='',master_port=3306,MASTER_USER='replica',MASTER_PASSWORD='<password>',master_auto_position=1;  
    start slave;  

### 5.7.6 版本 在线将传统方式的复制改为gtid复制

    1. 所有机器上设置 SET @@GLOBAL.ENFORCE_GTID_CONSISTENCY = WARN;  #所有事物都允许违反GTID一致性  
    2. 所有机器上设置 SET @@GLOBAL.ENFORCE_GTID_CONSISTENCY = ON;    #所有事物都不能违反GTID一致性  
    3. 所有机器上设置 SET @@GLOBAL.GTID_MODE=OFF_PERMISSIVE;  #新的事物是匿名的,同时允许复制的事物是GTID或匿名的  
    4. 所有机器上设置 SET @@GLOBAL.GTID_MODE=ON_PERMISSIVE;   #新的事物使用GTID,同时允许复制的事物是GTID或匿名的  
    5. 查询所有从库,等待 show status like 'ONGOING_ANONYMOUS_TRANSACTION_COUNT'; 为0 #表示已经标记为匿名的正在进行的事物数量,必须为0  
    6. 所有机器 上设置 SET @@GLOBAL.GTID_MODE=NO;  #开启GTID  
    7. 修改my.cnf配置文件, enforce_gtid_consistency = 1; gtid_mode=NO;  #保证重启生效  
    8. stop slave; change master to master_auto_position=1;start slave;  

### GTID 限制

    事物中混合多个存储引擎,会产生多个GTID  
    主从库的表存储引擎不一致,会导致数据不一致(如果引擎一个是事物形的,一个是非事物的.会导致事务和GTID之间一对一的关系被破坏)  
    GTID 不支持 create table ... select 语句  
    不支持create temporary table; drop temporary table;  
    不推荐运行 mysql_upgrade 命令; 这个命令会更新myisam引擎的表  

## Mysql MGR

### 三个基本操作

    创建组  
    加入组  
    离开组  

### 复制模式

    单主模式 - MGR 可以只在一个主上写,其他从库进行复制操作  
    多主模式 - MGR 也可以在多个实例上进行写操作. 组内所有实例互相复制  

### 前提条件

        server_id = 1;  

    开启binlog和relaylog,并设置row格式,并关闭checksum:  
        log_bin = binlog  
        binlog_format = ROW  
        binlog_checksum = NONE   #不支持  
        log_slave_updates = ON  
        relay_log = relay-log  

    开启GTID:  
        gtid_mode = ON  
        enforce_gtid_consistency = ON  

    使用系统表存储slave信息:  
        master_info_repository = TABLE  
        relay_log_info_repository = TABLE  

    开启并行复制:  
        SET GLOBAL slave_parallel_type = 'LOGICAL_CLOCK'  
        SET GLOBAL slave_parallel_workers = <线程数量>  
        SET GLOBAL slave_parallel_commit_order = NO  

    开启主键信息采集功能:  
        transaction_write_set_extraction = XXHASH64  

### 插件使用

    加载插件  
        INSTALL PLUGIN group_replication SONAME 'group_replication.so';  

    启用插件  
        START GROUP_REPLICATION;  
        #这个命令将本mysql加入到 个存在的组内,或初始化为新组的第一个成员  

    停用插件  
        STOP GROUP_REPLICATION;  

### 参数设置

    设置组名  
        SET GLOBAL group_replication_group_name = <a uuid>  
        #必须是一个UUID  
      
    设置成员的本地地址  
        SET group_replication_local_address = ip:port  

## Mysql Innodb 引擎原理

### 名词解释

| 名词                   | 解释                                                        |
| -------------------- | --------------------------------------------------------- |
| innodb\_buffer\_pool | 可以用 information\_schema.innodb\_buffer\_pool\_status 查看状态 |
| Free列表               |                                                           |
| LRU列表                | 可以用 information\_schema.innodb\_buffer\_pool\_status 查看状态 |
| unzip\_LRU           | 压缩LRU被包含在LRU里面,也可以通过上面的表进行查看,where compressd\_size <> 0   |
| Flush列表              | 脏页同样存在LRU列表里,也可以通过上面的表进行查看,where oldest\_modiication > 0  |

### 事物

    1. redo log 保证事物的持久性  
    2. undo 保证原子性,一致性, 隔离性  
    3. 回滚不是恢复,而是执行与原操作相反的操作来使数据变的和之前的版本一样  
    4. undo 分两种:  
        insert undo log 因为 insert操作的记录保对本事物可见. 所以可在事物提交后直接删除  
        update updo log 包括delete, 需要判断能不能删除,用purge定期删除  

### 组提交

    1. 5.6之前,开启binlog会使组提交失效,因为为了保证binlog和redolog顺序一致, 启用了一个锁(prepare_commit_mutex)   
    2. 导致在一个事物的redolog刷盘时, 其他事物不能进行行写入redolog buffer操作,导致mysql性能变慢  
    3. 5.6 版本,移除了这个锁, Binary Log Group Commit (BLGC)  
    4. 该模式的实现方式是将事物的提交过程分为几个步骤来完成  
    5. 按顺序将事物放入一个队列中, 第一个为leader, 控制着之后的所有follower
    6. flush 阶段,将每个事物的二进制日志写入内存中
    7. Sync阶段,将内存中的二进制日志刷新到磁盘,若队列中有多个事物,那么仅一次fsync就完成所有事物的二进制日志的写入
    8. commit阶段,leader根据顺序调用存储引擎层事物的提交,innodb

### redo log buffer 刷盘

    1. Master 线程每一秒将重做日志缓冲区刷新到重做日志文件  
    2. 每个事物提交时  
    3. 重做日志缓冲区剩余空间小于1/2时  

    4. MTR 物理事物, 事物中包括页面数据变量和redolog变量.
    5. 页面数据变量和redolog变量更新后. 做物理事物的提交(这时用户还没有执行commit)会把redolog变量里的记录刷新到 redo log buffer 
    6. 所以, 数据的修改,在内存中是先修改数据页, 再在redo log buffer里产生日志的

### checkpoint

    1. 缩短数据库恢复时间  
    2. 缓冲池不够用时,将脏页刷新到磁盘  
    3. 重做日志不可用时,将脏页刷新到磁盘  
    4. Sharp checkpoint 数据库关闭时,将所有脏页刷新回磁盘(innodb_fast_shutdown = 1)  
    5. Fuzzy checkpoint 只刷新一部分脏页  

#### Fuzzy checkpoint 的几种情况

    |场景|说明|  
    |-|-|  
    | Master Thread | 每秒 或 每10秒 刷新脏页列表中一定比例的脏页回磁盘 (应该是只有每10秒的时候产生检查点)|  
    | FLUSH_LRU_LIST | LRU中需要有差不多100个空闲页可供使用(1.2.x版本改用参数控制,默认1024), 如果没有,移除LRU尾端的页. 如果被移除的页有脏页,则需要进行checkpoint |  
    | Async/Sync Flush | 重做日志文件不可用,需要强制将一些页刷新回磁盘 |  
    | Dirty page too much | 脏页数量太多,参数 innodb_max_dirty_pages_pct 控制|  

### Master Thread 工作方式

    由多个loop循环组成: 主循环(loop), 后台循环(backgroup loop), 刷新循环(flush loop), 暂停循环(suspend loop)  
    根据运行状态在几个loop中进行切换  

    主loop:  
        每秒一次的操作:  
            日志缓冲刷新到磁盘, 即使这个事物还没有提交(总是)  
            合并插入缓冲(可能)  
            到多刷新100个脏页到磁盘(可能)  
            如果没有用户活动,切换到backupgroup loop(可能)  

        每10秒一次的操作:  
            刷新100个脏页到磁盘(可能)  
            将日志换成刷新到磁盘(总是)  
            删除无用的undo页(总是)  
            刷新100个或者10个脏页到磁盘(总是)  

    后台循环:  
        删除无用的undo(总是)  
        合并20个插入缓冲(总是)  
        跳回到主循环(总是)  
        不断刷新100个页直到符合条件(可能,跳转到flush loop中完成. 如果flush loop 中也没有什么事可以做, 切换到suspend loop 中将主线程挂起,等待事件发生)  

### 插入缓冲(insert buffer, 之后引入change buffer)

两个前提条件:\
索引是辅助索引\
索引不是唯一索引    #插入 insert buffer 时, 数据库不会去查找索引页来判断插入记录的唯一性.

若进行操作的索引页不在buffer pool里,则先放入到insert buffer里,之后看情况对原来的页进行更新\
在写密集情况下,会大量占用buffer pool空间,默认最大可以占用1/2

何时合并:\
辅助索引页被读取到缓冲池\
insert buffer bitmap 页追踪到该辅助索引页已无可用空间\
master thread 每10秒进行

### 两次写(double write)

doublewrite buffer 大小为 2M\
物理磁盘上共享表空间中的连续的128个页,即2个区(extent), 大小也是2M\
在MySQL 5.6中， 默认有120个page用于批量刷新（如 LRU Flush 或者 LIST FLUSH），剩下的8个Page用于单个page的flush

对脏页进行刷盘时, 先将脏页复制到 doublewrite buffer , 然后通过doublewrite buffer 再分两次,每次1MB顺序的写入共享表空间的物理磁盘上.\
然后调用fsync将脏页同步到磁盘.

list  和 LRU 批量刷盘, 每个buffer pool 实例都有对应的这两个空间的shard缓存\
批量页面刷盘, 双写机制新增加了一个文件,用innodb\_parallel\_doublewrite\_path 参数控制\
LRU不够用时, 将尾端页面刷出内存,这时只要把这个页面复制到shard缓冲内存就可以.不需要刷盘(这一块我始终没明白怎么保证数据安全的)

### 自适应哈希索引(adaptive hash index)

必须是查询条件一样,切是确切等于的条件,访问了100次以上, 页通过该模式被访问了N次,n = 页中记录数 \* 1/16

### 异步IO(async io)

### 刷新邻接页(flush neighbor page)

### innodb\_force\_recovery

可以设置6个非零值: 1 \~6\
设置了非零值后,用户可以对表进行select,create,drop操作,但不能进行insert,update,delete操作

## mysql的文件

1.  参数文件 my.cnf
2.  错误日志 error log
3.  二进制日志 binlog
4.  慢查询日志 slow query log     , 5.1版本开始可以改为table, 还有参数控制每分钟内写入无索引慢sql的次数
5.  全局日志 general log
6.  套接字文件
7.  pid 文件
8.  表结构定义文件 .frm
9.  innodb引擎文件 ibdata2 .ibd
10. 重做日志文件 ib\_logfile0

## xtrabackup 备份

    1. innobackupex 启动,fork xtrabackup 进程  
    2. 检查 xtrabackup_suspended_2 文件是否存在. 如果存在就会被唤醒(一直等待,直到被唤醒)  
    3. xtrabackup 在备份时,启动两个线程  
        1. ibd 文件复制线程, 负责复制ibd文件  
        2. redo log 复制线程, 负责复制redo log 信息.   
        3. 说明: xtrabackup 首先启动redo log 复制线程, 从最近的checkpoit点开始顺序复制redo log;  
            然后启动ibd复制线程;  
            在ibd复制过程中, redo log 复制进程一直工作  
            innobackupex 进程一直等待被唤醒  

        4. xtrabackup 复制完成ibd文件, 创建xtrabackup_suspended_2引以为荣以唤醒innobackupex 进程.  
            redo log 复制不停, 继续复制  
      
    4. innobackup 进程被唤醒后, 执行备份锁(lock tables for backup), 取到一致性的点位,然后开始复制非innodb文件  
    5. 非innodb表复制完成,执行 lock binlog for backup ,然后获取binlog 位置信息,然后写入 xtrabackup_binlog_info 文件  
    6. 删除 xtrabackup_suspended_2 文件,并通知xtrabackup进程  
    7. xtrabackup 进程收到通知,停止redo log 复制线程, 通知innobackupex进程 redo log 复制完成.  
    8. innobackupex 释放  unlock binlog ; unlock table ;  
    9. 释放资源,备份元数据, 备份binlog位置 等后期工作  
    10. 进程结束后退出  

## sql 流程

    1. 收到sql , query_cache_size, hash sql语句,判断有没有在query_cache缓存结果,有则直接验证权限,权限通过直接返回结果  
    2. sql解析器,解析sql语句 ddl/dml (词法分析,语法分析,生成sql解析树)  
    3. 预处理器(可能sql等价改写, 即生成新的解析树)  
    4. 验证权限, 验证不通过,返回权限问题  
    5. 查询优化器(生成sql执行计划), 如果是insert,执行explain会看到只有select_type有值是SIMPLE,其他列的值全是NULL
    6. 进入innodb引擎,根据执行计划中的索引.  