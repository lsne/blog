# MongoDB 问题处理
## 运维场景操作

#### 故障诊断之海量数据导入

```text
查看 mongostat 状态

如果 dirty 太小, used 太大, 证明写入很慢, 在不停的和磁盘交换数据. 证明缓存大小太小, 不足以装下常用数据集
```

## 查询正在运行的线程

#### 解决执行 `db.currentOp` 命令权限不足

> 普通用户, 执行 `db.currentOp` 命令报错权限不足

> 解决方式一: 普通用户使用 `$ownOps` 参数查询

```js
// 1. 执行命令时, 可以添加 "$ownOps" 作为筛选条件
db.currentOp({ "$ownOps": true});

// 2. 授予 inprog 权限
```

> 解决方式二: 给普通用户添加 `inprog` 权限

```js
// 创建自定义角色
db.createRole({
  role: "viewInprog",
  privileges: [
    {
      resource: { db: "admin", collection: "" },  // 作用于整个数据库
      actions: ["inprog"]  // 授予 inprog 权限
    }
  ],
  roles: []
})

// 授权
db.grantRolesToUser("username", [{ role: "viewInprog", db: "admin" }])
```

#### 查询所有正在等待锁的写操作

```javascript
db.currentOp({
  "waitingForLock": true,
  "$or": [
    { "op": { "$in": ["insert", "update", "remove"] } },
    { "query.findandmodify": { "$exists": true } }
  ]
})
```

#### 查询执行超过指定时间的操作

> 查询所有操作 db1库 并且执行时间已超过3s的请求

```js
db.currentOp({
	"active" : true,
	"secs_running" : { "$gt" : 3 },
	"ns" : /^db1\./
})
```

#### 查询正在创建的索引

```js
db.currentOp({"op": "command", "msg":{$regex: "Index Build"}})

db.currentOp({"op": "command", "msg":{$regex: "Index Build"}}).inprog[0].msg
```

#### 查询正在执行的全表扫描

```js
db.currentOp({"op": "query", "planSummary": {$regex: "COLLSCAN"} })
```

#### 查询正在执行的索引扫描

```js
db.currentOp({"op": "query", "planSummary": {$regex: "IXSCAN"} })
```


#### 查询时只显示需要的字段

```js
db.currentOp().inprog.forEach( function split(opitem) {printjson(opitem.opid)})
```

#### 查询正在创建索引的操作的 `opid`

```js
db.currentOp({"op": "command", "msg":{$regex: "Index Build"}}).inprog.forEach( function split(opitem) {printjson(opitem.opid)})
```

## `kill` 操作
#### `kill` 指定 opid 的线程

```js
db.killOp(opid)
```

#### `kill` `db01.col1` 集合的所有 `query` 操作

```js
db.currentOp({"op": "query", "ns": "db01.col01" }).inprog.forEach( function split(opitem) {db.killOp(opitem.opid)})
```

## session

#### 查询当前 session 信息

> 实际测试好像没搞懂两个的区别😢

```js
// 列出当前数据库中所有的会话，包括来自不同用户和不同数据库的会话
use config
db.system.sessions.aggregate( [  { $listSessions: { allUsers: true } } ] )

// 列出当前数据库的本地会话信息, 不跨数据库
db.aggregate( [  { $listLocalSessions: { allUsers: true } } ] )
```

## 执行计划

#### 执行耗时

```js
db.col01.find({state: 4}, {name: 1, priority: 1, state: 1, estimate_eta: 1}).limit(10000).sort({state: 1, priority: -1, estimate_eta: 1}).explain("executionStats").executionStats.executionTimeMillis
```