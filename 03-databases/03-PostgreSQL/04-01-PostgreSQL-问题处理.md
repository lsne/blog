# PostgreSQL 问题处理
## 索引列超过 2704

### 报错信息

```
create indexes, err: pg: index row size 3048 exceeds btree version 4 maximum 2704 for index
```

### 报错原因

```
pgsql 默认每页为 8kb 大小
pgsql 限制每一页至少要存 3 条记录(或索引值)
创建索引的列中有数据内容超过 2704 字节就会创建失败
```

### 解决办法

```
根据业务需求, 改为创建 md5 索引, hash 索引, 或者全文索引
```

## 元数据表(pg_attribute)中有记录丢失

### 报错信息

```
2024-04-24 05:04:24.773 CST,,,4323,,66282258.10e3,2,,2024-04-24 05:04:24 CST,2/30,0,ERROR,XX000,"pg_attribute catalog is missing 2 attribute(s) for relation OID 16404",,,,,,,,,"","pg_cron launcher",,-5280970146734079043
```

### 报错原因
```
pg_class 里记录的 16404 的列数量统计值与 pg_attribute 里记录的列数量不一样
```

### 解决办法

#### 1. 查看元数据表 `pg_class` 和 `pg_attribute` 表

```
# 查看 16404 是哪张表
SELECT 16404::regclass;

# 查看 pg_class 中显示的 16404 表的字段数量
SELECT relnatts FROM pg_class WHERE oid = 16404;

# 查看 pg_attribute 里记录的 16404 表的字段数量
# pg_attribute 中 attnum 列小于0 的是隐藏字段
SELECT attrelid,attname,atttypid,attnum FROM pg_attribute WHERE attrelid = 16404;
```

可以看到 ,  pg_class 记录的 16404 表的字段为 9 个。 但是 pg_attribute 中显示的 16404 表中的字段只有 7 个

#### 2. 确定异常的元数据表

```
优先第一种方法: 根据实际业务判断。

第二种方法: pg_attribute 表里的字段的 attnum 值不连续。 比如有 1 到 9 中的 7 个数字, 但缺少: 4, 6 两个数字
```

这里根据 pg_attribute 中现有的字段的 attnum 值不连续, 判断是 pg_attribute 表中的数据有丢失的情况

#### 3. 全表扫描查询 `pg_attribute` 

该步是为了确定是否为 pg_attribute 表上的索引异常导致的问题

```
start transaction read only;
set enable_indexscan=off;
set enable_bitmapscan=off;
explain SELECT * FROM pg_attribute WHERE attrelid = 16404;  # 确定是否不走索引了
SELECT * FROM pg_attribute WHERE attrelid = 16404 and attnum > 0; # 查询确定
```

如果全表扫描找到了缺失的记录, 则表示是 `pg_attribute` 表上的索引页有损坏导致的问题, 如果全表扫描还是没找到缺失的记录, 则表示确实是 `pg_attribute` 表有记录丢失

#### 4. 索引页损坏修复方案

如果不走索引查询 pg_attribute 里数据正常。 这种情况是 pg_attribute 表的索引上有数据页损坏了, 直接重建 pg_attribute 表的索引即可

```
reindex table pg_attribute;

# 如果重建索引报错。则执行:
vacuum full pg_attribute;
```

#### 5. 数据记录丢失修复方案

如果不走索引查询  pg_attribute 里的数据还是找不到。这种情况确实是 pg_attribute 表的记录丢失了数据, 需要找到相应的记录并重新插入该表
##### 5.1 在其他环境找到正确的字段记录

在其他环境找到正常的相同的表, 查询丢失的字段记录在这个环境里的行信息

```
select oid from pg_class where relname='job';

\x
SELECT * FROM pg_attribute WHERE attrelid = 16423 and attnum = 4;
SELECT * FROM pg_attribute WHERE attrelid = 16423 and attnum = 6;
```

##### 5.2 写入故障环境的 pg_attribute 表

尽量将修改操作在事务里执行, 并且在事务里检查没问题之后再提交。 这样如果修改出错还可以及时回滚。

```
# 开启事务
start transaction read write;

# INSERT 时注意两个环境的 attrelid 值不同
INSERT INTO pg_attribute values(16404,'nodename',25,-1,-1,4,0,-1,-1,'f','i','x','','t','t','f','','','f','t',0,100,NULL,NULL,NULL,NULL);

INSERT INTO pg_attribute values(16404,'database',25,-1,-1,6,0,-1,-1,'f','i','x','','t','t','f','','','f','t',0,100,NULL,NULL,NULL,NULL);

# 事务内确认
select * from pg_attribute where attrelid = 16404;

# 事务内查询故障表
select * from  cron.job;

# 都没问题后, 提交事务
commit;
```


