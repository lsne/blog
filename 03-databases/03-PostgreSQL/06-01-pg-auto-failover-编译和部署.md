# pg_auto_failover

## 编译

#### 编译时, 叫运行时找lib根据相对路径在二进制文件的 ../lib/ 目录下查找

```
先执行 pg_config --ldflags 查看参数, 将参数修改后, 替换Make文件, 如下:
linux# pg_config --ldflags
-Wl,-rpath='/../lib',--disable-new-dtags -Wl,--as-needed
替换为
-Wl,-rpath='$$ORIGIN/../lib',--disable-new-dtags -Wl,--as-needed

然后编辑 Makefile 文件
cd pg_auto_failover-2.0
vim src/bin/pg_autoctl/Makefile
61行:

# LIBS += $(shell $(PG_CONFIG) --ldflags)
LIBS += -Wl,-rpath='$$ORIGIN/../lib',--disable-new-dtags -Wl,--as-needed

PG_CONFIG=/opt/pgsql5432/server/bin/pg_config make clean
PG_CONFIG=/opt/pgsql5432/server/bin/pg_config make
PG_CONFIG=/opt/pgsql5432/server/bin/pg_config make install
```

## 集群搭建

### 环境

```
10.57.93.155:5432  主 
10.57.93.156:5432  从
10.57.93.154:5432  monitor
```

### 一. 初始化机器

> 三台机器都执行

#### 1. 三台机器初始化用户,目录,程序包

```sh
useradd postgres
mkdir /opt/pgsql5432
tar zxvf pgsql14.tar.gz -C /opt/pgsql5432/
chown postgres:postgres -R /opt/pgsql5432
```

#### 2. 创建登录用密码文件: `vim /home/postgres/.pgpass`

> 文件一行一个登录用的信息
> 格式为: 要连接的pgsql IP:端口:库名:用户:密码
> 以下示例文件内容: 第一行和第三行都是执行 pg_autoctl create postgres 初始化实例时用到的用户密码
> 以下示例文件内容: 第二行是方便使用 psql 时不用设置 PGPASSWORD 变量了

```
localhost:5432:template1:postgres:123456
localhost:5432:postgres:postgres:123456
localhost:5432:postgres:mycheck:123456
10.57.93.155:5432:postgres:pgautofailover_replicator:123456
10.57.93.156:5432:postgres:pgautofailover_replicator:123456
10.57.93.155:5432:pgautofailover_replicator:pgautofailover_replicator:123456
10.57.93.156:5432:pgautofailover_replicator:pgautofailover_replicator:123456
10.57.93.155:5432:replication:pgautofailover_replicator:123456
10.57.93.156:5432:replication:pgautofailover_replicator:123456
```

#### 3. 修改登录密码文件权限

```sh
chmod 600 /home/postgres/.pgpass
```

### 一. monitor 节点初始化

> 10.57.93.154 机器执行

#### 1. 切换用户到: `postgres`

```sh
su - postgres
```

#### 2. 初始化 monitor 节点

```sh
pg_autoctl create monitor --pgctl /opt/pgsql5432/server/bin/pg_ctl  --pgdata /opt/pgsql5432/data --pgport 5432 --hostname 10.57.93.154 --auth md5  --ssl-self-signed --run
```

#### 3. 登录 monitor 节点机器, 设置 `autoctl_node` 用户的密码

```sh
psql --quiet --no-align --tuples-only -c "ALTER USER autoctl_node WITH PASSWORD '123456';"
```

#### 4. 查看 monitor 连接 url

```sh
PGPASSWORD='123456' pg_autoctl show uri --pgdata /opt/pgsql5432/data
```

#### 5. 查看集群状态

> 现在显示一个节点都没有

```sh
PGPASSWORD='123456' pg_autoctl show state --pgdata /opt/pgsql5432/data
```

### 二. 主节点初始化

> 10.57.93.155 机器执行

#### 1. 切换用户到: `postgres`

```sh
su - postgres
```

#### 2. 创建密码文件

```sh
echo 123456 > /home/postgres/.pwd
chmod 600 /home/postgres/.pwd
```

#### 3. 初始化实例

```sh
initdb -D /opt/pgsql5432/data -E UTF8 --locale=en_US.utf8 --pwfile=/home/postgres/.pwd
```

#### 4. 移除默认配置文件

```sh
cd /opt/pgsql5432/data
mv postgresql.conf postgresql.conf.bak
mv pg_hba.conf pg_hba.conf.bak
```

#### 5. 创建新配置文件: `vim postgresql.conf`

```toml
listen_addresses                 = '*'
#port                             = 5432  # pg_autoctl 指定 
unix_socket_directories          = '/tmp/'
fsync                            = on
shared_buffers                   = 512MB
temp_buffers                     = 8MB
work_mem                         = 8MB
huge_pages                       = off
effective_cache_size             = 8GB
maintenance_work_mem             = 64MB
max_connections                  = 153
max_prepared_transactions        = 153
superuser_reserved_connections   = 2
tcp_keepalives_idle              = 120
tcp_keepalives_interval          = 10
tcp_keepalives_count             = 10
authentication_timeout           = 10s
wal_level                        = replica
wal_buffers                      = 16MB
checkpoint_completion_target     = 0.9
commit_delay                     = 10
commit_siblings                  = 4
wal_log_hints                    = on
max_wal_size                     = 3GB
min_wal_size                     = 256MB
logging_collector                = on
log_destination                  = 'csvlog'
log_directory                    = '/opt/pgsql5432/log'
log_filename                     = 'postgresql-%a.log'
log_rotation_age                 = 1d
log_duration                     = off
log_truncate_on_rotation         = on
log_min_duration_statement       = 60000
log_checkpoints                  = off
log_connections                  = off
log_disconnections               = off
log_lock_waits                   = off
log_statement                    = none
log_line_prefix                  = '%t [%p]: user=%u,db=%d,client=%h '
log_timezone                     = 'Asia/Shanghai'
log_min_messages                 = 'error'
log_min_error_statement          = 'error'
client_min_messages              = 'error'
# shared_preload_libraries       = 'timescaledb'
shared_preload_libraries         = 'pg_stat_statements'
pg_stat_statements.max           = 10000
pg_stat_statements.track         = all
pg_stat_statements.track_utility = off
pg_stat_statements.save          = off
```

#### 6. 创建授权文件: `vim pg_hba.conf`

```
# TYPE  DATABASE        USER            ADDRESS         METHOD
local   all             postgres                        md5
host    all             postgres        127.0.0.1/32    md5
local   postgres        mycheck                         md5
hostssl "postgres" "mycheck" 10.57.93.155/32 md5
hostssl all "pgautofailover_monitor" 10.57.93.154/32 md5
hostssl "postgres" "pgautofailover_replicator" 10.57.93.155/32 md5
hostssl "postgres" "pgautofailover_replicator" 10.57.93.156/32 md5
hostssl "pgautofailover_replicator" "pgautofailover_replicator" 10.57.93.155/32 md5
hostssl "pgautofailover_replicator" "pgautofailover_replicator" 10.57.93.156/32 md5
hostssl replication "pgautofailover_replicator" 10.57.93.155/32 md5
hostssl replication "pgautofailover_replicator" 10.57.93.156/32 md5
```

#### 7. 启动实例, 创建用户, 停止实例

```sh
pg_ctl start -D /opt/pgsql5432/data

# 使用 /home/postgres/.pgpass 中的第二行直接登录, 不用手动设置 PGPASSWORD 变量

psql --quiet --no-align --tuples-only -c "CREATE USER mycheck WITH LOGIN CREATEDB SUPERUSER PASSWORD '123456';"

psql --quiet --no-align --tuples-only -c "CREATE USER pgautofailover_replicator WITH REPLICATION PASSWORD '123456';"

pg_ctl stop -D /opt/pgsql5432/data
```

#### 10. 使用 autoctl 初始化主节点

```sh
pg_autoctl create postgres --pgctl='/opt/pgsql5432/server/bin/pg_ctl' --pgdata='/opt/pgsql5432/data' --pgport=5432 --name='mypg001' --hostname='10.57.93.155' --dbname='postgres' --username='mycheck' --skip-pg-hba --ssl-self-signed --monitor='postgres://autoctl_node:123456@10.57.93.154:5432/pg_auto_failover?sslmode=require' --run
```

#### 11. 查看集群状态

> 到 `monitor 节点` 执行以下命令, 查看主节点是否已经加入集群

```sh
PGPASSWORD='123456' pg_autoctl show state --pgdata /opt/pgsql5432/data
```

### 三. 从节点初始化

> 10.57.93.156 机器执行

#### 1. 初始化

```sh
pg_autoctl create postgres --pgctl='/opt/pgsql5432/server/bin/pg_ctl' --pgdata='/opt/pgsql5432/data' --pgport=5432 --name='mypg002' --hostname='10.57.93.156' --dbname='postgres' --username='mycheck' --skip-pg-hba --ssl-self-signed  --monitor='postgres://autoctl_node:123456@10.57.93.154:5432/pg_auto_failover?sslmode=require' --run
```

#### 2. 查看集群状态

> 到 `monitor 节点` 执行以下命令, 查看从节点是否已经加入集群

```sh
pg_autoctl show state --pgdata /opt/pgsql5432/data
```

## 集群操作

> 在任意节点都可以执行, 不过部分操作必须要连接到 `monitor` 节点(可以远程连接)
> `pg_autoctl show` 需要连接到 `monitor` 节点
> `pg_autoctl show state --local` 操作可以查看本地节点状态, 不需要连接 `monitor`
> `--json` 可用于输出 json 格式的信息

### 参数设置

#### 查看参数

```sh
pg_autoctl show settings

# 或
pg_autoctl get formation settings
```
#### 修改参数

```sh
pg_autoctl set formation number-sync-standbys
pg_autoctl set node replication-quorum
pg_autoctl set node candidate-priority
```

#### number_sync_standbys

```
number_sync_standbys 含义是强同步的从节点数量。 默认值为 从节点-1
当有一主一从时, 值为：0
当有一主两从时, 值为: 1

number_sync_standbys 值为 0 时, 所有从节点故障, 主库会转为异步复制
number_sync_standbys 值大于 0 时, 所有从节点故障, 主库会只读, 所有写操作卡住。不会自动转为异步复制模式

pg_auto_failover 需要 number_sync_standbys + 1 个备用节点参与复制仲裁
```

## `monitor` 节点配置

> 编辑配置文件: `vim /opt/pgmonitor5432/data/postgresql.conf`

```toml
# 以下为默认值, monitor 每5秒对数据节点进行一次健康检查, 如果检查失败, 会每隔2秒重试一次, 重试 2 次(加上第1次一共检查探测3次), 重试2次还是失败,则进行切主流程。 发送的连接请求最多等5秒, 5秒还没有应答则直接标记为超时,连接检查失败。
pgautofailover.health_check_max_retries = 2
pgautofailover.health_check_period = 5000
pgautofailover.health_check_retry_delay = 2000
pgautofailover.health_check_timeout = 5000
```

> 修改后需要重启 monitor 进程: `systemctl restart pgmonitor5432`

#### pgautofailover.health_check_period

> 默认 5000 毫秒

```
monitor 节点每间隔多少毫秒, 对 pgsql 数据节点进行一次健康检查(libpq.so 连接测试)
```

#### pgautofailover.health_check_max_retries

> 默认: 2

```
monitor 每次健康检查时, 如果连接数据节点失败, 最多会重试多少次连接操作。
```

#### pgautofailover.health_check_retry_delay

```
monitor 每次健康检查时, 如果连接数据节点失败, 间隔多久重试一次
```
#### pgautofailover.health_check_timeout

> 默认: 5000 毫秒

```
monitor 健康检查向 数据节点发起连接之后, 如果一直没有响应, 等多长时间判断为超时
```



### 常用操作
#### 生成 systemd 启动文件

```sh
pg_autoctl show systemd --pgdata /opt/pgsql5432/data
```

#### 查看相关配置文件

```sh
PGPASSWORD='123456' pg_autoctl show file --pgdata /opt/pgsql5432/data
```

#### 查看 monitor 连接 url

```sh
PGPASSWORD='123456' pg_autoctl show uri --pgdata /opt/pgsql5432/data
```

#### 查看集群状态

```sh
PGPASSWORD='123456' pg_autoctl show state --pgdata /opt/pgsql5432/data
```

#### 实时刷新状态

```sh
PGPASSWORD='123456' pg_autoctl show state --watch --pgdata /opt/pgsql5432/data

# 或
PGPASSWORD='123456' pg_autoctl watch --pgdata /opt/pgsql5432/data
```

#### 查看历史事件

```sh
PGPASSWORD='123456' pg_autoctl show events --pgdata /opt/pgsql5432/data
```


## 节点操作

#### 维护模式

> 1. 处于维护模式的节点不参与故障转移
> 2. 备用节点上启用维护会关闭主节点强同步参数，从而避免写入查询被阻止。但同时从节点也有可能会出现数据延迟的情况。

```sh
# 开启维护模式
pg_autoctl enable maintenance

# 关闭维护模式
pg_autoctl disable maintenance

# 在主节点上执行维护模式, 将自动切主
pg_autoctl enable maintenance --allow-failover
```

#### 手动切主

> 在没有实际节点故障的情况, 手动切主

```sh
# 
pg_autoctl perform failover

# 
pg_autoctl perform switchover

# 选举新的主节点
pg_autoctl perform promotion
```

### 删除从节点

```sh
PGPASSWORD='123456' pg_autoctl drop node --pgdata='/opt/pgsql5432/data' --formation='node_2' --hostname='10.57.93.156' --pgport=5432 --force
```

### 集群清理

>  整个集群卸载, 并清理相关文件

> 三台机器都执行

#### 停止实例

```sh
pg_autoctl stop --pgdata='/opt/pgsql5432/data'
```

#### 删除相关数据文件, 配置文件

```sh
rm -rf /opt/pgsql5432/backup /opt/pgsql5432/data /home/postgres/.config/pg_autoctl /home/postgres/.local/share/pg_autoctl
```