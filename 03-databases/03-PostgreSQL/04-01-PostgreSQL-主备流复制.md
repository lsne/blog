## 流复制

### 流复制启动流程

```
1. 主库启动 wal sender 进程, 负责向备库发送 wal 日志
2. 备库启动 startup 进程, 负责将接收到的主库的wal在备库重放
3. 备库启动 walreceiver 进程, 负责接收主库发过来的 wal 日志,并保存到磁盘
4. 备库发出连接主库的请求
5. walsender 响应请求
6. 握手成功
7. 追赶没有同步的数据
8. 开始正常流复制
```

### walsender 进程状态

```
start-up  # 从启动 walsender 到握手结束
catch-up  # 在追赶阶段
streaming # 流媒体复制正在工作
backup    # 备份(pg_backupbackup 等)工具全量备份时的状态
```

### 流复制无法设置超时

流复制不支持设置自动超时将同步自动还原到异步模式。
两种解决办法:

#### 1. 使用多个备用服务器来提交系统可用性

#### 2. 设置同步模式切换到异步模式

```
1. 设置 synchronous_standby_names 为 空字符串
2. 重载配置: pg_ctl -D $PGDATA reload
```

##### 表: pg_stat_replication

```
sync_state 字段值
	sync      : 同步复制, 优先级最高
	potential : 同步复制, 第二优先级
	async     : 异步复制, 
```

#### 查看实例状态

```
PGDATA=/data/pgsql32086/ pg_controldata | grep cluster
```

### 实时同步

#### 1. 主库配置文件设置

```toml
# 实时同步时, 在主库配置该参数. 写备库名列表
synchronous_standby_names        = 'mystandby001'   
synchronous_standby_names        = 'FIRST 1 (mystandby001,mystandby002)'

# FIRST 1 表示只要有任意一个从节点可以实时同步, 就可以正常访问主库, 不阻塞主库
```

#### 2. 备库主从同步连接添加 `application_name=mystandby001`

```toml
primary_conninfo = 'host=pg1 application_name=mystandby001 port=1922 user=repl password=xxxx option="-c wal_sender_timeout=5000"'
```


## 逻辑复制

```
pg_replication_origin_session_setup # 函数, 防止双主造成的写循环

或者发布订阅中的 replorigin_create 可指定 Origin ID。
```

### 复制槽

#### 1. 创建逻辑复制槽

```sql
SELECT pg_create_logical_replication_slot('slot_name', 'output_plugin');

# 示例
SELECT pg_create_logical_replication_slot('my_slot', 'pgoutput');
```

#### 2. 删除逻辑复制槽

```sql
SELECT pg_drop_replication_slot('slot_name');

-- 示例
SELECT pg_drop_replication_slot('slot_name');
```

#### 3. 查看复制槽信息

```sql
SELECT slot_name, active, wal_status, safe_wal_size FROM pg_catalog.pg_replication_slots;
```

#### 4. 复制槽保留 wal 大小参数

```
max_slot_wal_keep_size
```

## 发布与订阅

- 逻辑订阅目前支持 insert, update, delete, truncate 中一种或者多种的订阅。
- 支持update 和 delete 订阅的表需要设置 [REPLICA IDENTITY](https://www.postgresql.org/docs/devel/sql-altertable.html#SQL-CREATETABLE-REPLICA-IDENTITY) 唯一标示一行。
- 同一个表可以发布多次。
- 一个PUBLICATION 可以允许多个SUBSCRIPTION。
- 保证事务级别的逻辑订阅，不会出现某个事务复制一半的情况。

#### 发布端参数修改

```
1. wal_level=logical
2. max_replication_slots=16
3. max_wal_senders=16
5. max_logical_replication_workers=16
6. wal_sender_timeout = 180s
7. wal_keep_segments=200
8. wal_keep_size=10240
```

#### 订阅端参数修改

```
1. max_replication_slots，大于等于该实例总共需要创建的订阅数
2. max_logical_replication_workers，大于等于该实例总共需要创建的订阅数
3. max_worker_processes， 大于等于max_logical_replication_workers + 1 + CPU并行计算 + 其他插件需要fork的进程数.
```

### 创建发布

> 实例: `127.0.0.1:5432`

#### 1. 创建发布表

```sql
CREATE TABLE t1(id int primary key, info text, crt_time timestamp);
```

#### 2. 创建发布

```sql
CREATE PUBLICATION mypub FOR TABLE t1;
```

#### 3. 查看当前有哪些发布

```sql
SELECT * FROM pg_publication;
```

#### 4. 创建复制槽

> 此步骤不需要了, 因为在上面创建发布时, 会自动创建与发布同名的 slot

```sql
SELECT pg_create_logical_replication_slot('myslot', 'pgoutput');
```

#### 5. 查看有哪些复制槽

```sql
SELECT slot_name, active, wal_status, safe_wal_size FROM pg_catalog.pg_replication_slots;
```

#### 配置订阅

> 实例: `127.0.0.1:5433`

#### 1. 创建订阅表

> 表的所属 schema, 表名, 表结构必须与原实例上的表完全相同

```sql
CREATE TABLE t1(id int primary key, info text, crt_time timestamp);
```

### 2. 创建订阅

```sql
CREATE SUBSCRIPTION mysub CONNECTION 'dbname=pguser host=127.0.0.1 port=5432 user=postgres password=123456 ' PUBLICATION mypub;

# 其他可选的 WITH 参数(列出来的这3个参数都没有测试成功, 不知道干啥用的)
CREATE SUBSCRIPTION <订阅名> CONNECTION 'dbname=xxx host=xxx' PUBLICTION <发布名> WITH (enabled, create_slot=false, slot_name='sub1_from_pub1');
```

#### 3. 查看有哪些订阅

```sql
SELECT * FROM pg_subscription;

SELECT * FROM pg_stat_subscription;
```

#### 4. 删除订阅

> 删除订阅需要以下3个步骤

```sql
ALTER SUBSCRIPTION mysub2 DISABLE;
ALTER SUBSCRIPTION mysub2 SET (slot_name=NONE);
DROP SUBSCRIPTION mysub2;
```