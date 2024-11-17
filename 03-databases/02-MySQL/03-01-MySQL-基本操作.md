
## 管理操作

### 在线开启 GTID

> [在线开启GTID](https://dev.mysql.com/doc/refman/5.7/en/replication-mode-change-online-enable-gtids.html)

### 删除 binlog 日志

```sql
-- 查看当前binlog列表
SHOW BINARY LOGS;

-- 删除编号为 mysql-bin.000003 之前的所有 binlog
PURGE BINARY LOGS TO 'mysql-bin.000003';

-- 删除某个时间之前的binlog
PURGE BINARY LOGS BEFORE 'YYYY-MM-DD hh:mm:ss';
```

## MySQL 常用理命令

### 常用语句

#### 登录

```sh
/usr/local/mysql56/bin/mysql -A -u <user> -p<password> -h localhost -S /tmp/mysql.sock
/usr/local/mysql56/bin/mysql -A -u <user> -p<password> -h <IP> -P <port> -D <db> -BNe "select 1"
```

#### 上线sql, 执行方法

```sh
# 必要时，开启screen会话

mysql -v -v -v -e "warnings;source ~/update.sql;" &>output.log

# 完成后, 搜索output.log，精确匹配 "ERROR" 和 "Warning"
```

#### 创建表

```sql
CREATE TABLE `test_tbl` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(10) DEFAULT NULL,
  `created_at` date DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=232022 DEFAULT CHARSET=utf8;
```


### 常用操作

#### mysql 查看库的碎片率

```sql
select table_schema,sum(DATA_LENGTH)/1024/1024/1024,sum(MAX_DATA_LENGTH)/1024/1024/1024,sum(INDEX_LENGTH)/1024/1024/1024,sum(DATA_FREE)/1024/1024/1024 from tables where table_schema='scmdb'
'scmdb' and table_type='BASE TABLE';
```

#### Binlog 解析

```sh
mysqlbinlog --base64-output=DECODE-ROWS -v -v -v --start-position=882469271 --start-datetime='2004-12-25 11:25:56'
```

#### 使用 binlog 恢复

```sh
mysqlbinlog --start-position=250508735 11132-binlog.000214 | /usr/local/mysql56/bin/mysql -S /tmp/mysql11132.sock -uroot -p123456
```

#### 从库同步到指定的时间点: start slave until

```sql
start slave until MASTER_LOG_FILE='11009-binlog.004559', MASTER_LOG_POS=215166475;
```

#### GTID 跳过事务

```sql
show slave status\G

Executed_Gtid_Set: 18b2fd50-30fe-11e9-a254-6c92bf4454b0:1-63,
472c2866-5701-11e7-8f89-6c92bf42b00a:1-3409944541


mysql> stop slave;

-- 这里的 GTID_NEXT 应该设置当前值, 还是当前值+1, 还是 binlog 里报错位置的值需要再确认一下
mysql> SET @@SESSION.GTID_NEXT= '18b2fd50-30fe-11e9-a254-6c92bf4454b0:1-63,472c2866-5701-11e7-8f89-6c92bf42b00a:1-3409944542';

mysql> BEGIN; COMMIT;

mysql> SET SESSION GTID_NEXT = AUTOMATIC;

mysql> START SLAVE;
```

#### 权限导出

```sql
-- 查看用户和host
select concat('''',user,'''@''',host,'''') from user order by user;

-- 查看show user信息
mysql -P 3306 -uroot -pxxxxx -D mysql -BNe "select concat('show create user ', u.userhost,';') from (select concat('''',user,'''@''',host,'''') as userhost from user order by user) u";

-- 查看show grants 信息
mysql -P 3306 -uroot -pxxxxxx -D mysql -BNe "select concat('show grants for', u.userhost,';') from (select concat('''',user,'''@''',host,'''') as userhost from user order by user) u";
```

#### 权限导出脚本

```sh
#!/usr/bin/env bash

mysql -P 16975 -pxxxxx -D mysql -BNe "select concat('show create user ', u.userhost,';') from (select concat('''',user,'''@''',host,'''') as userhost from user order by user) u;" > mysql_grants.show
mysql -P 16975 -pxxxxx -D mysql -BNe "select concat('show grants for', u.userhost,';') from (select concat('''',user,'''@''',host,'''') as userhost from user order by user ) u;" >> mysql_grants.show
mysql -P 16975 -pxxxxx -D mysql -BNe "source mysql_grants.show" > mysql_grants.sql
```

### pt 工具

#### pt-online-schema-change 创建索引

```sh
pt-online-schema-change D=db01,t=table01  --alter='ADD INDEX sid(gid,sid),ADD INDEX channel_id(union_id,channel_id),ADD INDEX adv_add_time(adv_add_time)' --host='<IP>' --port=<port>  --charset=utf8 --user=<user> --password=<password> --set-vars "wait_timeout=10000,innodb_lock_wait_timeout=10,lock_wait_timeout=3600"  --dry-run

pt-online-schema-change D=db01,t=table01  --alter='ADD INDEX sid(gid,sid),ADD INDEX channel_id(union_id,channel_id),ADD INDEX adv_add_time(adv_add_time)' --host='<IP>' --port=<port>  --charset=utf8 --user=<user> --password=<password> --set-vars "wait_timeout=10000,innodb_lock_wait_timeout=10,lock_wait_timeout=3600"  --execute
```

> 示例

```sh
pt-online-schema-change  --host=10.208.44.237 --port=4010 --user=user01 --password=123456 --nodrop-old-table --charset=utf8 --alter-foreign-keys-method=auto  --max-load "Threads_running=100" --critical-load "Threads_running=200"  --alter="ADD INDEX update_time(update_time);" D=pepper_storage,t=user --execute --check-slave-lag=10.208.43.93 --max-lag=100 > 4010.log
```

```sh
pt-online-schema-change h=10.252.128.195,u=user01,p=123456,P=11047,D=activelist,t=staffip --alter "ADD INDEX custom_index_update_time_desc(updated desc)"  --recursion-method=none --no-check-replication-filters --alter-foreign-keys-method=auto --print --execute

pt-online-schema-change --charset=utf8mb4 --user=user01 --password=123456 --host=10.249.22.182 --port=11086 D=testb,t=cloud_address --alter "ADD INDEX idx_abc4(test2 desc)"  --recursion-method=none --no-check-replication-filters --alter-foreign-keys-method=auto --print --execute
```
