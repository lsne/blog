## MongoDB 数据导出导入

#### 导出 `db01` 库

```sh
mongodump --authenticationDatabase=admin --host=10.249.97.40 --port=27017 --username=backup-user01 --password=123456 --db=db01 -j 16 --out=/backup/db01/
```

#### 恢复 `db01` 库

```sh
mongorestore --authenticationDatabase=admin --host=127.0.0.1 --port=27017 --username=user01 --password=123456 --db=db01 -j 16 --dir=/backup/db01/
```

#### 压缩备份 `db01` 库

```sh
mongodump --authenticationDatabase="admin" --host="127.0.0.1" --port=27017 --username="backup-user01" --password="123456" --db=db01 --numParallelCollections=16 --gzip --archive="/backup/db01/db01.20150716.gz"
```

#### 全实例压缩备份到远程服务器

```sh
mongodump --authenticationDatabase="admin" --host="127.0.0.1" --port=27017 --username="backup-user01" --password="123456" --numParallelCollections=16 --gzip --archive 2>> /home/lsne/mongodump.log | sudo -u ssh_user01 ssh -o StrictHostKeyChecking=no 10.10.10.10 " cat - > /backup/testmongodump/27017.gz " >> /home/lsne/mongodump.log
```

#### 从压缩备份中恢复

> 恢复时, 排除(即不恢复) `admin` 和 `config` 库

```sh
mongorestore --authenticationDatabase="admin" --host="127.0.0.1" --port=27017 --username="user01" --password="123456"  --numParallelCollections=16 --gzip --nsExclude 'admin.*' --nsExclude 'config.*' --archive=/backup/db01/db01.20150716.gz
```

#### 从压缩备份中恢复指定的集合

> 好像是不会恢复索引

```sh
mongorestore --authenticationDatabase="admin" --host="10.249.22.22" --port=27017 --username="user01" --password="123456"  --numParallelCollections=16 --gzip --nsExclude 'admin.*' --nsExclude 'config.*' --db=db01 --collection=col01 --drop --archive=/backup/db01/db01.20150716.gz
```

## 一致性备份恢复

> 未测试, 未验证

#### 一致性备份

```sh
mongodump --host localhost:27017 --oplog --out /data/backup
```

#### 一致性恢复

```sh
mongorestore --host localhost:27017 --oplogReplay /data/backup
```

#### 基于时间点的恢复

```sh
mongorestore --host localhost:27017 --oplogReplay --startAtOperationTime <timestamp> /path/to/backup
```

#### 恢复备份之后的时间点

> 未测试, 未验证

```sh
# 确保当前保留的 oplog 能接上备份文件 

# 1. 首先要在恢复备份之前, 备份当前实例中要恢复到的时间点之前的所有 oplog 日志
mongodump --authenticationDatabase=admin -u backup-user01 -p 123456 --port 27017 --host 10.10.10.10  -d local -c oplog.rs --query '{"ts":{"$gt": {"$timestamp": {"t": 1594799299, "i":1}}}}' -o /backup/oplog/

# 2. 恢复备份文件
mongorestore /data/backup/

# 3. 恢复备份的 oplog (备份 oplog 时已经指定时间点了)
mongorestore -h 10.10.10.10 -p 27017 --oplogReplay /backup/oplog/

# 3. 或者备份 oplog 时全量备份, 在恢复 oplog 时指定恢复到哪个时间点
mongorestore -h 10.10.10.10 -p 27017 --oplogReplay --startAtOperationTime <timestamp> /backup/oplog/
```

## `json` 格式导出导入

#### 导出为 `json` 格式的文件

> 导出 `db01.col01` 集合中满足 `idc: bjyt` 条件的记录

```sh
mongoexport --authenticationDatabase=admin --host=10.10.10.10 --port=27017 --username=backup-user01 --password=123456 --db=db01 --collection=col01 --query='{"idc" : "bjyt"}'  --out=/backup/col01-bjyt.json
```

#### 将 `json` 文件导入到 `mongodb`

```sh
mongoimport  --authenticationDatabase=admin --host=10.10.10.10 --port=27017 --username=user01 --password=123456 --db=db01 --collection=col01 --file=/backup/col01-bjyt.json
```