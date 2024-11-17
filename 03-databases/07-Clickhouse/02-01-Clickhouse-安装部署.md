# Clickhouse 安装部署

## 高性能条件

> [!WARNING] 高性能条件
> CPU 必须是x86_64
> CPU 可以使用SSE 4.2 指令集

####  查看 cpu 是否支持 `SSE 4.2` 指令集

```sh
grep -q sse4_2 /proc/cpuinfo && echo "SSE 4.2 supported" || echo "SSE 4.2 not supported"
SSE 4.2 supported
```

### 压缩格式

```
默认压缩格式: LZ4
对于日志场景: ZSTD(1),  在字段后加: log.msg String CODC(ZSTD(1))

bilibili 改造文章中的原话: 对于大部分的字段，我们都使用了ZSTD(1)的压缩模式，经过测试相比默认的Lz4提升了50%的压缩率，在写入和查询性能上的代价不超过5%，适合日志写多读少的场景
```

### clickhouse-keeper 未授权访问

```sh
# 修改配置文件: 添加以下内容:
<four_letter_word_white_list>srvr,rcvr</four_letter_word_white_list>

Linux 6:
 
iptables -I INPUT -p tcp --dport 2181 -j DROP
iptables -I INPUT -s 10.46.177.0/24 -p tcp --dport 2181 -j ACCEPT
iptables -I INPUT -s 10.46.172.xx -p tcp --dport 2181 -j ACCEPT
 
service iptables save
service iptables restart
 
iptables -L

Linux 7:
 
firewall-cmd --zone=public --remove-port=2181/tcp --permanent
firewall-cmd --permanent --add-rich-rule=“rule family=“ipv4” source address=“10.xx.xx.xx” port protocol=“tcp” port=“2181” accept”
firewall-cmd --reload
firewall-cmd --list-all
```

## 获取安装包

```
https://clickhouse.com/docs/en/install
```

#### yum安装

```sh
yum install -y yum-utils
yum-config-manager --add-repo https://packages.clickhouse.com/rpm/clickhouse.repo
yum install -y clickhouse-server clickhouse-client
```

#### tar.gz 安装(未测试)

```shell
https://packages.clickhouse.com/tgz/

LATEST_VERSION=$(curl -s https://packages.clickhouse.com/tgz/stable/ | \
    grep -Eo '[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+' | sort -V -r | head -n 1)
export LATEST_VERSION

case $(uname -m) in
  x86_64) ARCH=amd64 ;;
  aarch64) ARCH=arm64 ;;
  *) echo "Unknown architecture $(uname -m)"; exit 1 ;;
esac

for PKG in clickhouse-common-static clickhouse-common-static-dbg clickhouse-server clickhouse-client
do
  curl -fO "https://packages.clickhouse.com/tgz/stable/$PKG-$LATEST_VERSION-${ARCH}.tgz" \
    || curl -fO "https://packages.clickhouse.com/tgz/stable/$PKG-$LATEST_VERSION.tgz"
done

tar -xzvf "clickhouse-common-static-$LATEST_VERSION-${ARCH}.tgz" \
  || tar -xzvf "clickhouse-common-static-$LATEST_VERSION.tgz"
sudo "clickhouse-common-static-$LATEST_VERSION/install/doinst.sh"

tar -xzvf "clickhouse-common-static-dbg-$LATEST_VERSION-${ARCH}.tgz" \
  || tar -xzvf "clickhouse-common-static-dbg-$LATEST_VERSION.tgz"
sudo "clickhouse-common-static-dbg-$LATEST_VERSION/install/doinst.sh"

tar -xzvf "clickhouse-server-$LATEST_VERSION-${ARCH}.tgz" \
  || tar -xzvf "clickhouse-server-$LATEST_VERSION.tgz"
sudo "clickhouse-server-$LATEST_VERSION/install/doinst.sh" configure
sudo /etc/init.d/clickhouse-server start

tar -xzvf "clickhouse-client-$LATEST_VERSION-${ARCH}.tgz" \
  || tar -xzvf "clickhouse-client-$LATEST_VERSION.tgz"
sudo "clickhouse-client-$LATEST_VERSION/install/doinst.sh"
```

### 配置启动

```shell
mkdir -p /data1/clickhouse/{tmp,user_files,logs}
chown clickhouse:clickhouse -R /data1/clickhouse

vim /etc/clickhouse-server/config.xml
<path>/data1/clickhouse/</path>
<tmp_path>/data1/clickhouse/tmp/</tmp_path>
<user_files_path>/data1/clickhouse/user_files/</user_files_path>

systemctl start clickhouse-server
```

## clickhouse 集群部署

### 架构
| 角色                | 主机名                    | IP             | 数据目录                     |
| ----------------- | ---------------------- | -------------- | ------------------------ |
| clickhouse-keeper | myk8smaster01v.lsne.cn | 10.252.177.231 | /data/clickhouse-keeper/ |
| clickhouse-keeper | myk8smaster02v.lsne.cn | 10.252.177.230 | /data/clickhouse-keeper/ |
| clickhouse-keeper | myk8smaster03v.lsne.cn | 10.252.177.229 | /data/clickhouse-keeper/ |
|                   |                        |                |                          |
| clickhouse-server | myk8snode01v.lsne.cn   | 10.252.177.232 | /data{1,2,3}/clickhouse/ |
| clickhouse-server | myk8snode02v.lsne.cn   | 10.252.177.233 | /data{1,2,3}/clickhouse/ |
| clickhouse-server | myk8snode03v.lsne.cn   | 10.252.177.235 | /data{1,2,3}/clickhouse/ |
| clickhouse-server | myk8snode04v.lsne.cn   | 10.252.177.234 | /data{1,2,3}/clickhouse/ |
| clickhouse-server | dbuptest07v.lsne.cn    | 10.249.104.178 | /data{1,2,3}/clickhouse/ |
| clickhouse-server | dbuptest08v.lsne.cn    | 10.249.104.177 | /data{1,2,3}/clickhouse/ |

#### 扩容分片

| 角色 | 主机名 | IP | 数据目录 |
| --- | --- | --- | --- |
| clickhouse-server | dbuptest10v.lsne.cn  | 10.249.104.179 | /data{1,2,3}/clickhouse/ |
| clickhouse-server | dbuptest05v.lsne.cn  | 10.249.105.52  | /data{1,2,3}/clickhouse/ |

### 1. 部署 clickhouse-keeper

#### 1.1 创建数据目录并修改所属用户

```sh
mkdir -p /data/clickhouse-keeper/wal
mkdir -p /data/clickhouse-keeper/snapshots
mkdir -p /data/clickhouse-keeper/logs

chown clickhouse:clickhouse -R /data/clickhouse-keeper
```

#### 1.2 修改配置文件

> 需要根据实际情况修改每个节点的 server_id 

> `vim /etc/clickhouse-server/keeper.xml`

```xml
<clickhouse>
    <listen_host>0.0.0.0</listen_host>
    <logger>
        <level>notice</level>
        <log>/data/clickhouse-keeper/logs/clickhouse-server.log</log>
        <errorlog>/data/clickhouse-keeper/logs/clickhouse-server.err.log</errorlog>
        <size>1000M</size>
        <count>10</count>
    </logger>
    <keeper_server>
        <tcp_port>2181</tcp_port>
        <!-- <tcp_port_secure>2182</tcp_port_secure> -->
        <server_id>1</server_id>   <!-- 需要根据实际情况修改每个节点的 server_id -->
        <log_storage_path>/data/clickhouse-keeper/wal</log_storage_path>
        <snapshot_storage_path>/data/clickhouse-keeper/snapshots</snapshot_storage_path>
        <four_letter_word_white_list>srvr,rcvr</four_letter_word_white_list> <!-- 需要实际情况指定需要的4字符命令 -->
        
        <coordination_settings>
            <operation_timeout_ms>10000</operation_timeout_ms>
            <session_timeout_ms>30000</session_timeout_ms>
            <raft_logs_level>trace</raft_logs_level>
        </coordination_settings>

        <raft_configuration>
            <server>
                <id>1</id>
                <hostname>myk8smaster01v.lsne.cn</hostname>
                <port>2183</port>
            </server>
            <server>
                <id>2</id>
                <hostname>myk8smaster02v.lsne.cn</hostname>
                <port>2183</port>
            </server>
            <server>
                <id>3</id>
                <hostname>myk8smaster03v.lsne.cn</hostname>
                <port>2183</port>
            </server>
        </raft_configuration>
    </keeper_server>
</clickhouse>
```

#### 1.3 service 文件

> `vim /usr/lib/systemd/system/clickhouse-keeper.service`

```toml
[Unit]
Description=ClickHouse Server (analytic DBMS for big data)
Requires=network-online.target
# NOTE: that After/Wants=time-sync.target is not enough, you need to ensure
# that the time was adjusted already, if you use systemd-timesyncd you are
# safe, but if you use ntp or some other daemon, you should configure it
# additionaly.
After=time-sync.target network-online.target
Wants=time-sync.target

[Service]
#Type=notify
Type=simple

# Switching off watchdog is very important for sd_notify to work correctly.
Environment=CLICKHOUSE_WATCHDOG_ENABLE=0
User=clickhouse
Group=clickhouse
Restart=always
RestartSec=30
RuntimeDirectory=clickhouse-server
ExecStart=/usr/bin/clickhouse-keeper --config=/etc/clickhouse-server/keeper.xml --pid-file=/data/clickhouse-keeper/clickhouse-keeper.pid
# Minus means that this file is optional.
EnvironmentFile=-/etc/default/clickhouse
LimitCORE=infinity
LimitNOFILE=500000
CapabilityBoundingSet=CAP_NET_ADMIN CAP_IPC_LOCK CAP_SYS_NICE CAP_NET_BIND_SERVICE

[Install]
# ClickHouse should not start from the rescue shell (rescue.target).
WantedBy=multi-user.target
```

#### 1.4 启动

```sh
systemctl start clickhouse-keeper

或手动启动
sudo -u clickhouse /usr/bin/clickhouse-keeper --config=/etc/clickhouse-server/keeper.xml --pid-file=/data/clickhouse-keeper/clickhouse-keeper.pid
```

#### 1.4 测试

```sh
echo ruok | nc 127.0.0.1 2181   # 测试服务器是否在非错误状态下运行, 返回 imok 表示正常, 否则异常
echo mntr | nc 127.0.0.1 2181   # 输出可用于监控集群状态的变量列表
echo srvr | nc 127.0.0.1 2181   # Lists full details for the server.
echo stat | nc 127.0.0.1 2181   # 列出服务器和连接的客户端的简要详细信息。
```

### 2. 部署 clickhouse-server

#### 2.1 创建数据目录并设置所属用户

```sh
mkdir -p /data/clickhouse/
mkdir -p /data1/clickhouse/
mkdir -p /data2/clickhouse/
mkdir -p /data3/clickhouse/

chmod 755 /data/
chmod 755 /data1/
chmod 755 /data2/
chmod 755 /data3/

chown clickhouse:clickhouse -R /data/clickhouse
chown clickhouse:clickhouse -R /data1/clickhouse
chown clickhouse:clickhouse -R /data2/clickhouse
chown clickhouse:clickhouse -R /data3/clickhouse
```

#### 2.2 创建 server.xml 配置文件

> 尽量保持 config.xml 和 users.xml 文件不变, 将所有自定义的配置写到 config.d/ 和 users.d/ 子目录下。 因为这两个配置文件里有很多默认设置

> `vim /etc/clickhouse-server/config.d/server.xml`

```xml
<clickhouse>
    <listen_host>0.0.0.0</listen_host>
    <logger>
        <level>notice</level>
        <log>/data/clickhouse/logs/clickhouse-server.log</log>
        <errorlog>/data/clickhouse/logs/clickhouse-server.err.log</errorlog>
        <size>1000M</size>
        <count>10</count>
    </logger>
    <http_port>8123</http_port>
    <tcp_port>9000</tcp_port>
    <max_connections>4096</max_connections>
    <tmp_path>/data/clickhouse/tmp/</tmp_path>
    <user_files_path>/data/clickhouse/user_files/</user_files_path>
    <path>/data/clickhouse/</path>
    <user_directories>
        <users_xml>
            <!-- Path to configuration file with predefined users. -->
            <path>users.xml</path>
        </users_xml>
        <local_directory>
            <!-- Path to folder where users created by SQL commands are stored. -->
            <path>/data/clickhouse/access/</path>
        </local_directory>
    </user_directories>
    <format_schema_path>/data/clickhouse/format_schemas/</format_schema_path>
    <distributed_ddl>
      <!-- Path in ZooKeeper to queue with DDL queries -->
      <path>/clickhouse/task_queue/ddl</path>  <!-- 分布式 DDL 写入 zk 的路径 -->
      <cleanup_delay_period>60</cleanup_delay_period> <!-- 检查 DDL 记录清理的间隔, 单位为秒, 默认 60 秒 -->
      <task_max_lifetime>86400</task_max_lifetime> <!-- 分布式 DDL 记录可以保留的最大时长, 单位为秒, 默认保留 7 天 -->
      <max_tasks_in_queue>1000</max_tasks_in_queue> <!-- 分布式 DDL 队列中可以保留的最大记录数, 默认 1000 条 -->
    </distributed_ddl>
    <storage_configuration>
        <disks>
            <disk_ssd01>
                <path>/data1/clickhouse/</path>
                <keep_free_space_bytes>1073741824</keep_free_space_bytes>
            </disk_ssd01>
            <disk_hdd01>
                <path>/data2/clickhouse/</path>
                <keep_free_space_bytes>1073741824</keep_free_space_bytes>
            </disk_hdd01>
            <disk_hdd02>
                <path>/data3/clickhouse/</path>
                <keep_free_space_bytes>1073741824</keep_free_space_bytes>
            </disk_hdd02>
        </disks>
        <policies>
            <policy_hot_and_cold>
                <volumes>
                    <volume_hot>
                        <disk>disk_ssd01</disk>
                        <max_data_part_size_bytes>1073741824</max_data_part_size_bytes>
                        <!-- <max_data_part_size_ratio></max_data_part_size_ratio> -->
                        <!-- <perform_ttl_move_on_insert>true</perform_ttl_move_on_insert> -->
                        <!-- <prefer_not_to_merge>false</prefer_not_to_merge> -->
                        <!-- <load_balancing>round_robin</load_balancing> -->
                    </volume_hot>
                    <volume_cold>
                        <disk>disk_hdd01</disk>
                        <disk>disk_hdd02</disk>
                    </volume_cold>
                </volumes>
                <move_factor>0.2</move_factor>
            </policy_hot_and_cold>
        </policies>
    </storage_configuration>
</clickhouse>
```

#### 2.3 创建 cluster.xml 配置文件

> `vim /etc/clickhouse-server/config.d/cluster.xml`

```xml
<clickhouse>
    <macros> <!-- 宏内的变量及值需要根据节点进行修改, 每个节点的值都不一样-->
        <cluster>cluster_elastic_beats</cluster>
        <shard>01</shard>
        <replica>rs_01_01</replica>
    </macros>
    <zookeeper>
        <node>
            <host>10.252.177.231</host>
            <port>2181</port>
        </node>
        <node>
            <host>10.252.177.230</host>
            <port>2181</port>
        </node>
        <node>
            <host>10.252.177.229</host>
            <port>2181</port>
        </node>
    </zookeeper>
    <remote_servers>
        <cluster_elastic_beats>
            <shard>
                <replica>
                    <host>10.252.177.232</host>
                    <port>9000</port>
                    <!-- <user>default</user> -->
                    <!-- <password>123456</password> -->
                    <!-- <secure>1</secure> -->
                </replica>
                <replica>
                    <host>10.252.177.233</host>
                    <port>9000</port>
                </replica>
            </shard>
            <shard>
                <replica>
                    <host>10.252.177.235</host>
                    <port>9000</port>
                </replica>
                <replica>
                    <host>10.252.177.234</host>
                    <port>9000</port>
                </replica>
            </shard>
            <shard>
                <replica>
                    <host>10.249.104.178</host>
                    <port>9000</port>
                </replica>
                <replica>
                    <host>10.249.104.177</host>
                    <port>9000</port>
                </replica>
            </shard>
        </cluster_elastic_beats>
    </remote_servers>
</clickhouse>
```

#### 2.4 用户配置

> 此部分未测试, 添加后, 需要在 cluster.xml 文件中设置相应的用户密码等

> `vim /etc/clickhouse-server/users.d/account.xml`

```xml
<clickhouse>
    <profiles>
        <default> <!-- 默认用户-->
            <max_threads>8</max_threads>
        </default>
        <user01> <!-- 读写-->
            <readonly>0</readonly>
            <allow_ddl>1</allow_ddl>
            <max_rows_to_read>1000000000</max_rows_to_read>
            <max_bytes_to_read>100000000000</max_bytes_to_read>

        </user01>
        <user02> <!-- 只读-->
            <max_rows_to_read>1000000000</max_rows_to_read>
            <max_bytes_to_read>100000000000</max_bytes_to_read>
            <readonly>2</readonly>
            <allow_ddl>0</allow_ddl>
            <constraints>
                <max_memory_usage>  <!-- 在库里执行 SET max_memory_usage=20000000001; 时, 限制取值范围-->
                    <min>500000000</min>
                    <max>2000000000</max>
                </max_memory_usage>
                <distributed_product_mode>
                    <readonly/>
                </distributed_product_mode>
            </constraints>
        </user02>
    </profiles>
    <users>
        <default>
            <password_sha256_hex>123456123456xxxxx</password_sha256_hex>
            <networks>
                <ip>10.10.10.10</ip>
            </networks>
            <profile>default</profile>
        </default>
        <user01>
            <password>123456</password>
            <networks>
                <ip>10.10.10.10</ip>
            </networks>
            <profile>user01</profile>
            <quota>user01</quota>
            <default_database>default</default_database>
            <allow_databases>
                <database>default</database>
                <database>db01</database>
            </allow_databases>
            <databases> <!-- 设置该用户对 table1 表进行 select 时, 最多只允许返回 1000 行记录-->
                <database_name>
                    <table1>
                        <filter>id = 1000</filter>
                    </table1>
                </database_name>
            </databases>
        </user01>
    </users>
    <quotas>
        <user01> <!-- 自定义名称, 可以和用户名无关-->
            <interval>
                <duration>3600</duration> <!-- 时间周期: 单位: 秒-->
                <queries>0</queries> <!--  在周期内允许执行的查询次数, 0 表示不限制-->
                <errors>0</errors> <!-- 周期内异常次数, 0 表示不限制-->
                <result_rows>0</result_rows> 
                <read_rows>0</read_rows>
                <execution_time>0</execution_time>
            </interval>
        </user01>
    </quotas>
</clickhouse>
```

#### 2.5 修改 service 文件

> `vim /usr/lib/systemd/system/clickhouse-server.service`

```toml
Type=simple
ExecStart=/usr/bin/clickhouse-server --config=/etc/clickhouse-server/config.xml --pid-file=/data/clickhouse/clickhouse-server.pid

systemctl daemon-reload
```

#### 2.5.1 完整的 service 文件

> `vim /usr/lib/systemd/system/clickhouse-server.service`

```toml
[Unit]
Description=ClickHouse Server (analytic DBMS for big data)
Requires=network-online.target
# NOTE: that After/Wants=time-sync.target is not enough, you need to ensure
# that the time was adjusted already, if you use systemd-timesyncd you are
# safe, but if you use ntp or some other daemon, you should configure it
# additionaly.
After=time-sync.target network-online.target
Wants=time-sync.target

[Service]
#Type=notify
Type=simple

# Switching off watchdog is very important for sd_notify to work correctly.
Environment=CLICKHOUSE_WATCHDOG_ENABLE=0
User=clickhouse
Group=clickhouse
Restart=always
RestartSec=30
RuntimeDirectory=clickhouse-server
ExecStart=/usr/bin/clickhouse-server --config=/etc/clickhouse-server/config.xml --pid-file=/data/clickhouse/clickhouse-server.pid
# Minus means that this file is optional.
EnvironmentFile=-/etc/default/clickhouse
LimitCORE=infinity
LimitNOFILE=500000
CapabilityBoundingSet=CAP_NET_ADMIN CAP_IPC_LOCK CAP_SYS_NICE CAP_NET_BIND_SERVICE

[Install]
# ClickHouse should not start from the rescue shell (rescue.target).
WantedBy=multi-user.target
```

#### 2.6 启动 6个节点的 clickhouse-server

```sh
systemctl start clickhouse-server

或者手动启动测试:
sudo -u clickhouse /usr/bin/clickhouse-server --config=/etc/clickhouse-server/config.xml --pid-file=/data1/clickhouse/clickhouse-server.pid
```


## 创建库表

```sql
clickhouse-client -m  # -m 表示多行模式连入数据库

CREATE DATABASE db01 ON CLUSTER 'cluster_elastic_beats';

CREATE TABLE t4_local ON CLUSTER cluster_elastic_beats (
    datatime DateTime default now(),
    content String,
    count Int32
) ENGINE = ReplicatedMergeTree('/clickhouse/tables/{shard}/db01/t4_local', '{replica}') 
PARTITION BY toYYYYMMDD(datatime)
ORDER BY datatime 
TTL toDateTime(datatime) + toIntervalDay(2),
    toDateTime(datatime) + toIntervalDay(1) TO VOLUME 'volume_cold' 
SETTINGS storage_policy = 'policy_hot_and_cold';

# 只有创建了这个 Distributed 分布式表, 写到分布式表里的数据才会进行分片写入多台机器
CREATE TABLE t4_all ON CLUSTER cluster_elastic_beats (
    datatime DateTime default now(),
    content String,
    count Int32
) ENGINE = Distributed(cluster_elastic_beats,db01,t4_local,rand());

# 其他操作
ALTER TABLE t4 MODIFY TTL toDateTime(datatime) + toIntervalDay(2), toDateTime(datatime) + toIntervalDay(1) TO VOLUME 'volume_cold';

DROP TABLE t4 ON CLUSTER cluster_elastic_beats;
```


> [!WARNING] WARNING
> 分片表(Distributed) 不支持 delete 和 update


> [!WARNING] WARNING
> 创建分片表时, 如果不指定分片键(最后一个参数), 则所有数据写到一个分片上, 就失去了意思

## 副本节点故障修复(迁移)

#### 1. 原配置空实例启动

#### 2. 登录实例, 创建数据库

```sql
create database db01;
```

#### 3. 删除 keeper 中的本副本路径信息

> 如果是添加新副本, 不与之前副本重名, 可以不用操作这一步

```sql
SYSTEM DROP REPLICA 'rs_02_02' FROM ZKPATH '/clickhouse/tables/02/db01/t4';
```

#### 4. 创建本地表

```sql
CREATE TABLE t4_local (
    datatime DateTime default now(),
    content String,
    count Int32
) ENGINE = ReplicatedMergeTree('/clickhouse/tables/{shard}/db01/t4_local', '{replica}') 
PARTITION BY toYYYYMMDD(datatime)
ORDER BY datatime
TTL toDateTime(datatime) + toIntervalDay(2),
    toDateTime(datatime) + toIntervalDay(1) TO VOLUME 'volume_cold'
SETTINGS storage_policy = 'policy_hot_and_cold';
```

#### 5. 创建分布式表

```sql
CREATE TABLE t4_all (
    datatime DateTime default now(),
    content String,
    count Int32
) ENGINE = Distributed(cluster_elastic_beats,db01,t4_local,rand());
```

## 分片节点缩容

> 示例架构: 当前有 `1,2,3` 分片, 要下线第 `3` 个分片


> [!WARNING] WARNING
> 这个数据为什么这么迁移，之后怎么均衡还没搞明白(好像是因为不需要均衡, 删掉的数据不要了, 再写直接写到多个分片, 等老数据全过期了, 数据就均衡了)

#### 1. 登录第3个分片节点, 查看分区情况

```sql
use system
select partition AS `分区`, sum(rows) AS `总行数`, formatReadableSize(sum(data_uncompressed_bytes)) AS `原始大小`, formatReadableSize(sum(data_compressed_bytes)) AS `压缩大小`, round((sum(data_compressed_bytes) / sum(data_uncompressed_bytes)) * 100, 0) AS `压缩率` from parts where database='db01' and table='t4' group by partition order by partition ASC;
```

#### 2. 登录第3个分片节点, 查看 zk 路径

```sql
use system
select * from replicas where database='db01' and table='t4'\G;
```

#### 3. 数据迁移

>  登录第1个分片节点(第2个也行), 执行命令将第3个节点的数据迁移过来
>  未实际测试, 不确定是否能把数据搞过来

```sql
use db01
ALTER TABLE t4 FETCH PARTITION 20221230 FROM '/clickhouse/tables/03/db01/t4';
ALTER TABLE t4 ATTACH PARTITION 20221230;   -- 此命令完成后会在分布式表中查询时显示多出来一部分数据, 需要下掉第3节点之后才会恢复正常
```

#### 4. 下线分片

> 关闭第3个分片的两个节点, 修改1,2分片的4个节点的配置文件, 去掉最后一个分片

## 分片节点扩容

> 扩容完也没有写入, 但是新节点数据从0行涨到810行, 我看别的节点行数也涨了, 估计是刚刚停止的写入的缓存, 这个以后再研究

#### 1. 所有实例添加新分片配置信息， 重启

#### 2. 新分片同样添加所有节点的配置信息, 启动

#### 3. 在新分片上创建库表

```
# 在新分片的所有副本上创建库
CREATE DATABASE IF NOT EXISTS db01 ON CLUSTER cluster_elastic_beats;

# 在新分片的所有副本上创建本地表
CREATE TABLE t4_local (
    datatime DateTime default now(),
    content String,
    count Int32
) ENGINE = ReplicatedMergeTree('/clickhouse/tables/{shard}/db01/t4_local', '{replica}') 
PARTITION BY toYYYYMMDD(datatime)
ORDER BY datatime
TTL toDateTime(datatime) + toIntervalDay(2),
    toDateTime(datatime) + toIntervalDay(1) TO VOLUME 'volume_cold'
SETTINGS storage_policy = 'policy_hot_and_cold';

# 在新分片的所有副本上创建分布式表
CREATE TABLE t4_all (
    datatime DateTime default now(),
    content String,
    count Int32
) ENGINE = Distributed(cluster_elastic_beats,db01,t4_local,rand());
```

## clickhouse-keeper 节点迁移

#### 1. 修改配置文件, 添加新节点, 删除老节点

#### 2. keeper集群进入恢复模式

> 方式一: 重启所有老节点, 并确保有 leader 节点, 然后在 leader 节点执行:

```sh
# 查看是否为 leader 节点
echo srvr | nc 127.0.0.1 2181

# 在 leader 节点执行以下命令, 使keeper集群进入恢复模式:
echo rcvr | nc 127.0.0.1 2181
```

> 方式二: 关闭所有节点之后, 以 `clickhouse-keeper --force-recovery` 参数只启动一个老节点

```sh
sudo -u clickhouse /usr/bin/clickhouse-keeper --config=/etc/clickhouse-server/keeper.xml --pid-file=/data/clickhouse-keeper/clickhouse-keeper.pid --force-recovery
```

#### 3. 依次启动剩下的节点

> 每启动一个节点, 要确保该节点状态为 follower 后, 再启动下一个

```sh
systemctl start clickhouse-keeper

echo srvr | nc 127.0.0.1 2181
```

#### 4. 所有老节点启动完成后, 启动新节点

> 新节点为 follower 后集群正常

## 数据分布不均匀问题待研究