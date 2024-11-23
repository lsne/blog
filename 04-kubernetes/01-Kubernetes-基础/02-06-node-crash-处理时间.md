# node crash 处理
## 处理时间

```
在默认配置下，k8s节点故障时，工作负载的调度周期约为6分钟，

参数概念：

node-monitor-period    节点控制器(node controller) 检查每个节点的间隔，默认5秒。
node-monitor-grace-period    节点控制器判断节点故障的时间窗口, 默认40秒。即40 秒没有收到节点消息则判断节点为故障。
pod-eviction-timeout    当节点故障时，kubelet允许pod在此故障节点的保留时间，默认300秒。即当节点故障5分钟后，kubelet开始在其他可用节点重建pod。

5+40+300 ≈ 6分钟

```

```
kubernetes节点失效后pod的调度过程：
0、Master每隔一段时间和node联系一次，判定node是否失联，这个时间周期配置项为 node-monitor-period ，默认5s

1、当node失联后一段时间后，kubernetes判定node为notready状态，这段时长的配置项为 node-monitor-grace-period ，默认40s

2、当node失联后一段时间后，kubernetes判定node为unhealthy，这段时长的配置项为 node-startup-grace-period ，默认1m0s

3、当node失联后一段时间后，kubernetes开始删除原node上的pod，这段时长配置项为 pod-eviction-timeout ，默认5m0s

```

## 调整处理时间

### 1. 调整k8s组件配置参数

```
vim /etc/kubernetes/manifests/kube-controller-manager.yaml
--node-monitor-grace-period=30s
--node-monitor-period-5s
--pod-eviction-timeout=30s
--node-startup-grace-period=1m0s

设置pods漂移时间
vim /etc/kubernetes/manifests/kube-apiserver.yaml
--default-not-ready-toleration-seconds=30
--default-unreachable-toleration-seconds=30
```

### 2. 调整POD对污点的容忍时长

```
1. vim /etc/kubernetes/manifests/kube-apiserver.yaml
--default-not-ready-toleration-seconds=30
--default-unreachable-toleration-seconds=30

systemctl restart kube-apiserver


spec:
  template:
    spec:
      tolerations:
      # 调整 Pod 对污点 Unreachable:NoExecute 的容忍时长为 100s
      - key: "node.kubernetes.io/unreachable"
        operator: "Exists"
        effect: "NoExecute"
        tolerationSeconds: 100
      # 调整 Pod 对污点 NoteReady:NoExecute 的容忍时长为 100s
      - key: "node.kubernetes.io/not-ready"
        operator: "Exists"
        effect: "NoExecute"
        tolerationSeconds: 100
```