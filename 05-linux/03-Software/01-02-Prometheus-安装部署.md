# prometheus

## 调用prometheus的API接口

```sh
curl -X POST -H 'Content-Type: application/x-www-form-urlencoded' -d 'query=node_cpu_frequency_max_hertz{instance="db01.lsne.cn:9100",cpu="16"}' 'http://prom-zll.yun.lsne.cn/api/v1/query'
```

## 安装部署

1. 下载最新版本

```linux
github上下载
```

2. 启动

```sh
./prometheus
默认找当前目录下的 prometheus.yaml 配置文件

热载入配置 curl -X POST http://localhost:9090/-/reload
热载入配置, 2.0 之后默认关闭, --web.enabled-lifecycle 参数开启
docker 下的好像不能热加载,除非自己设计一个docker镜像(或者传入一个配置文件?)

不加参数，执行kill -HUP 命令也可以进行动态加载
```

3. 配置文件讲解

```yaml
# my global config
global:
  scrape_interval:     15s # Set the scrape interval to every 15 seconds. Default is every 1 minute.
  evaluation_interval: 15s # Evaluate rules every 15 seconds. The default is every 1 minute.
  # scrape_timeout is set to the global default (10s).

# Alertmanager configuration
alerting:
  alertmanagers:
  - static_configs:
	- targets:
	  # - alertmanager:9093

# Load rules once and periodically evaluate them according to the global 'evaluation_interval'.
rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

# A scrape configuration containing exactly one endpoint to scrape:
# Here it's Prometheus itself.
scrape_configs:
  # The job name is added as a label `job=<job_name>` to any timeseries scraped from this config.
  - job_name: 'prometheus'

	# metrics_path defaults to '/metrics'
	# scheme defaults to 'http'.

	static_configs:
	- targets: ['localhost:9090']
```

4. node_exporter

```sh
node_exporter 可以开启  --collector.textfile 参数
然后通过 --collector.textfile.directory="" 指定文本文件的路径就可以把文本文件里的内容发送给server
```

## 函数

1. 取一段时间的增长值

```linux
increase 
```
    
2. 多个监控值相加(所有服务器的cpu值相加,不实用)

```linux
sum
```
    
3. 拆分sum的结果

```linux
by (instance)
```
    
4. 例: 获取CPU使用率

```linux
sum(increase(node_cpu{mode="idle"}[1m])) by (instance)
increase(node_cpu[1m])

CPU使用率公式
( 1 - sum(increase(node_cpu_seconds_total{mode="idle"}[1m])) by (instance) / sum(increase(node_cpu_seconds_total[1m])) by (instance)) * 100
```
    
5. rate

```linux
rate 专门搭配counter类型数据使用的函数
设置一个时间段, 取 counter 在这个时间段中的 平均每秒的增量

rate(node_network_receive_bytes_total[10m])
```
    
6. topk 

```linux
按值排序只取前几个

topk(3,node_netstat_Tcp_ActiveOpens)
```
    
7. count

8. predict_linear

```linux
线性预测

```

## 标签

## pushgateway 

## grafana

## Pagerduty 报警平台

1. 注册

    ```linux
    https://www.pagerduty.com/
    ```

2. configuration -- service 配置server, 可以叫grafana可以连到这里来

# systemd 启动脚本

## 启动

```toml
cat > /etc/systemd/system/prometheus.service <<EOF
[Unit]
Description=prometheus
After=network.target
[Service]
Type=simple
User=root
ExecStart=/data/prometheus217/prometheus --web.enable-lifecycle --storage.tsdb.path=/data/prometheus217/data --config.file=/data/prometheus217/prometheus.yml
Restart=on-failure
[Install]
WantedBy=multi-user.target
EOF
```

## node_export

```toml
cat > /etc/systemd/system/node_exporter.service <<EOF
[Unit]
Description=prometheus_node_export
After=network.target
[Service]
Type=simple
User=root
ExecStart=/data/node_exporter10/node_exporter
Restart=on-failure
[Install]
WantedBy=multi-user.target
EOF
```

## alertmanager

```toml
cat > /etc/systemd/system/alertmanager.service <<EOF
[Unit]
Description=alertmanager
After=network.target
[Service]
Type=simple
User=root
ExecStart=/data/alertmanager020/alertmanager --config.file=/data/alertmanager020/alertmanager.yml
Restart=on-failure
[Install]
WantedBy=multi-user.target
EOF
```
