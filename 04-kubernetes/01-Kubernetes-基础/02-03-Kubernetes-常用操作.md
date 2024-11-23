# Kubernetes 常用操作
### 格式
#### service 格式

```
<servicename>.<namespace>.svc.<clusterdomain>

示例:
postgresql-mypg01.testpg.svc.cluster.local
```

### 常用操作

####  在宿主机进入容器的数据目录

```sh
# 获取 pod 的 uid
kubectl get pod clickhouse-keeper-1 -n raindrop1 -o jsonpath='{.metadata.uid}'

# 然后在pod的宿主机上可以直接进pvc的数据目录
cd /var/lib/kubelet/pods/<pod-uid>/volumes/kubernetes.io~csi/<pvc-xxxx-xxx>/mount/
```
#### 1. 机器维护并驱逐机器上的pod

```sh
kubectl drain  <node_name> --delete-emptydir-data --ignore-daemonsets --force

# 完成后机器会处于: SchedulingDisabled 状态
```

#### 2. 取消机器的维护

```sh
kubectl uncordon <node_name>
```

#### 强制删除

```sh
# 1.5 以上版本
kubectl delete pods <pod> --grace-period=0 --force

# 1.4 以下版本
kubectl delete pods <pod> --grace-period=0


# 如果在这些命令后 Pod 仍处于 Unknown 状态，请使用以下命令从集群中删除 Pod:
kubectl patch pod <pod> -p '{"metadata":{"finalizers":null}}'
```

#### 强制删除 Terminating 命名空间(postgres-operator)

```sh


# 首先 - dump 对象为 json 文件
kubectl get namespace postgres-operator -o json > tmp.json

# 然后
# 删除 tmp.json 文件中的 spec.finalizers  和  status 
# 如果 spec 下只有 finalizers 一个属性, 则将 spec 部分直接删除

# 最后 - 通过 proxy 应用 json 文件
kubectl proxy
curl -k -H "Content-Type: application/json" -X PUT --data-binary @tmp.json http://127.0.0.1:8001/api/v1/namespaces/postgres-operator/finalize

```

#### 查看资源清单

```sh
kubectl api-resources   # 资源清单
kubectl api-versions    # 可用 api 版本
kubectl delete CustomResourceDefinition distributedredisclusters.redis.kun  # 删除一个资源
kubectl logs -f --tail=10 postgres-operator-74bcb97f87-gs2db -n testpg
```

#### 标签

```sh
# 1.  展示标签
kubectl get pods --show-labels

# 2.  展示指定标签redisRole的值
kubectl get pod -o wide -L redisRole

# 3.  只显示包含 redisRole 标签的 pod
kubectl get pod -o wide -l redisRole

# 4. 通过标签过滤pod
kubectl get pods --selector app=ai

#　5. 筛选多个标签值
kubectl get pods -l 'app in (a1,a2)' --show-labels

＃　6. 添加标签
kubectl label pod foo unhealthy=true

＃　7. 修改标签
kubectl label --overwrite pod foo status=unhealthy

＃ 8. 删除标
kubectl label pod foo bar-
```

### Deployment 操作命令

#### 1. `kubectl apply -f a.yaml` 即可以创建,也可以更新

```linux
vim a.yaml 直接修改后重新执行 apply, Deployment控制器可以直接更新
```

#### 2. 显示更新过程 -w
 
```sh
kubectl get pods -l app=myapp -w
```

#### 3. 查看 deployment 的滚动历史

```sh
kubectl rollout history deployment myapp-deploy
```
    
#### 4. 打补丁方式修改

```sh
kubectl patch deployment myapp-deploy -p '{"spec":{"replicas":5}}'
```
    
#### 5. set image 可以改容器版本,以及暂停更新过程

> 暂停是为了观察更新过程

```sh
kubectl set image deployment myapp-deploy myapp=ikubernetes/myapp:v3 && kubectl rollout pause deployment myapp-deploy
```

#### 6. 另一种监测更新过程

```sh
kubectl rollout status deployment myapp-deploy
```
    
#### 7. 结束暂停

```sh
kubectl rollout resume
```

#### 8. 回滚

```sh
kubectl rollout history deployment myapp-deploy
kubectl rollout undo deployment myapp-deploy --to-revision=1
```

### 用户与权限
#### 用户配置

```sh
kubectl config set-cluster mycluster --kubeconfig=/tmp/test.conf --server="https://172.20.0.70:6443" --certificate-authority="/etc/kubernetes/pki/ca.crt" --embed-certs=true
```

#### 使用新用户

```sh
kubectl config use-context magedu@kubernetes
```

#### 创建 Role 

```sh
kubectl create role pods-reader --verb=get,list,watch --resource=pods --dry-run -o yaml 
```

#### 创建 rolebinding

```sh
kubectl create rolebinding magedu-read-pods --role=pods-reader --user=magedu  --dry-run -o yaml 
```

#### 创建 Cluster Role 

```sh
kubectl create clusterrole cluster-reader --verb=get,list,watch --resource=pods --dry-run -o yaml 
```

```sh
kubectl get clusterrole
```
## 问题处理

#### 处理网络问题导致的k8s 异常

```sh
systemctl stop kubelet

systemctl stop docker

rm -rf /var/lib/cni/

rm -rf /var/lib/kubelet/

rm -rf /etc/cni/

ifconfig cni0 down

ifconfig flannel.1 down

ifconfig docker0 down

ip link delete cni0

ip link delete flannel.1
```