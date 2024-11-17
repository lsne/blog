#### 索引类型&索引选项

```
索引类型:
正序: 1
倒序: -1
文本: text
哈希: hashed
2d 球体地理空间索引: 2dsphere
2d 二维平面地理空间索引: 2d
```

#### 索引选项

```
后台创建: background
索引名: name
排序规则: collation
存储引擎: storageEngine	
稀疏索引: { sparse: true }
唯一索引: { unique: true }
部分索引: { partialFilterExpression: { rating: { $gt: 5 } } }
过期索引: { expireAfterSeconds: 3600 }
隐藏索引: { hidden: true }
```
### 创建索引

```js
db.col01.createIndex({msg_id:"hashed"},{"background":true})

db.col01.createIndex({"send_time" : -1, "app_id" : 1, "msg_type" : 1, "send_type" : 1},{"background":true});
```

### 创建过期索引

```javascript
db.col01.createIndex({creatAt:1}, expireAfterSeconds:604800,"background":true});
```

### 修改过期索引过期时间

```javascript
db.runCommand({collMod: "col01",index: {keyPattern: {"expire_date":1},expireAfterSeconds: 5184000}});
```

### 批量创建索引

> 属性相同: 即都是唯一索引, 或者都是普通索引

```javascript
db.col01.createIndexes([{"url" : "hashed"},{"downloaded_time" : 1}],   {"background":true});

```

### 批量创建索引

> 属性不同: 即有唯一索引, 又有普通索引, 或者又有过期索引

```javascript
 db.runCommand(
  {
    createIndexes: "testcol01",
    indexes: [
        {
            key: {
                "id":1,
                "name":1
            },
			"name": "id_1_name_1",
			"background":true
        },
        {
            key: {
                "id":1
            },
			"name":"id_1",
			"unique":true,
			"background":true
        }
    ]
  }
)
```

### 获取指定库下所有表的索引创建语句

> 获取 testdb1 库中所有表的所有索引的创建语句(一个索引一条语句)

```javascript
var dbname = "testdb1"
db.getSiblingDB(dbname).getCollectionNames().forEach(function (colname) {
  db.getSiblingDB(dbname).getCollection(colname).getIndexes().forEach(function (index) {
    if (index.name === "_id_") {
      return true;
    }
    delete index.v;
    delete index.ns;
    delete index.name;
    var key = index.key;
    delete index.key
    index.background = true;
    print("db."+ colname +".createIndex(" + JSON.stringify(key) + "," + JSON.stringify(index) + ");");
  });
});

```

> 获取 testdb1 库中所有表的所有索引的创建语句(一个集合一条语句)

```js
// var background = true

db.adminCommand('listDatabases').databases.forEach(function (dbinfo) {
  db.getSiblingDB(dbinfo.name).getCollectionNames().forEach(function (colname) {
    var indexes = []
    db.getSiblingDB(dbinfo.name).getCollection(colname).getIndexes().forEach(function (index) {
      if (index.name === "_id_") {
        return true;
      }
      delete index.v;
      delete index.ns;
      delete index.background;
      if ( typeof background == "undefined" || background ) {
        index.background = true;
      }
      indexes.push(index);
    });
  
    if ( indexes.length > 0 ) {
      // print('db.runCommand({createIndexes: "' + colname + '", indexes: ' + JSON.stringify(indexes) + ' });');
      // 如果需要在 js 脚本里执行, 并且返回执行结果, 则使用以下输出;
      print('printjson(db.getSiblingDB("' + dbinfo.name + '").runCommand({createIndexes: "' + colname + '", indexes: ' + JSON.stringify(indexes) + ' }));');
    }
  });
});
```