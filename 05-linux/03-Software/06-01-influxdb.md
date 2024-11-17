# influxDB 笔记

## 常用操作

### 操作

1. 登录proxy

```sh
/usr/local/influxdb17/bin/influx -host 10.208.36.147 -port 28002 -username admin -password 123456
host 必须明确指定IP，不能是127.0.0.1 或 localhost
```

2. 登录meta_admin

```sh
/usr/local/qtsdb/bin/influx-meta_admin/meta_admin --meta-server 10.208.36.147:18002 --meta-user cluster_admin --meta-password 123456
```

3. 查看& 创建 库

```sql
show databases;
create database prometheus;
```

4. 查看表

```sql
use prometheus
SHOW MEASUREMENTS
```

5. 创建一个admin用户

```sql
CREATE USER admin WITH PASSWORD '123456' WITH ALL PRIVILEGES;
```

6. 创建一个普通用户

```sql
CREATE USER "abc" WITH PASSWORD 'abc';
```

7. 为一个db授权

```sql
grant all on dbname to username; (all为write + read)
```

8. 取消一个用户的授权

```sql
revoke write on dbname from username
```

9. 查看全部用户

```sql
show users;
```

10. 为db创建一个保留策略

```sql
create retention policy "rp_name" on "db_name" duration 3w replication 1 default
3w:3周
replication 1：1副本
default：设置为默认策略，意为写入的数据如果没有指定策略，那么全部写入到这个默认策略中，并按照
这个默认策略的规则进行过期，策略相当于“容器”（这个地方可以改为autogen，或者改名）
```

11. 查看一个db的保留策略

```sql
show retention policies on "db_name"
```

12. 删除表

```sql
drop measurement "measurement_name";
```

13. 修改一个保留策略ALTER

```sql
ALTER RETENTION POLICY "2_hours" ON "telegraf" DURATION 4h DEFAULT;
```

14. 删除一个保留策略

```sql
drop retention POLICY "rp_hao360cn_stat" ON "hao360cn_stat";
注意POLICY必须是大写
```

15. 查看连续查

```sql
show continuous queries;
```

16. 创建连续查

```sql
CREATE CONTINUOUS QUERY <cq_name> ON <database_name>
BEGIN
<cq_query>
END
```

17. 写入一条数据

```sql
use testDb
insert test,host=127.0.0.1,monitor_name=test count=1
test:表名
host=127.0.0.1,monitor_name=test:tag
count=1:field
```

18. 修改一个过期策略的切片周期

```sql
ALTER RETENTION POLICY "rp_network" ON "network" DURATION 180d REPLICATION 1 SHARD DURATION 1d;
```
