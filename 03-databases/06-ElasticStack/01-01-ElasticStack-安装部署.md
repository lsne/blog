# ElasticStack 安装部署

## 浏览器插件

### 1.  Elasticsearch Head

```
方便查看集群节点数据
方便管理和索引、分片
支持同时连接多集群
```

### 2. Elasticsearch Tools 

```
方便查看节点资源占用
可执行行查询语句
```

### 3. Elasticvue 

```
功能强大， 对国人友好
```

## 辅助工具

### 1. cerebro

```sh
wget https://github.com/lmenezes/cerebro/releases/download/v0.9.2/cerebro-0.9.2.tgz

tar zxvf cerebro-0.9.2.tar.gz
cd cerebro
bin/cerebro

启动后会提示监听端口默认为: 9000
```

## 获取安装包

> [!NOTE] 自带 JDK
> 从 7.0 版本开始, 安装包自带 jdk   
> ES 8.0 版本只能在 jdk 17 和 jdk 18 版本中运行  
> 可以下载不包含 jdk 的精简包  

#### 1. 下载 ElasticSearch 二进制包

```sh
wget https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-8.13.2-linux-x86_64.tar.gz

wget https://artifacts.elastic.co/downloads/kibana/kibana-8.13.2-linux-x86_64.tar.gz
```

#### 2. 下载 deb 包

```
https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-8.13.2-amd64.deb

https://artifacts.elastic.co/downloads/kibana/kibana-8.13.2-amd64.deb
```

#### 3. 使用 apt 仓库

```sh
wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | sudo gpg --dearmor -o /usr/share/keyrings/elasticsearch-keyring.gpg

sudo apt-get install apt-transport-https

echo "deb [signed-by=/usr/share/keyrings/elasticsearch-keyring.gpg] https://artifacts.elastic.co/packages/8.x/apt stable main" | sudo tee /etc/apt/sources.list.d/elastic-8.x.list

sudo apt-get update && sudo apt-get install elasticsearch kibana
```


## 配置文件


> [!NOTE] Title
> ES 8.0 开始,  无配置不可以直接启动 ES 实例。   
> 因为 8.0 开始默认开启 Security 功能(集群安全策略)  

### 1. 环境变量

```sh
# ES jdk 目录, 配置该参数则使用该参数指定的jdk, 不配置则默认使用 ES 自带的 jdk
# 一般建议使用系统自带的 jdk
# 运行 ES 时, JAVA_HOME 不生效
export ES_JAVA_HOME=/usr/local/elasticsearch-8.13.2/jdk

# elastic 用户的密码
export ELASTIC_PASSWORD="your_password"
```

### 1. java 虚拟机子配置

> `vim /etc/elasticsearch/jvm.options.d/xxx.options`

```sh
# 一般建议使用子配置, 不建议直接修改 /etc/elasticsearch/jvm.options

# Heap size: 默认情况下，Elasticsearch 根据节点的角色和总内存自动设置 JVM 堆大小。 官方建议大多数生产环境使用默认大小。

# 官方建议这两个内存参数保持一致
# 不要超过操作系统总内存的 50% . 因为底层会把数据交给操作系统处理
# 最大大小不要超过 32G。  最大设置 31G
# 64G 内存的机器: 启动一个 31G 内存的 node 
# 128G 内存的机器: 启动 两个 31 G 内存的 node
-Xms4g  # 初始4G内存
-Xmx4g  # 最大4G内存

# 个人建议: 
搜索类项目: 1:16 设置1G内存,对应该存储16G数据
日志类项目: 1:48 ~ 1:96

# 修改 gc log 路径
## GC logging
-Xlog:gc*,gc+age=trace,safepoint:file=/data/elasticsearch/logs/gc.log:utctime,level,pid,tags:filecount=32,filesize=64m
```

### 2. ES 配置文件示例


> [!NOTE] 各节点修改参数
>  后续节点修改: `node.name: node-1`  
>  后续节点修改: `node.roles: [ "master", "data" ]`  
>  后续节点修改: `network.host: 10.59.16.33`  

> [!NOTE] 初始化参数
> 为确保初始化集群的前三个 node 不会误加入其他 ES 集群,  在初始化一个新集群时,  应该指定 `cluster.initial_master_nodes` 参数 。 只在第一次形成集群时需要, 重新启动节点, 或加入新节点时不需要
> 
> 该参数可以写到配置文件, 但建议集群启动完成后在配置文件中删除。  
> 建议直接使用命令行参数: `bin/elasticsearch -E cluster.initial_master_nodes=master-a,master-b,master-c`  
> 
> `bin/elasticsearch -E cluster.initial_master_nodes=node-1`


```yaml
# ---------------------------------- Cluster -----------------------------------

# 集群名称, 在同一网络环境中千万不要混淆
cluster.name: myes001

# ------------------------------------ Node ------------------------------------

# 集群中 node.name 必须唯一, 每一个 node 的名称都必须是不相同的
# 一个 node 仅代表一个 ES 实例,  一台机器上启动多个实例, 则会有多个 node
# 默认为当前主机的主机名
node.name: node-1
# 该 node 的角色
node.roles: [ "master", "data" ]

# pid文件(好像不识别, 只能在命令行指定)
# node.pidfile: /data/elasticsearch/es.pid

# 还可以给 node 增加自定义属性, 如:
# node.attr.rack: r1

# ----------------------------------- Paths ------------------------------------

# 存储数据的目录路径(多个位置用逗号分隔):
path.data: /data/elasticsearch/data

# 日志文件路径:
path.logs: /data/elasticsearch/logs

# ----------------------------------- Memory -----------------------------------

# 启动时锁定内存
# bootstrap.memory_lock: true

# ---------------------------------- Network -----------------------------------

# es 实例对外提供服务的IP地址, 即本机内网地址, 手动设置后触发生产模式
network.host: 10.59.16.33

# 公网地址(可以不是本机配置的地址)
# network.publish_host: 

# 端口号, 如果启动多个实例而不手动设置, 默认会使用 9200, 9201, 9202 依次类推
http.port: 9200

# 集群间节点通信
# transport.host: 

# 集群间节点通信端口
transport.port: 9300

# --------------------------------- Discovery ----------------------------------
# 集群自动发现

# master 角色节点列表。 新加入的节点可以通过这些节点来发现集群中的其他节点. 并自动加入这个集群
discovery.seed_hosts: ["10.59.16.33:9300", "10.59.16.32:9300", "10.59.16.29:9300"]

# 设置实例为单节点模式, 设置该参数, 可以绕过引导检查。 生产环境禁止这样设置
# discovery.type: single-node

# --------------------------------- Security -----------------------------------
# security 功能
xpack.security.enabled: true

xpack.security.enrollment.enabled: true

# 启用 ssl 后, 必须 https + 证书方式访问
xpack.security.http.ssl:
  enabled: true
  keystore.path: /data/elasticsearch/config/certs/http.p12
  truststore.path: /data/elasticsearch/config/certs/http.p12

# Enable encryption and mutual authentication between cluster nodes
xpack.security.transport.ssl:
  enabled: true
  verification_mode: certificate
  keystore.path: /data/elasticsearch/config/certs/elastic-certificates.p12
  truststore.path: /data/elasticsearch/config/certs/elastic-certificates.p12
# Create a new cluster with the current node only
# Additional nodes can still join the cluster later

# Allow HTTP API connections from anywhere
# Connections are encrypted and require user authentication
http.host: 0.0.0.0
ingest.geoip.downloader.enabled: false
xpack.security.http.ssl.client_authentication: none

# --------------------------------- Index -----------------------------------
# 允许自动创建指定前缀的索引索引
# action.auto_create_index: .monitoring*,.watches,.triggered_watches,.watcher-history*,.ml*

# 允许自动创建所有索引
action.auto_create_index: .*
```

## ES 集群二进制部署

### 1. Linux 环境准备

#### 1.1 生产环境配置

> 实际参数值暂略

```
堆大小
文件描述符
内存锁定
最大线程数
。。。
等等
```

#### 1.2 修改内核参数

```sh
# 修改限制
vim /etc/security/limits.conf
es soft nofile 65536
es hard nofile 65536

# 修改系统参数
vim /etc/sysctl.conf
vm.max_map_count = 655360

sysctl -p
```

#### 1.3 创建用户

```sh
useradd es
```

#### 1.4 下载软件包并解压

```sh
cd /home/es
tar zxvf elasticsearch-8.13.2-linux-x86_64.tar.gz -C /usr/local/
tar zxvf kibana-8.13.2-linux-x86_64.tar.gz -C /usr/local/
```

#### 1.5 创建数据目录

```sh
mkdir -p /data/elasticsearch
cp -r /usr/local/elasticsearch-8.13.2/config /data/elasticsearch/
mkdir -p /data/elasticsearch/config/certs
mkdir -p /data/elasticsearch/data
mkdir -p /data/elasticsearch/logs

chown es:es -R /data/elasticsearch
```

#### 1.6 设置环境变量

```sh
export ES_JAVA_HOME=/usr/local/elasticsearch-8.13.2/jdk
```

### 2. 生成集群通信证书

> 证书文件必须在  `$ES_PATH_CONF` 路径内部, 可以是其子目录
> 只在一个节点上生成, 然后将证书复制到其他节点

#### 2.1 生成 ca

```sh
# 生成 ca (密码: 1234)
sudo -u es /usr/local/elasticsearch-8.13.2/bin/elasticsearch-certutil ca --out /data/elasticsearch/config/certs/elastic-stack-ca.p12 --pass "1234"

# 生成证书 (密码: 4567)
sudo -u es /usr/local/elasticsearch-8.13.2/bin/elasticsearch-certutil cert --ca /data/elasticsearch/config/certs/elastic-stack-ca.p12 --out /data/elasticsearch/config/certs/elastic-certificates.p12 --ca-pass "1234" --pass "4567"
```

#### 2.2 生成 http 证书 zip 包(密码: 7890)

```sh
root@cephloki01v:/data/elasticsearch/cert# sudo -u es /usr/local/elasticsearch-8.13.2/bin/elasticsearch-certutil http

## Elasticsearch HTTP Certificate Utility

Generate a CSR? [y/N]n

Use an existing CA? [y/N]y

## What is the path to your CA?

Please enter the full pathname to the Certificate Authority that you wish to
use for signing your new http certificate. This can be in PKCS#12 (.p12), JKS
(.jks) or PEM (.crt, .key, .pem) format.
CA Path: /data/elasticsearch/config/certs/elastic-stack-ca.p12

Password for elastic-stack-ca.p12:

For how long should your certificate be valid? [5y] 100y

Generate a certificate per node? [y/N]n

Enter all the hostnames that you need, one per line.
When you are done, press <ENTER> once more to move on to the next step.

mytest01v.cn
mytest02v.cn
mytest03v.cn

You entered the following hostnames.

 - mytest01v.cn
 - mytest02v.cn
 - mytest03v.cn

Is this correct [Y/n]y

Enter all the IP addresses that you need, one per line.
When you are done, press <ENTER> once more to move on to the next step.

10.59.16.33
10.59.16.32
10.59.16.29

You entered the following IP addresses.

 - 10.59.16.33
 - 10.59.16.32
 - 10.59.16.29

Is this correct [Y/n]y

Do you wish to change any of these options? [y/N]n

If you wish to use a blank password, simply press <enter> at the prompt below.
Provide a password for the "http.p12" file:  [<ENTER> for none]
Repeat password to confirm: 

What filename should be used for the output zip file? [/usr/local/elasticsearch-8.13.2/elasticsearch-ssl-http.zip] /data/elasticsearch/config/certs/elasticsearch-ssl-http.zip

Zip file written to /data/elasticsearch/config/certs/elasticsearch-ssl-http.zip
```

#### 2.3 解压 zip 包, 拷贝证书

```sh
cd /data/elasticsearch/config/certs

sudo -u es unzip elasticsearch-ssl-http.zip

sudo -u es cp elasticsearch/http.p12 kibana/elasticsearch-ca.pem .
```

### 3. 配置并启动实例

#### 3.1 向ES密钥库添加证书的密码

> 证书密码不能直接明文写到配置文件

```sh
# 以下两个操作将 http 证书 http.p12 的密码(7890)保存到密钥库文件

sudo -u es ES_PATH_CONF=/data/elasticsearch/config /usr/local/elasticsearch-8.13.2/bin/elasticsearch-keystore add xpack.security.http.ssl.keystore.secure_password

sudo -u es ES_PATH_CONF=/data/elasticsearch/config /usr/local/elasticsearch-8.13.2/bin/elasticsearch-keystore add xpack.security.http.ssl.truststore.secure_password

# 以下两个操作将 elastic-certificates.p12 的密码(4567)保存到密钥库文件

sudo -u es ES_PATH_CONF=/data/elasticsearch/config /usr/local/elasticsearch-8.13.2/bin/elasticsearch-keystore add xpack.security.transport.ssl.keystore.secure_password

sudo -u es ES_PATH_CONF=/data/elasticsearch/config /usr/local/elasticsearch-8.13.2/bin/elasticsearch-keystore add xpack.security.transport.ssl.truststore.secure_password
```

#### 3.2 查看配置是否生效

```sh
sudo -u es ES_PATH_CONF=/data/elasticsearch/config /usr/local/elasticsearch-8.13.2/bin/elasticsearch-keystore show xpack.security.http.ssl.keystore.secure_password

sudo -u es ES_PATH_CONF=/data/elasticsearch/config /usr/local/elasticsearch-8.13.2/bin/elasticsearch-keystore show xpack.security.http.ssl.truststore.secure_password

sudo -u es ES_PATH_CONF=/data/elasticsearch/config /usr/local/elasticsearch-8.13.2/bin/elasticsearch-keystore show xpack.security.transport.ssl.keystore.secure_password

sudo -u es ES_PATH_CONF=/data/elasticsearch/config /usr/local/elasticsearch-8.13.2/bin/elasticsearch-keystore show xpack.security.transport.ssl.truststore.secure_password
```


#### 3.3 配置

> 根据 [[01-01-ElasticStack-安装部署#2. ES 配置文件示例]] 编辑修改配置文件

```sh
vim /data/elasticsearch/config/elasticsearch.yml
```

#### 3.4 启动

> `-E cluster.initial_master_nodes=node-1` 在第一个节点启动时添加, 其他节点不添加

```sh
sudo -u es ES_PATH_CONF=/data/elasticsearch/config /usr/local/elasticsearch-8.13.2/bin/elasticsearch [-E cluster.initial_master_nodes=node-1] --pidfile=/data/elasticsearch/pid [-d]
```

#### 3.5 控制台输出关键信息

> 在第一次启动实例时, 并且是前台启动, 如果没有 `xpack.security.enabled: false` 关闭安全设置, 则控制台会输出以下内容

> [!WARNING] 后台启动不生成密码
> 使用 systemctl 启动或者使用 -d 参数后台启动,  不会自动生成密码, token 等信息  
> 这时可以使用重置密码, 重新生成 token 等操作来获取这些信息

```
✅ Elasticsearch security features have been automatically configured!
✅ Authentication is enabled and cluster connections are encrypted.

ℹ️  Password for the elastic user (reset with `bin/elasticsearch-reset-password -u elastic`):
  123456

ℹ️  HTTP CA certificate SHA-256 fingerprint:
  5a7154e406098dd822a1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxbbbc

ℹ️  Configure Kibana to use this cluster:
• Run Kibana and click the configuration link in the terminal when Kibana starts.
• Copy the following enrollment token and paste it into Kibana in your browser (valid for the next 30 minutes):
  ttttttttttttttttttttiOlsiMTAuNTcuMTQ0LjIzNTo5MjAwIl0sImZnciI6IjVhNzE1NGU0MDYwOThkZDgyMmExMzAxMjliYWU5NzI3YjU4ODhlZTNlxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx==

ℹ️  Configure other nodes to join this cluster:
• On this node:
  ⁃ Create an enrollment token with `bin/elasticsearch-create-enrollment-token -s node`.
  ⁃ Uncomment the transport.host setting at the end of config/elasticsearch.yml.
  ⁃ Restart Elasticsearch.
• On other nodes:
  ⁃ Start Elasticsearch with `bin/elasticsearch --enrollment-token <token>`, using the enrollment token that you generated.
```

#### 3.6 重置 `elastic` 用户密码

> 因为后台启动不会在控制台输出密码信息, 所以只能重置一次

```sh
sudo -u es ES_PATH_CONF=/data/elasticsearch/config /usr/local/elasticsearch-8.13.2/bin/elasticsearch-reset-password -u elastic

# 输出:
Password for the [elastic] user successfully reset.
New value: g2=xxxxxxxxxxxxxxx
```

#### 3.7 重置 `kibana` 用户密码

```sh
sudo -u es ES_PATH_CONF=/data/elasticsearch/config /usr/local/elasticsearch-8.13.2/bin/elasticsearch-reset-password -u kibana

# 输出:
Password for the [kibana] user successfully reset.
New value: xxxxxxxxxxxx
```
#### 3.8 验证

```sh
# 浏览器访问:
https://10.59.16.33:9200/
user
password

看到以下输出:
{
  "name" : "node-1",
  "cluster_name" : "myes001",
  "cluster_uuid" : "xa8u5ndOxxxxxxxxxxx",
  "version" : {
    "number" : "8.13.2",
    "build_flavor" : "default",
    "build_type" : "tar",
    "build_hash" : "16cc90cd2d08a3147cexxxxxxxxxxxxxxxxxf",
    "build_date" : "2024-04-05T14:45:26.420424304Z",
    "build_snapshot" : false,
    "lucene_version" : "9.10.0",
    "minimum_wire_compatibility_version" : "7.17.0",
    "minimum_index_compatibility_version" : "7.0.0"
  },
  "tagline" : "You Know, for Search"
}
```

#### 3.9 查看 node 节点列表

```sh
# 浏览器访问:
https://10.59.16.33:9200/_cat/nodes?v
```

### 4. 其他节点

> 可按此步骤扩容，第2, 第3, 第4, 第5, ... 第100, 第 1000 ... 节点

#### 4.1 拷贝证书

```sh
scp -r /data/elasticsearch/config/certs/* es@2.2.2.2/data/elasticsearch/config/certs/
```

#### 4.2 配置并启动实例

> 执行 [[#3. 配置并启动实例]] 中的 3.1 ~ 3.4 步骤配置并启动实例


### 5. 部署 Kibana

#### 5.1 创建目录

```sh
mkdir -p /data/kibana/
cp -r /usr/local/kibana-8.13.2/config /data/kibana/
mkdir -p /data/kibana/config/certs
mkdir -p /data/kibana/data
mkdir -p /data/kibana/logs
```

#### 5.1 生成 Kibana 证书

```sh
# 生成 csr
bin/elasticsearch-certutil csr -name kibana -dns 10.59.16.33
Please enter the desired output file [csr-bundle.zip]: /data/kibana/config/certs/csr-bundle.zip

# 解压
cd /data/kibana/config/certs/
unzip csr-bundle.zip
mv kibana/* .

# 生成证书
openssl x509 -req -in kibana.csr -signkey kibana.key -out kibana.crt
```

#### 5.3 创建配置文件

> `vim /data/kibana/config/kibana.yml`

```sh
server.port: 5601
server.host: 10.59.16.33
path.data: /data/kibana/data/
pid.file: /data/kibana/kibana.pid
logging.appenders.default:
  type: file
  fileName: /data/kibana/logs/kibana.log
  layout:
    type: json

# 国际化 - 中文
i18n.locale: "zh-CN"

# ES 服务主机地址
elasticsearch.hosts: ["https://10.59.16.33:9200", "https://10.59.16.32:9200","https://10.59.16.29:9200/"]
elasticsearch.username: "kibana"
elasticsearch.password: "xxxxxxxxx"
elasticsearch.ssl.verificationMode: none
elasticsearch.ssl.certificateAuthorities: ["/data/elasticsearch/config/certs/elasticsearch-ca.pem"]

server.ssl.enabled: true
server.ssl.certificate: /data/kibana/config/certs/kibana.crt
server.ssl.key: /data/kibana/config/certs/kibana.key
```

#### 5.4 启动

```sh
sudo -u es /usr/local/kibana-8.13.2/bin/kibana --config=/data/kibana/config/kibana.yml --log-file=/data/kibana/logs/kibana.log 2>&1 &
```

#### 5.5 验证

```
# 浏览器访问:
https://10.59.16.33:5601
user
password
```

#### 100. 附录: es 启动文件

```toml
vim /usr/lib/systemd/system/elasticsearch.service 
[Unit]
Description=Elasticsearch
Documentation=https://www.elastic.co
Wants=network-online.target
After=network-online.target

[Service]
Type=notify
# the elasticsearch process currently sends the notifications back to systemd
# and for some reason exec does not work (even though it is a child). We should change
# this notify access back to main (the default), see https://github.com/elastic/elasticsearch/issues/86475
NotifyAccess=all
RuntimeDirectory=elasticsearch
PrivateTmp=true
Environment=ES_HOME=/usr/local/elasticsearch-8.13.2
Environment=ES_PATH_CONF=/data/elasticsearch/config
Environment=PID_DIR=/data/elasticsearch/
Environment=ES_SD_NOTIFY=true
# EnvironmentFile=-/etc/default/elasticsearch # 这个是 deb 安装出来的文件

WorkingDirectory=/usr/local/elasticsearch-8.13.2

User=es
Group=es

# ExecStart=/usr/share/elasticsearch/bin/systemd-entrypoint -p ${PID_DIR}/elasticsearch.pid --quiet

ExecStart=/usr/local/elasticsearch-8.13.2/bin/elasticsearch --pidfile=/data/elasticsearch/pid

# StandardOutput is configured to redirect to journalctl since
# some error messages may be logged in standard output before
# elasticsearch logging system is initialized. Elasticsearch
# stores its logs in /var/log/elasticsearch and does not use
# journalctl by default. If you also want to enable journalctl
# logging, you can simply remove the "quiet" option from ExecStart.
StandardOutput=journal
StandardError=inherit

# Specifies the maximum file descriptor number that can be opened by this process
LimitNOFILE=65535

# Specifies the maximum number of processes
LimitNPROC=4096

# Specifies the maximum size of virtual memory
LimitAS=infinity

# Specifies the maximum file size
LimitFSIZE=infinity

# Disable timeout logic and wait until process is stopped
TimeoutStopSec=0

# SIGTERM signal is used to stop the Java process
KillSignal=SIGTERM

# Send the signal only to the JVM rather than its control group
KillMode=process

# Java process is never killed
SendSIGKILL=no

# When a JVM receives a SIGTERM signal it exits with code 143
SuccessExitStatus=143

# Allow a slow startup before the systemd notifier module kicks in to extend the timeout
TimeoutStartSec=900

[Install]
WantedBy=multi-user.target

# Built for packages-8.13.2 (packages)
```

## packetbeat 部署

### 1. 下载 packetbeat 并解压

```sh
curl -L -O https://artifacts.elastic.co/downloads/beats/packetbeat/packetbeat-8.13.2-linux-x86_64.tar.gz

tar zxvf packetbeat-8.13.2-linux-x86_64.tar.gz -C /usr/local/
```

### 查看网口列表

```sh
./packetbeat devices
```
### 2.  编辑配置文件

> `vim /data/packetbeat/config/packetbeat.yml`

```
如果: setup.ilm.enabled: true

# 则以下两个参数被忽略
setup.template.name
setup.template.pattern
```

```yaml
name: "myhost001.cn"
path: 
  home: /usr/local/packetbeat-8.13.2-linux-x86_64
  config: /data/packetbeat/config
  data: /data/packetbeat/data
  logs: /data/packetbeat/logs
logging:
  level: INFO
  to_files: true
  files:
    path: /data/packetbeat/logs
    name: packetbeat
    keepfiles: 7
    permissions: 0644

# 接口协议以及监听的
# 嗅探器(sniffer)类型, 默认: pcap, linux 可改为内存映射嗅探(af_packet), 比 libpcap 更快, 并且不需要内核模块，但它是 Linux 特有的
packetbeat:
  interfaces: 
    type: af_packet
    device: any         # 监听的本机网口, any 表示所有网口(仅 Linux 环境 any 生效)
    buffer_size_mb: 100 # 缓冲区大小
    snaplen: 65535      # 要捕获的数据包的最大大小, 默认 65535
    #bpf_filter: "not host 127.0.0.1" # 不捕获 127.0.0.1
    #bpf_filter: "net 192.168.238.0/0 and port 80 or port 3306" # 只捕获 port 80 和 port 3306

# 要监听的协议以及端口号
packetbeat:
  protocols:
    - type: redis
      ports: [20008]

# 模板
setup:
  template:
    #name: "packetbeat-%{[agent.version]" # 这两个设置了不生效, 还把生命周期搞不出来了
    #pattern: "packetbeat-%{[agent.version]"
    settings:
      index:
        number_of_shards: 3
        number_of_replicas: 1
  ilm:
    enabled: true # 索引生命周期管理, 默认: auto。
    policy_name: "mypolicy001" # 策略名
    #policy_file:  # 策略文件
	# 是否检查生命周期策略, 生产环境建议设置为: false
	# 如果为 false，即使 setup.ilm.overwrite: true 也不会自动生成生命周期策略
    check_exists: false
    setup.ilm.overwrite: false # 生命周期策略将在启动时被覆盖, 默认为 false
  dsl: # 数据流生命周期管理(设置完不生效。改天再研究)
    #enabled: true
    #data_stream_pattern: "zerotrust-redis-packetbeat-%{[agent.version]}"
    #setup.dsl.policy_file:
    # 是否检查生命周期策略, 如果为 false, 则将 setup.dsl.overwrite 设置为 true 以便可以自动创建生命周期策略
	# 如果为 true, 则策略存在就不会覆盖。新参数也不会生效
    #setup.dsl.check_exists: true
    #setup.dsl.overwrite: false # 生命周期策略将在启动时被覆盖, 默认为 false
  # kibana 配置会在 kibana 中生成 dashbaord, 可以不写。但不写会导致配置检查过不去. 直接启动不做配置检查即可
  kibana:
    host: "https://10.59.16.33:5601"
    username: "elastic"
    password: "xxxxxxxxxxxxxxxxxxxx"
    ssl:
      enabled: true
      verification_mode: none   # 设置为 none 可以不用指定证书, 但数据明文传输
      #certificate_authorities: ["/data/packetbeat/config/certs/elasticsearch-ca.pem"]
      #certificate: "/data/packetbeat/config/certs/kibana.crt"
      #key: "/data/packetbeat/config/certs/kibana.key"

output:
  elasticsearch:
    hosts: ["https://10.59.16.33:9200"]
    username: "packetbeat"
    password: "xxxxxxxxxxxxxxxxxx"
    # 设置 index 选项, 必须指定, setup.template.name 和 setup.template.pattern
    # 设置了 生命周期, index 选项会忽略
    index: "%{[fields.log_type]}-%{[agent.version]}-%{+yyyy.MM.dd}"
    ssl:
      enabled: true
      verification_mode: none # 设置为 none 可以不用指定证书, 但数据明文传输
      #certificate_authorities: ["/data/packetbeat/config/certs/elasticsearch-ca.pem"]
      #certificate: "/data/packetbeat/config/certs/kibana.crt"
      #key: "/data/packetbeat/config/certs/kibana.key"



# 以下参数在 8 版本废弃了
# 指定索引的滚动别名
#setup.ilm.rollover_alias: "packetbeat-zerotrust-redis"
# 名称模式，用于确定何时应该滚动到新的索引
# setup.ilm.pattern: "{now/d}"
```

#### 启动

```sh
./packetbeat run -c /data/packetbeat/config/packetbeat.yml 
```