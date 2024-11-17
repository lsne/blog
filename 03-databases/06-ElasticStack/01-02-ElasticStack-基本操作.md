
## 常见问题

#### 1. 状态不为 green 问题排查

[ES集群异常问题排查](https://www.elastic.co/guide/cn/elasticsearch/guide/current/_cluster_health.html)

#### 2. Type 的逐渐弃用

```sh
# 在 7.0 之前, 可自定义类型
PUT {index}/mytype1/{id}
PUT {index}/mytype2/{id}
PUT {index}/_doc/{id}

# 在 7.0,  可以使用自定义类型, 但不推荐。 推荐使用 _doc
# 这样使用, 查询 mytype1 类型下会查出来所有记录
PUT {index}/mytype1/{id}
PUT {index}/_doc/{id}

# 在 8.0 不能使用自定义类型, 必须强制使用 _doc

PUT {index}/_doc/{id}
```

#### 3. 索引分片规则

```
1. 不超过 node 数量的 3倍: 3个node。则每个索引设置9个分片
2. 不超过 es 最大JVM堆空间设置(不超过32G)。 索引总容量: 500G, 分片设置 16 个左右
3.  node数 <= 主分片数 * (副本数 + 1)
```

#### 4. 推迟分片重新分配

```sh
PUT /_all/_settings
{
	"settings": {
		"index.unassigned.node_left.delayed_timeout": "10m"
	}
}
```

#### 5. 优化

##### 5.1 路由优化

```
查询时带  routing 路由参数
自己根据分片数量计算路由参数值
shard = hash(routing) % number_of_primary_shards
```

##### 5.2 优化写操作

```
1. 加大 Translog Flush , 目的是降低 iops, writeblock
2. 增加 Index Refresh 间隔, 目的是减少 Segment Merge 的次数
3. 调整 Bulk 线程池和队列
4. 优化节点间的任务分布
5. 优化 Lucene 层的索引建立, 目的是降低 CPU 及 IO.
```

#### 6. 关闭 security 模式启动集群


> [!WARNING] 禁止在生产环境关闭
> 禁止在生产环境关闭
##### 6.1 配置文件添加参数

```
xpack.security.enabled: false
```

##### 6.2 批量启动

```sh
vim start.sh
# -E 表示设置一个参数
open bin/elasticsearch -E path.data=/data1 -E path.logs=/logs1 -E node.name=node1 -E cluster.name = myes001
open bin/elasticsearch -E path.data=/data2 -E path.logs=/logs2 -E node.name=node2 -E cluster.name = myes002
open bin/elasticsearch -E path.data=/data3 -E path.logs=/logs3 -E node.name=node3 -E cluster.name = myes003

# sh start.sh
```

## 概念

### 1. 角色

#### 1.1 角色列表

```sh
master - active   主节点
master - eligible 候选主节点
data node         数据节点
ingest node       预处理节点, 对数据预处理操作
```

### 2. 数据流(Data Streams)

Data Streams: 
- 是 Elasticsearch 7.11 版本引入的新功能，用于处理时间序列数据。
- 是一种逻辑上的数据组织方式，它将相关的数据存储在一个或多个 backing indices 中。
- 允许您以更高级别的方式管理和查询时间序列数据，同时提供了一些额外的功能，如自动索引管理、自动数据生命周期管理等。

## 常用操作

#### 使用 `curl + 用户密码` 方式查看集群状态

```shell
curl --user user01:password01 -H 'Content-Type: application/x-ndjson' -XGET '10.51.27.221:7007/_nodes/_local/stats' | jq
```

### 管理命令
#### 修改 `elastic` 用户的密码

```sh
sudo -u elasticsearch bin/elasticsearch-reset-password -u elastic
```

#### 交互式手动设置 `elastic` 用户的密码

```sh
sudo -u elasticsearch bin/elasticsearch-reset-password --username elastic -i
```

#### 生成 token 

> ES 8 好像不适用了

```sh
bin/elasticsearch-create-enrollment-token -s node

# 在第一个节点执行, 会生成一个 token 如:
xxxxtokenxxxx
```

#### 加入第二个节点(如果需要手动加入)

> ES 8 好像不适用了

```sh
# 在新机器上以上面的 token 启动新实例
bin/elasticsearch --enrollment-token xxxxtokenxxxx
```

#### 查看未分配的副本

```sh
curl -X GET -s 127.0.0.1:9200/_cat/shards?h=index,shard,prirep,state,unassigned.reason| grep UNASSIGNED
```

#### 禁用自动创建索引

```json
PUT _cluster/settings
{
    "persistent": {
        "action.auto_create_index": "false"
    }
}
```

#### 查看集群健康状态

```json
127.0.0.1:9200/_cat/health?v

或
127.0.0.1:9200/cluster/health

# 返回结果
{
  "cluster_name" : "7002",
  "status" : "green",
  "timed_out" : false,
  "number_of_nodes" : 8,
  "number_of_data_nodes" : 8,
  "active_primary_shards" : 1613,
  "active_shards" : 1774,
  "relocating_shards" : 8,
  "initializing_shards" : 0,
  "unassigned_shards" : 0,
  "delayed_unassigned_shards" : 0,
  "number_of_pending_tasks" : 0,
  "number_of_in_flight_fetch" : 0,
  "task_max_waiting_in_queue_millis" : 0,
  "active_shards_percent_as_number" : 100.0
}

GET _cluster/health?level=indices

# 返回结果:
{
  "cluster_name" : "7002",
  "status" : "green",
  "timed_out" : false,
  "number_of_nodes" : 8,
  "number_of_data_nodes" : 8,
  "active_primary_shards" : 1613,
  "active_shards" : 1774,
  "relocating_shards" : 8,
  "initializing_shards" : 0,
  "unassigned_shards" : 0,
  "delayed_unassigned_shards" : 0,
  "number_of_pending_tasks" : 0,
  "number_of_in_flight_fetch" : 0,
  "task_max_waiting_in_queue_millis" : 0,
  "active_shards_percent_as_number" : 100.0,
  "indices" : {
    "packetbeat-mongodb-7.6.3-2022.12.19" : {
      "status" : "green",
      "number_of_shards" : 12,
      "number_of_replicas" : 0,
      "active_primary_shards" : 12,
      "active_shards" : 12,
      "relocating_shards" : 0,
      "initializing_shards" : 0,
      "unassigned_shards" : 0
    },
    "filebeat-cephnginxaccess-log-7.6.13-2022.12.28" : {
      "status" : "green",
      "number_of_shards" : 12,
      "number_of_replicas" : 0,
      "active_primary_shards" : 12,
      "active_shards" : 12,
      "relocating_shards" : 0,
      "initializing_shards" : 0,
      "unassigned_shards" : 0
    },
    ...
    ...
    ...
}
```

#### 检查集群状态

```sh
_cluster/health/<target>

# 或
GET _cluster/allocation/explain
```

#### 查看集群中的节点

```sh
_cat/nodes?v
```

#### 查看集群中节点的磁盘使用率

```sh
GET _cat/allocation?v&pretty
```

#### 查看集群中的索引

```sh
_cat/indices?health=yellow&v=true
```

#### 查看索引的数据分片

```sh
127.0.0.1:9200/_cat/shard?v
```

#### 查看节点属性

```sh
_cat/nodeattrs
```

#### 诊断分片未分配原因

```sh
# 整体查询
_cluster/allocation/explain

# 查询指定索引的指定分片
_cluster/allocation/explain
{
	"index": "test_product",
	"shard": 0,
	"primary": false,
	# "current_node": "node-1"  # 可加可不加
}

# 以下列出了可能的 由于 ... 而未分配的原因

ALLOCATION_FAILED:        由于分片分配失败而未分配
CLUSTER_RECOVERED:        由于完整集群恢复而未分配
DANGLING_INDEX_IMPORTED:  由于导入悬空索引而未分配
EXISTING_INDEX_RESTORED:  由于还原到闭合索引而未分配
INDEX_CREATED:            由于API创建索引而未分配
INDEX_REOPENED:           由于打开闭合索引而未分配
NEW_INDEX_RESTORED:       由于还原到新索引而未分配
NODE_LEFT:                承载他的 node 离开集群而取消分配
REALLOCATED_REPLICA:      确定更好的副本位置并取消现有副本分配
REINITIALIZED:            当碎片从"开始"移回"初始化"时
REPLICA_ADDED:            由于显示添加了副本副本而未分配
REROUTE_CANCELLED:        由于显示取消重新路由命令而取消分配
```

### 读写操作

#### 字段优化

```json
PUT packetbeat-mysql-7.6.3-2020.07.17/_mapping
{
  "properties": {
    "query": { 
      "type":     "text",
      "fielddata": true
    }
  }
}
```
#### 关闭_source字段

```sh
 数据默认存在 _source 字段， 每次会将_source字段内容全取出来，
 如果其中有大内容字段， 每行记录全取出来会影响性能
 可以关闭 -- 
 "_source":{
     "enabled":false
 }
 
 然后在每个要保存的字段中加入:
 "store":true
 
 查询时可以这样查:
 {
     "stored_fileds": ["title","content"],
     "query":{
         "content":"blog"
     }
 }
```

#### 查询 - 获取文档

```json
GET packetbeat-mysql-7.6.3-2020.07.17/_search
{
  "query": {
    "match":{"server.port": 11028}
  },
  "sort":[
    {
      "event.duration": {"order":"desc"}
    }
    ],
    "_source": ["query", "method","server.port","event.duration"], 
  "size":5
}
```

#### 查询 - 聚合查询平均值,最大，最小，count等

```json
GET packetbeat-mysql-7.6.3-2020.07.17/_search
{
  "size": 5,
  "_source": ["query", "method","server.port","event.duration"], 
  "aggs": {
    "snaptime": {
      "date_range": {
        "field": "@timestamp",
        "ranges": [
          {
            "from": "now-1d/d",
            "to": "now"
          }
        ]
      },
      "aggs": {
        "duration": {
          "avg": {
            "field": "event.duration"
          }
        },
        "testabb":{
          "stats": {
            "field": "event.duration"
          }
        }
      }
    }
  }
}
```

#### 查询 - 多字段特性，先分组,再聚合查询

```json
GET packetbeat-mysql-7.6.3-2020.07.18/_search
{
  "size": 0,
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "server.port": 11028
          }
        },
        {
          "match": {
            "server.ip.keyword": "10.249.152.87"
          }
        }
      ]
    }
  },
  "_source": ["query", "method","server.port","event.duration"], 
  "aggs": {
    "snaptime": {
      "date_range": {
        "field": "@timestamp",
        "ranges": [
          {
            "from": "now-1d/d",
            "to": "now"
          }
        ]
      },
      "aggs": {
        "testgroup":{
          "terms": {
            "field": "query.keyword",
            "size": 20,
            "order": { "testabb.avg": "desc" }
          },
          "aggs": {
            "testabb":{
              "stats": {
                "field": "event.duration"
              }
            }
          }
        }
      }
    }
  }
}
```

### 分词器

#### 分词测试

```json
POST _analyze
{
    "analyzer": "standard",     // 分词器类型 standard 为es中的默认分词器
    "text":"hello world!"       // 要进行分词的文本
}
```

#### 针对现有索引的某一个字段进行测试

```json
POST packetbeat-mysql-7.6.3-2020.07.17/_analyze
{
  "field": "query",
  "text": "SELECT page_size, compress_ops, compress_ops_ok, compress_time, uncompress_ops, uncompress_time FROM information_schema.innodb_cmp"
}
```

#### 自定义分词器

```json
POST _analyze
{
    "analyzer": "standard",     // 分词器类型, 选择使用哪种分词器
    "filter": ["lowercase"],    // 分词效果, 变小写
    "text":"Hello World!"       // 要进行分词的文本
}
```

### es自带分词器

```
Standard
Simple
Whitespace
Stop
Keyword
Pattern
Language
```

#### 中文分词

```
IK : https://github.com/medcl/elasticsearch-analysis-ik
jieba 
Hanlp 基于自然语言处理(机器学习上下文)
THULAC  由清华大学自然语言处理与社会人文计算实验室推出的一套
```

#### 自定议分词

```
Character Filters 
在 Tokenizer 之前对原始文本进行处理,比如增加,删除或替换字符等
自带的如下:
HTML Strip 去除html标签和转换html实体
Mapping 进行字符替换操作
Pattern Replace 进行正则匹配替换
会影响后续tokenizer解析的postion 和 offset 信息

示例:
POST _analyze
{
    "tokenizer":"keyword",
    "char_filter": ["html_strip"],
    "text":"<p>I&apos;m so<b>happy</b>!</p>"
}


Tokenizer
将原始文本按一定规则切分为单词
path_hierarchy 按文件路径进行分割

示例:
POST _analyze
{
    "tokenizer":"path_hierarchy",
    "text":"/a/b/c"
}


Token Filters
lowercase 将所有 term 转换为小写
stop 删除 stop words
NGram 和 Edge NGram 连词分割
Synonym 添加近义词的 term

```

#### 自定义分词API

```
PUT test_index
{
    "settings":{
        "analysis":{
            "char_filter":{},
            "tokenizer":{},
            "filter":{},
            "analyzer":{}
        }
    }
}
```

### mapping

```
字段属性
type 类型 text keyword 等
copy_to 将字段值复制到其他字段(可以在多个字段设置该属性,copy_to到同一个字段)
index 是否索引，即是否可用于查询
index_options 记录倒排索引的哪些内容， doc_id, 词频, 起始位置等
null_value 遇到 null 值如何处理

type 专用类型
ip 专门记录IP的类型 
completion 实现自动补全
token_count 记录分词数
murmur3 记录字符串hash值

多字段特性
```

### 分页方式

```
from/size   index.max_result_window
scroll 不能用来实时搜索
```