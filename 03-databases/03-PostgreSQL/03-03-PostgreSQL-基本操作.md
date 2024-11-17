## PostgreSQL 基本操作

### 常用操作

#### 登录

```sh
# -h 参数可以是 主机地址, 也可以是 socket 文件所在路径
PGPASSWORD='XXXXXX' psql -p 5432 -U postgres -h localhost
```

#### 非交互执行命令

```sh
PGPASSWORD='123456' psql -h /tmp -U postgres -p 5432 --quiet --no-align --tuples-only -c "show hba_file;"
```

### 快捷操作

#### 切库

```
psql> \c db01
```

#### 查看数据库列表

```
psql> \l
```

#### 查看当前库下的表

```
psql> \dt
```

#### 查看表结构

```
psql> \d t1
```

## 数据类型转换

#### 1.  使用函数 `cast()` 转换

```
# 字符串转换为 int 类型
postgres=# select cast('123' as int);
 int4 
------
  123

# oid 转换为对应的表名
postgres=# select cast(18311 as regclass);
 regclass  
-----------
 sch001.t1
```

#### 2. 使用双冒号 `::` 转换

> 双冒号 `::` 是 `PostgreSQL` 特有

```sql
-- 字符串转换为 int 类型
postgres=# select '123'::int;
 int4 
------
  123

-- oid 转换为对应的表名
postgres=# select 18311::regclass;
 regclass  
-----------
 sch001.t1
```

### 数据库操作

> 所有的数据库对象都由各自的对象标识符(oid)在内部管理  

#### 查看数据库 oid

数据库的 oid 存储在 pg_database 中
数据库的 oid 与对应的数据库的目录名是一致的  

```sql
-- dattablespace 表空间 oid
SELECT datname, oid, dattablespace FROM pg_database;
```

#### 查看库大小

```sql
select pg_database.datname, pg_database_size(pg_database.datname)/1024/1024/1024 AS size from pg_database;
```

### 表空间操作

PostgreSQL 默认有两个表空间: `pg_global` 和 `pg_default`
`pg_global` 物理文件在 `global` 目录中。 用来存放系统表
`pg_default` 物理文件在 `base` 目录中。创建库时不指定表空间参数, 则默认存放在 `pg_default` 表空间, 是 `template0` 和 `template1` 库的默认表空间。


#### 查看表空间 oid

```sql
SELECT spcname, oid FROM pg_tablespace;
```

#### 创建表空间

```sql
CREATE TABLESPACE tbl001 LOCATION '/data1/test_pgsql_tablespace_32086/tbl001';
```

#### 创建数据库时指定表空间

```sql
CREATE DATABASE db01 TABLESPACE tbl001;
```

#### 创建表时指定表空间

```sql
CREATE TABLE t1 (id int) TABLESPACE tbl001;
```

### 表操作
#### 查看表的 oid

```sql
-- relfilenode 该表在磁盘上的数据文件的名字, 一般情况下与 oid 相同
SELECT relname, oid, relfilenode FROM pg_class WHERE relname='company';
```

#### 查看指定的 oid 所对应的表

```sql
SELECT 16404::regclass;
```

#### 查看表

```sql
\d

-- 如果在前一个 schema 下搜索到表, 比如: t1 。则后面的 schema 就不会再搜索该表。这会导致不同 schema 下相同的表名在 \d 时只能看到一个

-- 可以使用 pg_class 查看所有表
select relname from pg_class;
```

#### 查指定表的列信息

```sql
-- 查看有多少列
SELECT relnatts FROM pg_class WHERE oid = 16404;

-- 查看每一个列的详细信息
SELECT count(*) FROM pg_attribute WHERE attrelid = 16404 AND attnum > 0;
```

#### 查看插件版本

```sql
-- 有版本信息和已经被安装的哪个版本的插件
SELECT * FROM pg_available_extension_versions where name = 'pg_cron';
```

#### 查看已经安装的插件的版本信息

```sql
SELECT * FROM pg_extension;
```

#### 查看单个表大小

```sql
select pg_relation_size('hack_tool');
```

#### 查看单个表大小

```sql
SELECT current_database() AS dbname,
            psut.schemaname,
            psut.relname,
            psut.relid,
            pg_total_relation_size(psut.relid) AS total_size ,
            pg_relation_size(psut.relid) AS table_size,
            pg_indexes_size(psut.relid) AS index_size,
            pg_relation_size(pc.reltoastrelid) AS toast_size,
            pc.reltuples
        FROM pg_catalog.pg_stat_user_tables psut
        JOIN pg_catalog.pg_class pc ON psut.relid = pc.oid;
```

#### 查看 TimescaleDB 表大小

```sql
SELECT table_bytes/1024/1024/1024, index_bytes/1024/1024/1024, toast_bytes/1024/1024/1024, total_bytes/1024/1024/1024 FROM hypertable_relation_size('rulelog');
```
### 创建表

#### 创建表示例

```sql
// company
CREATE TABLE company(
   ID INT PRIMARY KEY     NOT NULL,
   NAME           TEXT    NOT NULL,
   AGE            INT     NOT NULL,
   ADDRESS        CHAR(50),
   SALARY         REAL
);

// department
CREATE TABLE department(
   ID INT PRIMARY KEY      NOT NULL,
   DEPT           CHAR(50) NOT NULL,
   EMP_ID         INT      NOT NULL
);
```

#### 创建有主键但不自增的表

> 将 `t1` 表的 `id` 字段不会自动增长, 每次 insert 都需要手动写入该列的值

```sql
CREATE TABLE t1 (
	id INT PRIMARY KEY NOT NULL,
	name VARCHAR(50)
);
```
#### 创建表以序列为主键(自增)的表

> 将 `t2` 表的 `id` 字段指定为 SERIAL 类型, 会自动创建一个名为: `t1_id_seq` 的序列

```sql
CREATE TABLE t2 (
	id SERIAL PRIMARY KEY,
	name VARCHAR(50)
);
```

等价于以下三个步骤的

```sql
CREATE SEQUENCE t1_id_seq;

CREATE TABLE t2 (
	id integer NOT NULL DEFAULT nextval('t1_id_seq');
	name VARCHAR(50)
);

ALTER SEQUENCE t1_id_seq OWNER BY t1.id;
```

#### 如果手动创建自增表会报错

```sql
CREATE TABLE "my_table#ap__file_security1" (
  id int8 NOT NULL DEFAULT nextval("public.my_table#ap__file_security1_id_seq"::regclass),
  name VARCHAR(50)
);
```

> 报错: 

```
ERROR:  cannot use column reference in DEFAULT expression
LINE 2:   id int8 NOT NULL DEFAULT nextval("public.my_table#ap__file...
```

> 原因: id 字段上的 `nextval("public.my_table#ap__file_security1_id_seq"::regclass)` 是创建 SERIAL 类型的自增主键字段时, 自动添加的序列。 不用这样写, 直接创建自增主键就可以

```
# 需要将 id 字段类型改为 SERIAL 并且添加主键关键字

CREATE TABLE "my_table#ap__file_security" (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50)
);
```


#### 创建多种类型的字段的表

> 精确小数类型 numeric/decimal 类型, 不写(3,2) 不会转换为特定精度, 第二位不写默认为0

```sql
CREATE TABLE t3(
    id serial PRIMARY KEY,            -- 自增主键
    ok boolean,                       -- boolean
    age smallint NOT NULL DEFAULT 18, -- 整数 smallint/int2 类型 2 byte 
    amount int NOT NULL DEFAULT 0,    -- 整数 int/integer/int4 类型 4 byte
    column01 bigint,                  -- 整数 bigint/int8 类型 8 byte
    column02 numeric(3,2),            -- 精确小数类型 numeric/decimal 类型
    column03 real,                    -- 浮点数(不精确)
    column04 double precision,        -- 浮点数(不精确)
    column05 serial,                  -- 自增
    column06 bigserial,               -- 大范围自增
    column07 varchar(10),             -- 变长, 最大 1GB
    column08 char(10),                -- 定长, 不足补空白
    column09 text,                    -- 变长, 无长度限制
    column10 date,                    -- 日期(天): 2023-12-31, 4 byte
    column11 date,                    -- 时间: 23:59:59, 8 byte
    column12 timestamp,               -- 日期和时间, 8 byte
    column13 int[],                   -- int 数组类型
    column14 date[],                  -- int 数组类型
    column15 xml,                     -- xml 类型
    column16 json                     -- json 类型
);
```

#### 创建分区表

```sql
# 创建主表
CREATE TABLE orders (
    id serial,
    user_id int4,
    create_time timestamp(0) 
) PARTITION BY RANGE(create_time);

# 创建分区表
CREATE TABLE orders_history PARTITION OF orders FOR VALUES FROM ('2000-01-01') TO ('2020-03-01');
CREATE TABLE orders_202003 PARTITION OF orders FOR VALUES FROM ('2020-03-01') TO ('2020-04-01');
CREATE TABLE orders_202004 PARTITION OF orders FOR VALUES FROM ('2020-04-01') TO ('2020-05-01');
CREATE TABLE orders_202005 PARTITION OF orders FOR VALUES FROM ('2020-05-01') TO ('2020-06-01');
CREATE TABLE orders_202006 PARTITION OF orders FOR VALUES FROM ('2020-06-01') TO ('2020-07-01');

# 创建分区表索引
CREATE INDEX CONCURRENTLY order_idx_history_create_time ON orders_history USING btree(create_time);
CREATE INDEX CONCURRENTLY order_idx_202003_create_time ON orders_202003 USING btree(create_time);
CREATE INDEX CONCURRENTLY order_idx_202004_create_time ON orders_202004 USING btree(create_time);
CREATE INDEX CONCURRENTLY order_idx_202005_create_time ON orders_202005 USING btree(create_time);
CREATE INDEX CONCURRENTLY order_idx_202006_create_time ON orders_202006 USING btree(create_time);

# 可以在父表上再创建普通索引
CREATE INDEX order_idx_create_time ON orders USING btree(create_time);
```

#### 删除分区表中的指定分区

```sql
DROP TABLE orders_202003;
```

#### 只将分区与父表分离, 不实际删除子表

```sql
ALTER TABLE orders DETACH PARTITION orders_202003;
```

#### 创建范围分区

```sql
CREATE TABLE pkslow_person_r (age int not null, city varchar not null) PARTITION BY RANGE (age);

create table pkslow_person_r1 partition of pkslow_person_r for values from (MINVALUE) to (10);  
create table pkslow_person_r2 partition of pkslow_person_r for values from (11) to (20);  
create table pkslow_person_r3 partition of pkslow_person_r for values from (21) to (30);  
create table pkslow_person_r4 partition of pkslow_person_r for values from (31) to (MAXVALUE); 
```

#### 创建 LIST 分区

```sql
create table pkslow_person_l (age int not null, city varchar not null) partition by list (city);

CREATE TABLE pkslow_person_l1 PARTITION OF pkslow_person_l FOR VALUES IN ('GZ');  
CREATE TABLE pkslow_person_l2 PARTITION OF pkslow_person_l FOR VALUES IN ('BJ');  
CREATE TABLE pkslow_person_l3 PARTITION OF pkslow_person_l DEFAULT; 
```

#### 创建 HASH 分区

```sql
create table pkslow_person_h (age int not null, city varchar not null) partition by hash (city);

create table pkslow_person_h1 partition of pkslow_person_h for values with (modulus 4, remainder 0);  
create table pkslow_person_h2 partition of pkslow_person_h for values with (modulus 4, remainder 1);  
create table pkslow_person_h3 partition of pkslow_person_h for values with (modulus 4, remainder 2);  
create table pkslow_person_h4 partition of pkslow_person_h for values with (modulus 4, remainder 3); 
```

### 表继承

```sql
CREATE TABLE persons (
	name text,
	sex boolean,
	age int
);

CREATE TABLE students (
class_no int
) INHERITS (persons);

# 可以看到两个表都有写入
INSERT INTO students values('张三', 15, true, 1);

注意:
1. 在 persons 表中直接写入的数据, 在 students 表中看不到
2. 在 students 表中写入的数据,  直接在 persons 表中 update, 则在 students 表可以看到更改
```

### 索引操作

#### 重建索引

```sql
REINDEX INDEX t1_pkey;
```

#### 查看索引信息

```sql
-- 查看索引 meta 信息
SELECT * FROM BT_METAP('t1_pkey');

-- 查看指定的索引块的状态信息
-- 1 是索引块号, 比如meta信息中记录的索引 root 块是 1, 则这里查的就是索引的根块信息
SELECT * FROM bt_page_stats('t1_pkey', 1);  

-- 查看指定索引块的内容
-- 内容包含行ID(ctid) 和 索引字段的值
SELECT * FROM bt_page_items('t1_pkey', 1);  

-- 根据 ctid 查找表记录
SELECT * FROM t1 where ctid='(0,1)';
```

### schema 操作

#### 查看当前 schema

```sql
SHOW search_path;
```

#### 切换 schema

```sql
SET search_path TO "$user",mysch;
或
SET search_path TO mysch;
或
SET search_path TO mysch,public;
```

#### 查看当前库下所有 schema

```sql
\dnS

-- 或
select schema_name from information_schema.schemata where schema_name not in ('information_schema','pg_catalog','pg_temp_1','pg_toast','pg_toast_temp_1','public');
```

#### 获取某个 schema 下的表

```sql
select table_name from information_schema.tables where table_schema='schema_name' and table_type='table_name';
```

#### 创建 schema

```sql
CREATE SCHEMA sch001;
```

#### 查看模式

```sql
\dn
```

#### 删除模式

> 只有 schema 所属于的 owner 用户, 或具有 super 权限的用户才可以删除 schema

```sql
-- 删除 schema (如果 schema 有对象则会删除失败)
DROP SCHEMA sch001;

-- 删除 schema 同时删除所有依赖
DROP SCHEMA sch001 CASCADE;
```

#### 查看 schema 搜索路径

```sql
show search_path;
```

#### 设置 schema 搜索路径

```sql
SET search_path="$user", public, sch001,sch002,sch003;
```

#### 给 schema 添加注释

```sql
COMMENT ON SCHEMA public IS '这是一个测试用的schema';
```

### 与 pg_class 有关的操作
#### 查所有数据库

```sql
SELECT d.datname as "Name",
       pg_catalog.pg_get_userbyid(d.datdba) as "Owner",
       pg_catalog.pg_encoding_to_char(d.encoding) as "Encoding",
       d.datcollate as "Collate",
       d.datctype as "Ctype",
       pg_catalog.array_to_string(d.datacl, E'\n') AS "Access privileges"
FROM pg_catalog.pg_database d
ORDER BY 1;
```

#### 查所有用户角色

```sql
SELECT rolname,
	CASE rolcanlogin WHEN 'true' THEN 'user' WHEN 	'false' THEN 'role' END AS TYPE
FROM pg_roles
WHERE rolname !~ '^pg_'
ORDER BY 1;
```


#### 查所有 schema

```sql
SELECT n.nspname AS "Name",
  pg_catalog.pg_get_userbyid(n.nspowner) AS "Owner"
FROM pg_catalog.pg_namespace n
WHERE n.nspname !~ '^pg_' AND n.nspname not in ('information_schema', 'public')
ORDER BY 1;
```

#### 查所有 table

```sql
SELECT n.nspname as "Schema",
  c.relname as "Name",
  CASE c.relkind WHEN 'r' THEN 'table' WHEN 'v' THEN 'view' WHEN 'm' THEN 'materialized view' WHEN 'i' THEN 'index' WHEN 'S' THEN 'sequence' WHEN 's' THEN 'special' WHEN 'f' THEN 'foreign table' WHEN 'p' THEN 'partitioned table' WHEN 'I' THEN 'partitioned index' END as "Type",
  pg_catalog.pg_get_userbyid(c.relowner) as "Owner"
FROM pg_catalog.pg_class c
     LEFT JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind IN ('r','p','')
      AND n.nspname <> 'pg_catalog'
      AND n.nspname <> 'information_schema'
      AND n.nspname !~ '^pg_toast'
ORDER BY 1,2;
```

#### 查所有 view

```sql
SELECT n.nspname as "Schema",
  c.relname as "Name",
  CASE c.relkind WHEN 'r' THEN 'table' WHEN 'v' THEN 'view' WHEN 'm' THEN 'materialized view' WHEN 'i' THEN 'index' WHEN 'S' THEN 'sequence' WHEN 's' THEN 'special' WHEN 'f' THEN 'foreign table' WHEN 'p' THEN 'partitioned table' WHEN 'I' THEN 'partitioned index' END as "Type",
  pg_catalog.pg_get_userbyid(c.relowner) as "Owner"
FROM pg_catalog.pg_class c
     LEFT JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind IN ('v','m')
      AND n.nspname <> 'pg_catalog'
      AND n.nspname <> 'information_schema'
      AND n.nspname !~ '^pg_toast'
ORDER BY 1,2;
```

#### 查所有索引

```sql
SELECT n.nspname as "Schema",
  c.relname as "Name",
  CASE c.relkind WHEN 'r' THEN 'table' WHEN 'v' THEN 'view' WHEN 'm' THEN 'materialized view' WHEN 'i' THEN 'index' WHEN 'S' THEN 'sequence' WHEN 's' THEN 'special' WHEN 'f' THEN 'foreign table' WHEN 'p' THEN 'partitioned table' WHEN 'I' THEN 'partitioned index' END as "Type",
  pg_catalog.pg_get_userbyid(c.relowner) as "Owner",
 c2.relname as "Table"
FROM pg_catalog.pg_class c
     LEFT JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
     LEFT JOIN pg_catalog.pg_index i ON i.indexrelid = c.oid
     LEFT JOIN pg_catalog.pg_class c2 ON i.indrelid = c2.oid
WHERE c.relkind IN ('i','I','')
      AND n.nspname <> 'pg_catalog'
      AND n.nspname <> 'information_schema'
      AND n.nspname !~ '^pg_toast'
ORDER BY 1,2;
```

## 不常用类型
#### 货币类型

```sql
postgres=# SELECT '12.34'::money;
 money  
--------
 $12.34

postgres=# set lc_monetary = 'en_US.UTF-8';
SET
postgres=# SELECT 12.34::money;
 money  
--------
 $12.34

postgres=# set lc_monetary = 'zh_CN.UTF-8';
SET
postgres=# SELECT 12.34::money;
  money  
---------
 ￥12.34
```

#### 网络地址类型

```sql
postgres=# SELECT '192.168.1.100'::inet;
     inet      
---------------
 192.168.1.100

postgres=# SELECT '192.168.1.100'::cidr;
       cidr       
------------------
 192.168.1.100/32

postgres=# SELECT '00e04c757d5a'::macaddr;
      macaddr      
-------------------
 00:e0:4c:75:7d:5a

postgres=# SELECT '00-e0-4c-75-7d-5a'::macaddr;
      macaddr      
-------------------
 00:e0:4c:75:7d:5a
```

#### 复合类型

```sql
CREATE TYPE person AS (
	name varchar(10),
	age int,
	sex boolean
);
```
#### `XML` 和 `JSON` 类型

#### 其他类型

```
# 范围类型
int4range
int8range
daterange

# 数组类型
int[]
text[]

# uuid 类型

# pg_lsn 类型
```

### 其他操作
#### 清理 pgsql 的 timesclaedb 插件数据

```
SELECT drop_chunks('rulelog', INTERVAL '15 day');
SELECT drop_chunks('rulestat', INTERVAL '365 day');

SELECT add_drop_chunks_policy('rulelog', INTERVAL '15 day');
SELECT add_drop_chunks_policy('rulestat', INTERVAL '365 day');
```



#### 远程访问其他实例

```
create extension if not exists dblink;

select * from dblink('host=pgsql32092w.yun.lsne.cn port=32092 dbname=yl1 user=yl1 password=xxxxxxxxxx', 'select * from test1') as t (id integer, name text, age text);
```