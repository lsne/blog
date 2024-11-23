# Kafka 安装部署
## 说明

```
Kafka 3.3.1 第一个标志着可以在生产环境中使用KRaft
Kafka 社区计划在下一个版本（3.4）中弃用 ZooKeeper，然后在 4.0 版本中完全删除它。

kafka-eagle 监控平台 - 最近改名为: EFAK
```

## 参数

```
broker.id  # 每个节点唯一
auto.create.topics.enable  自动创建主题, 最好设置为: false
listeners=PLAINTEXT://:9092,CONTROLLER://:9093
inter.broker.listener.name=PLAINTEXT
advertised.listeners=PLAINTEXT://10.252.177.232:9092    # 修改这里的IP, 默认localhost只能本地连接

未开启幂等
max.in.flight.requests.per.connection  需要设置为1

开启幂等
max.in.flight.requests.per.connection  需要设置小于等于5

# kafka 集群会缓存最后5个消息, 在内存排序后落盘

auto.leader.rebalance.enable 默认 true 自动 leader partition 平衡(建议关闭, 因为主节点不是replicas:第一个就会表示不均衡)
leader.imbalance.per.broker.percentage 默认 10% 每个broker 允许的不平衡比例， 超过会出发均衡
leader.imbalance.check.interval.seconds  检查是否平衡的时间间隔, 默认 300秒
```

## 单机部署

#### 1. 下载

```
打开页面后点最新版本下载:
https://kafka.apache.org/downloads  

或直接下载:
https://downloads.apache.org/kafka/3.3.1/kafka_2.13-3.3.1.tgz
```

#### 2. 解压, 并且配置安装

```sh
tar zxvf kafka_2.13-3.3.1.tgz
cd kafka_2.13-3.3.1/
```

#### 3. 修改配置文件并启动

> `vim config/kraft/server.properties`

```toml
listeners=PLAINTEXT://:9092,CONTROLLER://:9093
inter.broker.listener.name=PLAINTEXT
advertised.listeners=PLAINTEXT://10.252.177.232:9092    # 修改这里的IP, 默认localhost只能本地连接

# 生成集群 ID
bin/kafka-storage.sh random-uuid

# 格式话存储目录
bin/kafka-storage.sh format -t ad6hIf4PSmuC8K6JZ1jbkQ -c config/kraft/server.properties

# 启动
bin/kafka-server-start.sh [-daemon] config/kraft/server.properties 
```

#### 4. 测试

```sh
创建 topic 
bin/kafka-topics.sh --create --topic k8s-log --partitions 1 --replication-factor 1 --bootstrap-server 127.0.0.1:9092

查看 topic
bin/kafka-topics.sh --list --bootstrap-server 127.0.0.1:9092

查看 组
bin/kafka-consumer-groups.sh --list --bootstrap-server 127.0.0.1:9092

查看 topic 详细信息
bin/kafka-topics.sh --describe --topic k8s-log --bootstrap-server 127.0.0.1:9092

开启消费者
bin/kafka-console-consumer.sh --bootstrap-server 127.0.0.1:9092 --topic k8s-log

开启生产者
bin/kafka-console-producer.sh --broker-list 127.0.0.1:9092 --topic k8s-log

删除组
bin/kafka-consumer-groups.sh --bootstrap-server 127.0.0.1:9092 --delete --group console-consumer-17808

删除 tpoic
bin/kafka-topics.sh --delete --topic k8s-log --bootstrap-server 127.0.0.1:9092
```

## 集群部署

### 架构
| 角色         | 主机名                    | IP             | 数据目录         |
| ---------- | ---------------------- | -------------- | ------------ |
| controller | myk8smaster01v.lsne.cn | 10.252.177.231 | /data/kraft/ |
| controller | myk8smaster02v.lsne.cn | 10.252.177.230 | /data/kraft/ |
| controller | myk8smaster03v.lsne.cn | 10.252.177.229 | /data/kraft/ |
|            |                        |                |              |
| broker     | myk8snode01v.lsne.cn   | 10.252.177.232 | /data/kafka/ |
| broker     | myk8snode02v.lsne.cn   | 10.252.177.233 | /data/kafka/ |
| broker     | myk8snode03v.lsne.cn   | 10.252.177.235 | /data/kafka/ |
| broker     | myk8snode04v.lsne.cn   | 10.252.177.234 | /data/kafka/ |


### 创建目录

```sh
kraft 节点:
mkdir -p /data/kraft
chown kafka:kafka -R /data/kraft

broker 节点:
mkdir -p /data/kafka
chown kafka:kafka -R /data/kafka
```

### 下载

```
打开页面后点最新版本下载:
https://kafka.apache.org/downloads  

或直接下载:
https://downloads.apache.org/kafka/3.3.1/kafka_2.13-3.3.1.tgz
```

### 解压, cd到目录

```sh
tar zxvf kafka_2.13-3.3.1.tgz
cd kafka_2.13-3.3.1/
```

### 编辑配置文件

> `controller 节点: vim config/kraft/server.properties`
> `或者直接编辑 vim config/kraft/controller.properties 文件, 之后用此文件启动`

```toml
# 每个节点的 node.id, listeners 两个参数都不能重复(node.id =1 必须为 controller 节点)
process.roles=controller
node.id=1
controller.quorum.voters=1@10.252.177.231:9093,2@10.252.177.230:9093,3@10.252.177.229:9093
listeners=CONTROLLER://10.252.177.231:9093
#inter.broker.listener.name=PLAINTEXT
#advertised.listeners=PLAINTEXT://10.252.177.231:9092
log.dirs=/data/kraft
```

> `broker 节点: vim config/kraft/server.properties`
> `或者直接编辑 vim config/kraft/broker.properties 文件, 之后用此文件启动`

```toml
# 每个节点的 node.id, advertised.listeners 两个参数都不能重复(node.id 与 controller 中的值也不能重复)
process.roles=broker
node.id=4
controller.quorum.voters=1@10.252.177.231:9093,2@10.252.177.230:9093,3@10.252.177.229:9093
listeners=PLAINTEXT://10.252.177.232:9092
advertised.listeners=PLAINTEXT://10.252.177.232:9092
controller.listener.names=CONTROLLER
log.dirs=/data/kraft
```

### 生成随机数并配置到配置文件

```sh
# 生成随机数
linux# bin/kafka-storage.sh random-uuid
bfImaVXlS-6sG2WrvSfheA

# 用该随机数格式化kafka存储目录(所有节点)
linux# bin/kafka-storage.sh format -t bfImaVXlS-6sG2WrvSfheA -c config/kraft/server.properties
```

### 启动所有节点

```sh
bin/kafka-server-start.sh -daemon config/kraft/server.properties 
```

## kafka 的认证

```
还未研究
```