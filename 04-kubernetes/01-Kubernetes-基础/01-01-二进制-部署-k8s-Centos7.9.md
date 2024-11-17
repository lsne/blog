# Kubernetes 二进制部署

## 准备

### 环境

| 角色          | 主机名                                   | IP             | 备注                                |
| ----------- | ------------------------------------- | -------------- | --------------------------------- |
| etcd        | db19.cpp.zzt.lsne.cn           | 10.252.134.44  | 域名: etcd15025a.yun.lsne.cn |
| etcd        | db20.cpp.zzt.lsne.cn           | 10.252.134.45  | 域名: etcd15025b.yun.lsne.cn |
| etcd        | db19.cpp.zzbm.lsne.cn          | 10.46.20.100   | 域名: etcd15025c.yun.lsne.cn |
|             |                                       |                |                                   |
| kube-master | myk8smaster01v.cpp.zzt.lsne.cn | 10.252.177.231 |                                   |
| kube-master | myk8smaster02v.cpp.zzt.lsne.cn | 10.252.177.230 |                                   |
| kube-master | myk8smaster03v.cpp.zzt.lsne.cn | 10.252.177.229 |                                   |
|             |                                       |                |                                   |
| kube-node   | myk8snode01v.cpp.zzt.lsne.cn   | 10.252.177.232 |                                   |
| kube-node   | myk8snode02v.cpp.zzt.lsne.cn   | 10.252.177.233 |                                   |
| kube-node   | myk8snode03v.cpp.zzt.lsne.cn   | 10.252.177.235 |                                   |
| kube-node   | myk8snode04v.cpp.zzt.lsne.cn   | 10.252.177.234 |                                   |

### 修改 /etc/hosts

```
vim /etc/hosts
127.0.0.1   localhost localhost.localdomain localhost4 localhost4.localdomain4
::1         localhost localhost.localdomain localhost6 localhost6.localdomain6
10.252.177.231 master01
10.252.177.230 master02
10.252.177.229 master03
10.252.177.232 node01
10.252.177.233 node02
10.252.177.235 node03
10.252.177.234 node03
```


### 下载 cfssl, cfssljson 

```
https://github.com/cloudflare/cfssl/releases
```

### 下载 etcd

```
https://github.com/etcd-io/etcd/releases
```

### 下载二进制包

```
打开
https://github.com/kubernetes/kubernetes/releases

点击版本中的 CHANGELOG

下载:
kubernetes-server-linux-amd64.tar.gz   (server 里包括 client 和 node )
kubernetes-client-linux-amd64.tar.gz
kubernetes-node-linux-amd64.tar.gz
```

### 创建目录

```sh
mkdir -p /usr/local/etcd35/bin/
mkdir -p /data1/etcd15025/{cert,config,log}
mkdir -p /data1/kubernetes/{bin,cert,config,logs}
```

### 解压

 > 解压 cfssl, cfssljson, etcd, etcdctl 等命令到 /usr/local/etcd35/bin/

```
```

>  解压 kube-apiserver, kube-controller-manager, kubectl 等命令到 /data1/kubernetes/bin/

```
```

## 安装docker

### 1. 卸载旧版本

```sh
yum remove docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-engine docker-ce

rm -rf /var/lib/docker
```

### 2. 安装必备软件

```sh
yum install -y yum-utils device-mapper-persistent-data lvm2
```

### 3. 设置yum源

```sh
yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo

```

### 4. 安装 docker

```sh
#查看可用版本
yum list docker-ce --showduplicates | sort -r

#安装18.09.1的版本，安装其他版本照套格式就行
yum install docker-ce-18.09.1 docker-ce-cli-18.09.1 containerd.io

#安装最新版本
yum install -y docker-ce docker-ce-cli containerd.io    

mkdir -p /etc/docker 

cat /etc/docker/daemon.json    -- 这个好像不好使, 取消了
{
	"registry-mirrors": [
		"https://mirror.ccs.tencentyun.com",
		"http://docker.mirrors.ustc.edu.cn",
		"http://hub-mirror.c.163.com"
	],
	"insecure-registries": [
		"docker.mirrors.ustc.edu.cn"
	],
	"debug": true,
	"experimental": true
}
```

### 4.1 配置代理

```sh
cat /etc/systemd/system/docker.service.d/http-proxy.conf
[Service]
Environment="HTTP_PROXY=http://static-proxy.g0.lsne.cn:3128"
Environment="HTTPS_PROXY=http://static-proxy.g0.lsne.cn:3128"
Environment="NO_PROXY=localhost,127.0.0.1,lsne.cn,127.0.0.0/8,10.0.0.0/8,172.17.0.0/16,192.168.0.0/16"
```

### 5. 重启docker

```sh
systemctl daemon-reload
systemctl restart docker.service
```

## 部署etcd

### 1. 创建 ca 配置文件

```sh
cd /data1/etcd15025/cert/
[root@test1 cert]# cat ca-csr.json 
{
    "CN": "etcd CA",
    "key": {
        "algo": "rsa",
        "size": 2048
    },
    "names": [
        {
            "C": "CN",
            "L": "Beijing",
            "ST": "Beijing",
            "O": "etcd",
            "OU": "System"
        }
    ]
}

# etcd-server 必须 server auth 和 client auth两个都有，配置到 etcd.yaml 配置文件的 client-transport-security 和 peer-transport-security 里;  etcd-client 是 etcdctl 命令上用的
[root@test1 cert]# cat ca-config.json 
{
    "signing": {
        "default": {
            "expiry": "876000h"
        }, 
        "profiles": {
            "etcd-server": {
                "expiry": "876000h", 
                "usages": [
                    "signing", 
                    "key encipherment", 
                    "server auth", 
                    "client auth"
                ]
            }, 
            "etcd-client": {
                "expiry": "876000h", 
                "usages": [
                    "signing", 
                    "key encipherment", 
                    "client auth"
                ]
            }
        }
    }
}

[root@test1 cert]# cat etcd-csr.json 
{
    "CN": "etcd",
    "key": {
        "algo": "rsa",
        "size": 2048
    },
    "names": [
        {
            "C": "CN",
            "L": "Beijing",
            "ST": "Beijing",
            "O": "etcd",
            "OU": "System"
        }
    ]
}
```

### 2. 创建 ca 证书中心 和 etcd使用的证书

```sh
/usr/local/etcd35/bin/cfssl gencert -initca ca-csr.json | /usr/local/etcd35/bin/cfssljson -bare ca

/usr/local/etcd35/bin/cfssl gencert -ca=ca.pem -ca-key=ca-key.pem -config=ca-config.json -hostname=10.252.134.44,10.252.134.45,10.46.20.100 -profile=etcd-server etcd-csr.json | /usr/local/etcd35/bin/cfssljson -bare /data1/etcd15025/cert/etcd-server

/usr/local/etcd35/bin/cfssl gencert -ca=ca.pem -ca-key=ca-key.pem -config=ca-config.json -profile=etcd-client etcd-csr.json | /usr/local/etcd35/bin/cfssljson -bare /data1/etcd15025/cert/etcd-client
```

### 3. 创建etcd配置文件

```yaml
vim /data1/etcd15025/config/etcd.yaml
name: "db19.cpp.zzt.lsne.cn"
data-dir: "/data1/etcd15025/data"
wal-dir: "/data1/etcd15025/wal"
snapshot-count: 10000
heartbeat-interval: 100
election-timeout: 1000
quota-backend-bytes: 4294967296
max-request-bytes: 10485760
listen-peer-urls: "https://10.252.134.44:16025"
listen-client-urls: "https://10.252.134.44:15025,https://127.0.0.1:15025"
max-snapshots: 5
max-wals: 5
cors:
initial-advertise-peer-urls: "https://10.252.134.44:16025"
advertise-client-urls: "https://10.252.134.44:15025"
discovery:
discovery-fallback: 'proxy'
discovery-proxy:
discovery-srv:
initial-cluster: "db19.cpp.zzt.lsne.cn=https://10.252.134.44:16025,db20.cpp.zzt.lsne.cn=https://10.252.134.45:16025,db19.cpp.zzbm.lsne.cn=https://10.46.20.100:16025"
initial-cluster-token: "etcd15025"
initial-cluster-state: "new"
strict-reconfig-check: true
enable-v2: false
enable-pprof: true
proxy: 'off'
proxy-failure-wait: 5000
proxy-refresh-interval: 30000
proxy-dial-timeout: 1000
proxy-write-timeout: 5000
proxy-read-timeout: 0

client-transport-security:
  auto-tls: false
  client-cert-auth: true
  cert-file: "/data1/etcd15025/cert/etcd-server.pem"
  key-file: "/data1/etcd15025/cert/etcd-server-key.pem"
  trusted-ca-file: "/data1/etcd15025/cert/ca.pem"

peer-transport-security:
  auto-tls: false
  client-cert-auth: true
  cert-allowed-cn: "lsk8s-etcd15025"
  cert-file: "/data1/etcd15025/cert/etcd-server.pem"
  key-file: "/data1/etcd15025/cert/etcd-server-key.pem"
  trusted-ca-file: "/data1/etcd15025/cert/ca.pem"

self-signed-cert-validity: 1
log-level: info
logger: zap
log-outputs: ["/data1/etcd15025/log/etcd.log"]
force-new-cluster: false

auto-compaction-mode: "periodic"
auto-compaction-retention: "72h"
```

### 4. 启动 etcd 

```sh
./etcd --config-file=/data1/etcd15000/config/etcd.yaml
```

## 部署 kube-apiserver

### 1. 生成 kube-apiserver 需要的 ca 证书中心

> 可以将 /data1/kubernetes/cert/kube-apiserver 路径改为 /data1/kubernetes/cert/kube

```json
// vim /data1/kubernetes/cert/kube-apiserver/ca-csr.json
{
        "CN": "kubernetes",
        "key": {
                "algo": "rsa",
                "size": 2048
        },
        "names": [{
                "C": "CN",
                "L": "Beijing",
                "ST": "Beijing",
                "O": "k8s",
                "OU": "System"
        }]
}

```

```sh
/usr/local/etcd35/bin/cfssl gencert -initca ca-csr.json | /usr/local/etcd35/bin/cfssljson -bare ca
```

### 2. 使用刚刚生成的ca证书中心, 自签证书文件

```json
// vim /data1/kubernetes/cert/kube-apiserver/server-csr.json

{
	"CN": "kubernetes",
	"hosts": [
        "172.16.16.1",
        "172.16.16.2",
        "172.16.16.3",
        "172.16.16.4",
        "172.16.16.5",
        "172.16.16.6",
		"10.252.177.232",
		"10.252.177.233",
		"10.252.177.235",
		"10.252.177.234",
		"10.252.177.230",
		"10.252.177.231",
		"10.252.177.229"
	],
	"key": {
		"algo": "rsa",
		"size": 2048
	},
	"names": [{
		"C": "CN",
		"L": "BeiJing",
		"ST": "BeiJing",
		"O": "k8s",
		"OU": "System"
	}]
}

上述文件hosts字段中IP为所有Master/LB/VIP IP，一个都不能少！为了方便后期扩容可以多写几个预留的IP。
```

```sh
/usr/local/etcd35/bin/cfssl gencert -ca=ca.pem -ca-key=ca-key.pem -config=ca-config.json -profile=kubernetes server-csr.json | /usr/local/etcd35/bin/cfssljson -bare server
```

### 3. 生成token.csv文件

```sh
head -c 16 /dev/urandom | od -An -t x | tr -d ' '

vim /data1/kubernetes/config/token.csv
60876ce619dde78e99689fadd71b9a1c,kubelet-bootstrap,10001,"system:node-bootstrapper"
```

### 4. 创建配置文件

```sh
vim /data1/kubernetes/config/apiserver.conf
KUBE_APISERVER_OPTS="--logtostderr=false \
--v=2 \
--log-dir=/data1/kubernetes/logs \
--etcd-servers=https://etcd15025a.yun.lsne.cn:15025,https://etcd15025b.yun.lsne.cn:15025,https://etcd15025c.yun.lsne.cn:15025 \
--bind-address=10.252.177.231 \
--secure-port=6443 \
--advertise-address=10.252.177.231 \
--allow-privileged=true \
--service-cluster-ip-range=172.16.16.0/24 \
--enable-admission-plugins=NodeRestriction \
--authorization-mode=RBAC,Node \
--enable-bootstrap-token-auth=true \
--token-auth-file=/data1/kubernetes/config/token.csv \
--service-node-port-range=30000-32767 \
--kubelet-client-certificate=/data1/kubernetes/cert/kube-apiserver/server.pem \
--kubelet-client-key=/data1/kubernetes/cert/kube-apiserver/server-key.pem \
--tls-cert-file=/data1/kubernetes/cert/kube-apiserver/server.pem  \
--tls-private-key-file=/data1/kubernetes/cert/kube-apiserver/server-key.pem \
--client-ca-file=/data1/kubernetes/cert/kube-apiserver/ca.pem \
--service-account-key-file=/data1/kubernetes/cert/kube-apiserver/ca-key.pem \
--service-account-issuer=api \
--service-account-signing-key-file=/data1/kubernetes/cert/kube-apiserver/ca-key.pem \
--etcd-cafile=/data1/kubernetes/cert/etcd/ca.pem \
--etcd-certfile=/data1/kubernetes/cert/etcd/etcd-client.pem \
--etcd-keyfile=/data1/kubernetes/cert/etcd/etcd-client-key.pem \
--requestheader-client-ca-file=/data1/kubernetes/cert/kube-apiserver/ca.pem \
--proxy-client-cert-file=/data1/kubernetes/cert/kube-apiserver/server.pem \
--proxy-client-key-file=/data1/kubernetes/cert/kube-apiserver/server-key.pem \
--requestheader-allowed-names=kubernetes \
--requestheader-extra-headers-prefix=X-Remote-Extra- \
--requestheader-group-headers=X-Remote-Group \
--requestheader-username-headers=X-Remote-User \
--enable-aggregator-routing=true \
--audit-log-maxage=30 \
--audit-log-maxbackup=3 \
--audit-log-maxsize=100 \
--audit-log-path=/data1/kubernetes/logs/k8s-audit.log"
```

### 5. 创建service启动文件, 并启动

```toml
# vim /usr/lib/systemd/system/kube-apiserver.service

[Unit]
Description=Kubernetes API Server
Documentation=https://github.com/kubernetes/kubernetes

[Service]
EnvironmentFile=/data1/kubernetes/config/apiserver.conf
ExecStart=/data1/kubernetes/bin/kube-apiserver $KUBE_APISERVER_OPTS
Restart=always

[Install]
WantedBy=multsr.target

systemctl start kube-apiserver
```

## 创建kubeconfig配置文件

```
为kube-controller-manager、kube-scheduler、kubelet和kubeproxy服务统一创建一个kubeconfig文件作为连接kube-apiserver服务的 配置文件，后续也作为kubectl命令行工具连接kube-apiserver服务的配 置文件
```
### 方法一

```yaml
# vim /data1/kubernetes/config/kubeconfig
apiVersion: v1
kind: Config
clusters:
- name: default
  cluster:
    server: https://10.252.177.231:6443
    certificate-authority: /data1/kubernetes/cert/kube-apiserver/ca.pem
users:
- name: admin
  user:
    client-certificate: /data1/kubernetes/cert/kube-apiserver/kube-client.pem
    client-key: /data1/kubernetes/cert/kube-apiserver/kube-client-key.pem
contexts:
- context:
    cluster: default
    user: admin
  name: default
current-context: default
```

### 方法二

### 1. 使用apiserver中生成的ca证书中心, 自签证书文件

```json
// vim /data1/kubernetes/cert/kube-apiserver/kebu-client.csr.json
{
    "CN":"admin",
    "hosts":[

    ],
    "key":{
        "algo":"rsa",
        "size":2048
    },
    "names":[
        {
            "C":"CN",
            "L":"BeiJing",
            "ST":"BeiJing",
            "O":"system:masters",
            "OU":"System"
        }
    ]
}
```

```sh
/usr/local/etcd35/bin/cfssl gencert -ca=ca.pem -ca-key=ca-key.pem -config=ca-config.json -profile=kubernetes controller-manager.csr.json | /usr/local/etcd35/bin/cfssljson -bare kube-client
```

### 2. 生成kubeconfig文件(以下是shell命令，直接在终端执行):

```sh
KUBE_CONFIG="/data1/kubernetes/config/kubeconfig"
KUBE_APISERVER="https://10.252.177.231:6443"

/data1/kubernetes/bin/kubectl config set-cluster kubernetes \
  --certificate-authority=/data1/kubernetes/cert/kube-apiserver/ca.pem \
  --embed-certs=true \
  --server=${KUBE_APISERVER} \
  --kubeconfig=${KUBE_CONFIG}
/data1/kubernetes/bin/kubectl config set-credentials admin \
  --client-certificate=./kube-client.pem \
  --client-key=./kube-client-key.pem \
  --embed-certs=true \
  --kubeconfig=${KUBE_CONFIG}
/data1/kubernetes/bin/kubectl config set-context default \
  --cluster=kubernetes \
  --user=admin \
  --kubeconfig=${KUBE_CONFIG}
/data1/kubernetes/bin/kubectl config use-context default --kubeconfig=${KUBE_CONFIG}
```

### 3. 最后自动生成的是这样的:

```yaml
apiVersion: v1
clusters:
- cluster:
    certificate-authority-data: LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURtakNDQW9LZ0F3SUJBZ0lVR3YxL001UlIyYXFGWm9iK1pyTXk4YXBPTUZNd0RRWUpLb1pJaHZjTkFRRUwKQlFBd1pURUxNQWtHQTFVRUJoTUNRMDR4RURBT0JnTlZCQWdUQjBKbGFXcHBibWN4RURBT0JnTlZCQWNUQjBKbAphV3BwYm1jeEREQUtCZ05WQkFvVEEyczRjekVQTUEwR0ExVUVDeE1HVTNsemRHVnRNUk13RVFZRFZRUURFd3ByCmRXSmxjbTVsZEdWek1CNFhEVEl5TURjeU1UQTRNek13TUZvWERUSTNNRGN5TURBNE16TXdNRm93WlRFTE1Ba0cKQTFVRUJoTUNRMDR4RURBT0JnTlZCQWdUQjBKbGFXcHBibWN4RURBT0JnTlZCQWNUQjBKbGFXcHBibWN4RERBSwpCZ05WQkFvVEEyczRjekVQTUEwR0ExVUVDeE1HVTNsemRHVnRNUk13RVFZRFZRUURFd3ByZFdKbGNtNWxkR1Z6Ck1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0NBUUVBejRDV0lHMnRNZEJoRitoN2d0T00KNmxhWC91K254cXdmVDNkWnpia3pna1AwT0N2OTlOcnhTL2Q3ZnJoZjJuRDJ2N3lNWXpteDNXdUsrOTVKMk82NgpnSCtxZWd2Z2JFRms0WkJINXAyY1JqSnJlcEJtNUdvSTZhdDIyN0Uydmw0cU0xM0tUblVmVTVCaGJxeWFNTUxRCk05WktWN09Yb2pqeTd5Q3M4ZFFCeFFJVkxkakU4RVBZOTgwdzIvS1d3bFMzbUk3THJSSkpneDJCZ2JMaEMzdVMKWEdsTGp0MkJFUEtLYnVqZ3ovM244K0NSTEdCZ1BFdVBEZitTZWMwWExoazlFeFZaRGxTcUhiR1VFSHBpc1JxSApMdFpjdGMvOEx3MllJR2oxZWpQZTlIc0t3ZE5rallOQ0NUTElzUkplaldDdVdiakh0eUh1aFBGbnpmUXRudzVuCkRRSURBUUFCbzBJd1FEQU9CZ05WSFE4QkFmOEVCQU1DQVFZd0R3WURWUjBUQVFIL0JBVXdBd0VCL3pBZEJnTlYKSFE0RUZnUVVRZFkzS01jT1hpWGpWZE5DNXROUTJQWHc5NEV3RFFZSktvWklodmNOQVFFTEJRQURnZ0VCQU1CcwpqNnkwcytDWXQ5RVpsa1ZiQlFBVFJsRmk3R2NkK0NQWHVZR3JrZEQxSFlNd0VVSmNSV1VlOGF5cEtIK2htNGVzCis0aER6V3R4V0k0OGJkemlSMlgzcmxxREMyWE8rOFhyZ2ZrVTAwSDVYK1NPdHBrcm1iL2Z3YWptTUptLys2OGIKTlc2UjZBWEVkU1ZRTVB3OGVWRHJqeGttNGpPYTR4ZFZLWTVtRGMrcXVxUjVyRVM0aHJvbnJ6aG5Cb0tJTGNCbQpVVTV1Mk9YSlFjTVZJWThOWXl2aHVwakpSOWdLc3F1L1F0NmMxRzFjYzc1eVdLSTZCMlNWMVJ5QlF1MHJITlpECjlmeTFkTFNtd3Z2R2NhYkRKWHlBa1pCY21aYzNjSDc0T1JVLzBINGFUek1UZ2FUR3l2cnFMVlM1Vlo3RUN5d2IKYWRpNXQvcVhjbTJsdXhPaHdPYz0KLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQo=
    server: https://10.252.177.231:6443
  name: kubernetes
contexts:
- context:
    cluster: kubernetes
    user: admin
  name: default
current-context: default
kind: Config
preferences: {}
users:
- name: admin
  user:
    client-certificate-data: LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUQ5ekNDQXQrZ0F3SUJBZ0lVZlJtU01NbURWR1B1cEwrL2QrU3FvSWZrbjhBd0RRWUpLb1pJaHZjTkFRRUwKQlFBd1pURUxNQWtHQTFVRUJoTUNRMDR4RURBT0JnTlZCQWdUQjBKbGFXcHBibWN4RURBT0JnTlZCQWNUQjBKbAphV3BwYm1jeEREQUtCZ05WQkFvVEEyczRjekVQTUEwR0ExVUVDeE1HVTNsemRHVnRNUk13RVFZRFZRUURFd3ByCmRXSmxjbTVsZEdWek1CNFhEVEl5TURjeU5UQTVNVE13TUZvWERUTXlNRGN5TWpBNU1UTXdNRm93Z1lReEN6QUoKQmdOVkJBWVRBa05PTVJBd0RnWURWUVFJRXdkQ1pXbEthVzVuTVJBd0RnWURWUVFIRXdkQ1pXbEthVzVuTVJjdwpGUVlEVlFRS0V3NXplWE4wWlcwNmJXRnpkR1Z5Y3pFUE1BMEdBMVVFQ3hNR1UzbHpkR1Z0TVNjd0pRWURWUVFECkV4NXplWE4wWlcwNmEzVmlaUzFqYjI1MGNtOXNiR1Z5TFcxaGJtRm5aWEl3Z2dFaU1BMEdDU3FHU0liM0RRRUIKQVFVQUE0SUJEd0F3Z2dFS0FvSUJBUUR2VTFLUGVYVEp4MDJWZzI2SVF1cXdvT2lZMzRyL2dIYmVDSVFLSHRaUwpWNTk4VzNkYjc5NW91Uzk4blBUZmtCN01EbXcrRTBDYW82Y3dPd21CQlIrVTVqNlNRdkNsK1J0bWEzeStHbXVrCldIRlZMditBcmZvWVMvUXQ2alR1M0RsWkppRVdoOVRKdDdBZmc5RU1sWi9QL21RejZaM2IrdDRYYnRWRjhPaDIKeit6Y2dxdG50WWhVeTdRMXJDL3lBTEZTMnhXZ2lIQ1BiNk9oNThmT2lBNWpTUnRZSXprQTMvU0c1MHRsc3U2ZQp5UDI1V2hvd2QzeXB5M3grSUp0aFErUi9aRGIweGIxSDhVN3NXZm5QZExzdjZGM256M1M5S016Sko5ZjFkcFI3CjlsL1k1YnlpRERocm9mYmFWTUl2aXhUUWlLQXNDWjZpMVhsOGdvVHFKbTBqQWdNQkFBR2pmekI5TUE0R0ExVWQKRHdFQi93UUVBd0lGb0RBZEJnTlZIU1VFRmpBVUJnZ3JCZ0VGQlFjREFRWUlLd1lCQlFVSEF3SXdEQVlEVlIwVApBUUgvQkFJd0FEQWRCZ05WSFE0RUZnUVV5M3BYTkttY2dLbzFoSzRYSnlvdXcvRFQrVkV3SHdZRFZSMGpCQmd3CkZvQVVRZFkzS01jT1hpWGpWZE5DNXROUTJQWHc5NEV3RFFZSktvWklodmNOQVFFTEJRQURnZ0VCQU0yN2RqMzEKcU01L2dBYSsrV1ZYeFhaVkFXT1J4QndUMjRPeTVVeXlnZUFwQ3VkSitLWW1SZnJDWmtRbHpRU1JVZjlMTk5oOAoyNnkxc2w0Zisvb0ttcG54WFdmbFdNc05OTlJlVHRFeDhOOWp6UGRYNHdFWEJsd3lNdHI4U2tDNUhTUXdtTGNkCkU1blQ2MERJYUhidDNyeFpKOEdVaEZQcnRGZ2FXVU9EMHZKQU8vMjlQNkNCL3NqQW5jM2RDSlpOMlcyeGlmL04KNzdxMHZPRG13NFhjSUZuY3g0ekw5RlF2S3FJdVY2dTkvMEdoOTU2ak03S2ppbERGWkN6b20zN0x1ejZjQWFJdgp2NU1oWnlSUmZFRnVsNXZaUGJWeks0U1V2MlVHazQwTDRzT3d6OE1CeG5vMzVPRGFyajRTbW9Lc1lnRmJFd1EvCkZqc3ppZkpER0ZqWWtOWT0KLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQo=
    client-key-data: LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQpNSUlFcEFJQkFBS0NBUUVBNzFOU2ozbDB5Y2RObFlOdWlFTHFzS0RvbU4rSy80QjIzZ2lFQ2g3V1VsZWZmRnQzClcrL2VhTGt2Zkp6MDM1QWV6QTVzUGhOQW1xT25NRHNKZ1FVZmxPWStra0x3cGZrYlptdDh2aHBycEZoeFZTNy8KZ0szNkdFdjBMZW8wN3R3NVdTWWhGb2ZVeWJld0g0UFJESldmei81a00rbWQyL3JlRjI3VlJmRG9kcy9zM0lLcgpaN1dJVk11ME5hd3Y4Z0N4VXRzVm9JaHdqMitqb2VmSHpvZ09ZMGtiV0NNNUFOLzBodWRMWmJMdW5zajl1Vm9hCk1IZDhxY3Q4ZmlDYllVUGtmMlEyOU1XOVIvRk83Rm41ejNTN0wraGQ1ODkwdlNqTXlTZlg5WGFVZS9aZjJPVzgKb2d3NGE2SDIybFRDTDRzVTBJaWdMQW1lb3RWNWZJS0U2aVp0SXdJREFRQUJBb0lCQUNLSEE5ODlKNU5BMUxtZwpWNThEQUhieEQvMldLcWlIOFI1QlhrTlRoWm9sbUJYSjRHTjhMTHN4RkYvSENURUR5dDJucXdnZG9QRnVjTjF0CmR3YU5KYXhHdDNwRWZCR0Y2ZVVSMXRKYVgzTTdhMFpkM0hERktOSytpb0RoVERlMXYvUlRvdXhzTmsvUDEzSUUKZzNGc1dMMGFOM3loMUt0Nit2V29nTTV4WGloZHVadGZscytyNnV2aS9DS2taZVExeUxIM1pvSmo5WTBORUozTAo1a08zbDliblVWL1ducGRsS2ZDUm9VUmV1dEZmaHBJUXgzckpUVlFndWxYNUFTRU96b3J3SmU3MklZVHJlQnU5CjZsZUR1SXVqUGtIZUNIWURobmRzTjhmcm9iNG9KcWV0RjlKd0pwMC9sUkxLVSt2dmhBeVVQN3VhWTJwb1Fkb1MKbW9SVGp5a0NnWUVBL3hPQlpnaURZcHNQVFF6d244bUgzcTVGdVFodDRTMmFtM0xMT09rZEt6bTFGOEhLdkp3NAplaXlIbXdaTTlSb3lXamNFZ2EzTHIrU0V6RzF4Z2dKYTlhNE9DRzgvNXk0VkR0dHBoVld1Qlg0VE1zeDRLY1Z6CktNUUdUcEdIR2txYjFrMmNuU2x5cTM3SFJqRmx0SjF2UDViVmlUU2pUNE9RQmdRcU80MHFiQ1VDZ1lFQThERTIKdHBoVk1ibXZNSURuVFlrZEY5cmVFdTFUT3g5Zk5UYnNKVFFNaW5NQXhPNFpFQ3ZwQzhpT1h5eEFxTTErYUZVMwpodXhNaTNQYnN3MDFodHprL1p1Z2dmNGttRUpJMlkxWjRwdVFuR3hqc29KTlBTaGtVZEhpcVZ6cFpQaWlFMy9DCkhFTUVsRG1OM2luM0lSeTVXL3BxYi9mTmNJbjhORmtQYVAxTURhY0NnWUVBNXdEck4xU09hRWExWExwVFVPSmEKd2poaHZHajkyZWhMRkd5cHp5aU8yZzZ4Q29yZTZHRXlaTExmUEc1QVU5a2RzTVlTdHI2R3NRenJsNWVtTEcrbApvTW00dTdyRXpNRFhJVlZrQXZUTlhQd0l0d0NsOG01M0ZId3ltZ1VCcmJYVDNBajl4UGM4ZWtPZWhOdEhtSUxiCnRXTU1qKzJ6Mk5iMUgvMjFvYWordW1FQ2dZRUF1WERsa3hnTlBuVGp3d2ppaThRK2gvcGMxalFRdkdhK05QR1EKWkRESk5lTVFSdnFrc3cyVHdaczRBRmJFSFE5NmRzYkVOaEVlRDlTRlhMbm9CNVZuM2oxWE1NV3NMem1OMFJrRwp1cVBzaERoU3lMRTlQT2lBZTRNV0FqaFBvYnNzTnUyK1NkK2NHMnhNRWFoSXVuSFkwaUNHS0tnakhxNEozOGlhCjB5NHNsNlVDZ1lCTzk4RytoVUJKRVhyMlh5aTFaZ0NNamxocEhXcWFoUEQ2ODI2blJYZE1MOHVYUytHYzlUcDYKc2RidU9yZlFrSlBHQk95ZnBaSW1FaldIZGF1YUV4dDYveXNnOWJpMnQrS01zd0NSZFptY1dob1VacU15T2xiMgpuSFgxZEI0cTVNRDZNdm9peTVqZU8xaXo3RHNZV0RvT21BVnZvTS9wTmc3SEdDRlV3QUNoTmc9PQotLS0tLUVORCBSU0EgUFJJVkFURSBLRVktLS0tLQo=
```


## 部署 kube-controller-manager

### 1. 创建kube-controller-manager配置文件

```sh
vim /data1/kubernetes/config/controller-manager.conf
KUBE_CONTROLLER_MANAGER_OPTS="--logtostderr=false \
--v=2 \
--log-dir=/data1/kubernetes/logs \
--leader-elect=true \
--kubeconfig=/data1/kubernetes/config/kubeconfig \
--bind-address=0.0.0.0 \
--allocate-node-cidrs=true \
--cluster-cidr=192.168.0.0/16 \
--service-cluster-ip-range=172.16.16.0/24 \
--cluster-signing-cert-file=/data1/kubernetes/cert/kube-apiserver/ca.pem \
--cluster-signing-key-file=/data1/kubernetes/cert/kube-apiserver/ca-key.pem  \
--root-ca-file=/data1/kubernetes/cert/kube-apiserver/ca.pem \
--service-account-private-key-file=/data1/kubernetes/cert/kube-apiserver/ca-key.pem \
--cluster-signing-duration=87600h0m0s"
```

### 2. 创建 kube-controller-manager.service 文件, 并启动

```toml
# vim /usr/lib/systemd/system/kube-controller-manager.service
[Unit]
Description=Kubernetes Controller Managerw
Documentation=https://github.com/kubernetes/kubernetes

[Service]
EnvironmentFile=/data1/kubernetes/config/controller-manager.conf 
ExecStart=/data1/kubernetes/bin/kube-controller-manager $KUBE_CONTROLLER_MANAGER_OPTS
Restart=on-failure

[Install]
WantedBy=multi-user.target

systemctl start kube-controller-manager
```

## 部署kube-scheduler

### 1. 创建 kube-scheduler 配置文件

```sh
vim /data1/kubernetes/config/kube-scheduler.conf

KUBE_SCHEDULER_OPTS="--logtostderr=false \
--v=2 \
--log-dir=/data1/kubernetes/logs \
--leader-elect \
--kubeconfig=/data1/kubernetes/config/kubeconfig \
--bind-address=0.0.0.0"
```

### 2. 创建kube-scheduler.service 文件, 并启动

```sh
vim /usr/lib/systemd/system/kube-scheduler.service
[Unit]
Description=Kubernetes Scheduler
Documentation=https://github.com/kubernetes/kubernetes

[Service]
EnvironmentFile=/data1/kubernetes/config/kube-scheduler.conf
ExecStart=/data1/kubernetes/bin/kube-scheduler $KUBE_SCHEDULER_OPTS
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

## 查看集群状态 && 授权 admin 用户允许请求证书

### 1. 将配置文件复制到 /root/.kube

```sh
mkdir -p /root/.kube
cp /data1/kubernetes/config/kubeconfig /root/.kube/config
```

### 2. 执行查看命令

```sh
/data1/kubernetes/bin/kubectl get cs
```

### 3. 授权 kubelet-bootstrap 用户

```sh
/data1/kubernetes/bin/kubectl create clusterrolebinding kubelet-bootstrap --clusterrole=admin --user=kubelet-bootstrap
```

## Node 节点: 部署 kubelet

### 1. 创建 kubelet 配置命令行参数文件(--hostname-override 参数根据每台机器实际情况做修改)

```sh
[root@myk8snode01v config]# cat kubelet.conf 
KUBELET_OPTS="--v=2 \
--authorization-mode=Webhook \
--authentication-token-webhook=true \
--client-ca-file=/data1/kubernetes/cert/kube-apiserver/ca.pem \
--anonymous-auth=false \
--read-only-port=0 \
--network-plugin=cni \
--hostname-override=node02 \
--kubeconfig=/data1/kubernetes/config/kubeconfig \
--config=/data1/kubernetes/config/kubelet-config.yml \
--cert-dir=/data1/kubernetes/cert/kube-apiserver"
```

### 2. 创建 kubelet 配置文件

```sh
[root@myk8snode01v config]# cat kubelet-config.yml 
kind: KubeletConfiguration
apiVersion: kubelet.config.k8s.io/v1beta1
address: 0.0.0.0
port: 10250
readOnlyPort: 10255
cgroupDriver: cgroupfs
clusterDNS:
  - 172.16.16.2
clusterDomain: cluster.local 
failSwapOn: false
authentication:
  anonymous:
    enabled: true
```

### 3. 创建 kubelet.service 文件, 并启动

```sh
[root@myk8snode01v config]# cat /usr/lib/systemd/system/kubelet.service 
[Unit]
Description=Kubernetes Kubelet
After=docker.service

[Service]
EnvironmentFile=/data1/kubernetes/config/kubelet.conf
ExecStart=/data1/kubernetes/bin/kubelet $KUBELET_OPTS
Restart=on-failure
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target

systemctl start kubelet
```

### 4. 查看是否加入集群

```sh
/data1/kubernetes/bin/kubectl get nodes
```

## Node 节点: 部署 kube-proxy

### 1. 创建 kube-proxy 启动项文件

```sh
[root@myk8snode01v config]# cat kube-proxy.conf 
KUBE_PROXY_OPTS="--logtostderr=false \
--v=2 \
--log-dir=/data1/kubernetes/logs \
--config=/data1/kubernetes/config/kube-proxy-config.yml"
```

### 2. 创建 kube-proxy 文件, 配置文件

```sh
[root@myk8snode01v config]# cat kube-proxy-config.yml 
kind: KubeProxyConfiguration
apiVersion: kubeproxy.config.k8s.io/v1alpha1
bindAddress: 0.0.0.0
metricsBindAddress: 0.0.0.0:10249
clientConnection:
  kubeconfig: /data1/kubernetes/config/kubeconfig
hostnameOverride: 10.252.177.232
clusterCIDR: 192.168.0.0/16
```

### 3. 创建kube-proxy.service 文件, 并启动

```toml
# [root@myk8snode01v config]# cat /usr/lib/systemd/system/kube-proxy.service 
[Unit]
Description=Kubernetes Proxy
After=network.target

[Service]
EnvironmentFile=/data1/kubernetes/config/kube-proxy.conf
ExecStart=/data1/kubernetes/bin/kube-proxy $KUBE_PROXY_OPTS
Restart=on-failure
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target

systemctl start kube-proxy
```

## 设置 apiserver 允许访问各node节点的kubelet 

```yaml
[root@myk8smaster01v workspace]# cat apiserver-to-kubelet-rbac.yaml 
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  annotations:
    rbac.authorization.kubernetes.io/autoupdate: "true"
  labels:
    kubernetes.io/bootstrapping: rbac-defaults
  name: system:kube-apiserver-to-kubelet
rules:
  - apiGroups:
      - ""
    resources:
      - nodes/proxy
      - nodes/stats
      - nodes/log
      - nodes/spec
      - nodes/metrics
      - pods/log
    verbs:
      - "*"
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: system:kube-apiserver
  namespace: ""
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: system:kube-apiserver-to-kubelet
subjects:
  - apiGroup: rbac.authorization.k8s.io
    kind: User
    name: kubernetes
    
kubectl apply -f apiserver-to-kubelet-rbac.yaml
```


## 部署网络插件 网络插件Flannel

### 1. 下载 yaml 文件, 并且修改网络

```
wget  https://raw.githubusercontent.com/flannel-io/flannel/master/Documentation/kube-flannel.yml

vim kube-flannel.yml

net-conf.json: |
    {
      "Network": "192.168.0.0/16",
      "Backend": {
        "Type": "vxlan"
      }
    }
```

### 2. 安装 

```
/data1/kubernetes/bin/kubectl apply -f kube-flannel.yml
```

#### 如果安装失败 可能是 node 节点访问 k8s.gcr.io/pause:3.5 失败, 可按安装 docker 部分 4.1 步骤配置docker代理,并重启docker

#### 如果报错 Error validating CNI config list

```toml
# vim /etc/yum.repos.d/kubernetes.repo
[kubernetes]
name=Kubernetes
baseurl=https://mirrors.aliyun.com/kubernetes/yum/repos/kubernetes-el7-x86_64
enabled=1
gpgcheck=0
repo_gpgcheck=0
gpgkey=https://mirrors.aliyun.com/kubernetes/yum/doc/yum-key.gpg https://mirrors.aliyun.com/kubernetes/yum/doc/rpm-package-key.gpg

# yum install kubernetes-cni -y
```

#### 如果 Flannel 容器启动失败, 则可能是 <部署 kube-apiserver> 步骤中第2步的生成证书的 host 列表里没有指定 172.16.16.1 这个IP 

## 部署Dashboard和CoreDNS

### 1. 部署 CoreDNS  (先部署CoreDNS, 要不然IP会被占用)

```sh
# 1. 在这里下载 deploy.sh 和 coredns.yaml.sed 两个文件到 /home/lsne/coredns 目录
https://github.com/coredns/deployment/tree/master/kubernetes

# 2. 安装 

yum install jq
 
cd /home/lsne/coredns
export CLUSTER_DNS_SVC_IP="172.16.16.2"
export CLUSTER_DNS_DOMAIN="cluster.local"

./deploy.sh -i ${CLUSTER_DNS_SVC_IP} -d ${CLUSTER_DNS_DOMAIN} | kubectl apply -f -
```

### 2. 部署 Dashboard

```sh
# 1. 下载
wget https://raw.githubusercontent.com/kubernetes/dashboard/v2.6.0/aio/deploy/recommended.yaml

vim recommended.yaml
spec:
  ports:
    - port: 443
      targetPort: 8443
      nodePort: 30001
  type: NodePort
  selector:
    k8s-app: kubernetes-dashboard
    
# 2. 安装
kubectl apply -f recommended.yaml

# 3. 查看:
kubectl get pod -n kubernetes-dashboard
kubectl get pods,svc -n kubernetes-dashboard

# 4. 创建service account并绑定默认cluster-admin管理员集群角色：
kubectl create serviceaccount dashboard-admin -n kube-system
kubectl create clusterrolebinding dashboard-admin --clusterrole=cluster-admin --serviceaccount=kube-system:dashboard-admin
kubectl describe secrets -n kube-system $(kubectl -n kube-system get secret | awk '/dashboard-admin/{print $1}')

# 5. 访问:
访问地址：https://NodeIP:30001
会提示输入token, 这时将 4 步最后一个命令显示的 token 输入到页面
```

## 测试

```sh
kubectl create deployment nginx --image=nginx

kubectl expose deployment nginx --port=80 --type=NodePort

kubectl get deploy,svc,pod 
```


---

## 卸载

```sh
# 主节点
[root@myk8smaster01v lsne]# kubectl delete node --all

# 所有节点
[root@myk8smaster01v lsne]# systemctl stop kube-proxy
[root@myk8smaster01v lsne]# systemctl stop kubelet

// 所有主节点
[root@myk8smaster01v lsne]# systemctl stop kube-scheduler
[root@myk8smaster01v lsne]# systemctl stop kube-controller-manager
[root@myk8smaster01v lsne]# systemctl stop kube-apiserver

# 所有节点
[root@myk8snode02v lsne]# systemctl stop docker
[root@myk8snode02v lsne]# rm -rf ~/.kube/
[root@myk8snode02v lsne]# rm -rf /etc/kubernetes/
[root@myk8snode02v lsne]# rm -rf /etc/systemd/system/kubelet.service.d
[root@myk8snode02v lsne]# rm -rf /etc/systemd/system/kubelet.service
[root@myk8snode02v lsne]# rm -rf /usr/bin/kube*
[root@myk8snode02v lsne]# rm -rf /etc/cni
[root@myk8snode02v lsne]# rm -rf /opt/cni
[root@myk8snode02v lsne]# rm -rf /var/lib/etcd
[root@myk8snode02v lsne]# rm -rf /var/etcd

[root@myk8snode02v lsne]# yum remove docker-ce docker-ce-cli containerd.io

rm -rf /var/lib/cni/
rm -rf /var/lib/kubelet/
rm -rf /etc/cni/
ifconfig cni0 down
ifconfig flannel.1 down
ifconfig docker0 down
ip link delete cni0
ip link delete flannel.1

iptables -F

# 3. 清空etcd

查看 所有 key value
/usr/local/etcd35/bin/etcdctl --cacert=/data1/etcd15025/cert/ca.pem --cert=/data1/etcd15025/cert/etcd-client.pem --key=/data1/etcd15025/cert/etcd-client-key.pem --endpoints=https://10.46.20.100:15025 get "" --from-key

查看 所有 key  不看value
/usr/local/etcd35/bin/etcdctl --cacert=/data1/etcd15025/cert/ca.pem --cert=/data1/etcd15025/cert/etcd-client.pem --key=/data1/etcd15025/cert/etcd-client-key.pem --endpoints=https://10.46.20.100:15025 get --prefix --keys-only ""

删除所有key 
/usr/local/etcd35/bin/etcdctl --cacert=/data1/etcd15025/cert/ca.pem --cert=/data1/etcd15025/cert/etcd-client.pem --key=/data1/etcd15025/cert/etcd-client-key.pem --endpoints=https://10.46.20.100:15025 del --prefix ""
```