## MySQL 备份与恢复

### 导出为 `csv` 格式文件

```sh
mysql -h 10.249.22.179 -P 11086 -u user01  -p123456 -D lsne -s -N -e "select * from t1" > aa.csv
```

### mysqldump

#### mysqldump 导出

```sh
mysqldump -h 10.105.17.131 -P 3306 -u<user> -p<password> --single-transaction --default-character-set=utf8mb4 --hex-blob --routines --triggers --log-error=db01.log db01 > db01.dump
```

#### mysql 导入1

```sh
mysql -A -u <user> -p<password> -h localhost -S /tmp/mysql4233.sock -D db01 -v -v -v -e "warnings;source db01.dump;" &> db01.log
```

#### mysql 导入2

```sql
mysql> use db01;
mysql> source db01.dump;
```

### xtrabackup && innobackupex

> 1早期版本, xtrabackup 不能备份非innodb引擎表
> 最新版本可以了。 所以最新版本只用 xtrabackup 命令就OK

#### 老版本备份与恢复

```sh
# 1. 备份，要安装sshpass
innobackupex --defaults-file=/data1/mysql2029/my2029.cnf --user=root --password=<password> --host=localhost --socket=/tmp/mysql2029.sock --no-timestamp --kill-long-queries-timeout=20 --kill-long-query-type=select --parallel=8 --compress-threads=8 --compress-chunk-size=256k --tmpdir=/data1/mysql2029/ --stream=xbstream --compress /data1/mysql2029/  | /usr/bin/sshpass -p'123456' /usr/bin/ssh -q -o ConnectTimeout=3 -o ConnectionAttempts=2 lsne@10.138.64.157 /home/lsne/scripts/dba/px224/bin/xbstream -x -C /data1/mysql2029/

# 2. 解压，要安装qpress
innobackupex --decompress --parallel=16 /data1/mysql2029

# 3. 拷贝my.cnf
scp 10.142.103.37:/data1/mysql2029/my2029.cnf /data1/mysql2029/

# 4. 设置只读数read_only=1

# 5. 应用日志
xtrabackup --defaults-file="/data1/mysql3001/my3001.cnf" --defaults-group="mysqld" --prepare --target-dir=/data1/mysql3001 --use-memory=2G --tmpdir=/dev/shm

# 6. 修改权限
chown my3001:mysql -R /data1/mysql3001

# 7. 启动 mysql
v3_mysql_start.sh

# 8. 同步
CHANGE MASTER TO
MASTER_HOST='10.108.101.77',
MASTER_USER='replica',
MASTER_PASSWORD='<password>',
MASTER_PORT=3001,
master_auto_position =1;

# 9. 如果同步不成功: 
stop slave;
set global gtid_purged = '24024e52-bd95-11e4-9c6d-926853670d0b:1';
set global gtid_purged = ‘0058c9e4-0816-11e4-bcea-6c92bf071be9:1-360121574,0c061b9b-1ab1-11e7-863e-6c92bf071be9:1,15ad07d9-0816-11e4-bceb-6c92bf071be5:1-315600717’

# 10. 开启同步,start slave;
```

#### 新版本备份与恢复流程, 不打包

```sh
# 备份
xtrabackup --defaults-file=/etc/my.cnf --user=backup-user01 --password=123456 --socket=/var/lib/mysql/mysql.sock --use-memory=400M --kill-long-queries-timeout=20 --kill-long-query-type=all --parallel=6 --compress-threads=6 --compress-chunk-size=256k --compress --backup --tmpdir=./ --slave-info=2 --target-dir=/binlog_data/backup_mysql/

# 解压每个表的压缩文件(.qp)
xtrabackup --decompress --decompress-threads=4 --remove-original --target-dir=/data1/mysql${PORT}

# 应用binlog
xtrabackup --prepare --target-dir=/data1/mysql${PORT}

# 修改所属用户
chown my11066:mysql -R .

# 启动
mysql_start.sh -p 11066

# 查看 xtrabackup_binlog_info 文件
[root@bk02 mysql11044]# cat xtrabackup_binlog_info 
11044-binlog.000060	382947392	a380bd26-9431-11ea-ae89-e0008456353d:1-3062421

# 设置刚刚恢复的库的gtid
reset master;
set global gtid_purged="a380bd26-9431-11ea-ae89-e0008456353d:1-3062421"

# 重新chnage master
CHANGE MASTER TO
        MASTER_HOST='192.168.199.198',
        MASTER_USER='repl',
        MASTER_PASSWORD='123456',
        MASTER_PORT=3306,
        MASTER_AUTO_POSITION=1;
        
# 启动从库同步
start slave;
```

#### 新版本打包备份与恢复

> 用 xbstream 解包 (而且 最新版本 xtrabackup80 不能备份mysql5.6, 需要使用 xtrabackup24 )

```sh
# 备份 mysql 5.6
/usr/local/xtrabackup24/bin/xtrabackup --defaults-file=/data1/mysql11028/my11028.cnf --user=root --password=123456 --socket=/tmp/mysql11028.sock --use-memory=400M --kill-long-queries-timeout=20 --kill-long-query-type=all --parallel=6 --compress-threads=6 --compress-chunk-size=256k --compress --backup --tmpdir=./ --stream=xbstream --slave-info 2>> /home/lsne/scripts/log/backup/log/11044-20200525-1.log | sudo -u ssh_user01 ssh -o StrictHostKeyChecking=no 10.249.149.184 " cat - > /data1/dba_backup/mysql/20200525/11044-2/11044_20200525.xs " >> /home/lsne/scripts/log/backup/log/11044-20200525-2.log
 
# 解压.xbstream(.xs) 包文件
xbstream -C /data1/mysql11066/ -x < 11066_20200525.xs

# 解压每个表的压缩文件(.qp)
xtrabackup --decompress --decompress-threads=4 --remove-original --target-dir=/data1/mysql${PORT}

# 应用binlog
xtrabackup --prepare --target-dir=/data1/mysql${PORT}

# 修改所属用户
chown my11066:mysql -R .

# 启动
mysql_start.sh -p 11066

# 查看 xtrabackup_binlog_info 文件
[root@bk02 mysql11044]# cat xtrabackup_binlog_info 
11044-binlog.000060	382947392	a380bd26-9431-11ea-ae89-e0008456353d:1-3062421

# 设置刚刚恢复的库的gtid
reset master;
set global gtid_purged="a380bd26-9431-11ea-ae89-e0008456353d:1-3062421"

# 重新chnage master
CHANGE MASTER TO
        MASTER_HOST='192.168.199.198',
        MASTER_USER='repl',
        MASTER_PASSWORD='123456',
        MASTER_PORT=3306,
        MASTER_AUTO_POSITION=1;
        
# 启动从库同步
start slave;
```

### INTO OUTFILE && LOAD DATA

#### 前提: 需要开启的参数

```toml
secure_file_priv               = /data1/mysql11028/mysql11028-outfiles/
local_infile = 1
```

#### into outfile

```sql
-- mysql server 的 my.cnf 需要设置 secure-file-priv = /data1/mysql11086/mysql-outfile-dir  参数

-- outfile 参数后面的整个目录必须在mysql服务器上存在, mysql不会自动创建级联目录, 而且只会导出到mysql实例所在的服务器上。 不会到出到客户端机器

select * from rm_users where expiration >= '2021-06-02 00:00:00' into outfile '/data1/mysql11086/mysql-outfile-dir/rm_users.csv';
```

#### load data

```sh
mysql --local-infile=1 -u root -p1

mysql> LOAD DATA LOCAL INFILE '/home/lsne/b.tt' INTO TABLE tt1;

# load data 之前, mysql命令行必须是加了 --local-infile=1 参数进入的

# server端开启 local_infile 参数,对于load data 时加 LOCAL操作,secure_file_priv 参数的目录限制会失效
```

#### 示例

```sql
select * from ioc_alert where id>=84018862 into outfile '/data1/load11191/ioc_alert' fields terminated by ',' enclosed by '"' lines terminated by '\r\n';

LOAD DATA LOCAL INFILE '/data1/load11191/ioc_alert_new' INTO TABLE ioc_alert_new fields terminated by ',' enclosed by '"' lines terminated by '\r\n';
```