#### 1. 下载包

```
https://mirrors.aliyun.com/mariadb//mariadb-10.6.8/bintar-linux-systemd-x86_64/mariadb-10.6.8-linux-systemd-x86_64.tar.gz
```

#### 2. 解压并切换目录, 创建目录

```sh
tar zxvf mariadb-10.6.8-linux-systemd-x86_64.tar.gz
mv mariadb-10.6.8-linux-systemd-x86_64 /opt/mariadb3306
cd /opt/mariadb3306
mkdir config data logs tmp loadfiles
```

#### 3. 创建配置文件: vim config/my.cnf (一定要修改 server_id)

```toml
[client]
port                           = 3306
socket                         = /tmp/mariadb3306.sock

[mysql]
no_auto_rehash
max_allowed_packet             = 64M
prompt                         = '\u@\h [\d]> '
default_character_set          = utf8mb4

[mysqldump]
max_allowed_packet             = 64M

[mysqld]
# global
server_id				       = 24922179
user                           = lsne
port                           = 3306
socket                         = /tmp/mariadb3306.sock
pid_file                       = /opt/mariadb3306/data/mariadb.pid
secure_file_priv               = /opt/mariadb3306/loadfiles/
datadir                        = /opt/mariadb3306/data/
tmpdir                         = /opt/mariadb3306/tmp
innodb_tmpdir                  = /opt/mariadb3306/tmp
character_set_server           = utf8mb4
collation_server               = utf8mb4_general_ci
relay_log_recovery 			   = ON
performance_schema 			   = ON
local_infile 				   = ON
explicit_defaults_for_timestamp = OFF
max_heap_table_size            = 64M
max_connections                = 5000
max_user_connections           = 5000
thread_cache_size              = 100
max_connect_errors             = 1000000
wait_timeout				   = 3600
interactive_timeout			   = 3600
back_log					   = 1024
skip-name-resolve			   = ON
skip-slave-start			   = ON
read_only                      = OFF
#super_read_only				   = OFF
event_scheduler 			   = ON
lower_case_table_names  	   = 1
#default_authentication_plugin  = caching_sha2_password
sql_mode					   ='STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'
gtid_domain_id 				   = 0

# slave report
report-host					   =10.249.104.232
report-port				       =3306

# Query Cache (does not exist in MySQL 8.0 any more!)
#query_cache_type               = OFF
#query_cache_size               = OFF

# MySQL error log && General Query Log && Performance Schema
log_error                      = /opt/mariadb3306/logs/error.log
innodb_print_all_deadlocks     = ON

general_log_file               = /opt/mariadb3306/logs/general.log
general_log                    = OFF

performance_schema             = ON
performance_schema_consumer_events_statements_history_long = ON
# performance_schema_instrument  = 'memory/%=COUNTED'

# Table buffers and caches
open_files_limit               = 65535
table_definition_cache         = 1400
table_open_cache               = 2000
table_open_cache_instances     = 16

# session buffer
max_allowed_packet             = 64M
join_buffer_size 			   = 1M
sort_buffer_size               = 2M
tmp_table_size                 = 32M
read_buffer_size               = 128k
read_rnd_buffer_size           = 256k

# slow log 
log_queries_not_using_indexes  = OFF
slow_query_log                 = ON
slow_query_log_file            = /opt/mariadb3306/logs/mysql-slow.log
long_query_time				   = 1
min_examined_row_limit         = 100

# binlog 
log_bin                        = /opt/mariadb3306/data/3306-binlog
relay-log					   = /opt/mariadb3306/data/3306-relaylog
binlog-format				   = row
sync_binlog                    = 1
binlog_cache_size              = 2M
binlog_stmt_cache_size         = 2M
max_binlog_size 			   = 1G
#master-info-repository 		   = TABLE
#relay-log-info-repository	   = TABLE
binlog_expire_logs_seconds     = 604800
log-slave-updates			   = ON
slave_transaction_retries      = 100
#expire_logs_days               = 7
#replicate-wild-do-table=hostility_url.%
#replicate-wild-do-table=guards.%

# engine InnoDB
innodb_buffer_pool_size        = 128M
default_storage_engine         = InnoDB
#disabled_storage_engines       = 'MyISAM,MEMORY'
innodb_flush_method            = O_DIRECT
innodb_data_home_dir = /opt/mariadb3306/data/
innodb_data_file_path = ibdata1:100M:autoextend
innodb_autoinc_lock_mode       = 2
innodb_monitor_enable = all
innodb_log_buffer_size         = 16M
innodb_doublewrite	=1
innodb_strict_mode             = ON

#redo log
innodb_log_group_home_dir	   = /opt/mariadb3306/data/
#innodb_log_files_in_group      = 3
innodb_log_file_size           = 2G

#innodb performance
innodb_flush_log_at_trx_commit = 1
innodb_file_per_table          = 1
#innodb_buffer_pool_instances   = 8

#innodb_flush_sync && innodb_io_capacity
innodb_flush_sync              = OFF
innodb_io_capacity             = 1000
innodb_io_capacity_max	       = 10000
innodb_lock_wait_timeout       = 20
#innodb_write_io_threads 	   = 4
#innodb_read_io_threads   	   = 4
innodb_max_dirty_pages_pct	   = 90
innodb_default_row_format     = DYNAMIC
innodb_buffer_pool_dump_at_shutdown = 1
innodb_buffer_pool_load_at_startup  = 1
innodb_buffer_pool_dump_pct         = 50
innodb_print_all_deadlocks    = OFF
```

#### 4.1 修改目录所属权限

```sh
chown mariadb:mariadb -R /opt/mariadb3306
```

#### 4. 初始化

```sh
./scripts/mysql_install_db --defaults-file=/opt/mariadb3306/config/my.cnf --basedir=/opt/mariadb3306 --datadir=/opt/mariadb3306/data --user=lsne --verbos
```

#### 5. 启动

```sh
bin/mysqld_safe --defaults-file=/opt/mariadb3306/config/my.cnf > /dev/null 2>&1 &
```

#### 5.1 正式启动

```toml
vim /usr/lib/systemd/system/mariadb3306.service
[Unit]
Description=MariaDB 10.6.8 database server
Documentation=https://mariadb.com/kb/en/library/systemd/
After=network.target


[Service]
Type=notify
PrivateNetwork=false
User=lsne
Group=lsne
PermissionsStartOnly=true
ExecStart=/opt/mariadb3306/bin/mariadbd --defaults-file=/opt/mariadb3306/config/my.cnf --basedir=/opt/mariadb3306 --datadir=/opt/mariadb3306/data/ --plugin-dir=/opt/mariadb3306/lib/plugin --log-error=/opt/mariadb3306/logs/error.log --open-files-limit=65535 --pid-file=/opt/mariadb3306/data/mariadb.pid --socket=/tmp/mariadb3306.sock --port=3306
KillSignal=SIGTERM
SendSIGKILL=no
Restart=on-failure
RestartSec=180s
UMask=007
PrivateTmp=false
TimeoutStartSec=1000
TimeoutStopSec=1000
LimitFSIZE           = infinity
LimitCPU             = infinity
LimitAS              = infinity
LimitNOFILE          = 640000
LimitNPROC           = 640000
LimitMEMLOCK         = infinity
TasksMax             = infinity

[Install]
WantedBy=multi-user.target
```


#### 6. 登录

```sh
./bin/mysql -S /tmp/mysql3306.sock 
```

#### 7. 删除test库 && 删除多余用户

```sh
set session sql_log_bin = OFF;
drop database test;
drop user ''@'myserver01v.cpp.shjt2.lsne.cn';
drop user ''@'localhost';
drop user 'lsne'@'localhost';
```

#### 8. 创建 root@127.0.0.1 用户

> 修改root@localhost 密码, 取消mysql unix_sockt无密码登录

```sql
CREATE USER `root`@`127.0.0.1` identified by '123';
GRANT ALL PRIVILEGES ON *.* TO `root`@`127.0.0.1` WITH GRANT OPTION;

ALTER USER root@localhost IDENTIFIED VIA mysql_native_password;
set password for root@localhost = password('123');
```


#### 9. 主从同步相关 - 创建主从同步用户

```sql
CREATE USER `dbuprepl`@`10.10.10.10` identified by '123';
GRANT REPLICATION SLAVE, REPLICATION CLIENT ON *.* TO `dbuprepl`@`10.10.10.10`;
```

#### 10. 在从库执行同步命令

```sql
CHANGE MASTER TO
MASTER_HOST='10.249.104.232',
MASTER_USER='dbuprepl',
MASTER_PASSWORD='123',
MASTER_PORT=3307,
master_use_gtid=current_pos;
        
        
START SLAVE;

SHOW SLAVE STATUS\G
```
