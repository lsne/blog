# Clickhouse 常用操作

#### 查看表分区大小

```sql
select database,table,partition AS `分区`, sum(rows) AS `总行数`, formatReadableSize(sum(data_uncompressed_bytes)) AS `原始大小`, formatReadableSize(sum(data_compressed_bytes)) AS `压缩大小`, round((sum(data_compressed_bytes) / sum(data_uncompressed_bytes)) * 100, 0) AS `压缩率` from parts where database='secops_ueba'  group by database,table,partition order by database,table,partition ASC;
```