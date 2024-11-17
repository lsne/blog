## PostgreSQL 参数

```
参数分为:
- 实例级
- 数据库级
- 用户级
- 会话级
```

### 查看参数

#### 查看参数配置文件位置

```sql
show config_file;
```

#### 当前会话生效的参数值

```sql
show max_wal_size;
show archive_mode;

-- 查看所有参数
show all;
```

#### 查看实例参数

> 可以看到每个参数的当前值, 以及参数含义的解释

```sql
select * from pg_settings where name = 'max_wal_size';
```

#### 查看配置文件中的参数

> 其中 applied = t 不表示已经生效, 需要重启后或 `p_reload_conf()` 后才会生效. 
> 当前生效不生效可以使用 `show max_wal_size;` 查看

```sql
select * from pg_file_settings where name='max_wal_size';
```
#### 查看参数类型

> `pg_settings` 表存放配置参数

```sql
select name, setting, context from pg_settings where name in ('port', 'work_mem', 'log_statement', 'log_checkpoints');

-- 其中 context 列可能的值以及含义:
--	sighup: 表示 reload 后生效
--	superuser: 表示 必须超级管理员权限才可以修改, 可以针对其他用户, 数据库等单独设置
--	postmaster: 表示 必须超级管理员权限才可以修改, 需要重启生效
--	user: 普通用户可以修改, 立即生效,
```

#### 查看所有自定义设置

```sql
\drds
```

#### 查看数据库的连接数限制

```sql
SELECT datname, datconnlimit FROM pg_database;
```

### 参数设置方法

```sql
ALTER DATABASE db01 SET 参数名 { TO | = } { 值 | DEFAULT }
ALTER DATABASE db01 SET 参数名 FROM CURRENT
ALTER DATABASE db01 RESET 参数名 
ALTER DATABASE db01 RESET ALL 
```

### 参数设置示例

#### 设置归档

```sql
ALTER SYSTEM SET archive_mode = on;
```

#### 恢复参数默认值

```sql
-- 将归档参数设置为默认值
ALTER SYSTEM RESET archive_mode;

-- 将 执行SQL报错后中断连接 参数设置为默认值(默认为 off 不中断)
ALTER DATABASE db01 RESET exit_on_error;
```

#### 恢复指定库中的所有参数为默认值

```sql
ALTER DATABASE db01 RESET ALL; 
```

#### 设置数据库搜索 `schema` 路径

```sql
ALTER DATABASE db01 SET search_path TO "$user",public,sch001,sch002;
```

#### 配置连接 db01 库的工作内存

```sql
ALTER DATABASE db01 SET work_mem = '8MB';
```

#### 设置时区

> 重新登录后生效

```sql
ALTER DATABASE db01 SET TimeZone to cet;
ALTER DATABASE db01 SET DateStyle TO SQL,DMY; 
```

#### 设置SQL执行最长时间

```sql
-- 一秒超时
ALTER DATABASE db01 SET statement_timeout = 1000;
```

#### 设置客户端编码

```sql
ALTER DATABASE db01 SET client_encoding TO gbk;
```

#### 指定库的日志级别

```sql
ALTER DATABASE db01 SET log_statement=none;
```

#### 指定库 wal 刷盘级别

```sql
ALTER DATABASE db01 SET synchronous_commit TO local;
```

#### 指定库禁规划器

```sql
# 禁用 indexonlyscan 扫描
ALTER DATABASE db01 SET enable_indexonlyscan TO off;
```

#### 执行SQL报错后中断连接

```sql
ALTER DATABASE db01 SET exit_on_error TO on;
```

#### 数据库属性修改

```sql
-- 修改库名
ALTER DATABASE db01 RENAME TO db02;

-- 修改属主
ALTER DATABASE db01 OWNER TO { 用户名 | CURRENT_USER | SESSION_USER }

-- 修改默认表空间
ALTER DATABASE db01 SET TABLESPACE tabspace001;
```

