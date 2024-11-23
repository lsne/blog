# MongoDB 用户与权限
## Mongodb角色表

[MongoDB 角色表](https://www.cnblogs.com/xiaopingfeng/p/7602439.html)

## 用户及权限操作

#### 获取用户授权信息

```javascript
db.getUser('user01')

// 或
show users
```

#### 获取角色权限信息

```javascript
db.getRole('read',{showPrivileges:true});
```

#### Mongodb 查看角色及所拥有的权限

```js
db.runCommand( { rolesInfo: 1, showPrivileges: true, showBuiltinRoles: true } )
```

#### 创建普通用户

> 用户有 `db01` 库的 `所有` 权限, 以及 `db02` 库的 `st2role` 角色权限

```javascript
// 需要先切库: use admin 或 use db01。在哪个库下创建的用户, 连接时就使用哪个库做为认证库
db.createUser({
	user: "mongo",
	pwd: "1234565",
	roles: [ { role: "dbOwner", db: "db01" }, { role: "st2role", db: "db02" }]
})
```

#### 创建只读用户

```js
// 对 db01 库只读
db.createUser({
  user: "readonlyUser",
  pwd: "123456",
  roles: [{ role: "read", db: "db01" }]
})
```

#### 创建指定集合的只读权限的用户

```js
use db01

db.createRole({
  role: "readCol01",
  privileges: [
    {
      resource: { db: "db01", collection: "col01" },
      actions: ["find"]  // 只允许查询操作
    }
  ],
  roles: []
})

db.createUser({
  user: "readonlyUser01",  // 用户名
  pwd: "123456",  // 密码
  roles: [{ role: "readCol01", db: "db01" }]  // 只读角色
})
```

#### 创建读所有库权限的用户

> 不包括 `admin` 库下的  `system.version`, `system.roles` 等系统表

```js
db.createUser({
    user: "user01",
    pwd: "123456",
    roles: [{ role: "readAnyDatabase", db: "admin" }]
})
```

#### 创建 oplog 权限的用户

```javascript
db.createUser({
	user:"oplog_rw",
	pwd:"123456",
	roles:[{"role" : "backup","db" : "admin"}]
})
```

#### 创建IP授权用户

```js
db.createUser({
    user: "test_lsne03",
    pwd: "1234565",
    roles: [ { role: "dbOwner", db: "test_lsne" }],
	authenticationRestrictions: [ {
	clientSource: ["10.249.216.17/32","10.249.105.53/32"], 
	serverAddress: ["10.249.22.40/32","10.249.152.169/32"]}]
})
```

#### 修改密码

```javascript
db.changeUserPassword('user001','test');
```

#### 修改用户

```javascript
// 修改用户角色或用户密码等信息。 应该是完全覆盖, 以前有的权限, 这里不写, 也就不能用了
db.updateUser(	"user3",	{
	customDate:{"any information"},
	roles: [
		{ role: "dbOwner", db: "db1" },
		{ role: "clusterManager", db: "admin" }
	],
	pwd:"password" },
	writeconcem:{<write concem>})
```

> 修改用户角色

```javascript
db.updateUser("user2", {
	roles: [{ "role" : "dbarole", "db" : "admin" }]
});
```

#### 用户添加角色授权

```javascript
db.grantRolesToUser("mongo_r",[
	{ role: "read", db: "tracerecord" },
	{ role: "read", db: "user_credit" },
	{ role: "read", db: "user_datafile" },
	{ role: "read", db: "vcreditcard" }
]);
```

#### 用户回收角色权限

```javascript
use admin
db.revokeRolesFromUser(
	"reportsUser",
	[{ role: "readWrite", db: "accounts" }]
)
```

#### 创建角色1

> 创建对集群有 fsync 和 unlock 的权限, 一般用于普通用户有特殊操作时

```js
db.createRole({
     role: "fsync",
     privileges: [
       { resource: { cluster: true }, actions: [ "fsync", "unlock" ] },
     ],
     roles: []
})
```

#### 创建角色2

> 创建对 db01 的呢集合有 增删改查等权限

```javascript
db.createRole({
  "role": "dbarole",
  "privileges": [
    {
      "resource": { "db": "db01", "collection": "" },
      "actions": [
        "createCollection",
        "dropCollection",
        "convertToCapped",
        "emptycapped",
        "find",
        "insert",
        "remove",
        "update",
        "listDatabases",
        "listCollections",
        "listIndexes",
        "indexStats",
        "dbStats",
        "collStats",
        "renameCollectionSameDB",
        "planCacheRead",
        "storageDetails",
        "killCursors",
        "viewUser"
      ]
    },
    {
      "resource": { "cluster": true },
      "actions": [
        "listDatabases",
        "serverStatus",
        "top",
        "replSetGetStatus",
        "listShards"
      ]
    }
  ],
  "roles": []
});
```

#### 曾加角色的权限

```javascript
db.runCommand({
	grantPrivilegesToRole: "mongoClusterUser",
	privileges: [{
	  "resource": { "db": "hosturl", "collection": "" },
	  "actions": [
	    "createCollection",
	    "createIndex",
	    "dropCollection",
	    "enableSharding"
	  ]
	}]
})
```

#### 对角色授予指定集合的只读权限

```js
// 执行如下sql命令授予 myrole01 角色在 db01 数据库的 system.js 集合上的查询权限:
db.grantPrivilegesToRole("myrole01",[{
    "resource": { "db": "db01", "collection": "system.js" },
    "actions": ["find"]
}])
```

#### 对角色回收指定集合的更新权限

```js
// 执行如下sql命令收回 myrole01 角色在 db01 数据库的gadgets集合上的更新权限:
db.revokePrivilegesFromRole("myrole01", [{
	resource : {  db : "db01", collection : "gadgets" },
	actions : [  "update" ]
}])
```
#### 给 `dbarole` 角色分片的权限

```javascript
db.runCommand({
  "grantPrivilegesToRole": "dbarole",
  "privileges": [
    {
      "resource": { "db": "db01", "collection": "" },
      "actions": [
        "createCollection",
        "createIndex",
        "dropCollection",
        "enableSharding"   // 开启分片的权限
      ]
    }
  ]
});
```

#### 授予 config.system.sessions 集合权限

```js
// 注: sessions 集合可以直接使用: db.system.sessions.aggregate( [  { $listSessions: { allUsers: true } } ] ) 查看, 不使用 find 就不用单独授权

db.createRole({
  "role": "findsessions",
  "privileges": [
    {
      "resource": { "db": "config", "collection": "system.sessions" },
      "actions": ["find"]
    }
  ],
  "roles": []
})

db.grantRolesToUser('monitor', [{ role: "findsessions", db: "admin" }])
```