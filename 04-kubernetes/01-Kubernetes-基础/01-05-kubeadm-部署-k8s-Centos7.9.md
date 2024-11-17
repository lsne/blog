# k8s 安装部署

### 环境:

节点 |主机名 | IP 
---|---|---
master01 | kbsmastertest01v.cpp.shjt2.lsne.cn | 10.249.105.64
master02 | kbsmastertest02v.cpp.shjt2.lsne.cn | 10.249.105.62
master03 | kbsmastertest03v.cpp.shjt2.lsne.cn | 10.249.105.63
node01   | kbsnodetest01v.cpp.shjt2.lsne.cn   | 10.249.105.65
node02   | kbsnodetest02v.cpp.shjt2.lsne.cn   | 10.249.105.68
node03   | kbsnodetest03v.cpp.shjt2.lsne.cn   | 10.249.105.66
node04   | kbsnodetest04v.cpp.shjt2.lsne.cn   | 10.249.105.67

### 步骤

#### 1. 所有机器下载docker repo文件

```
cd /etc/yum.repos.d/
wget https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
```

#### 2. 所有机器创建kubernetes repo文件 (gpgkey好像没用)

```
cd /etc/yum.repos.d/ && vim kubernetes.repo
[kubernetes]
name=Kubernetes Repo
baseurl=https://mirrors.aliyun.com/kubernetes/yum/repos/kubernetes-el7-x86_64/
gpgcheck=0
gpgkey=https://mirrors.aliyun.com/kubernetes/yum/doc/yum-key.gpg
enabled=1
```

#### 3. 导入key文件

```
wget https://mirrors.aliyun.com/kubernetes/yum/doc/yum-key.gpg
rpm --import yum-key.gpg
```


#### 4. 检查

```
yum repolist
docker-ce-stable/7/x86_64   Docker CE Stable - x86_64   112
kubernetes                  Kubernetes Repo             654
```

#### 5.  安装docker 和 kubernetes

```
yum install docker-ce kubelet kubeadm-1.18.18 kubectl
```

#### 6. 创建并编辑docker配置文件, 以systemd启动

```
vim /etc/docker/daemon.json
{
   "exec-opts": ["native.cgroupdriver=systemd"],
   "registry-mirrors": [
        "https://registry.docker-cn.com",
        "https://docker.mirrors.ustc.edu.cn"
    ]
}


https://<your_code>.mirror.aliyuncs.com
```

#### 7. 修改docker service文件,并启动docker守护进程

> 这一步只是设置代理,如果没必要,可以不要

```
vim /usr/lib/systemd/system/docker.service
Environment="HTTPS_PROXY=http://www.ik8s.io:10080"
Environment="NO_PROXY=127.0.0.1/8,172.20.0.0/16,10.0.0.0/8"
```

#### 8. 确保两个系统参数为

```
cat /proc/sys/net/bridge/bridge-nf-call-ip6tables
cat /proc/sys/net/bridge/bridge-nf-call-iptables
```

#### 9. 启动docker, 设置开机自启动 docker 和 kubelet

```
systemctl daemon-reload
systemctl start docker
systemctl enable docker
systemctl enable kubelet
```

#### 10. 编辑kubelet配置文件

```
vim /etc/sysconfig/kubelet
KUBELET_EXTRA_ARGS="--fail-swap-on=false"
```

#### 11. 在其中一个master节点执行(master01)

```
kubeadm init --kubernetes-version=1.18.18 --pod-network-cidr=192.168.0.0/16 --service-cidr=172.16.0.0/16  --control-plane-endpoint=kbsmastertest01v.cpp.shjt2.lsne.cn:6443 --ignore-preflight-errors=Swap,SystemVerification,KubeletVersion --image-repository=registry.aliyuncs.com/google_containers

下面这个参数做为 apiserver的域名, 以后可以多个apiserver做负载均衡, 而且不写这个参数, 不出来join master 的提示命令
--control-plane-endpoint=kbsmastertest01v.cpp.shjt2.lsne.cn:6443

域名必须解析正常,否则会报错:

[wait-control-plane] Waiting for the kubelet to boot up the control plane as static Pods from directory "/etc/kubernetes/manifests". This can take up to 4m0s


[kubelet-check] Initial timeout of 40s passed.

	Unfortunately, an error has occurred:
		timed out waiting for the condition

	This error is likely caused by:
		- The kubelet is not running
		- The kubelet is unhealthy due to a misconfiguration of the node in some way (required cgroups disabled)

	If you are on a systemd-powered system, you can try to troubleshoot the error with the following commands:
		- 'systemctl status kubelet'
		- 'journalctl -xeu kubelet'

	Additionally, a control plane component may have crashed or exited when started by the container runtime.
	To troubleshoot, list all containers using your preferred container runtimes CLI.

	Here is one example how you may list all Kubernetes containers running in docker:
		- 'docker ps -a | grep kube | grep -v pause'
		Once you have found the failing container, you can inspect its logs with:
		- 'docker logs CONTAINERID'

error execution phase wait-control-plane: couldn't initialize a Kubernetes cluster
To see the stack trace of this error execute with --v=5 or higher
```

#### 12. 手动拉取镜像

> 上面命令如果失败, 可能是拉取某个镜像失败, 查看是哪个镜像. 然后去github直接下载并导入到docker, 然后重新执行上面的初始化命令

```
wget https://github.com/coredns/coredns/releases/download/v1.8.0/coredns_1.8.0_linux_amd64.tgz
docker import coredns_1.8.0_linux_amd64.tgz registry.aliyuncs.com/google_containers/coredns/coredns:v1.8.0

kubeadm init --kubernetes-version=1.18.18 --pod-network-cidr=192.168.0.0/16 --service-cidr=172.16.0.0/16  --control-plane-endpoint=kbsmastertest01v.cpp.shjt2.lsne.cn:6443 --ignore-preflight-errors=Swap,SystemVerification,KubeletVersion --image-repository=registry.aliyuncs.com/google_containers
```

#### 13. 安装完成后, 的最后提示信息要记录下来

```
Your Kubernetes control-plane has initialized successfully!

To start using your cluster, you need to run the following as a regular user:

  mkdir -p $HOME/.kube
  sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
  sudo chown $(id -u):$(id -g) $HOME/.kube/config

You should now deploy a pod network to the cluster.
Run "kubectl apply -f [podnetwork].yaml" with one of the options listed at:
  https://kubernetes.io/docs/concepts/cluster-administration/addons/

You can now join any number of control-plane nodes by copying certificate authorities
and service account keys on each node and then running the following as root:

  kubeadm join kbsmastertest01v.cpp.shjt2.lsne.cn:6443 --token vlf36l.vrc6zdot96ed9ps0 \
    --discovery-token-ca-cert-hash sha256:1513ebc26711b64e99119ac1015be985e6c0655b0f2a62bdf0c3a1486e91601f \
    --control-plane 

Then you can join any number of worker nodes by running the following on each as root:

kubeadm join kbsmastertest01v.cpp.shjt2.lsne.cn:6443 --token vlf36l.vrc6zdot96ed9ps0 \
    --discovery-token-ca-cert-hash sha256:1513ebc26711b64e99119ac1015be985e6c0655b0f2a62bdf0c3a1486e91601f 
```

#### 13. 根据提示执行以下命令初始化集群

```
  mkdir -p $HOME/.kube
  sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
  sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

#### 14. 查看集群状态

```
kubectl get componentStatus
或
kubectl get cs
```

#### 15. 如果集群状态不正常, 编辑配置文件后重启

```
vim /etc/kubernetes/manifests/kube-controller-manager.yaml 
- --port=0 #删除

vim /etc/kubernetes/manifests/kube-scheduler.yaml
- --port=0 #删除

systemctl restart kubelet
```

#### 16. 查看集群node(NotReady)

```
kubectl get nodes
```

#### 17. 安装flannel

```
打开github中flannel的 README.md (https://github.com/flannel-io/flannel) 有写到如果安装flannel
kubectl apply -f https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml
```

#### 18. 检查状态(Ready)

```
kubectl get nodes
kubectl get pods -n kube-system -o wide
```

#### 19. 查看名称空间

```
kubectl get ns
```

#### 20. 将node节点加入集群

```
第13步记录的最后一行, 再加一个--ignore-preflight-errors参数
kubeadm join 10.249.105.64:6443 --token h4c75g.jprjr4dmmb07e5bi --discovery-token-ca-cert-hash sha256:4de3db9bb0a76b229f3df5ac5d971ce8150cdb2bbfc562a5bb61b97994cf22e0 --ignore-preflight-errors=Swap
```

#### 21. 排查问题


```
kubectl describe pod coredns-545d6fc579-7jb2b -n kube-system
```


#### 22. 卸载

```
kubeadm reset -f 

然后: 
ifconfig cni0 down
ip link delete cni0
ifconfig flannel.1 down
ip link delete flannel.1
rm -rf /var/lib/cni/
rm -f /etc/cni/net.d/*
rm -rf /run/flannel/subnet.env 

即:
ifconfig cni0 down && ip link delete cni0 && ifconfig flannel.1 down && ip link delete flannel.1 && rm -rf /var/lib/cni/ && rm -f /etc/cni/net.d/* && rm -rf /run/flannel/subnet.env
```

#### 23. 重新复制config

```
rm -rf .kube/* && mkdir -p /home/lsne/.kube &&  cp -i /etc/kubernetes/admin.conf /home/lsne/.kube/config && chown lsne:lsne -R /home/lsne/.kube
```


#### 24. 快速部署总结

```
kubeadm init --kubernetes-version=1.18.18 --pod-network-cidr=192.168.0.0/16 --service-cidr=172.16.0.0/16  --control-plane-endpoint=kbsmastertest01v.cpp.shjt2.lsne.cn:6443 --ignore-preflight-errors=Swap,SystemVerification,KubeletVersion --image-repository=registry.aliyuncs.com/google_containers

mkdir -p /home/lsne/.kube &&  \cp -f /etc/kubernetes/admin.conf /home/lsne/.kube/config && chown lsne:lsne -R /home/lsne/.kube

sed -i "/--port=0/d" /etc/kubernetes/manifests/kube-controller-manager.yaml && sed -i "/--port=0/d" /etc/kubernetes/manifests/kube-scheduler.yaml && systemctl restart kubelet

kubectl apply -f https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml


卸载:
kubeadm reset -f 
ifconfig cni0 down && ip link delete cni0 && ifconfig flannel.1 down && ip link delete flannel.1 && rm -rf /var/lib/cni/ && rm -f /etc/cni/net.d/* && rm -rf /run/flannel/subnet.env
```

## 测试

```
创建pod
kubectl run nginx-deploy --image=nginx:1.20.0-alpine --port=80 --replicas=1

创建 nginx-service 服务(service):
kubectl expose deployment nginx-deploy --name=nginx-service --port=80 --target-port=80 --protocol=TCP
kubectl get svc

在集群内的pod上, 可以通过 (wget nginx-service) 命令访问开始创建的nginx-deploy这个pod的nginx服务

但看 nginx-service 解析
kubectl describe svc nginx-service

显示标签
kubectl get pods --show-labels

编辑服务
kubectl edit svc nginx-service

允许外部网络访问服务(只需要修改service的类型为 NodePort 即可):
kubectl edit svc nginx-service
type: NodePort
:wq

kubectl get svc #可以看到该的物理机IP对应该的端口
这种方式通过物理机IP访问, 生产环境中需要做高可用或负载均衡
```


## 各节点上pod资源收集和存储工具: HeapSter

```
HeapSter 保存  kubelet 里的插件 cAdvisor  收集的各节点上每个pod的资源使用情况
如果想持久化部署, 需要部署influxDB
如果需要显示曲线图, 需要部署grafana

没用了.  以后改用prometheus了
```