# MySQL 主从同步
#### 初始化数据库

```sh
sudo -u mysql mysqld --defaults-file=/etc/my.cnf --initialize-insecure --basedir=/usr/local/mysql --datadir=/var/lib/mysql --user=mysql
```

#### 创建主从同步账号

```sql
CREATE USER slave@1.1.1.2 IDENTIFIED WITH 'mysql_native_password' AS '*xxxxxxxxxxxx';
GRANT SUPER, REPLICATION SLAVE ON *.* TO slave@1.1.1.2;
```

#### 数据导出

```sh
# 没启用 gtid
mysqldump -h 1.1.1.1 -u root -pxxxx --default-character-set=latin1 --hex-blob --single-transaction --master-data=2 --log-error=dump1.log --routines --triggers --events --all-databases > dump1.sql

# 启用 gtid
mysqldump -h 1.1.1.1 -u root -pxxxxxxxxxxxxxxxxxx --default-character-set=utf8mb4 --hex-blob --single-transaction --master-data=2 --log-error=dump1.log --routines --triggers --events --all-databases> dump.sql
```

#### 导入数据

```sh
# 导入数据(linux 命令行) 操作
mysql < dump.sql

# 刷新权限(mysql> 客户端)操作
flush privileges;
```

#### 创建主从并启动

```sql
# 没启用 gtid
CHANGE MASTER TO
        MASTER_HOST='1.1.1.1',
		MASTER_PORT=3306,
        MASTER_USER='slave',
        MASTER_PASSWORD='*xxxxxxxxx',
		MASTER_LOG_FILE='mysql-bin.000001',
		MASTER_LOG_POS=20078270;

# 启用 gtid
CHANGE MASTER TO
        MASTER_HOST='1.1.1.1',
		MASTER_PORT=3306,
        MASTER_USER='slave',
        MASTER_PASSWORD='*xxxxxxxxx',
		MASTER_AUTO_POSITION=1;
```

#### 启动同步

```sql
start slave;
```