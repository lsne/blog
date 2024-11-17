## 逻辑备份与恢复

### 使用方式

#### 文本 SQL 恢复

```sh
psql db01 < db01.sql
```

#### 二进制文件恢复

```sh
pg_restore -d db02 db02.dmp
```

#### 二进制文件精细恢复

```sh
# 生成一个 toc 文件
pg_restore -l -f db02.toc db02.dmp

# 编辑 db02.toc 
# 不想恢复哪个表, 就在 db02.toc 文件中该表所在行行头添加 ; 号注释屏蔽掉。
# 注意, 同一个表会有两行, 都需要屏蔽掉。 一行创建表, 一行插入数据
```

#### 二进制导出时压缩

```sh
pg_dump testdb | gzip testdb.sql

gunzip -c testdb.sql.gz | psql testdb
```

#### 二进制导出直接导入到指定的库。文件不落地

```sh
pg_dump testdb | psql db01
```

#### 二进制并行导出导入

```sh
pg_dump -Fd -j4 -f testdb.p.dump testdb

pg_restore -d testdb01 -j4 testdb.p.dump
```

### 逻辑备份与恢复

#### `pg_dump` 和 `pg_restore` 二进制格式

> 只能备份实例里的某一个单个库, 不能备份用户等信息, 备份出来的是二进制格式(-Fc)

```sh
# 备份
PGPASSWORD=123456 pg_dump -h /tmp/ -U postgres -p 5432 -Fc -f db1.dmp db1

# 恢复
PGPASSWORD=123456 pg_restore -h /tmp/ -U postgres -p 5432 -Fc -C -d db1 db1.dmp
```

#### `pg_dump` 备份为文本格式

>  只能备份实例里的某一个单个库, 不能备份用户等信息, 备份出来的是二进制格式(-Fc)

```sh
# 备份
PGPASSWORD=123456 /pg_dump -h /tmp/ -U postgres -p 5432 -Fp -f db1.sql db1

# 恢复
PGPASSWORD=123456 psql -h /tmp/ -U postgres -p 5432 -d db1 -f db1.sql
```

#### `pg_dumpall` 备份

> 备份整个实例里的所有库,包括用户和角色信息,  `pg_dumpall` 命令备份出来的只能是文本格式的sql语句. 没办法备份为二进制格式

```sh
# 示例将整个实例备份到 all.sql 文件
PGPASSWORD=123456 pg_dumpall -h /tmp/ -U postgres -p 5432 > all.sql

# 恢复
PGPASSWORD=123456 psql -h /tmp/ -U postgres -p 5432 -f all.sql
```

### 逻辑备份与恢复示例

假若现有环境如下:

```
5556 实例中有库: db01
db01 库中有 2 个schema: public, mysch
public 有 4 张表: t1, t2, t3, t4
mysch 有 2 张表: t4, t5
```

> 测试中全部使用 `-Fc` 备份为二进制格式, 如果需要备份为文本格式, 需要改为 `-Fp` (默认)

#### 对 db01 库全量备份与恢复

> 全量备份实例中的 `db01` 库

```sh
PGPASSWORD='123456' pg_dump -U postgres -h /tmp -p 5432 -Fc -O -f db01.dmp db01
```

> 全量恢复 `db01` 库到实例

```sh
# 创建新库
PGPASSWORD='123456' psql -U postgres -h /tmp -p 5432 -c "create database db01 owner user001;"

# 恢复数据
PGPASSWORD='123456' pg_restore -U postgres -h /tmp -p 5432 -c --if-exists -Fc -d db01 db01.dmp
```

#### 备份恢复指定的表

> 备份(public: t2, t4;  mysch: t5)

```sh
PGPASSWORD='123456' pg_dump -U postgres -h /tmp -p 5432 -Fc -t t4 -t public.t2 -t mysch.t5 -O -f db01_1.dmp db01
```

> 恢复指定的表

```sh
# 创建恢复时涉及到的 库 和 schema (都需要提前手动创建)
PGPASSWORD='123' psql -U postgres -h /tmp -p 5432 -c "create database db01 owner user001;"
PGPASSWORD='123' psql -U postgres -h /tmp -p 5432 -d db01 -c "create schema mysch;"

# 恢复数据
PGPASSWORD='123' pg_restore -U postgres -h /tmp -p 5432 -c --if-exists -Fc -d db01 db01_1.dmp
```

#### 备份时忽略指定的表

> 备份(忽略public: t2, t4;  mysch: t5)

```sh
PGPASSWORD='123456' pg_dump -U postgres -h /tmp -p 5432 -Fc -T t4 -T public.t2 -T mysch.t5 -O -f db01_2.dmp db01
```

> 恢复

```sh
# 创建库(不需要单独创建schema)
PGPASSWORD='123456' psql -U postgres -h /tmp -p 5432 -c "create database db01 owner user001;"

# 恢复数据
PGPASSWORD='123456' pg_restore -U postgres -h /tmp -p 5432 -c --if-exists -Fc -d db01 db01_2.dmp
```

#### 恢复时不导入 owner 和权限

```sh
# 首先创建库, 并指定 库 和 schema 的 owner
create database db01 owner user001;
alter schema public owner to user001;

# 恢复
PGPASSWORD='123' pg_restore -h 127.0.0.1 -U user001 -p 5432 --no-owner --no-privileges -c --if-exists -Fc -d db01 db01.dmp
```

#### copy 导入导出

```
# 以 tab 做分割符

# 导出
\copy emp to 'emp.txt';

# 导入
\copy emp from 'emp.txt';

# 以 , 做为分割符
\copy emp to 'emp.csv' with csv;

# 导入
\copy emp from 'emp.csv' with csv;
```


## 物理备份

### 开启归档模式

```
ALTER SYSTEM SET archive_command = 'cp %p /data/archives/%f';
ALTER SYSTEM SET archive_mode = 'on';
```

### pg_basebackup 的流程

```
1. 执行 pg_start_backup 命令
2. 使用 tar/cp 命令对 $PGDATA 目录进行备份
3. 执行 pg_stop_backup 命令
```

> `pg_basebackup` 命令示例: 拉去主库全量数据, 可以做为从库直接启动

```sh
PGPASSWORD=xxxxx pg_basebackup -D /data1/pgdata -R -Fp -Xs -v  -p 5432 -h 1.1.1.1 -U replica -P
```

### pg_start_backup 流程

```
1. wal 强制全页写
2. 切换 wal 日志文件
3. 做一个检查点
4. 创建 backup_label 文件
```

### pg_stop_backup 流程

```
wal 改为非全页写
写备份结束的XLOG记录
切换 wal 日志文件
创建备份历史文件: 文件内容包含 backup_label 的内容和执行 pg_stop_backup 的时间戳
删除 backup_label 文件:
```
### backup_label 文件内容

```
CHECKPOINT LOCATION : 检查的 位置 LSN
START WAL LOCATION : 备份时 WAL 的位置
BACKUP METHOD : 备份方法: pg_start_backup 还是 pg_basebackup
BACKUP FROM : 备份库模式: 主库/备库
START TIME : 开始时间
LABEL: 在 pg_start_backup 中指定的标签
START TIMELINE : 备份时间线
```

### pg_basebackup 备份命令

```
# 备份为压缩文件(支持为中表空间文件存放在其他目录的情况)
# 会在目录中生成两个文件: base.tar.gz 和 pg_wal.tar.gz
pg_basebackup -D /data/backup/ -Ft -z -P

# 备份为数据目录, 与原 $PGDATA 目录保持一致(不支持表空间路径放在其他目录的情况)
pg_basebackup -D /data/pgdata2 -Fp -P
```

#### 备份指定的表空间

```
select pg_start_backup('tbs);

cd $PGDATA

# 备份指定的表空间目录
tar -zcf /backup/base.tar.gz base

cp backup_label /backup

select pg_stop_backup();
```

## 物理恢复

#### 恢复的几种类型

```
recovery_target_name (string) # 指定 pg_create_restore_point() 所创建的已命名的恢复点进行恢复
recovery_target_timeline = 'latest'   # 恢复到 wal 中所有的事务, 即实例崩溃的时间点
recovery_target = 'immediate'         # 恢复到一致状态。即只恢复到备份时的时间点
recovery_target_time = 'timestamp'    # 指定需要恢复到的时间点
recovery_target_xid = ''              # 指定恢复到哪个事务ID
recovery_target_lsn =                 # 指定恢复到哪个 wal 的 LSN 位置
```

### 完全恢复

```
1. 停止老库实例
	systemctl stop postgresql

2. 备份当前数据目录下 wal 日志文件
	cp $PGDATA/pg_wal /data/pg_wal
	
3. 移除老数据目录
	mv $PGDATA ${PGDATA}.bak

4. 使用备份恢复数据目录
	tar -zxvf /backup/base.tar.gz -C $PGDATA

5. 将备份的当前 wal 拷贝回数据目录
	cp /data/pg_wal/* $PGDATA/pg_wal/

6. 修改 postgresql.conf 文件, 添加以下两行恢复参数:
	# 恢复时将归档 wal 日志复制到 $PGDATA/pg_wal/ 目录
	restore_command = 'cp /data/backup/%f %p'
	# 恢复到最后时间点
	recovery_target_timeline = 'latest'

7. 生成 recovery.signal 空文件
	# pgsql 启动时遇到 recovery.signal, 就会根据 backup_label 文件内容进行恢复
	touch recovery.signal
	
8. 启动数据库
	pg_ctl start

恢复完成后, wal 时间线会+1, wal 文件名从: 0000001xxxxxx 变为  00000002xxxxxxx
恢复完成后, 会在 pg_wal/ 目录下产生一个历史文件，如:
000000002.history 
历史文件不能删除, 删除后下次恢复会报错
```

### 不完全恢复

#### 基于时间点的恢复

```
1. 停止老库实例
	systemctl stop postgresql

2. 备份当前数据目录下 wal 日志文件
	cp $PGDATA/pg_wal /data/pg_wal
	
3. 移除老数据目录
	mv $PGDATA ${PGDATA}.bak

4. 使用备份恢复数据目录
	tar -zxvf /backup/base.tar.gz -C $PGDATA

5. 将备份的当前 wal 拷贝回数据目录
	cp /data/pg_wal/* $PGDATA/pg_wal/

6. 修改 postgresql.conf 文件, 添加以下两行恢复参数:
	# 恢复时将归档 wal 日志复制到 $PGDATA/pg_wal/ 目录
	restore_command = 'cp /data/backup/%f %p'
	# 恢复到指定的时间点
	recovery_target_time = '2024-04-21 11:44:59'

7. 生成 recovery.signal 空文件
	# pgsql 启动时遇到 recovery.signal, 就会根据 backup_label 文件内容进行恢复
	touch recovery.signal
	
8. 启动数据库
	pg_ctl start

9. 等待数据库恢复完成后, 执行以下命令把数据库变成读写模式
	SELECT pg_wal_replay_resume();

恢复完成后, wal 时间线会+1, wal 文件名从: 0000001xxxxxx 变为  00000002xxxxxxx
恢复完成后, 会在 pg_wal/ 目录下产生一个历史文件，如:
000000002.history 
历史文件不能删除, 删除后下次恢复会报错
```

#### 使用表空间备份进行恢复

```
1. 停止老库实例
	systemctl stop postgresql

2. 使用备份恢复数据目录
	tar -zxvf /backup/tbl001.tar.gz -C /data1/tbl001

3. 将备份的 backup_label 复制到 pg数据目录
	cp /backup/backup_label $PGDATA/backup_label

4. 修改 postgresql.conf 文件, 添加以下两行恢复参数:
	# 恢复时将归档 wal 日志复制到 $PGDATA/pg_wal/ 目录
	restore_command = 'cp /data/backup/%f %p'
	# 恢复到最后时间点
	recovery_target_timeline = 'latest'

5. 生成 recovery.signal 空文件
	# pgsql 启动时遇到 recovery.signal, 就会根据 backup_label 文件内容进行恢复
	touch recovery.signal
	
6. 启动数据库
	pg_ctl start

恢复完成后, wal 时间线会+1, wal 文件名从: 0000001xxxxxx 变为  00000002xxxxxxx
恢复完成后, 会在 pg_wal/ 目录下产生一个历史文件，如:
000000002.history 
历史文件不能删除, 删除后下次恢复会报错
```

