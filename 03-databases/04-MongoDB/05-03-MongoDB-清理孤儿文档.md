
```js
function cleanupOrphaned(coll) {
    var nextKey = {};
    var result;
    while (nextKey != null) {
        result = db.adminCommand({ cleanupOrphaned: coll, startingFromKey: nextKey });
        if (result.ok != 1)
            print("Unable to complete at this time: failure or timeout.")
        printjson(result);
        nextKey = result.stoppedAtKey;
    }
}

var dbName = 'test'
db = db.getSiblingDB(dbName)
db.getCollectionNames().forEach(function (collName) {
    cleanupOrphaned(dbName + "." + collName);
});
```