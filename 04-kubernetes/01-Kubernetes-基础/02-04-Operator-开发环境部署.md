

#### kubebuilder 

> kubebuilder 是写 operator 用的代码自动生成工具

#### code-generator 

> code-generator 是对自定义资源进行增删改查监听等各种操作的代码自动生成工具
#### operator-sdk 

> operator-sdk 可以用GO, ANSIBLE, HELM三种写operator,  其中go是调用 `kubebuilder` 实现的

#### 开发operator 用到的开源包

| 包 | 项目地址 | mod 地址 |说明|
| --- | --- | --- | --- |
|  kubebuilder |  https://github.com/kubernetes-sigs/kubebuilder | | operator 开发框架|
|  controller-tools |  https://github.com/kubernetes-sigs/controller-tools | | kubebuilder 子项目|
|  controller-runtime |  https://github.com/kubernetes-sigs/controller-runtime | sigs.k8s.io/controller-runtime v0.12.2 |  kubebuilder 自动引用
|  code-generator |  https://github.com/kubernetes/code-generator | | 只能生产自定义资源的客户端, 不能生产crd文件|
| apimachinery | https://github.com/kubernetes/apimachinery | k8s.io/apimachinery v0.24.2 |  kubebuilder 自动引用
| client-go | https://github.com/kubernetes/client-go | k8s.io/client-go v0.24.2 | k8s客户端, kubebuilder 自动引用
| ginkgo | https://github.com/onsi/ginkgo | github.com/onsi/ginkgo | 测试框架,kubebuilder 自动引用
| gomega | https://github.com/onsi/gomega | github.com/onsi/gomega | 匹配器/断言库 和 ginkgo 配合使用, kubebuilder 自动引用
| k8s-objectmatcher |https://github.com/banzaicloud/k8s-objectmatcher| k8s 资源对比库


### Operator 开发环境部署

#### operator-sdk 方式

> 不推荐使用了, 现在推荐直接使用 kubebuilder

```
operator-sdk init --domain='my.testrc' --repo='testrc-operator'

operator-sdk create api --group='myrc' --version='v1alpha1' --kind TestRC --resource --controller

## 如果 当前用户没有执行 docker 的权限, 需要: usermod -aG docker lsne

## 需要在Dockerfile 文件里 RUN go mod download 一行之前添加环境变量: ENV GOPROXY=https://goproxy.cn,direct

make docker-build docker-push IMG="mysite.com/testrc-operator:v0.0.1"


controller-gen crd paths=./... output:crd:dir=config/crd
```

---
### Operator 开发环境部署

#### 1. 下载安装 kubebuilder

```sh
https://github.com/kubernetes-sigs/kubebuilder/releases

chmod +x kubebuilder_linux_amd64

cp kubebuilder_linux_amd64 /usr/local/bin/kubebuilder
```


#### 2. 下载安装 kustomize

```sh
kustomize 是一个可定制化生成 Kubernetes YAML Configuration 文件的工具
https://github.com/kubernetes-sigs/kustomize/releases/download/kustomize/v3.8.7/kustomize_v3.8.7_linux_amd64.tar.gz

tar zxvf kustomize_v3.8.7_linux_amd64.tar.gz

cp kustomize ~/workspace/mydevelop/bin/
```

#### 3. 创建项目

```sh
mkdir -p ~/workspace/mydevelop

cd ~/workspace/mydevelop

[lsne@myserver01v mydevelop]$ kubebuilder init --domain='dba.lsne.cn' --repo='redis-operator'

[lsne@myserver01v mydevelop]$ kubebuilder create api --group='redis' --version='v1beta1' --kind='RedisReplica'
Create Resource [y/n]
y
Create Controller [y/n]
y

[lsne@myserver01v mydevelop]$ kubebuilder create api --group='redis' --version='v1beta1' --kind='RedisCluster'

[lsne@myserver01v mydevelop]$ kubebuilder create api --group='redis' --version='v1beta1' --kind='RedisReplicaBackup'

[lsne@myserver01v mydevelop]$ kubebuilder create api --group='redis' --version='v1beta1' --kind='RedisClusterBackup'
```

#### 4. Dockerfile 添加 GOPROXY 变量

```dockerfile
FROM golang:1.18 as builder

ENV GOPROXY=https://goproxy.cn,direct

WORKDIR /workspace
```

#### 5. 生成 crd.yaml 并安装到k8s集群

```sh
make manifests

make install
```


#### 6. 本地运行控制器

```sh
make run

使用自定义资源
kubectl apply -f config/samples/
```


#### 7. 将控制器打包成镜像, 在k8s里运行

```sh
make docker-build docker-push IMG='304034605/redis-cluster-operator:v0.0.1'

make deploy IMG='304034605/redis-cluster-operator:v0.0.1'

如果你遇到 RBAC 错误，你可能需要授予自己集群管理员权限或以管理员身份登录。请参考 在 GKE 集群 v1.11.x 及以上版本上使用 Kubernetes RBAC 的组件依赖 可能是你的情况。
```

#### 8. 卸载控制器

```sh
make undeploy
```

#### 9. 卸载CRD

```sh
make uninstall
```