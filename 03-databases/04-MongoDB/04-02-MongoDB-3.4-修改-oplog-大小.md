#### 以单实例启动

```sh
mongod --port 37017 --dbpath /srv/mongodb
```

#### 备份现有的Oplog(选做)

```sh
mongodump --db local --collection 'oplog.rs' --port 37017
```

#### 授权local库

```js
db.grantRolesToUser("os_admin",[{role: "readWrite", "db" : "local"}]);
```

#### 备份oplog最后一条到temp集合

```js
use local
db = db.getSiblingDB('local')
db.temp.drop()
db.temp.save( db.oplog.rs.find( { }, { ts: 1, h: 1 } ).sort( {$natural : -1} ).limit(1).next() )
db.temp.find()
```

#### 删除 `oplog.rs` 集合

```js
db = db.getSiblingDB('local')
db.oplog.rs.drop()
```

#### 重新创建 `oplog.rs` 集合

> 需要计算新的 `oplog.rs` 集合的固定大小, 示例中是 `200G = 200 * 1024 * 1024 * 1024`

```js
db.runCommand( { create: "oplog.rs", capped: true, size: (200 * 1024 * 1024 * 1024) })
```

#### 将temp里保存的最后一条, 重新写到新的oplog

```js
db.oplog.rs.save( db.temp.findOne() )
db.oplog.rs.find()
```

#### 以复制集模式重启 mongod 实例

```sh
mongo_start.sh -p 27017
```
