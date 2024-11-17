# 配置

## 启动

```linux
./prometheus --web.enable-lifecycle --config.file=prometheus.yml 

--web.enable-admin-api 运行通过web方式管理prometheus（删除清空数据等操作）
--web.enable-lifecycle 运行通过web方式重新加载prometheus配置（相当于reload）
```

```linux
监控 docker 用 cadvisor
```

```linux
通过将SIGHUP发送到Prometheus进程，可以在运行时重新加载规则文件。 仅当所有规则文件格式正确时才会应用更改。
```

## 配置

```linux
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
      - localhost:9093

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
    - targets: ['localhost:9090','wmdb99.add.bjyt:9100','10.208.66.147:9100']

  - job_name: 'testdic'
    metrics_path: "/metrics"
    file_sd_configs:
    - files:
      - testdic/*.json
      refresh_interval: 1m
      
  - job_name: 'consul-prometheus'
    consul_sd_configs:
      - server: '192.168.43.121:8500'
        services: []
        refresh_interval: 1m
    relabel_configs:
      - source_labels: [__meta_consul_tags]
        regex: .*test.*
        action: keep
      - regex: __meta_consul_service_metadata_(.+)
        action: labelmap
        
remote_write:
  - url: "http://localhost:8086/api/v1/prom/write?db=prometheus"

remote_read:
  - url: "http://localhost:8086/api/v1/prom/read?db=prometheus"
```

- 其中remote中的 9999的配置是 influxdb2.0 版本尝试，最终没成功
- job_name testdic 是用的文件自动发现
- 自动发现文件也可以是yml格式

## file_sd_config

```linux
- labels:
    idc: "lsnan"
    machine: "test1"
  targets:
  - test1.lsnan.cn:9100
  - test2.lsnan.cn:9100
```
或者用 json 格式

```linux
[
  {
    "targets": [ "100.100.110.71:9090" ],
    "labels": {
      "env": "product",
      "job": "prometheus",
      "instance": "100.100.110.71_prometheus_server"
    }
  },
  {
    "targets": [ "100.100.110.53:9121" ],
    "labels": {
      "env": "product",
      "job": "redis",
      "instance": "redis53"
    }
  }
]
```

## consul_sd_config

1. 测试注册

```linux
curl -X PUT -d '{"id": "test1.lsnan.cn","name": "node-exporter","address": "192.168.43.121","port": 9100,"tags": ["test","prometheus","test_consul_sd_config"],"checks": [{"http": "http://192.168.43.121:9100/metrics", "interval": "5s"}]}'  http://192.168.43.121:8500/v1/agent/service/register
curl -X PUT -d '{"id": "test3.lsnan.cn","name": "node-exporter","address": "192.168.43.123","port": 9100,"tags": ["test","prometheus","test_consul_sd_config"],"checks": [{"http": "http://192.168.43.123:9100/metrics", "interval": "5s"}]}'  http://192.168.43.121:8500/v1/agent/service/register
```

2. 添加标签

```linux
vim consul-0.json
{
  "ID": "node-exporter",
  "Name": "node-exporter-192.168.43.123",
  "Tags": [
    "test"
  ],
  "Address": "192.168.43.123",
  "Port": 9100,
  "Meta": {
    "app": "spring-boot",
    "team": "appgroup",
    "name": "lsnan",
    "project": "bigdata"
  },
  "EnableTagOverride": false,
  "Check": {
    "HTTP": "http://192.168.43.123:9100/metrics",
    "Interval": "10s"
  },
  "Weights": {
    "Passing": 10,
    "Warning": 1
  }
}

curl --request PUT --data @consul-0.json http://192.168.43.122:8500/v1/agent/service/register?replace-existing-checks=1

```

## rule

1. 要在不启动Prometheus服务器的情况下快速检查规则文件在语法上是否正确，请安装并运行Prometheus的promtool命令行实用工具：一般下载来整个Prometheus已经包含了promtool工具

```linux
go get github.com/prometheus/prometheus/cmd/promtool
promtool check rules /path/to/example.rules.yml
```

2. 例子

```linux
groups:
  - name: example
    rules:
    - record: job:http_inprogress_requests:sum
      expr: sum(http_inprogress_requests) by (job)
```

```linux
# 组的名称。 在文件中必须是唯一的。
name: <string>

# 评估组中的规则的频率。
[ interval: <duration> | default = global.evaluation_interval ]

rules:
  [ - <rule> ... ]
```

```linux
# 要输出的时间序列的名称。 必须是有效的度量标准名称。
record: <string>

# 要评估的PromQL表达式。 每个评估周期都会在当前时间进行评估，并将结果记录为一组新的时间序列，其中度量标准名称由“记录”给出。
expr: <string>

# 在存储结果之前添加或覆盖的标签。
labels:
  [ <labelname>: <labelvalue> ]
```

```linux
# 警报的名称。 必须是有效的度量标准名称。
alert: <string>

# 要评估的PromQL表达式。 每个评估周期都会在当前时间进行评估，并且所有结果时间序列都会成为待处理/触发警报。
expr: <string>

# 警报一旦被退回这段时间就会被视为开启。
# 尚未解雇的警报被认为是未决的。
[ for: <duration> | default = 0s ]

# 为每个警报添加或覆盖的标签。
labels:
  [ <labelname>: <tmpl_string> ]

# 要添加到每个警报的注释。
annotations:
  [ <labelname>: <tmpl_string> ]
```

### 实际例子

```linux
groups:
- name: example
  rules:

  # 对于任何无法访问> 5分钟的实例的警报。
  - alert: InstanceDown
    expr: up == 0
    for: 5m
    labels:
      severity: page
    annotations:
      summary: "Instance {{ $labels.instance }} down"
      description: "{{ $labels.instance }} of job {{ $labels.job }} has been down for more than 5 minutes."

  # 对中值请求延迟> 1s的任何实例发出警报。
  - alert: APIHighRequestLatency
    expr: api_http_request_latencies_second{quantile="0.5"} > 1
    for: 10m
    annotations:
      summary: "High request latency on {{ $labels.instance }}"
      description: "{{ $labels.instance }} has a median request latency above 1s (current value: {{ $value }}s)"
```


## alertmanager

```linux
global:
  resolve_timeout: 5m
  smtp_smarthost: 'smtp.qq.com:465'
  smtp_from: '358181576@qq.com'
  smtp_auth_username: '358181576@qq.com'
  smtp_auth_password: 'xxxxxxxxxxxxxxx'
  smtp_require_tls: false
  wechat_api_url: 'https://qyapi.weixin.qq.com/cgi-bin/'
  wechat_api_secret: 'oemQ9rGqRlKOzCa1CchT2-xxxxxxxxxxx-ktnA'
  wechat_api_corp_id: 'xxxxxxxxxxxxx'
templates:
  - 'wechat.tmpl'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 30s
  repeat_interval: 1m
  #receiver: 'lsne'
  receiver: 'wechat'
  routes:
  - receiver: 'lsne'
    match_re:
      job: 'machine'

receivers:
- name: 'wechat'
  wechat_configs:
  - send_resolved: true
    agent_id: '1000002'
    to_party: '1'
    corp_id: 'ww49cd93bd66649ed9'
    api_url: 'https://qyapi.weixin.qq.com/cgi-bin/'
    api_secret: 'oemQ9rGqRlKOzCa1CchT2-SIaPJLI6FXSV8bg1-ktnA'
- name: 'lsne'
  email_configs:
  - to: '304034605@qq.com'
inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'dev', 'instance']
```

### 告警模板

```linux
[root@test1 alertmanager020]# cat wechat.tmpl 
{{ define "wechat.default.message" }}
{{ range $i, $alert :=.Alerts }}
========监控报警==========
告警状态：{{   .Status }}
告警级别：{{ $alert.Labels.severity }}
告警类型：{{ $alert.Labels.alertname }}
告警应用：{{ $alert.Annotations.summary }}
告警主机：{{ $alert.Labels.instance }}
告警详情：{{ $alert.Annotations.description }}
触发阀值：{{ $alert.Annotations.value }}
告警时间：{{ $alert.StartsAt.Format "2006-01-02 15:04:05" }}
========end=============
{{ end }}
{{ end }}
```

## node_exporter

```linux
./node_exporter 
```

## mysql_exporter

1. 设置my.cnf配置文件

```linux
[client]
host=localhost
port=3001
socket=/tmp/mysql3001.sock
user=root
password=123456
```

2. 执行

```linux
 ./mysqld_exporter --config.my-cnf="/data1/mysql3001/my3001.cnf"
```

## mongo_exporter

```linux
./mongodb_exporter --web.listen-address :9015 --mongodb.uri mongodb://admin:123456@127.0.0.1:8888/admin?authMechanism=SCRAM-SHA-256
```

## redis_exporter

```linux
./redis_exporter --redis.addr redis://10.203.140.108:25691 --redis.password 123456 --web.listen-address :9100
```