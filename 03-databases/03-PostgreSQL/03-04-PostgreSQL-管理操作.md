# 管理操作

#### 查找内嵌函数名

> `pg_proc` 表存在所有内嵌的函数或存储过程的名字

```
# 查看检查点函数名
select proname from pg_proc where proname like '%check%';
```

#### 手动执行检查点

```sql
-- 立即触发检查点
CHECKPOINT;

-- 触发检查点, 根据系统来, 好像经常执行完之后, 返回的信息没有变化
select pg_control_checkpoint();
```

#### 删除 pg_wal

```sql
-- 查看当前 wal 文件名
SELECT pg_walfile_name(pg_current_wal_lsn());

-- 切换 wal
SELECT pg_switch_wal();

-- 产生检查点, 不必考虑是否立即触发, 应该只根据返回的结果删除之前的 wal 文件就可以(待测试)
SELECT pg_control_checkpoint();

-- 删除指定 wal 文件之前的 wal 文件
/usr/pgsql-12/bin/pg_archivecleanup -d /data1/pgsql32086/pg_wal 0000000100000004000000A8
```
