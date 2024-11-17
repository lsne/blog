```js
// vim getWtEmpty.js
rs.slaveOk()
a = db.adminCommand({ listDatabases: 1 })
num = a['databases'].length
file_size = 0
reuse_size = 0

for (var i = 0; i < num; i++) {
    db_name = a['databases'][i];
    if (db_name["name"] != "test" && db_name["name"] != "admin" && db_name["name"] != "local") {
        //print(db_name["name"])
        rs.slaveOk()
        all_table = db.getSiblingDB(db_name["name"]).getCollectionNames()
        tb_num = all_table.length
        for (var j = 0; j < tb_num; j++) {
            if (all_table[j] != "system.profile") {
                ;
                //print(all_table[j])
                file_size = file_size + db.getSiblingDB(db_name["name"]).getCollection(all_table[j]).stats()['wiredTiger']['block-manager']['file size in bytes']
                reuse_size = reuse_size + db.getSiblingDB(db_name["name"]).getCollection(all_table[j]).stats()['wiredTiger']['block-manager']['file bytes available for reuse']
            }
        }
    }
}
kd = reuse_size / file_size * 100
print(kd.toFixed(2));
```