# Postgres 主从

#### 主库执行, 查看主从状态

```sql
-- 主从状态
select * from pg_stat_replication;

-- 延迟多少字节 pgsql 10 之后的版本可以使用
select pg_wal_lsn_diff(sent_lsn, replay_lsn) from pg_stat_replication;

-- 延迟多少字节 pgsql 10 之前的版本使用
select pg_xlog_location_diff(sent_location, replay_location) from pg_stat_replication;

```

#### 从库执行, 查看主从状态

```sql
-- 是否为从库
select pg_is_in_recovery();

-- 正在复制的主服务器信息, conninfo 字段中包含主节点IP
SELECT * FROM pg_stat_wal_receiver;

-- 从库同步的主节点的连接信息
show primary_conninfo;

-- 延迟多少字节 pgsql 10 之后的版本可以使用
SELECT
    CASE
        WHEN pg_last_wal_receive_lsn() = pg_last_wal_replay_lsn() THEN 0
        ELSE EXTRACT ( EPOCH FROM now() - pg_last_xact_replay_timestamp())
    END AS log_delay;

-- 延迟多少字节 pgsql 10 之前的版本使用
SELECT
  CASE
    WHEN pg_last_xlog_receive_location() = pg_last_xlog_replay_location() THEN 0
    ELSE EXTRACT (EPOCH FROM now() - pg_last_xact_replay_timestamp())
  END AS log_delay;
```

#### 从库提升为主库

```sql
-- postgresql 12 及之后可以使用
select pg_promote(true, 60);

-- postgresql 11 及之前使用
sudo -u postgres /usr/pgsql-11/bin/pg_ctl -D /data1/pgsql32087 promote
```

#### 增加从库

```sh
systemctl stop postgresql-11.service

PGPASSWORD=123456 pg_basebackup -D /data01/pg/11/data -R -Fp -Xs -v  -p 5430 -h 10.252.176.182 -U replicator -P

systemctl start postgresql-11.service

# 主库:
psql -p 5430 -U postgres -h localhost

select * from pg_stat_replication;
```