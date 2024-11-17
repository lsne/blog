## 副本集操作

#### 获取副本集IP列表

```js
rs.status().members.forEach( function getIPPort(member) { print(member.name, member.stateStr) } )
```

#### 查看主从信息

```javascript
1. rs.printReplicationInfo()
	// log length start to end: 当oplog写满时可以理解为时间窗口
	// oplog last event time: 最后一个操作发生的时间

2. rs.printSlaveReplicationInfo()
	// 复制进度：synedTo
	// 落后主库的时间：X secs(X hrs)behind the primary
```

#### 切主

```javascript
// 可传入参数:(等待多长时间不能成为主, 为从库延迟的情况等待多长时间)
rs.stepDown()

// 还不行就用 runCommand 命令添加 force 参数强制切主:
db.runCommand({'replSetStepDown':60,'secondaryCatchUpPeriodSecs':15,force: true})
```

#### 打开关闭链式复制

```javascript
cfg = rs.config()
cfg.settings.chainingAllowed = true/false
rs.reconfig(cfg)
```

## 分片操作

### 常用操作
#### 查询 key 属于哪个 shard

> 查询 `morpheus.cert` 表中的 `certs/92c1588e85af2201ce7915e8538b492f605b80c6` 属于哪个分片

```js
db.chunks.find({"ns" : "morpheus.cert", "max.uri":{"$gte":"certs/92c1588e85af2201ce7915e8538b492f605b80c6"}, "min.uri":{"$lte":"certs/92c1588e85af2201ce7915e8538b492f605b80c6"}});
```

#### Mongos 刷新配置

> 需要分别在所有 mongos 节点都执行一次

```javascript
db.adminCommand({"flushRouterConfig":1})
```

#### 查看当前集群有哪些 `mongos` 节点

```js
db.mongos.find({},{"_id":1})
```

#### 获取 mongos 节点配置中的的 `config 节点` 信息

```javascript
db.serverCmdLineOpts().parsed.sharding.configDB
```

#### 开启分片,添加片键

```javascript
// 6.0 版本之后不需要这一步了。 不过还可以使用它来指定主分片
sh.enableSharding("db01") 

// 指定 push 库的主分片为 md5001
sh.enableSharding("db01", "md5001") 
```

#### 添加片键

```js
// 给集合 db01.col01 添加片键
sh.shardCollection( "db01.col01", { "msg_id" : 1 } )

// 给集合 db01.col01 以 msg_id 进行 hashed 分片, 并初始化生成 16000 个 chunks
// 片键必须是 hashed 类型, 才可以使用 numInitialChunks 初始化 chunks 数量
// 初始化 chunks 数量, 可以避免大量写入操作导致的 chunk balancer 影响性能
db.runCommand({ shardcollection: "ceshi.test_col01", key: {"msg_id": "hashed"},numInitialChunks:16000})
```

#### 移除分片

```javascript
db.adminCommand( { removeShard : "7423" } )
db.adminCommand( { removeShard : "7423" } )
db.adminCommand( { movePrimary: "srv_wallet", to: "r37930-2664" } )
db.adminCommand( { removeShard : "7423" } )
use admin
db.adminCommand("flushRouterConfig")  // 所有 mongos 节点都要执行
```
### Balancer 操作
#### 对指定集合设置 balancer

```js
// 查看哪些集合设置了 noBalance 参数
db.getSiblingDB("config").collections.find({"noBalance" : true},{_id : 1, noBalance : true})

// 对 db01.col01 集合开启 Balance
sh.enableBalancing("db01.col01")

// 对 db01.col01 集合关闭 Balance
sh.disableBalancing("db01.col01")
```

#### chunk 迁移参数 - 修改 chunk 大小

```javascript
db.settings.save( { _id:"chunksize", value: 512 } )
```
#### chunk 迁移参数 - 设置 `balancer` 时间窗口

```javascript
// 设置每天 2:20 ~ 17:59 进行 chunk 迁移
db.settings.update(
{ _id: "balancer" },
{ $set: { activeWindow : { start : "02:30", stop : "17:59" } } },
{ upsert: true }
)

// 取消 balancer 时间窗口, 全天24小时迁移
db.settings.update({ _id : "balancer" }, { $unset : { activeWindow : true } })  
```

#### chunk 迁移参数 - 目标分片写入大多数副本

> _secondaryThrottle: true 表示 balancer 插入数据时，至少等待一个 secondary 节点回复；false 表示不等待写到 secondary 节点。 3.2 版本默认 true, 3.4 开始默认 false

>  _secondaryThrottle 参数除了 true 和 false 外, 还可以设置为 `write concern` 值
>  如 `{ "_secondaryThrottle" : { "w": "majority" } }`
>  迁移时使用这个 `write concern` 值的规则做为目标分片的写入规则

```javascript
//调整chunk迁移时目标分片需写入大多数节点
db.setting.update(
{ "_id" " "balancer"},
{ $set : {"_secondaryThrottle" : {"w": "majority"}}},
{ upset : true }
)
```
#### chunk 迁移参数 - 同步删除老节点上的 chunk 数据

>  waitForDelete: 迁移一个 chunk 数据以后，是否同步等待数据删除完毕。
>  默认为 false , 由一个单独的线程异步删除孤儿数据。

```js
// 设置 balancer 同步删除
use config
db.settings.update(
   { "_id" : "balancer" },
   { $set : { "_waitForDelete" : true } },
   { upsert : true }
)

// 改为默认的异步删除
use config
db.settings.update(
   { "_id" : "balancer", "_waitForDelete": true },
   { $unset : { "_waitForDelete" : "" } }
)
```

#### 同时设置 `_secondaryThrottle` 和 `_waitForDelete` 两个参数

```js
use config
db.settings.update(
{ "_id" : "balancer" },
{ $set : { "_secondaryThrottle" : { "w": "majority" } ,"_waitForDelete" : true } },
{ upsert : true }
)
```

#### 参数 - 迁移速度相关

```js
// 3.4.18 之后
// 3.6.10 之后
// 4.0.5  之后
// 以上版本以及之后的版本，可以通过以下参数调整插入数据的速度：

// migrateCloneInsertionBatchDelayMS: 迁移数据时，每次插入的间隔，默认 0 不等待。
// migrateCloneInsertionBatchSize: 迁移数据时，每次插入的数量，默认为 0 无限制。

db.adminCommand({setParameter:1,migrateCloneInsertionBatchDelayMS:0})
db.adminCommand({setParameter:1,migrateCloneInsertionBatchSize:0})
```

#### 参数 - 异步删除 chunks 线程相关

```js
// 3.2 和 4.0 版本的异步删除线程具体实现略有不同，但是，根本过程还是一致的，用一个队列保存需要删除的 range, 循环的取队列的数据删除数据。所以异步删除数据线程是按照 chunk 进入队列的顺序，逐个删除。总入口：

// 3.2 版本 db/range_deleter.cpp 线程入口 RangeDeleter::doWork()
// 4.0 版本 db/s/metadata_manager.cpp scheduleCleanup 时会有一个唯一的线程执行清理任务

// 4.0 版本在删除数据时，按批删除数据，每次删除数量计算方式如下：

maxToDelete = rangeDeleterBatchSize.load();
if (maxToDelete <= 0) {
maxToDelete = std::max(int(internalQueryExecYieldIterations.load()), 1); // 128
}

// 有较多的参数可以灵活的控制删除速度，
// 默认情况下，900s 以后开始清理 chunks 的数据，
// 每次清理 128 个文档，每隔 20ms 删除一次。

// 具体通过以下参数设置：
// rangeDeleterBatchDelayMS: 删除每个 chunk 数据的时候分批次删除，每批之间间隔的时间，单位 ms，默认 20ms
// internalQueryExecYieldIterations: 默认为 128；
// rangeDeleterBatchSize：每次删除数据的数量，默认即为0；为0时 ，则每次删除的数量为max(internalQueryExecYieldIterations，1)，
// orphanCleanupDelaySecs: moveChunk 以后延迟删除数据的时间，单位 s ，默认 900 s

// 具体操作如上:
// 查看:
db.adminCommand( { getParameter : "*" } ).rangeDeleterBatchDelayMS
db.adminCommand( { getParameter : "*" } ).rangeDeleterBatchSize

// 设置:
db.adminCommand( { setParameter: 1, rangeDeleterBatchDelayMS: 20 } )
db.adminCommand( { setParameter: 1, rangeDeleterBatchSize: 0 } )
```

### chunk 操作

####  清除 jumbo 标记

```javascript
db.chunks.update({ ns: "db01.col01", min: { "userNo" : NumberLong("2049396243249673340") }, jumbo: true },{ $unset: { jumbo: "" } })
```

#### 查看实际 chunk 大小

```js
db.runCommand({
	datasize: "db01.col01",
	keyPattern: { "mykey" : "hashed" },
	min:  { "mykey" : NumberLong("9179066116466048090") },
	max: { "mykey" : NumberLong("9179066382563008286") },
	estimate: true
});
```

#### 手动 split 大的 chunks

```javascript
// sh.splitAt() // 需要指定要 split 的那个位置的值

// sh.splitFind() // 只需要指定要 split 的 chunk 中的任意一个片键的值, 会自动找中间值进行 split 操作. 不用人为计算中间值
sh.splitFind( "test.foo", { x: 70 } )

// 扫描 jumbo chunk 并进行 split chunk 操作
// 1. 扫描
mongos> var chunks = db.getSiblingDB("config").chunks.find({"jumbo" : true},{"_id":0,"ns":1,"min":1})
// 2. 
mongos>  chunks.forEach( function split(chunk) { var info = sh.splitFind( chunk.ns, chunk.min ); print(info.ok) } )

```

#### 手动split大的 `hashed` 类型的chunks

```javascript
// 对指定的 hashed chunk 进行 split
db.adminCommand( { split: "db01.col02",bounds:[ { "id" : NumberLong("-9210699589462345225") }, { "id" : NumberLong("-9204393424356178704") }]} )


// 扫描 jumbo hashed chunk 并进行 split chunk 操作
var chunks = db.getSiblingDB("config").chunks.find({"jumbo" : true},{"_id":0,"ns":1,"min":1,"max":1})
chunks.forEach( function split(chunk) { var info = db.adminCommand( { split: chunk.ns,bounds:[ chunk.min, chunk.max]} ); printjson(info.ok) } )
```

#### 手动 move chunk

```javascript
sh.moveChunk("db01.col01", { "domain" : NumberLong("-1037173330883480185") }, "r37888-2650")
```

#### 手动 move hash 类型的chunk

```javascript
db.adminCommand( { moveChunk : "db01.col01" ,bounds  : [{ "domain" : NumberLong("-1037173330883480185") },{ "domain" : NumberLong("-1037173195356944940") }] , to : "r37888-2650"})
```