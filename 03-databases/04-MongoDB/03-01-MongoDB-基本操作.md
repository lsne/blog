# MongoDB 基本操作

### 基本知识点

> 写入操作 `insertOne`,`insertMany`,`insert`,`save`

```text
insertOne 和 insertMany 会返回插入记录的_id值
insert支持 .explatin() 命令, 其他两个不支持
save命令会调用insert命令进行操作
```

> 查询操作 `find().limit(5).skip(3).sort({a:1})`

```text
永远是先执行sort 排序,再执行skip, 再limit
```

> 更新和删除操作的选项

```text
更新多个文档 {multi: true}

删除一个文档 {justOne: true}
```

### mongodb 运行 js 脚本

#### linux 命令行直接运行 `js` 命令

```sh
mongo 127.0.0.1:27017/test --eval "printjson(db.users.findOne())"
```

#### `linux` 命令行直接运行 `js` 脚本

```sh
mongo 127.0.0.1:27017/test userfindone.js
```

#### 进入 `mongo shell` 客户端运行 `js` 脚本

```js
mongo test
load("/root/mongojs/userfindone.js")

// load() 参数中的文件路径，既可以是相对路径，也可以是绝对路径。
// 在mongo shell下查看当前工作路径的方法： pwd( )
```

#### 在 `js` 脚本中建立与数据库的连接

```sh
# userfindone.js 文件内容：
conn = new Mongo("127.0.0.1:27017");
db = conn.getDB("test");
printjson(db.users.findOne());

# 在命令行下运行：
mongo --nodb userfindone.js
```

### 常用操作

#### `mongo shell` 每次返回的记录数量

```js
DBQuery.shellBatchSize = 300
```

#### 自然倒序排序

```js
db.col01.find().sort( { $natural: -1 } ).limit(1)
```

#### 字符串按数值排序

```js
db.remote_execute.find({"orders": 123123123 },{'_id':0,"host":1,"stdout":1}).collation({"locale": "zh", numericOrdering:true}).sort({stdout:1})
```

#### 字符串正则匹配查询

```js
db.remote_execute.find({"orders": 1673317277500 , "host": { "$regex": ".*shjt2.*"}},{'_id':0,"host":1,"stdout":1}).collation({"locale": "zh", numericOrdering:true}).sort({stdout:1})
```

#### 查询集合大小

```js
db.col01.stats().storageSize/1024/1024/1024
```

#### 批量查询集合大小

> 输出大于 50G 的集合名称

```js
db.getCollectionNames().forEach(function ColSize(colname) {
    var size = db.getCollection(colname).stats().storageSize / 1024 / 1024 / 1024; if (size > 50) { print(colname, size) }
})
```

#### 慢查询

```js
db.system.profile.find({"ns" :"db01.col01"},{"_id":0,"millis":1,"ts":1})
```

#### 查看集合的空洞率

```js
db.col01.stats()['wiredTiger']['block-manager']['file bytes available for reuse']/db.col01.stats()['wiredTiger']['block-manager']['file size in bytes']*100
```

#### 快速查询oplog(根据_id倒排序)

```javascript
db.oplog.rs.find().sort( { $natural: -1 } ).limit(1)
```

#### 查看指定集合指定时间的 `oplog`

```js
db.oplog.rs.find({"ns" : "instance_beta.vm","ts":{"$lt":Timestamp(1556128868, 286)}}).pretty()
```

#### 但看索引的使用次数

```js
db.col01.aggregate( [ { $indexStats: { } } ] )
```

#### 获取object里的时间

```js
//首先查到 ObjectId, 输出: { "_id" : ObjectId("5e3a8beb7dfc9aae296bf7b0") }
db.col01.find({},{"_id":1}).sort({"_id":1}).limit(1)

// 通过函数获取 objectid 中的时间戳, 输出: ISODate("2020-02-05T09:33:31Z")
ObjectId("5e3a8beb7dfc9aae296bf7b0").getTimestamp()
```

### 管理操作

#### 日志切换的 `3` 种方式

```sh
1. db.runCommand({ logRotate: 1 })
2. kill -10 <PID>
3. kill -SIGUSR1 <PID>
```

#### 修改日志级别

```js
# 设置日志debug级别
db.setLogLevel(2)
```

#### 查看当前实例的参数设置

```js
db.adminCommand( { getParameter : "*" } )
```

#### 查看启动时的命令行选项和配置

```js
db._adminCommand( {getCmdLineOpts: 1})["parsed"]["storage"]["wiredTiger"]["engineConfig"]["cacheSizeGB"]
```

#### 查看存储引擎

```js
db.serverStatus().storageEngine
```

#### 查看内存使用大小 和 最大大小

```js
// 查看当前内存使用大小
db.runCommand( { serverStatus: 1 } ).wiredTiger.cache["bytes currently in the cache"]/1024/1024/1024

// 查看最大可用内存大小
db.runCommand( { serverStatus: 1 } ).wiredTiger.cache["maximum bytes configured"]/1024/1024/1024
```

#### 查看命令行内存配置

```js
db.serverCmdLineOpts().parsed.storage.wiredTiger.engineConfig
```

#### 修改内存

```javascript
db.adminCommand({ setParameter: 1, wiredTigerEngineRuntimeConfig: "cache_size=50G"  })
```

#### 查看和修改当前工作的线程

```js
// 查看
db.serverStatus().wiredTiger.concurrentTransactions

// 修改
db.adminCommand( { setParameter: 1,wiredTigerConcurrentWriteTransactions:"256" } )
```

#### 查看当前数据库是否被锁定

```js
serverIsLocked = function () {
    var co = db.currentOp();
    if (co && co.fsyncLock) {
        return true;
    }
    return false;
}

serverIsLocked()
```
