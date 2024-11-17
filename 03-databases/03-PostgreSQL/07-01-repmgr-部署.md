# repmgr 部署流程

```sh
sudo -u postgres /opt/pgsql5432/server/bin/repmgr -f /opt/pgsql5432/repmgr/repmgr.conf primary register

sudo -u postgres /opt/pgsql5432/server/bin/repmgr -f /opt/pgsql5432/repmgr/repmgr.conf -h 10.249.105.53 -p 5432 -U repmgr -d repmgr standby clone

systemctl start postgres5432

sudo -u postgres /opt/pgsql5432/server/bin/repmgr -f /opt/pgsql5432/repmgr/repmgr.conf standby register

sudo -u postgres /opt/pgsql5432/server/bin/repmgrd -d -f /opt/pgsql5432/repmgr/repmgr.conf

sudo -u postgres /opt/pgsql5432/server/bin/repmgr -f /opt/pgsql5432/repmgr/repmgr.conf cluster show
```

### 修改 postgresql.conf 文件

```toml
shared_preload_libraries='repmgr'
```

### 启动实例

```sh
systemctl start postgres5599
```

### 创建repmgr用户, 并配置 pg_hba.conf, 刷新配置

```sql
PGPASSWORD='123456' psql -h /tmp -U postgres -p 5432
CREATE USER repmgr SUPERUSER;
CREATE  DATABASE repmgr with owner repmgr;
ALTER USER repmgr SET search_path TO repmgr, public;
```

```
vim pg_hba.conf
local  replication      repmgr						   	trust
host   replication      repmgr		127.0.0.1/32		trust 
host   replication      repmgr		10.249.105.53/32   	trust
host   replication      repmgr		10.249.105.52/32  	trust
host   replication      repmgr		10.249.104.162/32  	trust
local  repmgr           repmgr		                   	trust
host   repmgr           repmgr		127.0.0.1/32       	trust
host   repmgr           repmgr		10.249.105.53/32   	trust
host   repmgr           repmgr		10.249.105.52/32  	trust
host   repmgr           repmgr		10.249.104.162/32   trust

postgres=# select pg_reload_conf();
```

### 创建 repmgr 配置文件

```toml
# 三个节点都要创建, 其中: node_id, node_name, conninfo 根据主从节点进行变化
# vim repmgr.conf

node_id=1
node_name=pg-node1
conninfo='host=10.249.105.53 port=5599 user=repmgr dbname=repmgr connect_timeout=2'
pg_bindir='/opt/pgsql5599/server/bin'
data_directory='/opt/pgsql5599/data'
log_file='/opt/pgsql5599/log/repmgr.log'
failover=automatic
promote_command='/opt/pgsql5599/server/bin/repmgr standby promote -f /opt/pgsql5599/repmgr/repmgr.conf --log-to-file'
follow_command='/opt/pgsql5599/server/bin/repmgr standby follow -f /opt/pgsql5599/repmgr/repmgr.conf --log-to-file --upstream-node-id=%n'
```

### 注册  primary server

```sh
# 在主节点执行
[root@dbuptest04v data]# sudo -u postgres /opt/pgsql5599/server/bin/repmgr -f /opt/pgsql5599/repmgr/repmgr.conf primary register
INFO: connecting to primary database...
NOTICE: attempting to install extension "repmgr"
NOTICE: "repmgr" extension successfully installed
NOTICE: primary node record (ID: 1) registered
```

### 创建 /clone standby server 并启动PostgreSQL

```sh
sudo -u postgres /opt/pgsql5599/server/bin/repmgr -f /opt/pgsql5599/repmgr/repmgr.conf -h 10.249.105.53 -p 5599 -U repmgr -d repmgr standby clone --dry-run
sudo -u postgres /opt/pgsql5599/server/bin/repmgr -f /opt/pgsql5599/repmgr/repmgr.conf -h 10.249.105.53 -p 5599 -U repmgr -d repmgr standby clone

systemctl start postgres5599
```

### 注册 standby server

```sh
sudo -u postgres /opt/pgsql5599/server/bin/repmgr -f /opt/pgsql5599/repmgr/repmgr.conf standby register
```

### 开启守护进程

```sh
sudo -u postgres /opt/pgsql5599/server/bin/repmgrd -d -f /opt/pgsql5599/repmgr/repmgr.conf
```

## 自动切换, 查看状态, 重新加入集群等

### 查看集群状态

```sh
sudo -u postgres /opt/pgsql5599/server/bin/repmgr -f /opt/pgsql5599/repmgr/repmgr.conf cluster show
```

### 停止主节点后, 再查看集群状态

```sh
systemctl stop postgres5599
```


### 将失败节点重新加入集群

```sh
sudo -u postgres /opt/pgsql5599/server/bin/repmgr -f /opt/pgsql5599/repmgr/repmgr.conf node rejoin -d 'host=10.249.104.162 port=5599 user=repmgr dbname=repmgr connect_timeout=2'
```

## 存在的问题

> 取消 postgres.service 文件, 因为执行repmgr命令会自动拉起; 而且如果不用repmgr启动, 会出现脑裂