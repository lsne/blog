# cloudnative-pg

## 准备

为了方便, 后续 cloudnative-pg 会经常简写为: cnpg

[cnpg github 地址](https://github.com/cloudnative-pg/cloudnative-pg)
[cnpg helm github 地址](https://github.com/cloudnative-pg/charts)

#### image

```
operator: ghcr.io/cloudnative-pg/cloudnative-pg:1.23.3
postgreSQL: ghcr.io/cloudnative-pg/postgresql:16.3
```

#### kubectl 插件

```
https://github.com/cloudnative-pg/cloudnative-pg/releases/download/v1.23.4/kubectl-cnpg_1.23.4_linux_x86_64.tar.gz
```

## 安装部署 cloudnative-pg 环境

### 安装 kubectl cnpg 插件

1. 下载插件

```sh
wget https://github.com/cloudnative-pg/cloudnative-pg/releases/download/v1.23.4/kubectl-cnpg_1.23.4_linux_x86_64.tar.gz
```

2. 解压, 并将二进制文件 `kubectl-cnpg` 复制到 PATH 路径下

```sh
tar zxvf kubectl-cnpg_1.23.4_linux_x86_64.tar.gz
cp kubectl-cnpg /usr/bin/
```

3. 测试
```sh
kubectl cnpg --help
```

### 安装 operator

>  kubectl 安装

1. 下载 yaml 文件

```sh
wget https://raw.githubusercontent.com/cloudnative-pg/cloudnative-pg/release-1.23/releases/cnpg-1.23.3.yaml
```

2. 安装 operator

```sh
kubectl apply --server-side -f cnpg-1.23.3.yaml
```

> helm 安装

1. 下载 helm charts 包文件

```sh
wget https://github.com/cloudnative-pg/charts/releases/download/cloudnative-pg-v0.21.6/cloudnative-pg-0.21.6.tgz
```

2. 创建 values.yaml

[values.yaml](https://github.com/cloudnative-pg/charts/blob/main/charts/cloudnative-pg/values.yaml)

```yaml
# vim values.yaml

replicaCount: 1

image:
  repository: ghcr.io/cloudnative-pg/cloudnative-pg
  pullPolicy: IfNotPresent
  # -- Overrides the image tag whose default is the chart appVersion.
  tag: "1.23.3"

imagePullSecrets: []
nameOverride: ""
fullnameOverride: ""

hostNetwork: false
dnsPolicy: ""

crds:
  # -- Specifies whether the CRDs should be created when installing the chart.
  create: true
```

3. 安装 operator

```sh
# 格式:
helm upgrade --install <自定义资源名称> <chart包路径> --namespace <名称空间> --create-namespace -f <参数文件>
# 示例:
helm upgrade --install cnpg-operator cloudnative-pg-0.21.6.tgz --namespace cnpg-system --create-namespace -f values.yaml
```

4. 查看效果

```sh
kubectl get pod -n cnpg-system
NAME                                            READY   STATUS    RESTARTS   AGE
cnpg-operator-cloudnative-pg-6498f85c6b-69czn   1/1     Running   0          32s
```

