# MongoDB 扫描 chunk 大小
#### 扫描所有标记为 `jumbo` 的 `chunk` 的大小

> 大小以 `MB` 为单位输出, 并取整

```js
db.chunks.find({ "jumbo": true }).forEach(
    function printChunkInfo(chunk) {
        var db1 = db.getSiblingDB(chunk.ns.split(".")[0]); // get the database we will be running the command against later
        var key = db.getSiblingDB("config").collections.findOne({ _id: chunk.ns }).key; // will need this for the dataSize call
        var dataSizeResult = db1.runCommand({ datasize: chunk.ns, keyPattern: key, min: chunk.min, max: chunk.max, estimate: true });
        // printjson(dataSizeResult); // uncomment to see how long it takes to run and status
        print(chunk._id + "," + chunk.shard + "," + parseInt(dataSizeResult.size / 1024 / 1024) + "MB," + dataSizeResult.numObjects);
    }
)
```

#### 创建函数可以指定集合进行扫描

```js
AllChunkInfo = function (ns, est) {
    var chunks = db.getSiblingDB("config").chunks.find({ "ns": ns, "shard": "md35020-4788" }).sort({ min: 1 }); //this will return all chunks for the ns ordered by min
    //some counters for overall stats at the end
    var totalChunks = 0;
    var totalSize = 0;
    var totalEmpty = 0;
    print("ChunkID,Shard,ChunkSize,ObjectsInChunk"); // header row
    // iterate over all the chunks, print out info for each
    chunks.forEach(
        function printChunkInfo(chunk) {
            var db1 = db.getSiblingDB(chunk.ns.split(".")[0]); // get the database we will be running the command against later
            var key = db.getSiblingDB("config").collections.findOne({ _id: chunk.ns }).key; // will need this for the dataSize call
            // dataSize returns the info we need on the data, but using the estimate option to use counts is less intensive
            var dataSizeResult = db1.runCommand({ datasize: chunk.ns, keyPattern: key, min: chunk.min, max: chunk.max, estimate: est });
            // printjson(dataSizeResult); // uncomment to see how long it takes to run and status
            print(chunk._id + "," + chunk.shard + "," + dataSizeResult.size + "," + dataSizeResult.numObjects);
            totalSize += dataSizeResult.size;
            totalChunks++;
            if (dataSizeResult.size == 0) { totalEmpty++ }; //count empty chunks for summary
        }
    )
    print("***********Summary Chunk Information***********");
    print("Total Chunks: " + totalChunks);
    print("Average Chunk Size (bytes): " + (totalSize / totalChunks));
    print("Empty Chunks: " + totalEmpty);
    print("Average Chunk Size (non-empty): " + (totalSize / (totalChunks - totalEmpty)));
}

AllChunkInfo("db01.col01", true)
```