# consul 部署

## consul 四大核心功能

```linux
服务发现 
Consul的客户端可用提供一个服务,比如 api 或者mysql ,另外一些客户端可用使用Consul去发现一个指定服务的提供者.通过DNS或者HTTP应用程序可用很容易的找到他所依赖的服务.

健康检查 
Consul客户端可用提供任意数量的健康检查,指定一个服务(比如:webserver是否返回了200 OK 状态码)或者使用本地节点(比如:内存使用是否大于90%). 这个信息可由operator用来监视集群的健康.被服务发现组件用来避免将流量发送到不健康的主机.

Key/Value存储
应用程序可用根据自己的需要使用Consul的层级的Key/Value存储.比如动态配置,功能标记,协调,领袖选举等等,简单的HTTP API让他更易于使用.

多数据中心 
Consul支持开箱即用的多数据中心.这意味着用户不需要担心需要建立额外的抽象层让业务扩展到多个区域.

Consul面向DevOps和应用开发者友好.是他适合现代的弹性的基础设施.
```

## 环境

```linux
192.168.43.121 test1.lsnan.cn
192.168.43.122 test2.lsnan.cn
192.168.43.123 test3.lsnan.cn

etcd 二进制文件: /usr/local/consul17/bin/consul

etcd 数据目录: /data/consul/
mkdir -p /data/consul/{data,log,cfg,consul.d}
```

## 三个节点创建配置文件(node_name选项的值三个节点必须不一样)

```json
cd /data/consul/cfg/

[root@test1 cfg]# cat consul.json 
{
	"datacenter": "consul_beijing_test",
	"data_dir": "/data/consul/data",
	"log_file": "/data/consul/log/consul.log",
	"log_rotate_duration": "3600s",
	"log_rotate_bytes": 1073741824,
	"log_level": "INFO",
	"node_name": "consul01",
	"server": true,
	"bootstrap_expect": 3,
	"ui": true,
	"client_addr": "0.0.0.0",
	"addresses": {
		"https": "0.0.0.0"
	},
    "ports": {
        "dns": 8600,
        "http": 8500,
        "https": 8700,
        "serf_lan": 8301,
        "serf_wan": 8302,
        "server": 8300
    },
	"watches": [{
		"type": "checks",
		"handler": "/usr/bin/health-check-handler.sh"
	}],
	"telemetry": {
		"statsite_address": "127.0.0.1:2180"
	}
}

```

## 三个节点启动

```sh
/home/lsne/consul/bin/consul agent -bind='10.95.58.95' -config-file=/home/lsne/consul/cfg/consul.json -config-dir=/home/lsne/consul/consul.d/

```

```sh
vim /usr/lib/systemd/system/consul.service
[Unit]
Description=Consul service discovery agent
Requires=network-online.target
After=network-online.target

[Service]
#User=consul
#Group=consul
Environment=GOMAXPROCS=2
Restart=on-failure
ExecStart=/usr/local/consul17/bin/consul agent -config-file=/data/consul/cfg/consul.json -config-dir=/data/consul/consul.d/
ExecReload=/bin/kill -HUP $MAINPID
KillSignal=SIGTERM
TimeoutStopSec=5

[Install]
WantedBy=multi-user.target

systemctl start consul
```

## 在后两个节点执行consul jion命令,加入第一个节点集群

```sh
/usr/local/consul17/bin/consul join 192.168.43.121
```

## 查看状态

1. web浏览器查看

```linux
http://192.168.43.121:8500/ui/consul_beijing_test/nodes
```

2. 命令行查看集群状态

```sh
/usr/local/consul17/bin/consul operator raft list-peers
```

3. 命令行查看members状态

```sh
/usr/local/consul17/bin/consul members
```

## 读写key操作

```
/usr/local/consul17/bin/consul kv put lsne_test "testhaha hello"

/usr/local/consul17/bin/consul kv get lsne_test

```

## 注册服务(应该是在client端进行注册)

```json
cd /data/consul/consul.d/

vim web.json
{
	"service": {
		"name": "prometheus",
		"tags": ["monitor","tsdb"],
		"address": "127.0.0.1",
		"port": 9090,
		"checks": [{
            "http": "http://127.0.0.1:9090/targets",
            "interval": "10s"
        }]
	}
}

systemctl reload consul
```

## 用API注册 和 查询

1. 注册

```sh
curl -X PUT -d '{"Datacenter": "consul_beijing_test", "Node": "consul03", "Address": "192.168.43.123", "Service": {"Service": "prometheus", "tags": ["monitor", "tsdb"], "Address": "192.168.43.123", "Port": 9090}}' http://127.0.0.1:8500/v1/catalog/register
```

2. 查询

```sh
curl -s 127.0.0.1:8500/v1/catalog/service/prometheus | python -m json.tool
```