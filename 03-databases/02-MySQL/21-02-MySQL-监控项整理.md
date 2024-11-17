
```
监控项:
1.  监控mysql是否存活
    mysql和mysqld_safe进程监控 或端口监控 或 ping tcp_port

2.  监控mysql主从复制状态
    slave_io_running=
    slave_sql_running=
    seconds_behind_master>=(根据业务定义)
    
3.  监控mysql数据库连接数
    max_connections    (参数,建议设置1000-2000)
    threads_connected (1000左右为佳)
    threads_running   (最好不要大于25,根据cpu核数可以相应多一些或少一些)
    
4.  慢查询数量 slow_queries
    最好是监控单位时间内的慢查询数量.
    如:  8:00 慢查询数量为 1000   , 8:10 慢查询数量为:1021  
          则监控:1021-1000=21 
    可以自定义时间间隔和单位时间内数量的阀值
    
5.  innodb行锁等待
    Innodb_row_lock_waits
    同上,可以监控单位时间内的变化
    
6.  表锁等待
    Table_locks_waited
    
7.  binlog缓存用磁盘:
    Binlog_cache_disk_use
    
8.  innodb redo log等待
    Innodb_log_waits
    因log buffer不足导致等待的次数
    
9.  qps/tps
    QPS=△Queries/ △Seconds
    TPS=(
        com_commit+
        com_rollback+
        com_xa_commit+
        com_xa_rollback
        )/Seconds
    
10. innodb_pool 命中率
    innodb buffer pool hits=
	(1-innodb_buffer_pool_reads/innodb_buffer_pool_read_requests)%
    
11. qc命中率
    query cache hits=
	Qcache_hits/(Qcache_hits+Qcache_inserts) %
    
12. key buffer命中率
    key buffer hits:
	读命中率=(1-Key_reads/Key_reads_requests) %
	写命中率=(1-Key_writes/Key_write_requests) %
    
13. 表缓存命中率   
    table cache hits=
	open_tables/opened_tables
	过小说明打开表次数多，table_open_cache需要调大
    
14. 线程命中率
    thread cache hits=
        (1- △ threads_created/threads_connected) %
    
15. innodb_pool 空闲等待
    Innodb_buffer_pool_wait_free
     太大则说明内存太小
```