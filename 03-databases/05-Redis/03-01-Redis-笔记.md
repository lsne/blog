# Redis 笔记

### 常用操作

1. 客户端登录

```sh
/usr/local/redis40/bin/redis-cli -p <port> -h <IP> -a <password>

# --no-auth-warning  # 参数可以在命令传入密码而不提示警告信息
```

2. 重写AOF

```text
BGREWRITEAOF
```

3. 重新生成rbd

```text
BGSAVE
```

4. 搭建从库

```text
1. 查看主库密码: CONFIG GET requirepass

2. 设置新从库的同步用密码: CONFIG SET masterauth "xxxxxxxxxx"

3. 同步主库: slaveof 11.23.54.65 3769

4. 查看使用内存大小: info memory

5. 查看同步状态: info 里  master_link_status:up

5. 如果是数据迁移,同步完成后需要取消同步: slaveof no one

6. 如果是数据迁移,同步完成后需要改回密码: CONFIG SET masterauth "xxxxxxx"
```

5. 切主

```text
1. 停止从库同步: slaveof no one

2. 同步主库: slaveof 11.23.54.65 3769

3. 所有从库依次执行以上命令

4. 将新主库关闭只读参数
    CONFIG SET slave-read-only no

5. 修改LVS:lvs下面删除那个不是新主库的节点，修改LVS模式为读写

5. 修改云平台页面管理端--redia实例--主从标签

6. 通知业务修改读写IP地址

7. 无问题后，修改新主: slaveof no one

8. 下线旧主库
```

6. redis内存使用报告,分析大key

```text
redis-rdb-tools
```


7.  空洞回收 - 手动回收

```
memory purge
```

7.  空洞回收 - 自动回收

```
# Enabled active defragmentation
# 碎片整理总开关
# activedefrag yes

# Minimum amount of fragmentation waste to start active defrag
# 内存碎片达到多少的时候开启整理
active-defrag-ignore-bytes 100mb

# Minimum percentage of fragmentation to start active defrag
# 碎片率达到百分之多少开启整理
active-defrag-threshold-lower 10

# Maximum percentage of fragmentation at which we use maximum effort
# 碎片率小余多少百分比开启整理
active-defrag-threshold-upper 100

# Minimal effort for defrag in CPU percentage
active-defrag-cycle-min 25

# Maximal effort for defrag in CPU percentage
active-defrag-cycle-max 75
```

### redisCluster 笔记

## redis cluster相关

### 说明

1. cluster-enabled yes
2. 哈希分区规则:节点取余分区, 一致性哈希分区. redis:虚拟槽分区 0~16383 个槽
3. 所有的键根据哈希函数映射到0~16383整数槽
4. 只能有一个数据空间 db0
5. 批量操作支持有限(mget mset等)，事务操作支持有限
6. key作为数据分区的最小粒度，因此不能将一个大的键值对象如hash、list等映射到不同的节点。
7. 不能级联复制
8. node节点ID不同于运行ID
9. Redis集群采用P2P的Gossip（流言）协议，Gossip协议工作原理就是节点彼此不断通信交换信息，一段时间后所有的节点都会知道集群完整的信息，这种方式类似流言传播
10. Gossip协议 ping/pong 定时任务每秒执行10次，每次1/10的其他节点状态数据
11. Redis接收任何键相关命令时首先计算键对应的槽，再根据槽找出所对应的节点，如果节点是自身，则处理键命令；否则回复MOVED重定向错误，通知客户端请求正确的节点。这个过程称为MOVED重定向
12. 如果键内容包含{和}大括号字符，则计算槽的有效部分是括号内的内容；否则采用键的全内容计算槽
13. 客户端通过在内部维护slot→node的映射关系，本地就可实现键到节点的查找，从而保证IO效率的最大化
14. 访问正在迁移中的槽里的数据,先访问源节点，如果没有，源节点会回复ASK重定向异常和目标节点信息, 客户端发送asking命令到目标节点打开客户端连接标识，再执行键命令
15. cluster-require-full-coverage no 节点故障只影响故障节点上的槽里的数据访问
16. 在从节点上执行cluster failover命令发起手动转移流程

### 相关命令

1. 获取集群节点状态: cluster nodes
2. 节点握手: cluster meet 127.0.0.1 6380

```text
异步命令
1. 本地创建6380节点信息对象，并发送meet消息
2. 节点6380接受到meet消息后，保存6379节点信息并回复pong消息
3. 之后节点6379和6380彼此定期通过ping/pong消息进行正常的节点通信。
```

3. 获取集群当前状态: cluster info
4. 分配槽: cluster addslots 0 1 2 3 4 5

5. redis-trib.rb 命令

```test
创建集群 redis-trib.rb create --replicas
增加节点 redis-trib.rb add-node 127.0.0.1:6385
增加从节点 redis-trib.rb add-node --slave --master-id $[nodeid] 127.0.0.1:7008 127.0.0.1:7000
迁移槽 redis-trib.rb reshard 127.0.0.1:6381
收缩节点 redistrib.rb del-node {host:port} {downNodeId}
检查节点之间槽的均衡性 redis-trib.rb rebalance 127.0.0.1:6380

```

### 手动搭建集群

1. 开启 cluster-enabled yes 直接启动6个实例

```conf
port 6379
cluster-enabled yes
# 节点超时时间，单位毫秒
cluster-node-timeout 15000
# 集群内部配置文件
cluster-config-file "nodes-6379.conf"
```

2. 节点握手(从其中一个实例执行5次，分别meet另外5个实例): cluster meet 127.0.0.1 6380
3. 分配槽(在三个主节点分别执行): cluster addslots {0...5461}
4. 建立主从复制关系(在三个从节点分别执行): cluster replicate cfb28ef1deee4e0fa78da86abe5d24566744411e

### 用redis-trib.rb搭建集群

1. redis-trib.rb create --replicas 1 127.0.0.1:6481 127.0.0.1:6482 127.0.0.1:6483 127.0.0.1:6484 127.0.0.1:6485 127.0.0.1:6486
2. 检查集群完整性: redis-trib.rb check ip:port

### 集群扩容

1. 启动两个新节点
2. 在现有集群节点执行命令加入集群: cluster meet 127.0.0.1 6385
3. 生产环境将节点加入集群操作建议用: redis-trib.rb add-node 127.0.0.1:6385 127.0.0.1:6379
4. 迁移槽

```text
新主: cluster setslot{slot} importing {sourceNodeId}
源:   cluster setslot{slot} migrating {targetNodeId}
源节点循环执行 cluster getkeysinslot 4096 100 命令，获取count个属于槽{slot}的键
在源节点上执行 migrate 127.0.0.1 6385 "" 0 5000 keys key:test:5028 key:test:68253 key:test:79212
重复3，4步骤
向集群内所有主节点发送cluster setslot{slot}node{targetNodeId}命令，通知槽分配给目标节点
```
  
5. 生产环境迁移槽(槽重分片功能): redis-trib.rb reshard 127.0.0.1:6379
6. 添加从节点: cluster replicate 1a205dd8b2819a00dd1e8b6be40a8e2abe77b756

### 收缩集群

1. 迁移槽 redis-trib.rb reshard 127.0.0.1:6381
2. 忘记节点 cluster forget {downNodeId}
3. 生产建议使用 redistrib.rb del-node {host:port} {downNodeId}
4. 先下线从节点再下线主节点，不然从节点自动同步其他主节点


```
如果从节点与主节点失联超过: cluster-node-timeout * cluster-slave-validity-factor, 则会失去选举成为主节点的资格。 
这时候如果只有这一个从库。则永远不会自动选出主节点。 只能等故障的主节点启动恢复, 或者手动执行 cluster failover 切主命令
```

0. redis cluster 集群手动切主
```
在从库执行: CLUSTER FAILOVER
```

0. 参数
```
1. cluster-enabled yes

    开启集群功能

2. cluster-config-file nodes-6379.conf

    集群配置文件

3. cluster-node-timeout 15000

    集群节点超时时间（单位毫秒）

4. cluster-migration-barrier 1

    主从节点切换需要的最少从节点个数。

5. cluster-require-full-coverage yes

    集群是否需要所有的slot都分配给在线节点才能正常访问。

6. repl-ping-slave-period 10

    从服务器每隔一定时间向服务器发送ping探测，时间间隔由该参数配置。

7. cluster-slave-validity-factor 10

    从节点有效判断因子，当从节点与主节点最后通信时间超过（((cluster-node-timeout) * (slave-validity-factor)) + (repl-ping-slave-period)）时，对应的从节点不具备故障转移资格，防止断线时间过长的从节点进行故障转移。设置为0表示从节点永不过期。
```

1. rediscluster从节点迁移

```text
1. 要新扩容到哪个机器上，就在哪个机器上执行初始化实例并启动实例命令(这里要在10.208.63.107机器上扩容16988端口)
    在10.208.63.107上执行:

    v3_redisinit.sh -P 16988 -v rediscluster -m 10 -b cluster40
    v3_redis_manager.sh -P 16988 -a start

2. 查看集群状态两点:
    1. 要下线节点的库node-id 和 IP
    2. 要下线节点的 主库node-id 和 主库IP (管理机执行)

    要下线的节点是10.208.38.100:16988
    用下面命令查到他的node-id和ip是 ad2560f65f69f14ce177463a1d53c9810850aff3 10.208.38.100:16988
    要下面的命令查到他的主库是      e75f08f70ad581db5b15b78799b0969d54307193 10.208.36.18:16988

    #命令中的(10.208.36.18:16988)可以替换为集群中的任意一个节点,作用是找到要检查的集群是哪个集群
    /home/yangyanjie-iri/redis-4.0.11/src/redis-trib.rb check 10.208.36.18:16988

3. 在管理机执行对这个（2）步中查到的主库增加新的从节点
    #管理机执行:

    /home/yangyanjie-iri/redis-4.0.11/src/redis-trib.rb add-node --slave --master-id e75f08f70ad581db5b15b78799b0969d54307193 10.208.63.107:16988 10.208.36.18:16988
    参数解释:
    add-node 表示这是一个增加节点操作
    --slave  标示要增加的节点作为集群中某一个主节点的从库加入集群
    --master-id e75f08f70ad581db5b15b78799b0969d54307193  指定加入的节点做为哪个主库的从库(必须是node-id，这里是第2步查到的那个主库的node-id)
    10.208.63.107:16988 要加入的节点，这里是第1步创建的那个实例
    10.208.36.18:16988  加入到哪个集群，这个节点可以是集群中的任意一个节点，只是表示要对哪个集群进行操作

4. 在云平台页面上机器管理里,找到新加实例的机器(10.208.63.107)，点更多,添加实例，进行新实例在 云平台页面上上的添加操作

5. 删除要下线的节点(在管理机执行)
    /home/yangyanjie-iri/redis-4.0.11/src/redis-trib.rb del-node 10.208.36.18:16988 ad2560f65f69f14ce177463a1d53c9810850aff3
    参数解释:
    del-node                                        表示这是一个删除节点操作
    10.208.38.100:16988                             集群中的任意一个节点，为了找到要对哪个集群进行操作
    ad2560f65f69f14ce177463a1d53c9810850aff3        要删除的节点的node-id （在第2步中查到的)

6.  在云平台页面对10.208.38.100:16988进行下线操作
```

## redis 单个slot迁移
#### 1. 源节点获取key所在的slot编号

```
cluster KEYSLOT sample_md5_bf_1
(integer) 16265
```

#### 2. 目标节点执行

```
cluster setslot 4096 importing cfb28ef1deee4e0fa78da86abe5d24566744411e

查看状态:
cluster nodes
```

#### 3. 源节点执行

```
cluster setslot 4096 migrating 1a205dd8b2819a00dd1e8b6be40a8e2abe77b756

查看状态:
cluster nodes
```

#### 4. 获取key

```
cluster getkeysinslot 16265 100
```

#### 5. 开始迁移

```
migrate 目标IP 目标端口 "" 0 5000 auth 1ouBXGGXSnJBZh9Lj0 keys lsne_test2
```

#### 6. 重复第4，第5步骤

#### 7. 通知所有主节点, slot迁移情况

```
cluster setslot 4096 node 1a205dd8b2819a00dd1e8b6be40a8e2abe77b756
```

#### 取消slot的迁移状态
```
cluster setslot 8323 stable
```
