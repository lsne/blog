

## 报错

```
ERROR:  uncommitted xmin 415285800 from before xid cutoff 462314292 needs to be frozen

原因有二:
一.  事务ID超过20亿
二.  数据文件损坏(可可以用 vacuum freeze, 不过可能会执行失败或者丢失数据)
```

## 事务ID超过20亿说明

```
对于PostgreSQL来说, 因为xid目前是32位的, 所以需要循环使用, freeze的动作来完成循环使用xid的工作. 所以 PG 年龄监控, freeze很重要.

自动化freeze开启的情况下却freeze不掉, 可以开启snapshot too old或者人工监测long query, long xact并杀掉导致freeze工作无法降低xid使用水位的问题, 避免freeze不掉的这种情况.

一旦出现数据库说年龄已经到极限了, 需要停止数据库来freeze, (通常这种告警在数据库日志中会不停的打印,
事务结束或者commit的时候也会收到告警). 可以去PG单用户模式执行vacuum freeze修复.

但是修复过程中如果遇到uncommitted xmin %u from before xid cutoff %u needs to be frozen错误
猜测这个错误可能是在数据库已经不允许执行事务的情况下被回滚的, 所以显示为uncommitted xid. 也可能是bug可以提给社区修复.
```

## 进单用户然后执行 vacuum 命令

```sh
[ls@abc.cn /home/ls]$ postgres --single -D $HG_HOME/data
Postgresql stand-alone backend 9. 4. 7
backend>
backend> vacuum full;
backend> vacuum freeze; 

vacuum freeze 主要是为了解决事务ID回卷问题
vacuum full 则包含了vacuum freeze的功能，并且做了额外的清理工作
```


## 查看库里所有表的最大年龄

```sql
SELECT
    c.oid :: regclass as table_name,
    greatest(age(c.relfrozenxid), age(t.relfrozenxid)) as age
FROM
    pg_class c
    LEFT JOIN pg_class t ON c.reltoastrelid = t.oid
WHERE
    c.relkind IN ('r', 'm')
order by
    2 desc;
```

## 查看单表的最大年龄

```sql
select age(c.relfrozenxid) from pg_class c where c.oid::regclass::text = 'test';
```