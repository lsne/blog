
### node-exporter

#### CPU 使用率

```
( 1 - sum(increase(node_cpu_seconds_total{mode="idle"}[1m])) by (instance) / sum(increase(node_cpu_seconds_total[1m])) by (instance)) * 100
```

> 示例

```
(1 - sum(increase(node_cpu_seconds_total{instance=~"db01.cpp.shyc3.lsne.cn:9100",mode="idle"}[1m])) by (instance) / sum(increase(node_cpu_seconds_total{instance=~"db01.cpp.shyc3.lsne.cn:9100"}[1m])) by (instance)) * 100
```

#### CPU IO 等待

```
(sum(increase(node_cpu_seconds_total{mode="iowait"}[1m])) by (instance) / sum(increase(node_cpu_seconds_total[1m])) by (instance)) * 100
```
#### 内存使用率

```
( 1 - ((node_memory_Buffers + node_memory_Cached + node_memory_MemFree) / node_memory_MemTotal)) * 100
```

> 示例

```
(1 - ((node_memory_MemAvailable_bytes{instance=~"db01.cpp.shyc3.lsne.cn:9100"}+node_memory_Buffers_bytes{instance=~"db01.cpp.shyc3.lsne.cn:9100"} + node_memory_Cached_bytes{instance=~"db01.cpp.shyc3.lsne.cn:9100"}) / (node_memory_MemTotal_bytes{instance=~"db01.cpp.shyc3.lsne.cn:9100"}))) * 100
```

#### 硬盘IO

```
((rate(node_disk_bytes_read[1m]) + rate(node_disk_bytes_written[1m])) / 1024 / 1024 )
```

#### 硬盘使用率

```
namespace:disk_usage:rate1m{instance=~"db01.cpp.shyc3.lsne.cn:9100",mountpoint="/data1"}
```

#### 负载

```
node_load15{instance="db01.cpp.shyc3.lsne.cn:9100"}
```

#### 网络

```shell
# 网络
irate(node_network_transmit_bytes_total{device!~"tap.*|veth.*|br.*|docker.*|virbr*|lo*|qv.*|pkt.*|rmirror.*|vnet.*"}[2m])/1024/1024*8

irate(node_network_receive_bytes_total{device!~"tap.*|veth.*|br.*|docker.*|virbr*|lo*|qv.*|pkt.*|rmirror.*|vnet.*"}[2m])/1024/1024*8

# 网络传输带宽
rate(node_network_transimit_bytyes[1m]) / 1024 / 1024

# TCP wait 
close_wait,time_wait 等等, 处于各种wait状态的TCP连接过多, 说明系统网络负载一定出问题了

# 文件描述符使用率监控

# 网络延迟丢包监控
#丢包数量
lostpk=`timeout 5 ping -q -A -s 500 -W 1000 -c 100 prometheus | grep transmitted | awk '{print $6}'`
#延迟
rrt=`timeout 5 ping -q -A -s 500 -W 1000 -c 100 prometheus | grep transmitted | awk '{print $10}'`
```


### mongodb-exporter

#### 网络带宽

```
mongodb:
irate(mongodb_network_bytes_total{state="in_bytes",uuid=~"10.44.101.81.*"}[1m])/1024/1024
irate(mongodb_network_bytes_total{state="out_bytes",uuid=~"10.44.101.81.*"}[1m])/1024/1024
```

### mysql -exporter

#### 网络带宽

```
mysql:
irate(mysql_global_status_bytes_received{uuid=~"10.44.101.81.*"}[1m])
irate(mysql_global_status_bytes_sent{uuid=~"10.44.101.81.*"}[1m])
```

### redis-exporter

#### 网络带宽

```
redis:
irate(redis_net_input_bytes_total{uuid=~"10.44.101.81.*"}[1m])
irate(redis_net_output_bytes_total{uuid=~"10.44.101.81.*"}[1m])
```