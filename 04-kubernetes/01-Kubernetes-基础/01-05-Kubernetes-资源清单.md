# k8s 资源清单样例

### 一个文件中定义多个资源用三个-隔开

```yaml
apiVersion: v1
kind: Pod
metadata:
spec:
  containers:
  - name: myapp
  affinity:
    nodeAffinity:
      prefererdDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
        - matchExpressions:
          - key: zone
            operator: In
            values:
            - foo
            - bar
---
apiVersion: v1
kind: Pod
metadata:
spec:
  containers:
  - name: myapp
    resources:
      requests:
        cpu: "500m"
        memory: "256Mi"
      limits:
        cpu "1"
        memory: "512Mi"
---
apiVersion: v1
kind: Pod
metadata:
spec:
```

### 创建名称空间

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: ingress-nginx-test
```

> 或者直接用命令 kubectl create namespace ingress-nginx-test1

> 删除名称空间会直接将名称空间下的所有POD一块删除

### Service: ClusterIP

```yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx-service
  namespace: default
spec:
  selector:
    app: myappOne
    testngx: "hahaha"
  clusterIP: 172.16.0.2
  type: ClusterIP
  ports:
  - port: 80
    targetPort: 80
```

### Service: NodePort

```yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx-service-nodeport
  namespace: default
spec:
  selector:
    app: myappOne
    testngx: "hahaha"
  clusterIP: 172.16.0.3
  type: NodePort
  ports:
  - port: 80
    targetPort: 80
    nodePort: 30080
```

### 自主式Pod

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx-demo
  namespace: default
  labels:
    testngx: "hahaha"
    tierrnn: frontend
  annotations:
    lsne.c/create-by: "lsne admin"
spec:
  containers:
  - name: nginx-c1
    image: nginx:1.20-alpine
    ports:
    - name: http
      containerPort: 80
    - name: https
      containerPort: 443
  - name: nginx-c2-busybox
    image: busybox:latest
    command:
    - "/bin/sh"
    - "-c"
    - "sleep 3600"
```

### 自主式Pod emptyDir 挂载存储卷

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx-volumes
  namespace: default
  labels:
    testngx: "hahaha"
    tierrnn: frontend
  annotations:
    lsne.c/create-by: "lsne admin"
spec:
  containers:
  - name: nginx-c1
    image: nginx:1.20-alpine
    ports:
    - name: http
      containerPort: 80
    - name: https
      containerPort: 443
    volumeMounts:
    - name: html
      mountPath: /data/web/html/
  - name: nginx-c2-busybox
    image: busybox:latest
    volumeMounts:
    - name: html
      mountPath: /data
    command:
    - "/bin/sh"
    - "-c"
    - "while true ; do date >> /data/index.html; sleep 10 ;done"
  volumes:
  - name: html
    emptyDir: {}
```


### 自主式Pod hostPath 挂载存储卷

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx-volumes-2
  namespace: default
  labels:
    testngx: "hahaha"
    tierrnn: frontend
  annotations:
    lsne.c/create-by: "lsne admin"
spec:
  containers:
  - name: nginx-c1
    image: nginx:1.20-alpine
    ports:
    - name: http
      containerPort: 80
    - name: https
      containerPort: 443
    volumeMounts:
    - name: hostdir
      mountPath: /data/web/html/
  - name: nginx-c2-busybox
    image: busybox:latest
    volumeMounts:
    - name: hostdir
      mountPath: /data
    command:
    - "/bin/sh"
    - "-c"
    - "while true ; do date >> /data/index.html; sleep 10 ;done"
  volumes:
  - name: hostdir
    hostPath:
      path: /data/testhostdir
      type: DirectoryOrCreate
```

### 控制器Pod: ReplicaSet

```yaml
apiVersion: apps/v1
kind: ReplicaSet
metadata:
  name: nginx-repl
  namespace: default
spec:
    replicas: 2
    selector:
        matchLabels:
            app: myappOne
            releatt: v0.1.0
    template:
        metadata:
          name: nginx-demo
          namespace: default
          labels:
            app: myappOne
            releatt: v0.1.0
            testngx: "hahaha"
            tierrnn: frontend
          annotations:
            lsne.c/create-by: "lsne admin"
        spec:
          containers:
          - name: nginx-c1
            image: nginx:1.20-alpine
            ports:
            - name: http
              containerPort: 80
            - name: https
              containerPort: 443
          - name: nginx-c2-busybox
            image: busybox:latest
            command:
            - "/bin/sh"
            - "-c"
            - "sleep 3600"
```

### 控制器Pod: Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deploy
  namespace: default
spec:
    replicas: 2
    selector:
        matchLabels:
            app: myappOne
            releatt: v0.1.0
    template:
        metadata:
          name: nginx-demo
          namespace: default
          labels:
            app: myappOne
            releatt: v0.1.0
            testngx: "hahaha"
            tierrnn: frontend
          annotations:
            lsne.c/create-by: "lsne admin"
        spec:
          containers:
          - name: nginx-c1
            image: nginx:1.20-alpine
            ports:
            - name: http
              containerPort: 80
            - name: https
              containerPort: 443
          - name: nginx-c2-busybox
            image: busybox:latest
            command:
            - "/bin/sh"
            - "-c"
            - "sleep 3600"
```

> 修改副本集数量

```sh
修改副本数量
vim 上面的文件(nginx-deploy.yaml)， 修改 replicas
replicas: 3

重新应用此文件(如果修改镜像版本,会自动进行滚动更新):
kubectl apply -f nginx-deploy.yaml

查看详细信息:
kubectl describe deploy nginx-deploy

查看滚动更新历史
kubectl rollout history deployment myapp-deploy

给对象打补丁(即修改对象), 必须是json字符串
kubectl patch deployment nginx-deploy -p '{"spec":{"replicas":5}}'

资源暂停
kubectl rollout pause

kubectl set image deployment nginx-deploy nginx-c1=nginx:1.20-alpine && kubectl rollout pause deployment nginx-deploy

kubectl rollout resume 解除暂停

kubectl rollout undo nginx-deploy 回滚到上一版本

kubectl rollout history deployment nginx-deploy

kubectl rollout undo nginx-deploy --to-revision=3


暴露端口
kubectl expose deployment nginx-deploy --port=80
```

### 控制器Pod: DaemonSet

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: nginx-daemon
  namespace: default
spec:
    selector:
        matchLabels:
            app: packetbeat
            releatt: v0.2.0
    template:
        metadata:
          name: nginx-demo
          namespace: default
          labels:
            app: packetbeat
            releatt: v0.2.0
            testngx: "hahaha"
            tierrnn: frontend
          annotations:
            lsne.c/create-by: "lsne admin"
        spec:
          containers:
          - name: nginx-c1
            image: nginx:1.20-alpine
            ports:
            - name: http
              containerPort: 80
            - name: https
              containerPort: 443
            env:
            - name: REDIS_HOST
              value: redis.default.svc.cluster.local
            - name: REDIS_LOG_LEVEL
              value: info
```

> DaemonSet 也支持滚动更新

### 控制器Pod: Ingress Controller 类似DaemonSet的一种七层代理服务器POD

```yaml
Ingres 和 Ingres Controller 不是一个概念
Ingress 就是一个或一组特殊的应用程序pod
一般有以下几种:
Nginx
envoy     16.7k
traefik   33.5k

Ingress 没有调度功能, 所以后面必须加一个 Service 进行分组调度

```

### 控制器Pod: StatefulSet

> 典型的StatefulSet, 一般有三个组件组成

```yaml
headless service 无头service
StatefulSet 控制器
volumeClaimTemplate 存储卷申请模板
```

```yaml
apiVersion: v1
kind: Service
metadata:
  name: myapp
  labels:
    app: myapp
spec:
  selector:
    app: myapp-pod
  clusterIP: None
  ports:
  - port: 80
    name: web
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: myapp
spec:
  serviceName: myapp
  replicas: 3
  selector:
    matchLabels:
      app: myapp-pod
  template:
    metadata:
      labels:
        app: myapp-pod
    spec:
      containers:
      - name: myapp
        image: nginx:1.20-alpine
        ports:
        - name: web
          containerPort: 80
        volumeMounts:
        - name: myappdata
          mountPath: /usr/share/nginx/html
  volumeClaimTemplates:
  - metadata:
      name: myappdata
    spec:
      accessModes: [ "ReadWriteOnce" ]
      resources:
        requests:
          storage: 5Gi
```

> StatefulSet 扩容缩容, 更新策略

```yaml
kubectl scal sts myapp --replicas=5
kubectl scal sts myapp --replicas=2
kubectl patch sts myapp -p '{"spec":{"replicas":5}}'
kubectl patch sts myapp -p '{"spec":{"replicas":2}}'

更新策略
kubectl patch sts myapp -p '{"spec":{"updateStrategy":{"rollingUpdate":{"partition":4}}}}'
```


### PersistentVolume (PV)  hostPath版本:
```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv001
  labels:
    name: pv001
spec:
  hostPath:
    path: /data/volumes/v1
  accessModes: ["ReadWriteMany","ReadWriteOnce"]
  capacity:
    storage: 3Gi
---
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv002
  labels:
    name: pv002
spec:
  hostPath:
    path: /data/volumes/v2
  accessModes: ["ReadWriteMany","ReadWriteOnce"]
  capacity:
    storage: 5Gi
---
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv003
  labels:
    name: pv003
spec:
  hostPath:
    path: /data/volumes/v3
  accessModes: ["ReadWriteMany","ReadWriteOnce"]
  capacity:
    storage: 8Gi
---
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv004
  labels:
    name: pv004
spec:
  hostPath:
    path: /data/volumes/v4
  accessModes: ["ReadWriteMany","ReadWriteOnce"]
  capacity:
    storage: 10Gi
```

### PersistentVolume (PV)  NFS版本:

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv001
  labels:
    name: pv001
spec:
  nfs:
    path: /data/volumes/v1
    server: stor01.magedu.com
  accessModes: ["ReadWriteMany","ReadWriteOnce"]
  capacity:
    storage: 1Gi
---
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv002
  labels:
    name: pv002
spec:
  nfs:
    path: /data/volumes/v2
    server: stor01.magedu.com
  accessModes: ["ReadWriteMany","ReadWriteOnce"]
  capacity:
    storage: 2Gi
---
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv003
  labels:
    name: pv003
spec:
  nfs:
    path: /data/volumes/v3
    server: stor01.magedu.com
  accessModes: ["ReadWriteMany","ReadWriteOnce"]
  capacity:
    storage: 3Gi
```

### PersistentVolumeClain (PVC):

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mypvc
  namespace: default
spec:
  accessModes: ["ReadWriteMany","ReadWriteOnce"]
  resources:
    requests:
      storage: 6Gi
---
apiVersion: v1
kind: Pod
metadata:
  name: nginx-volumes-3
  namespace: default
  labels:
    testngx: "hahaha"
    tierrnn: frontend
  annotations:
    lsne.c/create-by: "lsne admin"
spec:
  containers:
  - name: nginx-c1
    image: nginx:1.20-alpine
    ports:
    - name: http
      containerPort: 80
    - name: https
      containerPort: 443
    volumeMounts:
    - name: pvc-demo
      mountPath: /data/web/html/
  volumes:
  - name: pvc-demo
    persistentVolumeClaim:
      claimName: mypvc
```

### 动态PV

### 特殊类型存储卷

#### configMap 明文方式

> 第一种创建方式

```yaml
kubectl create configmap nginx-config --from-literal=nginx_port=80 --from-literal=server_name=myapp.magedu.com
kubectl get cm
kubectl edit cm nginx-config
```

> 第二种创建方式

```yaml
vim www.conf
server {
    server_name myapp.magedu.com;
    listen 80;
    root /data/web/html;
}

kubectl create configmap nginx-www --from-file=./www.conf
```

> 引用方式: 环境变量方式(只在启动时加载, 启动后,configMap值被修改后, pod里的值不会跟着修改)

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx-cm-1
  namespace: default
  labels:
    testngx: "hahaha"
    tierrnn: frontend
  annotations:
    lsne.c/create-by: "lsne admin"
spec:
  containers:
  - name: nginx-c1
    image: nginx:1.20-alpine
    ports:
    - name: http
      containerPort: 80
    - name: https
      containerPort: 443
    env:
    - name: NGINX_SERVER_PORT
      valueFrom:
        configMapKeyRef:
          name: nginx-config
          key: nginx_port
    - name: NGINX_SERVER_NAME
      valueFrom:
        configMapKeyRef:
          name: nginx-config
          key: server_name
```

> 引用方式: 挂在存储卷方式(启动后,configMap值被修改后, pod里的值会跟着修改)

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx-cm-1
  namespace: default
  labels:
    testngx: "hahaha"
    tierrnn: frontend
  annotations:
    lsne.c/create-by: "lsne admin"
spec:
  containers:
  - name: nginx-c1
    image: nginx:1.20-alpine
    ports:
    - name: http
      containerPort: 80
    - name: https
      containerPort: 443
    volumeMounts:
    - name: nginxconf
      mountPath: /etc/nginx/config.d/
      readOnly: true
  volumes:
  - name: nginxconf
    configMap:
      name: nginx-config
```

#### secret   加密方式

```yaml
kubectl create secret generic mysql-root-password --from-literal=password=123456
kubectl get secret mysql-root-password -o yaml
data:
  password: MTIzNDU2

解码:
echo MTIzNDU2 | base64 -d  
```

#### deployment 单实例部署一个redis

```yaml
apiVersion: v1
kind: Service
metadata:
  name: myredis01        # 变量
  namespace: testrc   # 变量
  labels:
    app: wf             # 变量
    dbtype: redis
    name: myredis01
spec:
  ports:
    - port: 6379        # 变量
  selector:             # 变量
    dbtype: redis
    app: wf
    name: myredis01
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myredis01        # 变量 ${mypg01}
  namespace: testrc   # 变量
  labels:               # 变量
    dbtype: redis
    app: wf
    name: myredis01
spec:
  # 这里我们定义了deployment的升级策略
  replicas: 1
  selector:
    matchLabels:        # 变量
      dbtype: redis
      app: wf
      name: myredis01
  # strategy:
  #   type: RollingUpdate # 变量
  #   rollingUpdate:
  #     maxUnavailable: 0
  #     maxSurge: 1
  template:
    metadata:
      labels:           # 变量
        dbtype: redis
        app: wf
        name: myredis01
    spec:
      # # 限制节点运行在wf.business/node-purpose=wf-service的节点运行
      # affinity:             # 变量
      #   nodeAffinity:       # 变量
      #     requiredDuringSchedulingIgnoredDuringExecution:
      #       nodeSelectorTerms:
      #       - matchExpressions:
      #         - key: wf.business/node-purpose
      #           operator: In
      #           values:
      #           - wf-service
      containers:
      - name: redis                          # 变量
        image: redis:6.2.11                  # 变量
        imagePullPolicy: IfNotPresent        # 变量
        resources:                           # 变量
          limits:
            memory: "128Mi"
            cpu: "500m"
        env:
          - name: REDIS_PASSWORD
            value: "123456"
        ports:
        - containerPort: 6379
        command:
        - "redis-server"
        - "--save \"\""
        - "--appendonly no"
        - "--maxclients 10000"
        - "--maxmemory 2gb"
        - "--requirepass '$(REDIS_PASSWORD)'"
```