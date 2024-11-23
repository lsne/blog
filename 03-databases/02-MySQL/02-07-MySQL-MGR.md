# MySQL MGR

## 部署

#### 1. 环境

```linux
192.168.43.121 test1.lsnan.cn
192.168.43.122 test2.lsnan.cn
192.168.43.123 test3.lsnan.cn

useradd mysql
mkdir -p /data/mysql/data
sudo chown -R mysql:mysql /data/mysql
```

#### 2. 配置文件（所有节点执行）

> 三台机器需要分别修改(server_id, group_replication_local_address, report_host)

```toml
[mysqld]
port=3306
basedir=/usr/local/mysql80
datadir=/data/mysql/data/
socket=/data/mysql/data/mysql.sock
pid_file=/data/mysql/data/mysql.pid

server_id=121
gtid_mode=ON
enforce_gtid_consistency=ON
binlog_checksum=NONE

log_bin=binlog
log_slave_updates=ON
binlog_format=ROW
master_info_repository=TABLE
relay_log_info_repository=TABLE

transaction_write_set_extraction=XXHASH64
loose-group_replication_group_name="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
loose-group_replication_start_on_boot=OFF
loose-group_replication_local_address= "192.168.43.121:33061"
loose-group_replication_group_seeds= "192.168.43.121:33061,192.168.43.122:33061,192.168.43.123:33061"
loose-group_replication_bootstrap_group=OFF

report_host=192.168.43.121
report_port=3306
```

#### 3. 初始化数据库（所有节点执行）

```sh
/usr/local/mysql80/bin/mysqld --initialize-insecure --basedir=/usr/local/mysql80 --datadir=/data/mysql/data --user=mysql
```

#### 4. 启动数据库，安装MGR插件，设置复制账号（所有节点执行）

```sh
su - mysql -c "/usr/local/mysql80/bin/mysqld_safe --defaults-file=/data/mysql/my.cnf &"

/usr/local/mysql80/bin/mysql -S /data/mysql/data/mysql.sock

# 安装MGR插件
mysql>INSTALL PLUGIN group_replication SONAME 'group_replication.so';

#设置复制账号
mysql> SET SQL_LOG_BIN=0;
mysql> CREATE USER repl@'%' IDENTIFIED BY 'repl';
mysql> GRANT REPLICATION SLAVE ON *.* TO repl@'%';
mysql> FLUSH PRIVILEGES;
mysql> SET SQL_LOG_BIN=1;
mysql> CHANGE MASTER TO MASTER_USER='repl', MASTER_PASSWORD='repl' FOR CHANNEL 'group_replication_recovery';
```

#### 5. 启动MGR单主模式(只在第一个节点执行)

```sql
# 启动MGR，在主库(192.168.56.101)上执行
mysql> SET GLOBAL group_replication_bootstrap_group=ON;
mysql> START GROUP_REPLICATION;
mysql> SET GLOBAL group_replication_bootstrap_group=OFF;

# 查看MGR组信息
mysql> SELECT * FROM performance_schema.replication_group_members;
+---------------------------+--------------------------------------+------------------------+-------------+--------------+-------------+----------------+
| CHANNEL_NAME              | MEMBER_ID                            | MEMBER_HOST    | MEMBER_PORT | MEMBER_STATE | MEMBER_ROLE | MEMBER_VERSION |
+---------------------------+--------------------------------------+------------------------+-------------+--------------+-------------+----------------+
| group_replication_applier | 8cb3f19b-8414-11e8-9d34-fa163eda7360 | 192.168.56.101 |        3306 | ONLINE       | PRIMARY     | 8.0.11         |
+---------------------------+--------------------------------------+------------------------+-------------+--------------+-------------+----------------+
1 row in set (0.01 sec)
```

#### 6. 添加其他节点(在另外两个节点执行)

```sql
START GROUP_REPLICATION;
```