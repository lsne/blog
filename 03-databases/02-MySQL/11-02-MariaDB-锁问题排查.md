# MariaDB 锁问题排查
## mariadb 锁等待

```sql
SELECT
    blocking_trx.trx_mysql_thread_id blocking_thread_id,
    blocking_thread.HOST blocking_host,
    blocking_thread.USER blocking_user,
    blocking_trx.trx_started blocking_start_time,
    blocking_trx.trx_state blocking_state,
    blocking_trx.trx_operation_state blocking_status,
    blocking_trx.trx_isolation_level blocking_trx_iso,
    blocking_trx.trx_query blocking_sql,
    waiting_trx.trx_mysql_thread_id waiting_thread_id,
    waiting_thread.HOST waiting_host,
    waiting_thread.USER waiting_user,
    waiting_trx.trx_started waiting_start_time,
    waiting_trx.trx_state waiting_state,
    waiting_trx.trx_operation_state waiting_status,
    waiting_trx.trx_isolation_level waiting_trx_iso,
    waiting_trx.trx_query waiting_sql
FROM
    information_schema.innodb_lock_waits w
    INNER JOIN information_schema.INNODB_TRX blocking_trx ON w.blocking_trx_id = blocking_trx.trx_id
    INNER JOIN information_schema.PROCESSLIST blocking_thread ON blocking_trx.trx_mysql_thread_id = blocking_thread.ID
    INNER JOIN information_schema.INNODB_TRX waiting_trx ON w.requesting_trx_id = waiting_trx.trx_id
    INNER JOIN information_schema.PROCESSLIST waiting_thread ON waiting_trx.trx_mysql_thread_id = waiting_thread.ID\G
```

```sql
#!/bin/bash

#cli="/opt/mariadb3306/bin/mariadb"   # mysql 客户端命令位置, 如: cli="/opt/mariadb3306/bin/mariadb", PATH环境变量里有, 就直接写命令如: cli="mysql"
cli="mysql"   # mysql 客户端命令位置, 如: cli="/opt/mariadb3306/bin/mariadb", PATH环境变量里有, 就直接写命令如: cli="mysql"
host="127.0.0.1"   # mysql 地址
port="3306"        # mysql 端口
username="root"    # mysql 用户
password="123456"  # mysql 密码
outfile="/opt/mariadb_log/lock_waits.log"   # 结果输出到哪个文件

if ! command -v ${cli} > /dev/null; then
    echo "$cli" 不是一个命令
    exit 2
fi

mkdir -p ${outfile%/*} || exit 2

{
    date
    ${cli} -h ${host} -P ${port} -u ${username} -p${password} -Be "SELECT blocking_trx.trx_mysql_thread_id blocking_thread_id, blocking_thread.HOST blocking_host, blocking_thread.USER blocking_user, blocking_trx.trx_started blocking_start_time, blocking_trx.trx_state blocking_state, blocking_trx.trx_operation_state blocking_status, blocking_trx.trx_isolation_level blocking_trx_iso, blocking_trx.trx_query blocking_sql, waiting_trx.trx_mysql_thread_id waiting_thread_id, waiting_thread.HOST waiting_host, waiting_thread.USER waiting_user, waiting_trx.trx_started waiting_start_time, waiting_trx.trx_state waiting_state, waiting_trx.trx_operation_state waiting_status, waiting_trx.trx_isolation_level waiting_trx_iso, waiting_trx.trx_query waiting_sql FROM information_schema.innodb_lock_waits w INNER JOIN information_schema.INNODB_TRX blocking_trx ON w.blocking_trx_id = blocking_trx.trx_id INNER JOIN information_schema.PROCESSLIST blocking_thread ON blocking_trx.trx_mysql_thread_id = blocking_thread.ID INNER JOIN information_schema.INNODB_TRX waiting_trx ON w.requesting_trx_id = waiting_trx.trx_id INNER JOIN information_schema.PROCESSLIST waiting_thread ON waiting_trx.trx_mysql_thread_id = waiting_thread.ID\G" 2>/dev/null
    echo ""
} >>${outfile}
```