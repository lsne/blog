## 刷新 `pg_hba.conf` 配置信息

```sh
PGPASSWORD=123456 psql -h /tmp/ -U postgres -p 5432
select pg_reload_conf();
```

## 用户与权限


> [!NOTE] user, group 与 role 的区别  
> user: 默认具有 login 权限的 role  
> group: 不拥有 replication/noreplication, connection limit 属性的 role  

### PostgreSQL 权限分类

```
实例权限: pg_hba.conf
数据库权限: GRANT, REVOKE 是否允许连接或创建 SCHEMA
表空间权限: GRANT, REVOKE 是否允许在对应的表空间创建表, 物化视图, 索引, 临时表
SCHEMA权限: GRANT, REVOKE 是否允许读写指定 SCHEMA 下对象的权限
object权限: GRANT, REVOKE
```

### 数据库级权限

```
CREATE 
CONNECT
TEMPORARY
ALL
```
### 对象权限分类

```
1. 表级对象权限
2. 列级权限
3. 序列权限
4. 类型域的权限控制(域简单来说就是自定义的带约束的数据类型)
5. FDW 权限控制 - 用于访问外部数据源
6. FS 权限控制 
7. 函数权限控制
8. 等等
```

#### public schema 权限

```
public 这个 schema 的 all 权限默认授权给了 public 角色
```

### 更改表属主

#### 更改单个表的属主

```sql
ALTER TABLE t1 OWNER TO user002;
```

#### 更改当前库下所有表的属主

> 将当前数据库下所有属主是 user001 的表, 全部改为属主是: user002
> 如果属主是 postgres 则不允许修改

```sql
REASSIGN OWNED BY user001 to user002;
```

### 查看用户
#### 查看用户列表

```sql
SELECT * FROM pg_user;
SELECT * FROM pg_roles;
```
#### 查看当前登录用户

```sql
SELECT user;
```

### 查看对象权限

1. 数据字典 `information_schema.table_privileges`
2. 快捷指令: `\z` 或 `\dp [tablename]`

#### 显示所有可设置的访问权限

```
\h GRANT
```
### 创建用户

#### 创建普通用户

```sql
CREATE USER user001 WITH PASSWORD '123456';
```

#### 创建有创建库权限的用户

```sql
CREATE USER "pgadmin"  WITH LOGIN CREATEDB password 'xxxx';
```
#### 创建 super 权限用户

> super 用户在操作数据库时, 不做权限检查

```sql
CREATE USER user001 SUPERUSER PASSWORD '123456';
```
#### 创建用户并设置过期时间

```sql
CREATE USER "testuser02" WITH LOGIN REPLICATION CREATEDB SUPERUSER ENCRYPTED password 'abc1223' VALID UNTIL '2021-11-15 18:07:00';
```

### 删除用户

> 有 `createrole` 权限的用户才可以删除用户
> 超级用户才可以删除超级用户
> 删除用户前, 需要先删除依赖该用户的所有对象, 权限等信息
> 删除 group 只会删除 group 本身, 不会删除 role 和 user

```sql
DROP USER USER01;

DROP USER IF EXISTS user02;

-- DROP ROLE 和 DROP USER 效果相同
DROP ROLE IF EXISTS user02;
```

### 修改用户

#### 修改用户名

> 必须有 `createrole` 权限的用户才可以改用户名

```sql
ALTER USER user001 RENAME TO user002;
```

#### 修改用户密码

```sql
ALTER USER user002 PASSWORD '123456';
```

#### 修改用户权限

```sql
-- 给用户添加创建库权限
ALTER USER user002 CREATEDB;

-- 给用户删除创建库权限
ALTER USER user002 NOCREATEDB;

-- 重置用户在 db01 中的参数为默认值
ALTER USER USER002 IN DATABASE db01 RESET ALL;
```

#### 修改用户过期时间

```sql
alter user testuser02  with valid until '2021-11-15 18:21:00+08'
```

#### 授权 role 到指定 user

```sql
-- dev 用户有创建库权限,  user001 用户没有创建库权限

-- 将 dev 用户授权给 user001 
GRANT dev TO user001;

-- 使用 user001 登录 pgsql, 发现还是没有创建库权限。
-- 需要这样激活, 才可以拥有 dev 角色的权限
set role dev;

-- 激活后, 默认创建的 库, 表, 等对象的 owner 都会是 dev
```

### 授权操作示例

#### 授权访问 `schema` 权限

> 只能看对象名, 不能做具体的 select 等操作

```sql
GRANT USAGE ON SCHEMA sch01 TO user001;
```

#### 授权创建 `schema` 的权限

```sql
GRANT CREATE ON DATABASE db01 TO user001;
```

#### 授予创建连接的权限

```sql
GRANT CREATE CONNECT ON DATABASE TO user001,user001 WITH GRANT OPTION;
```

#### 回收创建连接的权限

```
撤销CONNECT 权限。 需要同时撤销 public 中的 connect 权限
REVOKE CONNECT ON DATABASE db01 FROM public;
REVOKE CONNECT ON DATABASE db01 FROM user001;
```

#### 查看哪些用户有指定库的连接权限

```
查看哪些用户有 db01 库的 CONNECT 权限
select datname, datacl from pg_database where datname='db01';
```

#### 授权库的权限

```sql
-- 对库的 all 权限只包括: CONNECT,CREATE, TEMPORARY 权限, 没有创建表和查询表的权限
GRANT ALL PRIVILEGES ON DATABASE "db01" TO user001;
```

#### 授权在 sch01 模式中 创建对象 的权限

```sql
GRANT CREATE ON SCHEMA sch01 TO user001;
```

#### 授权指定 schema 下所有权限

```
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO pgadmin;
```

#### 授权指定表的权限

> 授权 user001 和 testddd 用户, public.t1 和 sch001.t1 表的 SELECT, INSERT 权限

```sql
GRANT USAGE ON SCHEMA sch001 TO user001, user002;
GRANT SELECT, INSERT ON t1, sch001.t1 TO user001, user002;
```

#### 授权访问指定 schema 的所有权限

> 授权 user001 和 testddd 用户, sch002, sch003 的所有权限
> ALL TABLES 只表示当前 schema 下已经存在的表, 如果授权后, 用户又创建了新表, 则没有新表的权限

```sql
GRANT USAGE ON SCHEMA sch002, sch003 TO user001, user002;
GRANT ALL [PRIVILEGES] ON ALL TABLES IN SCHEMA sch002, sch003 TO user001, user002 WITH GRANT OPTION;
```

#### 授权其他用户访问指定 schema 下的对象

```sql
-- 首先要授权访问 schema 的权限
GRANT USAGE ON SCHEMA sch001 TO user002;

-- 再授权访问该 schema 下指定对象的权限
GRANT SELECT ON sch001.t1 TO user002;

-- 授权用户只读 public schema 下所有表(对授权操作完成之后, 新增加的表无效)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO user002;
```

#### 授权用户对未来创建的表也具有只读权限

> 默认情况下, 在授权所有表只读之后, 对于新创建的表, 该用户依然没有只读权限。

```sql
-- 授权未来创建的表的只读权限
-- 这个 ALTER 命令必须使用表的所属 owner 用户来执行
-- 其他用户即使是超级管理员用户执行,都不会生效
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO "user_ro";

-- 授权已经存在的表的只读权限
GRANT USAGE ON SCHEMA public TO "user_ro";
GRANT SELECT ON ALL TABLES IN SCHEMA public TO "user_ro";
```
### 回收权限

```sql
-- 回收 user001 在 t1 表上的 SELECT 权限
REVOKE SELECT, INSERT ON t1,sch001.t1 FROM user001, user002;

-- 回收指定 sch002, sch003 下所有表的 SELECT, UPDATE 权限
REVOKE SELECT,UPDATE ON ALL TABLES IN SCHEMA sch002,sch003 FROM user001, user002;

-- 回收所有权限
REVOKE ALL ON t1, sch001.t1 FROM user001, user002;
```

## 修改用户密码的加密方式

> 将密码的加密方式从 `md5` 修改为 `SCRAM-SHA-256`

#### 各客户端对 `SCRAM-SHA-256` 的兼容情况

[各语言驱动](https://wiki.postgresql.org/wiki/List_of_drivers#Drivers)
#### 修改步骤

```
1. 查看目前的加密方式
postgres=# SELECT name,setting,source,enumvals FROM pg_settings WHERE name = 'password_encryption';
        name         |    setting    |       source       |      enumvals       
---------------------+---------------+--------------------+---------------------
 password_encryption | md5           | configuration file | {md5,scram-sha-256}
 
 2. 修改该参数并使之生效
postgres=# ALTER SYSTEM SET password_encryption TO 'scram-sha-256';
ALTER SYSTEM
postgres=# SELECT pg_reload_conf();
 pg_reload_conf 
----------------
 t
 
 3. 查看确认生效
 postgres=# SELECT name,setting,source,enumvals FROM pg_settings WHERE name = 'password_encryption';
        name         |    setting    |       source       |      enumvals       
---------------------+---------------+--------------------+---------------------
 password_encryption | scram-sha-256 | configuration file | {md5,scram-sha-256}
 
 4. 查看需要升级的用户
 postgres=# SELECT rolname FROM pg_authid WHERE rolcanlogin AND rolpassword !~ '^SCRAM-SHA-256\$';
 rolname  
----------
 postgres
 pgadmin

5.1 修改密码,使新加密方式生效(交互式)
postgres=# \password user001
 
5.2 修改密码,使新加密方式生效(非交互式)
ALTER USER pgadmin WITH PASSWORD '123456';
 
6. 修改pg_hba.conf文件的认证方式为 scram-sha-256
# TYPE  DATABASE        USER            ADDRESS         METHOD 
local   all             postgres                        scram-sha-256
host    all             postgres        127.0.0.1/32    scram-sha-256
local   all             pgadmin                         scram-sha-256
local   testuser        testuser                        scram-sha-256
host    testuser        testuser        127.0.0.1/32    scram-sha-256
host    testuser        testuser        0.0.0.0/0       scram-sha-256

7. 刷新配置, 使pg_hba.conf文件生效
select pg_reload_conf();
```
