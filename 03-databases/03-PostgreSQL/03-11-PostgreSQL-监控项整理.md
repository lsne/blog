# PGSQL 监控整理


## 库级别

1. 获取数据库当前存在的连接数量

```sql
select 'dbtest04v.lsne.cn', 'psql.db_connections[postgres]', extract(epoch from now())::int, ( select numbackends from pg_stat_database where datname = 'postgres' );
```

2. 缓存命中率

```sql
select 'dbtest04v.lsne.cn', 'psql.cachehit_ratio[postgres]', extract(epoch from now())::int, ( SELECT round(blks_hit*100/(blks_hit+blks_read), 2) AS cache_hit_ratio FROM pg_stat_database WHERE datname = 'postgres' and blks_read > 0 union all select 0.00 AS cache_hit_ratio order by cache_hit_ratio desc limit 1 );
```

3. 死锁

```sql
select 'dbtest04v.lsne.cn', 'psql.db_deadlocks[postgres]', extract(epoch from now())::int, ( select deadlocks from pg_stat_database where datname = 'postgres' );
```

4. 通过数据库查询写入临时文件的数据总量

```sql
select 'dbtest04v.lsne.cn', 'psql.db_temp_bytes[postgres]', extract(epoch from now())::int, ( select temp_bytes from pg_stat_database where datname = 'postgres' );
```

5. 提交的事务数量 (5 ~ 11 如果要查整个实例的信息, 只需要执行类似:  select sum(xact_commit) from pg_stat_database; )

```sql
select 'dbtest04v.lsne.cn', 'psql.db_tx_commited[postgres]', extract(epoch from now())::int, ( select xact_commit from pg_stat_database where datname = 'postgres' );
```

6. 回滚的事务数量

```sql
select 'dbtest04v.lsne.cn', 'psql.db_tx_rolledback[postgres]', extract(epoch from now())::int, ( select xact_rollback from pg_stat_database where datname = 'postgres' );
```

7. 删除次数

```sql
select 'dbtest04v.lsne.cn', 'psql.db_deleted[postgres]', extract(epoch from now())::int, ( select tup_deleted from pg_stat_database where datname = 'postgres' );
```

8. fetched次数

```sql
select 'dbtest04v.lsne.cn', 'psql.db_fetched[postgres]', extract(epoch from now())::int, ( select tup_fetched from pg_stat_database where datname = 'postgres' );
```

9. inserted次数

```sql
select 'dbtest04v.lsne.cn', 'psql.db_inserted[postgres]', extract(epoch from now())::int, ( select tup_inserted from pg_stat_database where datname = 'postgres' );
```

10. returned次数

```sql
select 'dbtest04v.lsne.cn', 'psql.db_returned[postgres]', extract(epoch from now())::int, ( select tup_returned from pg_stat_database where datname = 'postgres' );
```

11. updated次数

```sql
select 'dbtest04v.lsne.cn', 'psql.db_updated[postgres]', extract(epoch from now())::int, ( select tup_updated from pg_stat_database where datname = 'postgres' );
```

12. 版本

```sql
SELECT current_setting('server_version_num');
或
select version();
```

## 实例级别

1. 一 pg.transactions

```sql
select 'dbtest04v.lsne.cn', 'psql.tx_commited', extract(epoch from now())::int, (select sum(xact_commit) from pg_stat_database) ;

select 'dbtest04v.lsne.cn', 'psql.tx_rolledback', extract(epoch from now())::int, (select sum(xact_rollback) from pg_stat_database) ;

select 'dbtest04v.lsne.cn', 'psql.active_connections', extract(epoch from now())::int, (select count(*) from pg_stat_activity where state = 'active') ;

#### 这个下面分版本 select 'dbtest04v.lsne.cn', 'psql.server_connections', extract(epoch from now())::int, (select count(*) from pg_stat_activity $CONN_COND) ;

select 'dbtest04v.lsne.cn', 'psql.idle_connections', extract(epoch from now())::int, (select count(*) from pg_stat_activity where state = 'idle') ;

select 'dbtest04v.lsne.cn', 'psql.idle_tx_connections', extract(epoch from now())::int, (select count(*) from pg_stat_activity where state = 'idle in transaction') ;

####这个下面分版本 select 'dbtest04v.lsne.cn', 'psql.locks_waiting', extract(epoch from now())::int, (select count(*) from pg_stat_activity $CONN_COND $LOCK_COND) ;

select 'dbtest04v.lsne.cn', 'psql.server_maxcon', extract(epoch from now())::int, (select setting::int from pg_settings where name = 'max_connections');


pg version >= 10
select 'dbtest04v.lsne.cn', 'psql.server_connections', extract(epoch from now())::int, (select count(*) from pg_stat_activity where backend_type = 'client backend') ;
select 'dbtest04v.lsne.cn', 'psql.locks_waiting', extract(epoch from now())::int, (select count(*) from pg_stat_activity where backend_type = 'client backend' and wait_event_type like '%Lock%') ;

pg version >= 9.6
select 'dbtest04v.lsne.cn', 'psql.server_connections', extract(epoch from now())::int, (select count(*) from pg_stat_activity) ;
select 'dbtest04v.lsne.cn', 'psql.locks_waiting', extract(epoch from now())::int, (select count(*) from pg_stat_activity where wait_event_type like '%Lock%') ;

pg version < 9.6
select 'dbtest04v.lsne.cn', 'psql.server_connections', extract(epoch from now())::int, (select count(*) from pg_stat_activity ) ;
select 'dbtest04v.lsne.cn', 'psql.locks_waiting', extract(epoch from now())::int, (select count(*) from pg_stat_activity where waiting = 'true') ;
```

2. 二 pg.bgwriter

```sql
select 'dbtest04v.lsne.cn', 'psql.buffers_alloc', extract(epoch from now())::int, (select buffers_alloc from pg_stat_bgwriter) ;

select 'dbtest04v.lsne.cn', 'psql.buffers_backend', extract(epoch from now())::int, (select buffers_backend from pg_stat_bgwriter) ;

select 'dbtest04v.lsne.cn', 'psql.buffers_backend_fsync' , extract(epoch from now())::int, (select buffers_backend_fsync from pg_stat_bgwriter) ;

select 'dbtest04v.lsne.cn', 'psql.buffers_checkpoint', extract(epoch from now())::int, (select buffers_checkpoint from pg_stat_bgwriter) ;

select 'dbtest04v.lsne.cn', 'psql.buffers_clean', extract(epoch from now())::int, (select buffers_clean from pg_stat_bgwriter) ;

select 'dbtest04v.lsne.cn', 'psql.checkpoints_req', extract(epoch from now())::int, (select checkpoints_req from pg_stat_bgwriter) ;

select 'dbtest04v.lsne.cn', 'psql.checkpoints_timed', extract(epoch from now())::int, (select checkpoints_timed from pg_stat_bgwriter) ;

select 'dbtest04v.lsne.cn', 'psql.maxwritten_clean', extract(epoch from now())::int, (select maxwritten_clean from pg_stat_bgwriter);
```

3. 三  pg.slow_query

```sql
select 'dbtest04v.lsne.cn', 'psql.slow_dml_queries', extract(epoch from now())::int, (select count(*) from pg_stat_activity where state = 'active' and now() - query_start > '$PARAM1 sec'::interval and query ~* '^(insert|update|delete)');

select 'dbtest04v.lsne.cn', 'psql.slow_queries', extract(epoch from now())::int, (select count(*) from pg_stat_activity where state = 'active' and now() - query_start > '$PARAM1 sec'::interval);

select 'dbtest04v.lsne.cn', 'psql.slow_select_queries', extract(epoch from now())::int, (select count(*) from pg_stat_activity where state = 'active' and now() - query_start > '$PARAM1 sec'::interval and query ilike 'select%');
```

4. 库大小, pg.size , 库使用率

```sql
select 'dbtest04v.lsne.cn', 'psql.db_size[$DBNAME]', extract(epoch from now())::int, (select pg_database_size('$DBNAME'));

select 'dbtest04v.lsne.cn', 'psql.db_garbage_ratio[$DBNAME]', extract(epoch from now())::int, ( \
	SELECT round(100*sum( \
	CASE (a.n_live_tup+a.n_dead_tup) WHEN 0 THEN 0 \
	ELSE c.relpages*(a.n_dead_tup/(a.n_live_tup+a.n_dead_tup)::numeric) \
	END \
	)/ sum(c.relpages),2) \
	FROM \
	pg_class as c join pg_stat_all_tables as a on(c.oid = a.relid) where relpages > 0);
```

## standby 从库相关监控

1. 一 pg.stat_replication  

```sql
#### pg version 10 之后
select * from ( \
	select 'dbtest04v.lsne.cn', 'psql.write_diff['||host(client_addr)||']', extract(epoch from now())::int, pg_wal_lsn_diff(sent_lsn, write_lsn)::text as value from pg_stat_replication \
	union all \
	select 'dbtest04v.lsne.cn', 'psql.replay_diff['||host(client_addr)||']', extract(epoch from now())::int, pg_wal_lsn_diff(sent_lsn, replay_lsn)::text as value from pg_stat_replication \
	union all \
	select 'dbtest04v.lsne.cn', 'psql.sync_priority['||host(client_addr)||']', extract(epoch from now())::int, sync_priority::text as value from pg_stat_replication \
	union all \
	select 'dbtest04v.lsne.cn', 'psql.sync_state['||host(client_addr)||']', extract(epoch from now())::int, sync_state::text as value from pg_stat_replication \
	union all
	select '"$HOST_NAME"', 'psql.write_lag['||host(client_addr)||']', $TIMESTAMP_QUERY, extract(epoch from (coalesce(write_lag,'00:00:00')))::text as value from pg_stat_replication \
	union all
	select '"$HOST_NAME"', 'psql.flush_lag['||host(client_addr)||']', $TIMESTAMP_QUERY, extract(epoch from (coalesce(flush_lag,'00:00:00')))::text as value from pg_stat_replication \
	union all
	select '"$HOST_NAME"', 'psql.replay_lag['||host(client_addr)||']', $TIMESTAMP_QUERY, extract(epoch from (coalesce(replay_lag,'00:00:00')))::text as value from pg_stat_replication \
	) as t where value is not null;


#### pg version 10 之前
select * from ( \
	select 'dbtest04v.lsne.cn', 'psql.write_diff['||host(client_addr)||']', extract(epoch from now())::int, pg_xlog_location_diff(sent_location, write_location)::text as value from pg_stat_replication \
	union all \
	select 'dbtest04v.lsne.cn', 'psql.replay_diff['||host(client_addr)||']', extract(epoch from now())::int, pg_xlog_location_diff(sent_location, replay_location)::text as value from pg_stat_replication \
	union all \
	select 'dbtest04v.lsne.cn', 'psql.sync_priority['||host(client_addr)||']', extract(epoch from now())::int, sync_priority::text as value from pg_stat_replication \
	union all \
	select 'dbtest04v.lsne.cn', 'psql.sync_state['||host(client_addr)||']', extract(epoch from now())::int, sync_state::text as value from pg_stat_replication \
	) as t where value is not null;
						
```

2. 二 pg.sr.status

```sql
select 'dbtest04v.lsne.cn', 'psql.block_query', extract(epoch from now())::int, (select CASE count(setting) when 0 then 1 ELSE (select CASE (select pg_is_in_recovery()::int) when 1 then 1 ELSE (select CASE (select count(*) from pg_stat_replication where sync_priority > 0) when 0 then 0 else 1 END) END) END from pg_settings where name ='synchronous_standby_names' and setting !='');

SELECT 'dbtest04v.lsne.cn','psql.confl_tablespace[' || datname || ']',extract(epoch from now())::int,confl_tablespace from pg_stat_database_conflicts where datname not in ('template1','template0');

SELECT 'dbtest04v.lsne.cn','psql.confl_lock[' || datname || ']',extract(epoch from now())::int,confl_lock from pg_stat_database_conflicts where datname not in ('template1','template0');

SELECT 'dbtest04v.lsne.cn','psql.confl_snapshot[' || datname || ']',extract(epoch from now())::int,confl_snapshot from pg_stat_database_conflicts where datname not in ('template1','template0');

SELECT 'dbtest04v.lsne.cn','psql.confl_bufferpin[' || datname || ']',extract(epoch from now())::int,confl_bufferpin from pg_stat_database_conflicts where datname not in ('template1','template0');

SELECT 'dbtest04v.lsne.cn','psql.confl_deadlock[' || datname || ']',extract(epoch from now())::int,confl_deadlock from pg_stat_database_conflicts where datname not in ('template1','template0');
```

## 表状态

1. pg.stat_table 

```sql
select 'dbtest04v.lsne.cn', 'psql.table_analyze_count[$DBNAME,$SCHEMANAME,$TABLENAME]', extract(epoch from now())::int, (select analyze_count from pg_stat_user_tables where schemaname = '$SCHEMANAME' and relname = '$TABLENAME');

select 'dbtest04v.lsne.cn', 'psql.table_autoanalyze_count[$DBNAME,$SCHEMANAME,$TABLENAME]', extract(epoch from now())::int, (select autoanalyze_count from pg_stat_user_tables where schemaname = '$SCHEMANAME' and relname = '$TABLENAME');

select 'dbtest04v.lsne.cn', 'psql.table_autovacuum_count[$DBNAME,$SCHEMANAME,$TABLENAME]', extract(epoch from now())::int, (select autovacuum_count from pg_stat_user_tables where schemaname = '$SCHEMANAME' and relname = '$TABLENAME');

select 'dbtest04v.lsne.cn', 'psql.table_heap_cachehit_ratio[$DBNAME,$SCHEMANAME,$TABLENAME]', extract(epoch from now())::int, (select CASE heap_blks_hit+heap_blks_read WHEN 0 then 100 else round(heap_blks_hit*100/(heap_blks_hit+heap_blks_read), 2) end from pg_statio_user_tables where schemaname = '$SCHEMANAME' and relname = '$TABLENAME');

select 'dbtest04v.lsne.cn', 'psql.table_idx_cachehit_ratio[$DBNAME,$SCHEMANAME,$TABLENAME]', extract(epoch from now())::int, (select CASE WHEN idx_blks_read is NULL then 0 when idx_blks_hit+idx_blks_read=0 then 100 else round(idx_blks_hit*100/(idx_blks_hit+idx_blks_read + 0.0001), 2) end from pg_statio_user_tables where schemaname = '$SCHEMANAME' and relname = '$TABLENAME');

select 'dbtest04v.lsne.cn', 'psql.table_n_dead_tup[$DBNAME,$SCHEMANAME,$TABLENAME]', extract(epoch from now())::int, (select n_dead_tup from pg_stat_user_tables where schemaname = '$SCHEMANAME' and relname = '$TABLENAME');

select 'dbtest04v.lsne.cn', 'psql.table_n_tup_del[$DBNAME,$SCHEMANAME,$TABLENAME]', extract(epoch from now())::int, (select n_tup_del from pg_stat_user_tables where schemaname = '$SCHEMANAME' and relname = '$TABLENAME');

select 'dbtest04v.lsne.cn', 'psql.table_n_tup_hot_upd[$DBNAME,$SCHEMANAME,$TABLENAME]', extract(epoch from now())::int, (select n_tup_hot_upd from pg_stat_user_tables where schemaname = '$SCHEMANAME' and relname = '$TABLENAME');

select 'dbtest04v.lsne.cn', 'psql.table_idx_scan[$DBNAME,$SCHEMANAME,$TABLENAME]', extract(epoch from now())::int, (select coalesce(idx_scan,0) from pg_stat_user_tables where schemaname = '$SCHEMANAME' and relname = '$TABLENAME');

select 'dbtest04v.lsne.cn', 'psql.table_seq_tup_read[$DBNAME,$SCHEMANAME,$TABLENAME]', extract(epoch from now())::int, (select coalesce(seq_tup_read,0) from pg_stat_user_tables where schemaname = '$SCHEMANAME' and relname = '$TABLENAME');

select 'dbtest04v.lsne.cn', 'psql.table_idx_tup_fetch[$DBNAME,$SCHEMANAME,$TABLENAME]', extract(epoch from now())::int, (select coalesce(idx_tup_fetch,0) from pg_stat_user_tables where schemaname = '$SCHEMANAME' and relname = '$TABLENAME');

select 'dbtest04v.lsne.cn', 'psql.table_n_tup_ins[$DBNAME,$SCHEMANAME,$TABLENAME]', extract(epoch from now())::int, (select n_tup_ins from pg_stat_user_tables where schemaname = '$SCHEMANAME' and relname = '$TABLENAME');

select 'dbtest04v.lsne.cn', 'psql.table_n_live_tup[$DBNAME,$SCHEMANAME,$TABLENAME]', extract(epoch from now())::int, (select n_live_tup from pg_stat_user_tables where schemaname = '$SCHEMANAME' and relname = '$TABLENAME');

select 'dbtest04v.lsne.cn', 'psql.table_seq_scan[$DBNAME,$SCHEMANAME,$TABLENAME]', extract(epoch from now())::int, (select seq_scan from pg_stat_user_tables where schemaname = '$SCHEMANAME' and relname = '$TABLENAME');

select 'dbtest04v.lsne.cn', 'psql.table_n_tup_upd[$DBNAME,$SCHEMANAME,$TABLENAME]', extract(epoch from now())::int, (select n_tup_upd from pg_stat_user_tables where schemaname = '$SCHEMANAME' and relname = '$TABLENAME');

select 'dbtest04v.lsne.cn', 'psql.table_vacuum_count[$DBNAME,$SCHEMANAME,$TABLENAME]', extract(epoch from now())::int, (select vacuum_count from pg_stat_user_tables where schemaname = '$SCHEMANAME' and relname = '$TABLENAME')

select 'dbtest04v.lsne.cn', 'psql.table_garbage_ratio[$DBNAME,$SCHEMANAME,$TABLENAME]', extract(epoch from now())::int, (select round(100*(CASE (n_live_tup+n_dead_tup) WHEN 0 THEN 0 ELSE (n_dead_tup/(n_live_tup+n_dead_tup)::numeric) END),2) from pg_stat_user_tables where schemaname = '$SCHEMANAME' and relname = '$TABLENAME')

select 'dbtest04v.lsne.cn', 'psql.table_total_size[$DBNAME,$SCHEMANAME,$TABLENAME]', extract(epoch from now())::int, (select pg_total_relation_size('${SCHEMANAME}.\"${TABLENAME}\"'));
```