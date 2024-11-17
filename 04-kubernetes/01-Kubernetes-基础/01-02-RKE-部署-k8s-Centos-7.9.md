## 环境准备

### 1. 设置 /etc/hosts

```shell
[root@dbuptest04v lsne]# cat /etc/hosts
127.0.0.1   localhost localhost.localdomain localhost4 localhost4.localdomain4
::1         localhost localhost.localdomain localhost6 localhost6.localdomain6
10.252.177.231 master01
10.252.177.230 master02
10.252.177.229 master03
10.252.177.232 node01
10.252.177.233 node02
10.252.177.235 node03
10.252.177.234 node04
10.249.104.178 node05
10.249.104.177 node06
10.249.104.179 node07
10.249.162.132 lxs3.b.lsne.cn     
10.249.34.55 ecr-sh.yun.lsne.cn
10.249.104.94 mirrors.yun.lsne.cn
```

### 2. 加载模块, 开启转发

```shell
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


## 安装docker

### 1. 卸载旧版本

```shell
yum remove docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-engine docker-ce

rm -rf /var/lib/docker
rm -rf /var/lib/containerd
```

### 2. 安装必备软件

```shell
yum install -y yum-utils device-mapper-persistent-data lvm2
```

### 3. 设置yum源

```shell
yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
```

### 4. 安装 docker

```shell
#查看可用版本
yum list docker-ce --showduplicates | sort -r

#安装18.09.1的版本，安装其他版本照套格式就行
yum install docker-ce-18.09.1 docker-ce-cli-18.09.1 containerd.io

#安装20.10.17版本, 因为之前安装了一次最新版本(20.10.21) 导致 rke执行失败(/var/run/docker.sock 改到了 /run/containerd/containerd.sock 但手动配置 rke文件也不行)
yum install -y containerd.io-1.6.6 docker-ce-20.10.17 docker-ce-cli-20.10.17 # 20.10.17 是 kubernetes v1.25 支持的版本; v20.10.12 是 kubernetes v1.24 支持的版本

# 安装最新版本
# yum install -y docker-ce docker-ce-cli containerd.io    

mkdir -p /data1/docker
mkdir -p /etc/docker 

cat /etc/docker/daemon.json  
{
  "data-root": "/data1/docker"
}

```

### 4.1 配置代理

```shell
cat /etc/systemd/system/docker.service.d/http-proxy.conf
[Service]
Environment="HTTP_PROXY=http://static-proxy.g0.lsne.cn:3128"
Environment="HTTPS_PROXY=http://static-proxy.g0.lsne.cn:3128"
Environment="NO_PROXY=localhost,127.0.0.1,lsne.cn,127.0.0.0/8,10.0.0.0/8,172.17.0.0/16,192.168.0.0/16"
```

### 5. 重启docker

```shell
systemctl daemon-reload
systemctl restart docker.service
```


## 创建用户, 并添加docker组

```shell
# useradd lsne  #--如果用户存在就不用创建了

# usermod -aG docker lsne

# chown :docker /var/run/docker.sock
```

## 设置控制机到各部署节点的免密(包括自己到自己)

```shell
# ssh-keygen
//将所生成的密钥的公钥分发到各个节点
# ssh-copy-id lsne@master01
# ssh-copy-id lsne@master02
# ssh-copy-id lsne@master03
# ssh-copy-id lsne@node01
# ssh-copy-id lsne@node02
# ssh-copy-id lsne@node03
# ssh-copy-id lsne@node04
# ssh-copy-id lsne@node05
# ssh-copy-id lsne@node06
# ssh-copy-id lsne@node07
```

## 用rke 部署k8s集群

### 1. 下载rke

```shell
mkdir -p /home/lsne/rke
wget https://github.com/rancher/rke/releases/download/v1.3.12/rke_linux-amd64
mv rke_linux-amd64 rke
chmod a+x rke
```

### 2. 配置cluster.yml

> 有一种方法,执行: rke config --name cluster.yml ,然后一步步填写信息, 不采用

#### 第二种是直接编辑配置文件

```yaml
vim cluster.yml
nodes:
  - address: 10.252.177.231
    hostname_override: master01
    user: lsne
    # docker_socket: /run/containerd/containerd.sock
    role:
      - controlplane
      - worker
  - address: 10.252.177.230
    hostname_override: master02
    user: lsne
    # docker_socket: /run/containerd/containerd.sock
    role:
      - controlplane
      - worker
  - address: 10.252.177.229
    hostname_override: master03
    user: lsne
    # docker_socket: /run/containerd/containerd.sock
    role:
      - controlplane
      - worker
  - address: 10.252.177.232
    hostname_override: node01
    user: lsne
    # docker_socket: /run/containerd/containerd.sock
    role:
      - worker
  - address: 10.252.177.233
    hostname_override: node02
    user: lsne
    # docker_socket: /run/containerd/containerd.sock
    role:
      - worker
  - address: 10.252.177.235
    hostname_override: node03
    user: lsne
    # docker_socket: /run/containerd/containerd.sock
    role:
      - worker
  - address: 10.252.177.234
    hostname_override: node04
    user: lsne
    # docker_socket: /run/containerd/containerd.sock
    role:
      - worker
  - address: 10.249.104.178
    hostname_override: node05
    user: lsne
    # docker_socket: /run/containerd/containerd.sock
    role:
      - worker
  - address: 10.249.104.177
    hostname_override: node06
    user: lsne
    # docker_socket: /run/containerd/containerd.sock
    role:
      - worker
  - address: 10.249.104.179
    hostname_override: node07
    user: lsne
    # docker_socket: /run/containerd/containerd.sock
    role:
      - worker
network:
  plugin: flannel
enable_cri_dockerd: true
monitoring:
  provider: none
# kubernetes_version: v1.22.10-rancher1-1
#private_registries:
#     - url: ecr-sh.yun.lsne.cn/lsne-x86_64
#       is_default: true
services:
  kube-api:
     service_cluster_ip_range: 172.172.0.0/16
  kube-controller:
    cluster_cidr: 192.168.0.0/16
    service_cluster_ip_range: 172.172.0.0/16
    extra_args:
      v: 4
      cluster-signing-cert-file: "/etc/kubernetes/ssl/kube-ca.pem"
      cluster-signing-key-file: "/etc/kubernetes/ssl/kube-ca-key.pem"
  kubelet:
    cluster_dns_server: 172.172.0.2
    extra_binds:
      - "/home/minio:/home/minio"
      - "/var/minio:/var/minio"
  scheduler:
    extra_args:
      v: 2
  etcd:
    path: /data1/etcd
    external_urls:
      - https://etcd15025a.yun.lsne.cn:15025,https://etcd15025b.yun.lsne.cn:15025,https://etcd15025c.yun.lsne.cn:15025
    ca_cert: |-
      -----BEGIN CERTIFICATE-----
      MIIDojCCAoqgAwIBAgIUN+uQ59Jql2U6vzxAhMZDMckhaHswDQYJKoZIhvcNAQEL
      BQAwaTELMAkGA1UEBhMCQ04xEDAOBgNVBAgTB0JlaWppbmcxEDAOBgNVBAcTB0Jl
      aWppbmcxEzARBgNVBAoTCmxzazhzLWV0Y2QxDzANBgNVBAsTBlN5c3RlbTEQMA4G
      A1UEAxMHZXRjZCBDQTAeFw0yMjA3MTkwNjQ1MDBaFw0yNzA3MTgwNjQ1MDBaMGkx
      CzAJBgNVBAYTAkNOMRAwDgYDVQQIEwdCZWlqaW5nMRAwDgYDVQQHEwdCZWlqaW5n
      MRMwEQYDVQQKEwpsc2s4cy1ldGNkMQ8wDQYDVQQLEwZTeXN0ZW0xEDAOBgNVBAMT
      B2V0Y28273465783467826347823642374672827346578346782634782364237
      EiyZF15T49/YmfVsUgEn3gzbGqsLz1P5nMxdSy+FzU1RLE1Ml4srg3BH7BrpDHlV
      SuAF4UBUiErpatCu1rzyqzy6pXdeLVb/EKEkzTsCBBtGHXB0ierlBzZSj65ab7SQ
      VFDTo1fP9ehznynJO+UDtPCZayn8PMp4tUozzzOrP0sTs9VR8s1YVqTsqo8shhJd
      DnTqpZa0dg2Y2mrly9nG0BAJeH10kWeOwko0Hzdnebx2dI/pknFLhyMuTUxU6xj0
      FLfZnPhfyC9OmOqGaRP9lmERaeVfKPTCT9676TwsBAMqKB4TDxgUKiLb72v5lzeq
      MjzXE/ro4iPBAgMBAAGjQjBAMA4GA1UdDwEB/wQEAwIBBjAPBgNVHRMBAf8EBTAD
      AQH/MB0GA1UdDgQWBBTVKfqcFzUdDtLT6hLGr0luwe8B5DANBgkqhkiG9w0BAQsF
      AAOCAQEAn0cINqTUredXZwE92Rg+iUKwqHYAxCYl4Xa/FuVD0ccllQ1GKQtfQomL
      /QMAN7n3CvTrqhN1K7vjGYf9CynC10NUz0mbeW3/A9vi5g4G44SAmb36rYG4UPIG
      kYZ4W7o3WrxdOhCBb30lqHrpk8QFe6bhwgX/l/gP07B2BhCcPwZ5XextCM1bfUhK
      KKHQSzlD1FjqwF7cAEFSifbZuVYrjELGPYaXSPZSaekE4gh/RT30mcFHhrOqxTVo
      dbwKjajW6q6QJ5c8+Nxx1eXlyJi4/A1sw96h1g6BMTfRz+QT6XK4h7BqQidNCBA7
      VEINJTBhEnuAlbzp9Wk7RemDuOPaNw==
      -----END CERTIFICATE-----
    cert: |-
      -----BEGIN CERTIFICATE-----
      MIID2TCCAsGgAwIBAgIUWCltj+rDfESjHtEo5MrpJNkeDoAwDQYJKoZIhvcNAQEL
      BQAwaTELMAkGA1UEBhMCQ04xEDAOBgNVBAgTB0JlaWppbmcxEDAOBgNVBAcTB0Jl
      aWppbmcxEzARBgNVBAoTCmxzazhzLWV0Y2QxDzANBgNVBAsTBlN5c3RlbTEQMA4G
      A1UEAxMHZXRjZCBDQTAgFw0yMjA3MTkwOTAyMDBaGA8yMTIyMDYyNTA5MDIwMFow
      azELMAkGA1UEBhMCQ04xEDAOBgNVBAgTB0JlaWppbmcxEDAOBgNVBAcTB0JlaWpp
      bmcxDTALBgNVBAoTBGV0Y2QxDzANBgNVBAsTBlN5c3RlbTEYMBYGA1UEAxMPbHNr
      OHMtZXR82734657834678263478236423746728AMIIBCgKCAQEAlrYFawdasdff
      afTzMXOtMADWdDdPmNqp9BgTg9K4sVKpsvtUFzigRU7ThZIhxzJrZu4QFIjNEXpY
      +ZROD0ai8vAhbEEf4zQWftlmGnSwGy3bjRhiBzk6mV2C5q9HU03h8TlpbGKLV8dT
      G98aWgD1uU6rBPxHwUC1jPs2gINGXRSQASqIbCKHwKXSM1HtF/AzY9RqtBQ461s8
      5FE5v4PZbEcHrUautwwH87Qa2TBANQGSMdySBPmNuqEYZ2c09elpjSOcHr/F4bmc
      Q7q/0N92nRdQ7JsR+6gBz3zMpsy1xiTz+jlh6k+0nKrN0vl+Nj6k08ZETsSCUmGC
      e0GOThfWX5kR46eshwIDAQABo3UwczAOBgNVHQ8BAf8EBAMCBaAwEwYDVR0lBAww
      CgYIKwYBBQUHAwIwDAYDVR0TAQH/BAIwADAdBgNVHQ4EFgQUv4poIWSgIS2lJyLz
      CMz+C9qmJ8cwHwYDVR0jBBgwFoAU1Sn6nBc1HQ7S0+oSxq9JbsHvAeQwDQYJKoZI
      hvcNAQELBQADggEBAFmQ91yq9AhjPMl4r+B/J2ylSalCkocbqs8Euf4cNndurnAz
      CuQj8AWGmslmhRbvdfUpdVImV8BQg/TNSEDZMUvRxUR08vVYH3OVTWmI+AwOF27F
      fHIsF6uJOvjO2DrWbJomOt9RaHnFa+HVIQ/k56VOg+/vvupTlqgtelQGB7u6NLTG
      fW5pecqQFo+PadWDTHUiua+AbgOkT1z5Sq50URRG4oOr/j+rtjM8Yvvr2UNWEln8
      fjtc3ESj/UXReIf2xP2orTNY7q3cWQ6Cv4hLItDNIGkzN1SDMngPLJOAJPn16Jk5
      z5Bjs/rV/xYxbs102LquUZ0cxrWzwFaEobmoj40=
      -----END CERTIFICATE-----
    key: |-
      -----BEGIN RSA PRIVATE KEY-----
      MIIEpAIBAAKCAQEAlrYFafTzMXOtMADWdDdPmNqp9BgTg9K4sVKpsvtUFzigRU7T
      hZIhxzJrZu4QFIjNEXpY+ZROD0ai8vAhbEEf4zQWftlmGnSwGy3bjRhiBzk6mV2C
      5q9HU03h8TlpbGKLV8dTG98aWgD1uU6rBPxHwUC1jPs2gINGXRSQASqIbCKHwKXS
      M1HtF/AzY9RqtBQ461s85FE5v4PZbEcHrUautwwH87Qa2TBANQGSMdySBPmNuqEY
      Z2c09elpjSOcHr/F4bmcQ7q/0N92nRdQ7JsR+6gBz3zMpsy1xiTz+jlh6k+0nKrN
      0vl+Nj6k08ZETsSCUmGCe0GOThfWX5kR46eshwIDAQABAoIBAGBl9tqKKg/EfM9K
      ieF2C3yqyLBvw8273465783467826347823642374672iBOKWRjH2Cdze+Z7ePjJ
      LaevlDTgeU8TwSJE5uvLjjYWlYUnTtsQHA1vqcCX/WAtJ8iC07wGq5sVPia5nHK1
      5d/fegobWMTfXkIfNZ+N6npEeVQoWrRs2oATeEoOXSk6EmRNZrl+jOrTX7MdcRKB
      DQa1Ym2gCZPHlLxVhxywiq8hqm0YwzsFwIkpxeB8LWp7ijZaJc8ue1JTMGvUEz8f
      yLu0VW0js7ScEB7vG7OaA+xkT/WBIynZJLjHpyjFSIsCTwCeudDwdXMmEd1vCCLw
      X1jElUECgYEAwDTZbR/q1r9gTOnVIrPGkmOMvRRv3TBzu71CNtENQaIJh9zgTIkY
      xHTJ+atOYuuu4IFCekpljAp1mPWguLVIgEyNiNZrMUWHbpqUF8UvO+uf3f02Ug7H
      TIrrPmYg64p49yjgjQqPMvwzX+kGEeceupZ5lv7wPu5BME2MdlNo8KcCgYEAyLtx
      I11e/LYqnTaTBkZzJC1H2WlwgC2Wh70KLkGd2VpxlfKCCsK4BAvAOD0AGED/lTG9
      9osdNVY3BSOAr4DEoN5NSfOc9vyEHHxEmlBJ+mPvcCBsDpddxQP1atzfFbhBcBB1
      Itc0QNR7TO14I+BwnbByjxhP4xTpgPI11ApQASECgYAtWksTnLxk/7NRcrt//LuW
      PzcuRmw+3PfyDK5bEOj326w0CsJCTPczI/ukle9hGAujndx5zqQ3byBgf1T1QJFi
      9K1Q5IdWkPlr972J/lUu5mJKlz0CD8qnHQB1MNQDwCDa8SJLJXq0pR3aO7na75Yo
      oOj/4BgAQWfQZfwGz5ercQKBgQCUr0L+jwrs5YJrMSF2ZHilM2UlBZTvXNVDdiM0
      YCYr+XJpP1hT4Cet14ZqIcUQMhUezdmH5UOdXl8iz0litl7vSbq2LFz4FdNFxkaK
      hy5E6gFRbLKdnEE4zdXbcf9Md08BUy9wvzdVTg6GzN9Qs862/xvcIoYKDlNn0AFP
      LtRUAQKBgQCHh7PjEBh6GhVD8qWn7RxyVW74B2Ac0XKvVIUmsmSVU03dM4c0REkv
      ownB9yI9K0CZbrAjOL8/OY7QXEYEbdlxcFoMRSlWAg0SlPYHoYeJoj9PSoEXG6gh
      5qKPkMutVGQJPlowvcRI4iiUX5wP8j98hzRKdEwwh5K4NPAdQAWvsQ==
      -----END RSA PRIVATE KEY-----
```

### 3. 运行 rke 安装k8s

```shell
./rke --debug up --config cluster.yml

注1: 有时候资源准备比较慢，导致安装失败, 可以多次重复执行 ./rke up 命令试试

注2: 可提前在所有机器上下载镜像
docker image  pull rancher/rke-tools:v0.1.80
docker image  pull rancher/hyperkube:v1.22.10-rancher1
...
```

### 4. 查看集群状态

```shell
root# wget https://storage.googleapis.com/kubernetes-release/release/v1.22.10/bin/linux/amd64/kubectl
root# chmod +x kubectl
root# sudo su
root# mv kubectl /usr/local/bin/
root# mkdir root/.kube
root# cp kube_config_cluster.yml /root/.kube/config
root# exit
lsne> mkdir /home/lsne/.kube
lsne> cp kube_config_cluster.yml /home/lsne/.kube/config

kubectl get cs
kubectl get nodes
```

---
### 宿主机访问 k8s service 服务
```shell
# 1. 查看 k8s dns clusterIP 
lsne@myk8smaster01v:~/workspace/postgres$ kubectl get svc -n kube-system
NAME       TYPE        CLUSTER-IP    EXTERNAL-IP   PORT(S)                  AGE
kube-dns   ClusterIP   172.172.0.2   <none>        53/UDP,53/TCP,9153/TCP   38h

# 2. 将 CLUSTER-IP 配置到 /etc/resolv.conf
sudo echo "nameserver 172.172.0.2" >> /etc/resolv.conf
```


---
### 卸载

```shell
./rke remove --config cluster.yml
```