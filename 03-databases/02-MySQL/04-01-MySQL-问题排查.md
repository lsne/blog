# MySQL 问题排查
#### 磁盘占用排查

> 在操作系统找到消耗IO的TID

```sh
# top -H
iotop -u mysql
```

> 查看 mysql 库里的对应线程

```sql
SELECT a.name,
a.thread_id,       
a.thread_os_id,  //操作系统的线程id (top -H 对应PID, 或者 iotop -u mysql 对应TID)
a.processlist_id, // mysql 进程id, 可以 kill query
a.type,           // 线程类型, 分前台线程和后台线程
b.user,           // 用户
b.host,           // ip
b.db,             // 操作的库
b.command,        // sql 类型
b.time,           // sql 执行时间 单位: 秒
b.state,          // sql 状态
b.info            // sql 语句
FROM performance_schema.threads a
LEFT JOIN information_schema.processlist b
ON a.processlist_id = b.id
WHERE a.type = 'FOREGROUND';
```

#### 查看库里有哪些外键

```sql
SELECT
    C.TABLE_SCHEMA 拥有者,
    C.REFERENCED_TABLE_NAME 父表名称,
    C.REFERENCED_COLUMN_NAME 父表字段,
    C.TABLE_NAME 子表名称,
    C.COLUMN_NAME 子表字段,
    C.CONSTRAINT_NAME 约束名,
    T.TABLE_COMMENT 表注释,
    R.UPDATE_RULE 约束更新规则,
    R.DELETE_RULE 约束删除规则
FROM
    INFORMATION_SCHEMA.KEY_COLUMN_USAGE C
JOIN INFORMATION_SCHEMA. TABLES T ON T.TABLE_NAME = C.TABLE_NAME
JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS R ON R.TABLE_NAME = C.TABLE_NAME
AND R.CONSTRAINT_NAME = C.CONSTRAINT_NAME
AND R.REFERENCED_TABLE_NAME = C.REFERENCED_TABLE_NAME
WHERE
    C.REFERENCED_TABLE_NAME IS NOT NULL;
```

####  查看正在开启的事物

```sql
select * from information_schema.innodb_trx;
```

#### 查看 正在开启的事务对对应的 SQL 语句

> 只能看到当前正在执行的 SQL 语句, 如果事务当前没有任何操作, 则不显示

```sql
SELECT
    trx.trx_mysql_thread_id,
    trx.trx_query,
    threads.PROCESSLIST_USER,
    threads.PROCESSLIST_HOST,
    threads.PROCESSLIST_DB,
    threads.PROCESSLIST_COMMAND,
    threads.PROCESSLIST_INFO
FROM
    information_schema.innodb_trx trx
    JOIN performance_schema.threads threads ON threads.processlist_id = trx.trx_mysql_thread_id
WHERE
    trx.trx_state = 'RUNNING';
```

> 当前事务如何没有执行操作, 会看到上一个执行的SQL语句是什么

```sql
SELECT
    trx.trx_mysql_thread_id,
    trx.trx_query,
    threads.PROCESSLIST_USER,
    threads.PROCESSLIST_HOST,
    threads.PROCESSLIST_DB,
    threads.PROCESSLIST_COMMAND,
    threads.PROCESSLIST_INFO,
    esc.current_schema,
    esc.sql_text
FROM
    information_schema.innodb_trx trx
    JOIN performance_schema.threads threads ON threads.processlist_id = trx.trx_mysql_thread_id
    JOIN performance_schema.events_statements_current esc ON esc.thread_id = threads.thread_id
WHERE
    trx.trx_state = 'RUNNING';
```

#### 锁问题排查的相关表

```
information_schema.innodb_trx 可以查看执行完成,但未提交的事务,以及线程ID
performance_schema.data_locks 可以查看未提交事务的锁情况
performance_schema.data_lock_waits  可以查看锁等待信息
performance_schema.events_statements_current 可以查看执行完成,但未执行commit提交动作的SQL

# 查看一个线程中的历史执行的sql语句, 以时间顺序存储
select THREAD_ID,STATEMENT_ID,SQL_TEXT from performance_schema.events_statements_history where THREAD_ID=1313899;  

# 默认每个线程只保存最近10条记录, 可以用以下参数设置
show global variables like 'performance_schema_events_statements_history_size';

```

#### 查看哪个线程在等待哪个线程
##### 5.6

```sql
select
    blocking.trx_mysql_thread_id blocking_thread_id,
    blocking.trx_id blocking_trx_id,
    blocking.trx_started blocking_start_time,
    blocking.trx_state blocking_state,
    blocking.trx_operation_state blocking_status,
    blocking.trx_isolation_level blocking_iso,
    blocking.trx_query blocking_sql,
    request.trx_mysql_thread_id request_thread_id,
    request.trx_id request_trx_id,
    request.trx_started request_start_time,
    request.trx_state request_state,
    request.trx_operation_state request_status,
    request.trx_isolation_level request_iso,
    request.trx_query request_sql
from
    information_schema.innodb_lock_waits waits
    left join information_schema.innodb_trx request on request.trx_id = waits.requesting_trx_id
    left join information_schema.innodb_trx blocking on blocking.trx_id = waits.blocking_trx_id \G
```

> 和上面差不多, 没具体研究区别

```sql
SELECT
    rtrx.`trx_state` AS "等待的状态",
    rtrx.`trx_started` AS "等待事务开始时间",
    rtrx.`trx_wait_started` AS "等待事务等待开始时间",
    lw.`requesting_trx_id` AS "等待事务ID",
    rtrx.trx_mysql_thread_id AS "等待事务线程ID",
    rtrx.`trx_query` AS "等待事务的sql",
    CONCAT(
        rl.`lock_mode`,
        '-',
        rl.`lock_table`,
        '(',
        rl.`lock_index`,
        ')'
    ) AS "等待的表信息",
    rl.`lock_id` AS "等待的锁id",
    lw.`blocking_trx_id` AS "运行的事务id",
    trx.trx_mysql_thread_id AS "运行的事务线程id",
    CONCAT(
        l.`lock_mode`,
        '-',
        l.`lock_table`,
        '(',
        l.`lock_index`,
        ')'
    ) AS "运行的表信息",
    l.lock_id AS "运行的锁id",
    trx.`trx_state` AS "运行事务的状态",
    trx.`trx_started` AS "运行事务的时间",
    trx.`trx_wait_started` AS "运行事务的等待开始时间",
    trx.`trx_query` AS "运行事务的sql"
FROM
    information_schema.`INNODB_LOCKS` rl,
    information_schema.`INNODB_LOCKS` l,
    information_schema.`INNODB_LOCK_WAITS` lw,
    information_schema.`INNODB_TRX` rtrx,
    information_schema.`INNODB_TRX` trx
WHERE
    rl.`lock_id` = lw.`requested_lock_id`
    AND l.`lock_id` = lw.`blocking_lock_id`
    AND lw.requesting_trx_id = rtrx.trx_id
    AND lw.blocking_trx_id = trx.trx_id;
```

##### 8.0

```sql
-- 这个语句可以查出来, 阻塞(blocking) 语句已经执行完成, 但是没有执行 commit 语句的 SQL
SELECT
    -- waiting 是被卡住的sql, 等待 blocking 先执行完成,并且释放锁之后, waiting 才会被执行
    waiting_trx.trx_mysql_thread_id waiting_pid,
    waiting_trx.trx_id waiting_trx_id,
    waiting_esc.SQL_TEXT waiting_sql,
    blocking_trx.trx_mysql_thread_id blocking_pid,
    blocking_trx.trx_id blocking_trx_id,
    blocking_esc.SQL_TEXT blocking_sql
FROM
    performance_schema.data_lock_waits w
    INNER JOIN information_schema.INNODB_TRX waiting_trx ON w.REQUESTING_ENGINE_TRANSACTION_ID = waiting_trx.trx_id
    INNER JOIN performance_schema.events_statements_current waiting_esc ON w.REQUESTING_THREAD_ID = waiting_esc.THREAD_ID
    INNER JOIN information_schema.INNODB_TRX blocking_trx ON w.BLOCKING_ENGINE_TRANSACTION_ID = blocking_trx.trx_id
    INNER JOIN performance_schema.events_statements_current blocking_esc ON w.BLOCKING_THREAD_ID = blocking_esc.THREAD_ID
    ORDER BY w.BLOCKING_ENGINE_TRANSACTION_ID;
```

```sql
-- 这个语句, 如果sql执行完成,但是没有commit; 显示的 blocking_query 为 NULL
SELECT
  waiting_trx_id,    -- waiting 是被卡住的sql, 等待 blocking 先执行完成,并且释放锁之后, waiting 才会被执行
  waiting_pid,
  waiting_query,
  blocking_trx_id,
  blocking_pid,
  blocking_query
FROM sys.innodb_lock_waits;
```

```sql
-- 这个语句, 如果sql执行完成,但是没有commit; 显示的 blocking_query 为 NULL
SELECT
  r.trx_id waiting_trx_id,                         -- r 是被卡住的sql, 等待b先执行完成,并且释放锁之后, r才会被执行
  r.trx_mysql_thread_id waiting_thread,
  r.trx_query waiting_query,
  b.trx_id blocking_trx_id,
  b.trx_mysql_thread_id blocking_thread,
  b.trx_query blocking_query
FROM       performance_schema.data_lock_waits w
INNER JOIN information_schema.innodb_trx b
  ON b.trx_id = w.blocking_engine_transaction_id
INNER JOIN information_schema.innodb_trx r
  ON r.trx_id = w.requesting_engine_transaction_id;

```

#### 未提交的事务, 查看执行的最后一个SQL语句

```sql
-- 有时, 在执行 alter 操作的时候, 会等待元数据锁: Waiting for table metadata lock
-- 这时候查看 performance_schema.data_lock_waits 表是没有任何记录信息的
-- 只能直接查询 information_schema.INNODB_TRX 表, 查看有哪些事物正在执行
-- 以下SQL可以查看未提交的事务, 执行完成的最后一个SQL语句

SELECT 
	now(),
	(UNIX_TIMESTAMP(now()) - UNIX_TIMESTAMP(trx.trx_started)) diff_sec,
	pro.id,
	pro.user,
	pro.host,
	pro.db,
	esc.SQL_TEXT
FROM
	information_schema.INNODB_TRX trx
	INNER JOIN information_schema.PROCESSLIST pro on trx.TRX_MYSQL_THREAD_ID=pro.id
	INNER JOIN performance_schema.threads thr ON pro.id = thr.PROCESSLIST_ID
	INNER JOIN performance_schema.events_statements_current esc ON esc.THREAD_ID = thr.THREAD_ID;
```
