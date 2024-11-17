
## 1. 加载模块, 开启转发

```
lsmod | grep "br_netfilter"
modprobe  br_netfilter

// 如果想删除模块, 可以用 -r 参数
# modprobe -r raid1 

vim /etc/sysctl.conf
net.ipv4.ip_forward = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1

生效
sysctl -p /etc/sysctl.conf
```


## 手动拉去镜像

> 在每个节点安装完成之后, 如果长时间启动不成功, 可以使用以下命令进行手动拉去镜像文件

```
# master 节点需要包括 agent 部分在内的所有 image 
docker.io/rancher/hardened-cluster-autoscaler:v1.8.5-build20211119
docker.io/rancher/hardened-cluster-autoscaler@sha256:7cc3ec1030240a8b69d1185611c1f89cf357cddae642e8cc082e1a49ebc3611d
docker.io/rancher/hardened-coredns:v1.9.3-build20220613
docker.io/rancher/hardened-coredns@sha256:0ff19d19385acdfad644792531ac4c108c73cf021c755b08b7c6dfbef053a043
docker.io/rancher/hardened-etcd:v3.5.4-k3s1-build20220504
docker.io/rancher/hardened-etcd@sha256:146775f007a4b322485a7f1705424c2c799a4fccc1451484edecbdba0d07847f
docker.io/rancher/hardened-flannel:v0.19.1-build20220810
docker.io/rancher/hardened-flannel@sha256:1b6833d5a6b680e0c27f017ec9901d7e7e882394595aee30b55e7dc500e1aa7e
docker.io/rancher/hardened-k8s-metrics-server:v0.5.0-build20211119
docker.io/rancher/hardened-k8s-metrics-server@sha256:2aeab35db572d3e6b769a0991c2d2b332c0acee2898b799ab3169ee62208bc89
docker.io/rancher/klipper-helm:v0.7.3-build20220613
docker.io/rancher/klipper-helm@sha256:6a8e819402e3fdd5ff9ec576174b6c0013870b9c0627a05fa0ab17374b5cf189
docker.io/rancher/mirrored-ingress-nginx-kube-webhook-certgen:v1.1.1
docker.io/rancher/mirrored-ingress-nginx-kube-webhook-certgen@sha256:28197903d736aae74cbb1fa9e0ccbd11129395f0f65ad94281cc7fdfec020b25
docker.io/rancher/rke2-cloud-provider:v0.0.3-build20211118
docker.io/rancher/rke2-cloud-provider@sha256:a3fe814abb2f4cdb41583a5175453ec63667cce9e653a7b1a821d2c96a278c52


# agent 节点只需要以下 image
docker.io/rancher/hardened-calico:v3.24.1-build20221011
docker.io/rancher/hardened-calico@sha256:844c5e91732879b91a022c4000ac3ada05e7e7d91e3c163d0bb4b8488d48c303
docker.io/rancher/nginx-ingress-controller:nginx-1.2.1-hardened7
docker.io/rancher/nginx-ingress-controller@sha256:4ca60e6a08b47ea52befdb3ff4c34aff8bb332ee228f8ed8066198cf1ca7eb77
docker.io/rancher/hardened-kubernetes:v1.22.17-rke2r1-build20221208
docker.io/rancher/hardened-kubernetes@sha256:0894e6d4298d94581a1c73fa5c31fa5e4c9d49dc7b3660972b6ef1c909e135db
docker.io/rancher/pause:3.6
docker.io/rancher/pause@sha256:036d575e82945c112ef84e4585caff3648322a2f9ed4c3a6ce409dd10abc4f34
```


## 安装 rke2

### 第一个 master 节点安装

#### 编辑配置文件

> 编辑配置文件: `/etc/rancher/rke2/config.yaml` 
> 该文件中好多参数是后来添加的, 没有手动验证, 不确定安装其他节点的时候需要不需要保持一致
> 暂时先不改后面其他节点的配置模板了

```yaml
# 禁用 Control Plane 组件, 只安装 etcd
# disable-apiserver: true
# disable-controller-manager: true
# disable-scheduler: true

# 禁用 etcd，只安装 Control Plane 组件
# disable-etcd: true

# 这个最好别用, 用也不能用 /run/目录。 这个目录重启会清理
# container-runtime-endpoint: /run/containerd/containerd.sock   # 设置 sock 路径, 或者用环境变量代替。 

# 为了避免固定注册地址的证书错误，你应该在启动服务器时设置 tls-san 参数。这个选项在服务器的 TLS 证书中增加了一个额外的主机名或 IP 作为主题替代名，如果你想通过 IP 和主机名访问，可以将其指定为一个列表。
# tls-san:
#   - my-kubernetes-domain.com
#   - 192.168.1.2
#   - another-kubernetes-domain.com

debug: false
token: iabsdg3248ugh9iu23987buoisdrg98023iubasdf8g7v2
write-kubeconfig-mode: "0644"
system-default-registry: "registry.cn-hangzhou.aliyuncs.com" # 表示使用国内镜像
data-dir: "/var/lib/rancher/rke2"   # 指定数据目录, 默认: "/var/lib/rancher/rke2"
cluster-cidr: "10.42.0.0/16"   # pod 使用的IP段
service-cidr: "10.43.0.0/16"   # service 使用的IP段
service-node-port-range: "30000-32767"  # NodePort 类型的 service 可用的端口范围, 默认: "30000-32767"
cluster-dns: "10.43.0.10"     # dns 地址, 默认: 10.43.0.10
cluster-domain: "cluster.local"  # 集群名, 默认: "cluster.local"
node-name: master01
node-label:
  - "node=master01"
  - "something=amazing"
```

#### 安装并启动

```
curl -sfL https://rancher-mirror.rancher.cn/rke2/install.sh | INSTALL_RKE2_MIRROR=cn INSTALL_RKE2_VERSION="v1.22.17+rke2r1" INSTALL_RKE2_TYPE="server" INSTALL_RKE2_METHOD="tar" sh -

# 卸载
rke2-uninstall.sh 
```

#### 启动

```
systemctl enable rke2-server.service

systemctl start rke2-server.service
```

#### 设置k8s配置

```
mkdir ~/.kube
cat /etc/rancher/rke2/rke2.yaml > ~/.kube/config
```

#### 设置 PATH

```
vim /etc/bashrc
export CONTAINERD_ADDRESS=/run/k3s/containerd/containerd.sock
export CONTAINERD_NAMESPACE=k8s.io
export PATH=/var/lib/rancher/rke2/bin:$PATH

source /etc/bashrc
```

#### 查看效果

```
kubectl get nodes
```

#### 设置代理

> server 节点改 server, agent 节点改agent, 两个都改也没问题: 
> `vim /usr/local/lib/systemd/system/rke2-server.env`
> `vim /usr/local/lib/systemd/system/rke2-agent.env`

```
# 添加
HTTP_PROXY=http://static-proxy.g0.lsne.cn:3128
HTTPS_PROXY=http://static-proxy.g0.lsne.cn:3128
NO_PROXY=localhost,127.0.0.1,lsne.cn,127.0.0.0/8,10.0.0.0/8,100.65.0.0/16,100.64.0.0/16
```

#### 必要时, 还需要设置 linux 系统变量代理

```
export http_proxy=http://proxy.lsne.cn:3128
export https_proxy=http://proxy.lsne.cn:3128
```

#### 登录 docker.io 仓库

> 路径1: 
> `mkdir /var/lib/rancher/rke2/server/etc/containerd;` 
>  `vim /var/lib/rancher/rke2/server/etc/containerd/config.toml`
>  路径2: 
>  `mkdir /var/lib/rancher/rke2/agent/etc/containerd;`
>   `vim /var/lib/rancher/rke2/agent/etc/containerd/config.toml

```toml
[plugins.opt]
  path = "/var/lib/rancher/rke2/server/containerd"

[plugins.cri]
  stream_server_address = "127.0.0.1"
  stream_server_port = "10020"
  enable_selinux = false
  sandbox_image = "index.docker.io/rancher/pause:3.6"

[plugins.cri.containerd]
  snapshotter = "overlayfs"
  disable_snapshot_annotations = true

[plugins.cri.containerd.runtimes.runc]
  runtime_type = "io.containerd.runc.v2"

[plugins.cri.registry.mirrors]

[plugins.cri.registry.mirrors."*"]
  endpoint = ["http://docker.io"]

[plugins.cri.registry.configs."docker.io".auth]
  username = "304034605"
  password = "123456"
```

#### 重启 server/agent 服务

```
systemctl restart rke2-server.service

# 或

systemctl restart rke2-agent.service
```

##### 10. 未手动指定 token, 在添加其他节点时可以看这里
```
cat /var/lib/rancher/rke2/server/node-token
```

### 第二个, 第三个 master 节点安装

#### 编辑配置文件: 

> `mkdir -p /etc/rancher/rke2/ && vim /etc/rancher/rke2/config.yaml`

```
# 禁用 Control Plane 组件, 只安装 etcd
# disable-apiserver: true
# disable-controller-manager: true
# disable-scheduler: true

# 禁用 etcd，只安装 Control Plane 组件
# disable-etcd: true

# 这个最好别用, 用也不能用 /run/目录。 这个目录重启会清理
# container-runtime-endpoint: /run/containerd/containerd.sock   # 设置 sock 路径, 或者用环境变量代替。 

# 为了避免固定注册地址的证书错误，你应该在启动服务器时设置 tls-san 参数。这个选项在服务器的 TLS 证书中增加了一个额外的主机名或 IP 作为主题替代名，如果你想通过 IP 和主机名访问，可以将其指定为一个列表。
# tls-san:
#   - my-kubernetes-domain.com
#   - 192.168.1.2
#   - another-kubernetes-domain.com

debug: false
token: iabsdg3248ugh9iu23987buoisdrg98023iubasdf8g7v2    # 和第一个节点需要一致
server: https://10.52.76.165:9345                        # 第一个节点的IP地下和端口
write-kubeconfig-mode: "0644"
system-default-registry: "registry.cn-hangzhou.aliyuncs.com" # 表示使用国内镜像
node-name: master02                                      # 每个节点 node-name 唯一
node-label:
  - "node=master02"
  - "something=amazing"
```

#### 根据<第一个 master 节点安装>中的 2 ~ 9 小步进行安装启动 

#### 可以用以下命令手动拉取镜像

```
/var/lib/rancher/rke2/bin/ctr -a /run/k3s/containerd/containerd.sock image pull docker.io/library/busybox:latest
```

### agent 节点安装

#### 编辑配置文件: 

> `mkdir -p /etc/rancher/rke2/ && vim /etc/rancher/rke2/config.yaml`

```
# 这个最好别用, 用也不能用 /run/目录。 这个目录重启会清理
# container-runtime-endpoint: /run/containerd/containerd.sock   # 设置 sock 路径, 或者用环境变量代替。 

# 为了避免固定注册地址的证书错误，你应该在启动服务器时设置 tls-san 参数。这个选项在服务器的 TLS 证书中增加了一个额外的主机名或 IP 作为主题替代名，如果你想通过 IP 和主机名访问，可以将其指定为一个列表。
# tls-san:
#   - my-kubernetes-domain.com
#   - 192.168.1.2
#   - another-kubernetes-domain.com

debug: false
token: iabsdg3248ugh9iu23987buoisdrg98023iubasdf8g7v2    # 和第一个节点需要一致
server: https://10.52.76.165:9345                        # 第一个节点的IP地下和端口
write-kubeconfig-mode: "0644"
system-default-registry: "registry.cn-hangzhou.aliyuncs.com" # 表示使用国内镜像
node-name: node01                                      # 每个节点 node-name 唯一
node-label:
  - "node=node01"
  - "something=amazing"
```

#### 安装

```
curl -sfL https://rancher-mirror.rancher.cn/rke2/install.sh | INSTALL_RKE2_MIRROR=cn INSTALL_RKE2_VERSION="v1.22.17+rke2r1" INSTALL_RKE2_TYPE="agent" INSTALL_RKE2_METHOD="tar" sh -
```

#### 启动

```
systemctl enable rke2-agent.service

systemctl start rke2-agent.service
```

#### 根据 <第一个 master 节点安装> 中的 4 ~ 9 小步进行配置