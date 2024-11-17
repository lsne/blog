## 逻辑迁移

#### 1. 整理片键

```js
mongos> use config
mongos> var shardkey = db.collections.find({"_id": {"$ne": "config.system.sessions"}, "dropped": false},{"_id":1,"key":1,"unique":1})
mongos> 
mongos> shardkey.forEach( function printshardCollection(sk) { print('sh.shardCollection("' + sk._id + '", ' + JSON.stringify(sk.key) + ', ' + sk.unique +')') } )
```

#### 2. 将片建应用到新实例

```js
# 有多少个库写多少个库
sh.enableSharding("db01")
sh.enableSharding("db02")
...
...

# 有多少个分片集合, 写多少行
sh.shardCollection("db01.col01", {"id.mfsha1":"hashed"})
sh.shardCollection("db01.col02", {"sha1":"hashed"})
sh.shardCollection("db02.col03", {"id.mfsha1":"hashed"})
...
...
```

#### 3. 数据导出导入

```sh
# 导出老库
/usr/local/mongodb42/bin/mongodump --authenticationDatabase=admin --host=10.46.153.8 --port=35057 --username=admin --password=123456 --db=db01 -j 16 --out=/data1/backup/35057
/usr/local/mongodb42/bin/mongodump --authenticationDatabase=admin --host=10.46.153.10 --port=35057 --username=admin --password=123456 --db=db02 -j 16 --out=/data1/backup/35057
/usr/local/mongodb42/bin/mongodump --authenticationDatabase=admin --host=10.46.153.12 --port=35057 --username=admin --password=123456 --db=db03 -j 16 --out=/data1/backup/35057


# 导入到新库
/usr/local/mongodb42/bin/mongorestore --authenticationDatabase=admin --host=10.249.148.170 --port=35073 --username=admin --password=123456 --noIndexRestore --db=db1 --numParallelCollections=24 --numInsertionWorkersPerCollection=200 --batchSize=5000 --dir=/data1/backup/35057/db01 > db01.log 2 &> 1
/usr/local/mongodb42/bin/mongorestore --authenticationDatabase=admin --host=10.249.149.79 --port=35073 --username=admin --password=123456 --noIndexRestore --db=db02 --numParallelCollections=24 --numInsertionWorkersPerCollection=200 --batchSize=5000 --dir=/data1/backup/35057/db02 > db02.log 2 &> 1
/usr/local/mongodb42/bin/mongorestore --authenticationDatabase=admin --host=10.249.149.244 --port=35073 --username=admin --password=123456 --noIndexRestore --db=db03 --numParallelCollections=24 --numInsertionWorkersPerCollection=200 --batchSize=5000 --dir=/data1/backup/35057/db03 > db03.log 2 &> 1
```

#### 4. 获取老库非分片索引

> 在 mongoshell 客户端创建以下函数

```js
// 获取指定集合的索引创建语句, bkgd 为是否后台创建(mongodb 4.2 废弃了background 参数, 函数的 bkgd 参数可以去掉)

getIndexRunCommand = function (dbname, collname, bkgd) {
  var ns = dbname + "." + collname
  var indexes = []
  var shardkey = db.getSiblingDB("config").collections.findOne({ "_id": ns, "dropped": false }, { "_id": 0, "key": 1 })
  db.getSiblingDB(dbname).getCollection(collname).getIndexes().forEach(function (idx) {
    if (idx["name"] == "_id_") {
      return true;
    }

    if (!isObject(idx.key)) {
      print("ERROR: key 不是一个正确的json对象:", ns, JSON.stringify(idx))
    }

    if(shardkey != null && isObject(shardkey.key)) {
      if (JSON.stringify(idx.key) === JSON.stringify(shardkey.key)) {
        return true;
      }
    }

    delete idx.v
    delete idx.ns
    idx.background = bkgd  //去掉 bkgd 参数, 需要将行删除, 并且要添加删除 idx.background 的语句
    indexes.push(idx)
  })

  if(indexes.length == 0) {
    return true;
  }

  print('db.getSiblingDB("' + dbname + '").runCommand({createIndexes: "' + collname + '", indexes: ' + JSON.stringify(indexes) + ' })')
}

// 获取指定库中所有集合的索引创建语句
// bkgd 为是否后台创建( 依赖上一个函数<getIndexRunCommand>)
getIndexRunCommandForAllColls = function(dbname, bkgd) {
  db.getSiblingDB(dbname).getCollectionNames().forEach(function(collname) {
    getIndexRunCommand(dbname, collname, bkgd)
  })
}

// 获取实例中所有库的所有集合的索引创建语句
// bkgd 为是否后台创建 ( 依赖上一个函数<getIndexRunCommandForAllColls>)
getIndexRunCommandForAllDBs = function(bkgd) {
  var dbignore = ["admin", "config", "360monitor"]
  db.adminCommand( { listDatabases: 1, nameOnly: true} ).databases.forEach(function(dbname) {
    if (!dbignore.includes(dbname.name)) {
      getIndexRunCommandForAllColls(dbname.name, bkgd)
    }
  })
}
```

```js
// 测试指定集合
getIndexRunCommand("db01","col01", false)

// 测试指定库
mongos> getIndexRunCommandForAllColls("db02", false)

// 测试获取所有
getIndexRunCommandForAllDBs(false)
```

#### 5. 将4步输出的创建索引命令保存为 index.js 文件, 在新库执行

```sh
/usr/local/mongodb42/bin/mongo --authenticationDatabase admin -u monitor -p 123456 --host 127.0.0.1 --port 35073 index.js
```

## 物理方式迁移

老集群

```
35016

35016 MongoS   10.252.131.168
35016 MongoS   10.252.133.115
35016 MongoS   10.52.19.138

25016 ConfigS  10.252.131.168
25016 ConfigS  10.46.23.41
25016 ConfigS  10.52.19.134

4770  Shard    10.46.20.214
4770  Shard    10.252.135.133
4770  Shard    10.52.19.139

4771  Shard    10.46.152.178
4771  Shard    10.252.145.201
4771  Shard    10.252.131.248
```

新集群

```
35072

35072 MongoS   10.249.152.51
35072 MongoS   10.249.152.86
35072 MongoS   10.249.152.52

25072 ConfigS  10.249.152.51
25072 ConfigS  10.249.152.86
25072 ConfigS  10.249.22.25

4923  Shard    10.249.152.51
4923  Shard    10.249.152.86
4923  Shard    10.249.22.25

4924  Shard    10.249.152.51
4924  Shard    10.249.152.86
4924  Shard    10.249.22.25
```

### 停止与拷贝

#### 1. 新集群 35072: 停止所有节点

```
mongo_stop.sh -p 35072
mongo_stop.sh -p 25072
mongo_stop.sh -p 4923
mongo_stop.sh -p 4924
```

#### 2. 新集群 35072 清空数据目录

> 删除 config 和 shard 所有节点的数据目录, 保留 log, keyFile, mongodbxxxx.conf

```sh
cd /data1/mongodb25072
rm -rf $(ls | grep -Ev "log|mongodb25072.conf|keyFile") && rm -rf _mdb_catalog.wt

cd /data1/mongodb4923
rm -rf $(ls | grep -Ev "log|mongodb4923.conf|keyFile") && rm -rf _mdb_catalog.wt

cd /data1/mongodb4924
rm -rf $(ls | grep -Ev "log|mongodb4924.conf|keyFile") && rm -rf _mdb_catalog.wt
```

#### 3. 老集群 35016: 停止 balancer

```js
sh.stopBalancer()
```

#### 4. 老集群 35016: 停止所有节点

```sh
mongo_stop.sh -p 35016
mongo_stop.sh -p 25016
mongo_stop.sh -p 4770
mongo_stop.sh -p 4771
```

#### 5. 拷贝数据文件

> 拷贝 config 和每个 shard 的一个副本到新集群对应节点上

```sh
scp -r /data1/mongodb25016 lsne@x.x.x.x://data1/backup/
```

### config 节点操作

#### 6. 拷贝 config 数据文件

> 将config节点数据拷贝到 新集群 /data1/mongodb25072/

```sh
cd /data1/backup/mongodb25016/
rm -rf keyFile log mongodb25016.conf 
cd ..
cp -r mongodb25016/* /data1/mongodb25072/
```

#### 8. 修改 config 节点配置文件(注释两行)

```toml
#replSet = md25072
#configsvr = true
```

#### 7. 启动 config 单节点

```sh
mongo_start.sh -p 25072
```

#### 8. 创建 _system 角色的用户

```sh
tsmongo -c -p 25072
use admin
db.createUser(
  {
    user: "tmpuser001",
    pwd: "123456",
    roles: [ "__system" ]
  }
)
```

#### 9. 用新用户登录并操作

> 用新用户登录, 并删除 local 库, 并且修改 config.shards 集合的 host 字段

```sh
/usr/local/mongodb42/bin/mongo --host 127.0.0.1 --port 25072 --authenticationDatabase admin -u tmpuser001 -p qqq123xxx6

或直接认证: db.auth("tmpuser001","qqq123xxx6")

use local
db.dropDatabase()

use config
db.shards.updateOne(
  { "_id" : "md35016-4770" },
  { $set : { "host" : "md35072-4923/10.249.152.51:4923,10.249.152.86:4923,10.249.22.25:4923" } }
)

db.shards.updateOne(
  { "_id" : "md35016-4771" },
  { $set : { "host" : "md35072-4924/10.249.152.51:4924,10.249.152.86:4924,10.249.22.25:4924" } }
)
```

#### 10. 取消副本集参数注释,重启实例

```toml
replSet = md25072
configsvr = true

mongo_start.sh -p 25072
```

#### 11. 配置副本集群

```js
rs.initiate()
cfg=rs.config()
cfg.members[0].host="10.249.152.51:25072"
rs.reconfig(cfg)
```

#### 12. 启动另外两个副本, 并且加入副本集群

```js
mongo_start.sh -p 25072
rs.add("10.249.152.86:25072")
rs.add("10.249.22.25:25072")
```

#### 13. 删除临时用户

```js
db.dropUser("tmpuser001")
```

### shard 节点操作:

#### 14. 拷贝 shard 数据文件

> 将 shard 4770 节点数据拷贝到 新集群 /data1/mongodb4923/

```
cd /data1/backup/mongodb4770/
rm -rf keyFile log mongodb4770.conf 
cd ..
cp -r mongodb4770/* /data1/mongodb4770/
```

#### 15. 修改 shard 节点配置文件(注释两行)

```
#replSet = md35072-4923
#shardsvr = true
```

#### 16. 启动 shard 单节点

```
mongo_start.sh -p 4923
```

#### 17. 创建 _system 角色的用户

```js
tsmongo -c -p 4923
use admin
db.createUser(
  {
    user: "tmpuser001",
    pwd: "123456",
    roles: [ "__system" ]
  }
)
```

#### 18. 用新用户登录并操作

> 用新用户登录并删除 local 库, 并修改其他相关参数

```js
db.auth("tmpuser001","qqq123xxx6")

use local
db.dropDatabase()

use admin
db.system.version.find();
db.system.version.deleteOne( { _id: "minOpTimeRecovery" } )

db.system.version.updateOne(
  { "_id" : "shardIdentity" },
  { $set :
    { "configsvrConnectionString" : "md25072/10.249.152.51:25072,10.249.152.86:25072,10.249.22.25:25072"}
  }
)
```

#### 19. 取消副本集参数注释,重启实例

```
replSet = md35072-4923
shardsvr = true

mongo_start.sh -p 4923
```

#### 20. 配置副本集群

```js
rs.initiate()
cfg=rs.config()
cfg.members[0].host="10.249.152.51:4923"
rs.reconfig(cfg)
```

#### 21. 删除临时用户

```js
db.dropUser("tmpuser001")
```

#### 22. 启动另外两个副本

> 并且加入副本集群(或者先停止本节点物理拷贝到另外两个节点, 再rs.add)

```js
mongo_start.sh -p 4923
rs.add("10.249.152.86:4923")
rs.add("10.249.22.25:4923")
```

#### 23. 重复以上步骤, 将所有shard处理完成
