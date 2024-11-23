# MySQL 迁移
#### 方案一

> 数据量大, 业务不能停机

```shell
# 备份源库
mysqldump -h 10.249.171.20 -u user001 -p123 --default-character-set=utf8mb4 --hex-blob --single-transaction --master-data=2 --log-error=ips.log --routines --triggers --events --databases db01 db02 > db0102.sql

# 重置新库
mysql> reset master;

# 将源库的备份数据恢复到新库
mysql --local_infile=1 -u root -h localhost -p123 -S /tmp/mysql3306.sock < db0102.sql

# 新库上执行 change master to 同步源主库

# 备份新主库, 以恢复新主加的从库
xtrabackup --defaults-file=/data1/mysql3306/my3306.cnf --user=root --password=123 --socket=/tmp/mysql3306.sock --use-memory=400M --kill-long-queries-timeout=20 --kill-long-query-type=all --parallel=6 --compress-threads=6 --compress-chunk-size=256k --compress --backup --slave-info --target-dir=/backup/

# 拷贝到新主库的从节点机器上
scp -r /backup/ user@ip://backup/3306/xtrabackup/

# 恢复新库的从节点
/usr/local/xtrabackup24/bin/xtrabackup --decompress --decompress-threads=4 --remove-original --target-dir=/backup/3306/xtrabackup/
 
/usr/local/xtrabackup24/bin/xtrabackup --prepare --target-dir=/backup/3306/xtrabackup/

# 创建 error.log 文件
> error.log

# 创建配置文件和版本文件
cp my3306.cnf version .

# 修改目录权限
chown my3306:mysql -R mysql3306

# 启动从节点实例
mysql_start.sh

# 查看同步gtid
cat xtrabackup_slave_info

# 设置 gtid
SET GLOBAL gtid_purged='855a1e06-b132-11ea-aba9-e0008456353d:1-236, 95341067-3691-11e9-86b1-e9db8d2f44c6:1-457337, 9ccb3970-3691-11e9-86b1-d5882b3fbae8:1-69159248';

# 与新主库建立主从同步
CHANGE MASTER TO
        MASTER_HOST='10.249.152.88',
        MASTER_USER='dbareplica',
        MASTER_PASSWORD='123',
        MASTER_PORT=3306,
        MASTER_AUTO_POSITION=1;
        
start slave;
```

#### 方案二

> 如果库很小,或可以停业务迁移时, 可以使用这种方法

```sh
/usr/local/mysql56/bin/mysqldump -h 10.249.171.20 -u user001 -p1234566 --default-character-set=utf8mb4 --hex-blob --single-transaction --master-data=2 --set-gtid-purged=OFF --log-error=ips.log --routines --triggers --events --databases db01 > db01.sql

/usr/local/mysql56/bin/mysql --local_infile=1 -u root -h localhost -p123456 -S /tmp/mysql3306.sock < db01.sql
```