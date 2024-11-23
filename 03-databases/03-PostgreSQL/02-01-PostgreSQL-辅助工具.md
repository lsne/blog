# PostgreSQL 辅助工具
## 日志分析器: pgBadger 

pgBadger 是一个 Perl 脚本编写的 PostgreSQL 日志分析器  
自定检测支持的格式: syslog, stderr, csvlog, jsonlog  
支持的压缩格式: gzip, bzip2, lz4, xz, zip, zstd

可以使用命令行选项, 将 pgBadger 限制为公报告错误或删除报告的任何部分


## 中间件: pgbouncer 

下载地址: https://github.com/pgbouncer/pgbouncer

pgbouncer是一个针对PostgreSQL数据库的轻量级连接池，任何目标应用都可以把 pgbouncer 当作一个 PostgreSQL/Greenplum 服务器来连接，然后pgbouncer 会处理与服务器连接，或者是重用已存在的连接。pgbouncer 的目标是降低因为新建到 PostgreSQL/Greenplum 的连接而导致的性能损失。

pgbouncer目前支持三种连接池模型。分别是session, transaction和statment三个级别。

- session
	会话级链接。只有与当客户端的会话结束时，pgbouncer才会收回已分配的链接

- transaction 
	事务级连接。当事务完成后，pgbouncer会回收已分配的链接。也就是说客户端只是在事务中才能独占此链接，非事务的对数据库的请求是没有独享的链接的。

- statement 
	语句级链接。任何对数据库的请求完成后，pgbouncer都会回收链接。此种模式下，客户端不能使用事务，否则会造成数据的不一致。


## 备份恢复工具: pg_rman

下载地址: https://github.com/ossc-db/pg_rman

```
使用简单, 一键备份恢复
支持在线全量、增量、归档备份
支持备份压缩
支持自动备份维护，自动删除过期WAL备份文件
支持备份验证
支持基于 PITR 的配置文件生成器
```

### pg_rman 命令

```sh
pg_rman [OPTION] COMMAND

COMMAND:
init         # 初始化备份目录
backup       # 在线备份
restore      # 恢复
show         # 查看备份历史
validate     # 验证备份
delete       # 从知识库中删除备份信息
purge        # 从备份目录中删除实际的备份文件
```

### 安装 pg_rman

```sh
tar zxvf pg_rman-1.3.9-pg12.tar.gz
cd pg_rman-1.3.9-pg12
make
make install

# 默认安装到 $PG_HOME/bin 目录下
```

### 初始化 pg_rman

```sh
# 1. 在 postgres 用户配置文件中添加变量
vim .bash_profile
export BACKUP_PATH=/home/postgres/pg_rman_backup001
source .bash_profile

# 2. 初始化数据目录
pg_rman init
```


#### 使用 pg_rman

```sh
# 全备
pg_rman backup --backup-mode=full -C -P

# 增量备份
pg_rman backup --backup-mode=incremental -C -P

# 备份归档
pg_rman backup --backup-mode=archive

# 验证备份
# 以上3种备份, 每一种备份完成之后, 都需要做一次验证, 不验证后续无法做增量备份
pg_rman validate

# 查看备份信息
pg_rman show 

# 恢复
pg_rman restore

# 时间点恢复
pg_rman restore --recovery-target-time="2024-04-21 22:00:59"


# 删除备份分为两个步骤
1. 删除指定时间点前的备份记录, 如果只有一个备份, 删除备份需要加 -f 
	pg_rman delete "2023-12-31 23:59:59" [-f]
	
2. 删除实际存储在磁盘上的备份文件
	pg_rman purge
```

### 自动化 pg_rman

> 创建 `pg_rman.ini` 文件

根据备份策略, 制定自动维护配置, 在执行 `pg_rman backup` 备份操作时会自动检查:

```toml
RCLOG_PATH='/data1/archives'          # 归档目录
SRVLOG_PATH='/opt/postgres/data/log'  # 错误日志目录
COMPRESS_DATA = YES                   # 压缩数据
KEEP_ARCLOG_FILE = 10                 # 保留归档文件数量
KEEP_ARCLOG_DAYS = 10                 # 保留归档文件天数
KEEP_DATA_GENERATIONS = 3             # 备份冗余度
KEEP_DATA_DAYS = 10                   # 保留备份集时间
KEEP_SRVLOG_FILES = 10                # 保留日志文件个数
KEEP_SRVLOG_DAYS = 10                 # 保留日志文件天数
```

