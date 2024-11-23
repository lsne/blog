# PostgreSQL-问题处理
### 问题排查 

##### 1. 查看正在执行的sql

```sql
select * from pg_stat_activity where datname='schema名称';
```

##### 最后一秒创建的连接数
```sql
select backend_start from pg_stat_activity where now()-backend_start < '1 second';
```

##### 2 查询正在运行任务的sql并强制停止

```sql
SELECT
    procpid,
    start,
    now() - start AS lap,
    current_query
FROM
    (
        SELECT
            backendid,
            pg_stat_get_backend_pid(S.backendid) AS procpid,
            pg_stat_get_backend_activity_start(S.backendid) AS start,
            pg_stat_get_backend_activity(S.backendid) AS current_query
        FROM
            (
                SELECT
                    pg_stat_get_backend_idset() AS backendid
            ) AS S
    ) AS S
WHERE
    current_query <> 'idle'
ORDER BY
    lap DESC;
    
    
# 强制停止任务
SELECT pg_cancel_backend(进程id);   # 停止读操作
select pg_terminate_backend(pid);   # 停止写操作

# 补充
SELECT
    pid,
    datname AS db,
    query_start AS start,
    now() - query_start AS lap,
    query
FROM
    pg_stat_activity
WHERE
    state <> 'idle'
    and query not like '%pg_stat_activity%'
    and (now() - query_start) > interval '10 seconds';
```

### 现象

##### 1. postgresql 启动失败

##### 2. `pg_ctl start -D ${PGDATA}` 报错
```
postgresql error PANIC: could not locate a valid checkpoint record
```

##### 3.  `postgres -D ${PGDATA}` 报错
```
PANIC: replication checkpoint has wrong magic 0 instead of
```

##### 4. 解决办法:
```
mv ${PGDATA}/pg_logical/replorigin_checkpoint ${PGDATA}/pg_logical/replorigin_checkpoint.bak
然后启动实例
```