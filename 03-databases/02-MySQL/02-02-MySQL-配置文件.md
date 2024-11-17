### 要额外加的参数

```toml
binlog_rows_query_log_events  # binlog里记录原始sql语句
innodb_flush_neighbors = 0 # 对于高性参的固态SSD盘, 关闭邻近页刷新功能, 避免将邻近页刷到磁盘, 但该邻近页马上又有修改操作, 导致的IO操作膨胀问题
innodb_io_capacity  # 对于高性参的固态SSD盘,调大IO吞吐量参数, 每秒刷盘时, 刷新脏页的数量
log_throttle_queries_not_using_indexes = 3 # 每分钟记录到慢日志的未使用索引的sql语句次数
log-slave-updates = ON
skip-slave-start = OFF # 这个看情况设置
skip-name-resolve = ON

character-set-server = utf8mb4      # 8.0 默认值: utf8mb4 , 可以忽略
collation-server = utf8mb4_0900_ai_ci   # 8.0 默认值是: utf8mb4_0900_ai_ci , 有业务会要求修改为 utf8_unicode_ci

# 管理员独立端口, 方式原端口连接被打满
admin_address = 'localhost'  # 注意必须要有权限service_connection_admin才能登陆该端口，否则会报错
admin_port = 13306
create_admin_listener_thread # 是否创建一个单独的listener线程来监听admin的链接请求，默认值是关闭的，即会使用已有的监听线程去监听admin连接。该参数同样需要admin_address打开, 否则没有任何影响

# 开启 clone 插件, 并且如果插件加载失败, 强制 mysqld 启动失败
plugin-load-add=mysql_clone.so
clone=FORCE_PLUS_PERMANENT  # 或  FORCE

# 主从值不同的三个参数(主库值|从库值):
read_only = OFF | ON
super_read_only = OFF | ON
event_scheduler = ON | OFF

# 两种关闭 Gap Lock 的方式:
#  1. 将事务的隔离级别设置为 READ COMMITTED
#  或
#  2. 将参数 innodb_locks_unsafe_for_binlog 设置为: 1
#  这样配置之后,  除了外键约束和唯一性检查依然需要 Gap Lock, 其余情况公使用 Record Lock 进行锁定。
#  innodb 引擎采用 Next-Key Locking 机制(即加 Gap Lock) 来避免 Phantom Problem(幻像问题)
#  Phantom Problem 是指在同一事务下, 连续执行两次同样的SQL 语句可能导致不同的结果, 第二次 SQL 可能返回之前不存在的行。
```


### mysql 配置文件

```toml
# mysql 5.6

[mysqld]
interactive_timeout  = 1800
wait_timeout  = 1800
innodb_flush_log_at_trx_commit = 1
innodb_support_xa = 1
sync_binlog = 1

# GENERAL #
user                           = my20514
port                           =20514
default_storage_engine         = InnoDB
socket                         = /tmp/mysql20514.sock
pid_file                       = /data1/mysql20514/mysql.pid

#slave

#read_only
#log-slave-updates

# MyISAM #
key_buffer_size                = 128M
myisam_recover                 = FORCE,BACKUP

# SAFETY #
max_allowed_packet             = 16M
max_connect_errors             = 1000000

# DATA STORAGE #binlog-format
datadir                        = /data1/mysql20514/

# BINARY LOGGING #
log_bin                        = /data1/mysql20514/20514-binlog
expire_logs_days               = 5
relay-log=  /data1/mysql20514/20514-relaylog
#replicate-wild-do-table=hostility_url.%
#replicate-wild-do-table=guards.%
slave_transaction_retries      = 100


# CACHES AND LIMITS #
tmp_table_size                 = 32M
max_heap_table_size            = 32M
query_cache_type               = 1
query_cache_size               = 0
max_connections                = 5000
#max_user_connections        =200
thread_cache_size              = 512
open_files_limit               = 65535
table_definition_cache         = 4096
table_open_cache               = 4096
binlog-format=row
character-set-server=utf8
skip-name-resolve
back_log=1024


# INNODB #
innodb_flush_method            = O_DIRECT
innodb_data_home_dir = /data1/mysql20514/
innodb_data_file_path = ibdata1:100M:autoextend
#redo log
innodb_log_group_home_dir=/data1/mysql20514/
innodb_log_files_in_group      = 3
innodb_log_file_size           = 1G
#innodb performance
innodb_file_per_table          = 1
innodb_buffer_pool_instances   = 1
innodb_io_capacity             = 1000
#innodb_buffer_pool_size        = 128M
innodb_max_dirty_pages_pct=90
innodb_file_format=Barracuda
innodb_buffer_pool_dump_at_shutdown = 1
innodb_buffer_pool_load_at_startup = 1

# LOGGING #
log_error                      = /data1/mysql20514/error.log
#log_queries_not_using_indexes  = 1
slow_query_log                 = 1
slow_query_log_file            = /data1/mysql20514/mysql-slow.log
long_query_time=0.5
gtid_mode=ON
enforce-gtid-consistency
log-slave-updates
#loose-daemon_memcached_option="-p11222 -c 10240"
#report-host=10.16.15.61
#report-port=20514
master-info-repository=TABLE
relay-log-info-repository=TABLE
relay_log_recovery=1
server_id=14667101
innodb_buffer_pool_size        = 20G
skip-slave-start
report-host=10.146.67.101
report-port=20514
bind_address=0.0.0.0
binlog_rows_query_log_events = 1
```
