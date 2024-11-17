#### 实例管理

```shell
# 启动zookeeper (将来会取消对zookeeper的依赖)
/usr/local/kafka26/bin/zookeeper-server-start.sh  -daemon /data1/zkXXX/zkXXX.conf
 
# 启动kafka:
bin/kafka-server-start.sh -daemon config/kraft/server.properties
```

#### kraft 常用命令

```shell
# 查看元数据信息
bin/kafka-dump-log.sh  --cluster-metadata-decoder --skip-record-metadata  --files  /data/kraft/__cluster_metadata-0/00000000000000000000.index,/data/kraft/__cluster_metadata-0/00000000000000000000.log  >>/opt/metadata.txt

# 进入元数据客户端
bin/kafka-metadata-shell.sh --snapshot /data/kraft/__cluster_metadata-0/00000000000000000000.log
>> ls
>> cd cd brokers
>> ls
```

#### kafka 常用命令

```shell
创建 topic 
bin/kafka-topics.sh --create --topic k8s-log --partitions 1 --replication-factor 1 --bootstrap-server 127.0.0.1:9092

查看 topic
bin/kafka-topics.sh --list --bootstrap-server 127.0.0.1:9092

查看 组
bin/kafka-consumer-groups.sh --list --bootstrap-server 127.0.0.1:9092

查看 topic 详细信息
bin/kafka-topics.sh --describe --topic k8s-log --bootstrap-server 127.0.0.1:9092

开启消费者
bin/kafka-console-consumer.sh --bootstrap-server 127.0.0.1:9092 [--consumer-property group.id=testGroup] [--from-beginning] --topic k8s-log

# --consumer-property group.id=testGroup 指定消费组, 每个组里只能有一个消费者消费消息
# --from-beginning 从头开始消费

开启生产者
bin/kafka-console-producer.sh --broker-list 127.0.0.1:9092 --topic k8s-log

删除组
bin/kafka-consumer-groups.sh --bootstrap-server 127.0.0.1:9092 --delete --group console-consumer-17808

删除 tpoic
bin/kafka-topics.sh --delete --topic k8s-log --bootstrap-server 127.0.0.1:9092


# 查看当前主题下有哪些消费组
bin/kafka-consumer-groups.sh --bootstrap-server 127.0.0.1:9092 --list 

# 查看消费组中的具体信息: 如当前便宜量，最后一条消息便宜量，规程的消息数量等
bin/kafka-consumer-groups.sh --bootstrap-server 127.0.0.1:9092 --describe --group testGroup
```

#### 添加节点, 迁移数据, 添加副本等

```shell
# 添加节点后, 均衡数据
首先生成负载均衡的计划
vim topics-to-move.json
{
    "topics": [
        { "topic": "first" }
    ],
    "version": 1
}

bin/kafka-reassign-partitions.sh --bootstrap-server 127.0.0.1:9092 --topics-to-move-json-file topics-to-move.json --broker-list "0,1,2,3" --generate

然后将命令输出的新计划部分的josn保存为文件, 然后执行这个计划
vim increase-replication-factor.json

bin/kafka-reassign-partitions.sh --bootstrap-server 127.0.0.1:9092 --reassignment-json-file increase-replication-factor.json --execute

# 验证是否执行完毕
bin/kafka-reassign-partitions.sh --bootstrap-server 127.0.0.1:9092 --reassignment-json-file increase-replication-factor.json --verify
```

#### 退役节点

```shell
vim topics-to-move.json
{
    "topics": [
        { "topic": "first" }
    ],
    "version": 1
}

# 这时,  --broker-list 的值只写需要正常使用的节点, 不写要退役的节点
bin/kafka-reassign-partitions.sh --bootstrap-server 127.0.0.1:9092 --topics-to-move-json-file topics-to-move.json --broker-list "0,1,2" --generate 

然后将命令输出的新计划部分的josn保存为文件, 然后执行这个计划
vim increase-replication-factor.json

bin/kafka-reassign-partitions.sh --bootstrap-server 127.0.0.1:9092 --reassignment-json-file increase-replication-factor.json --execute

# 验证是否执行完毕
bin/kafka-reassign-partitions.sh --bootstrap-server 127.0.0.1:9092 --reassignment-json-file increase-replication-factor.json --verify
```


#### kafka 常用命令(zookeeper版本)

```shell
# 创建topic:
/usr/local/kafka26/bin/kafka-topics.sh  --create --zookeeper 127.0.0.1:2181 --replication-factor 2 --partitions 3 --topic  netflow

# 展示 topic 的副本,分片等详细信息
/usr/local/kafka26/bin/kafka-topics.sh --zookeeper 10.249.104.35:2181 --topic polaris-gateway-log-prod --describe
/usr/local/kafka26/bin/kafka-topics.sh --bootstrap-server 127.0.0.1:9092 -topic "packetbeat-logs-redis-7.6.3" --describe

# 删除topic:
/usr/local/kafka26/bin/kafka-topics.sh --zookeeper 127.0.0.1:2181 --delete --topic test0
 
# 列出全部topic：
/usr/local/kafka26/bin/kafka-topics.sh --zookeeper 10.249.104.35:2181 --list
 
# 制造数据：
/usr/local/kafka26/bin/kafka-console-producer.sh --broker-list 127.0.0.1:9092 --topic packetbeat-logs-mysql-8.0.0
 
# 消费数据：
/usr/local/kafka26/bin/kafka-console-consumer.sh --bootstrap-server  127.0.0.1:9092 --topic  netflow
 
# 查看消费组：
/usr/local/kafka26/bin/kafka-consumer-groups.sh --bootstrap-server 127.0.0.1:9092  --list
 
# 查看topic详情：

 
# 重平衡:
/usr/local/kafka26/bin/kafka-preferred-replica-election.sh  --bootstrap-server  127.0.0.1:9092 [--topics-to-move-json-file|--reassignment-json-file] x.json [--generate|--execute|--verify]
 
# 修改topic分片数量（只能增加不能减少）：
/usr/local/kafka26/bin/kafka-topics.sh --bootstrap-server  127.0.0.1:9092 --alter --partitions 6 --topic  netflow
 
# 修改topic保留时间（注意保留时间单位是毫秒，下面是修改为3天）：
/usr/local/kafka26/bin/kafka-topics.sh --bootstrap-server  127.0.0.1:9092 --alter --config retention.ms=259200000 --topic  netflow
```