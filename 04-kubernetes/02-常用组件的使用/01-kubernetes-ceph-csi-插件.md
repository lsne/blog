## kubernetes 添加 ceph-csi 插件

### 前提: 对 Ceph 初始化 rdb 池 (Ceph 集群的操作)

```sh
cephadm --docker shell ceph osd pool create kubernetes 128
cephadm --docker shell ceph osd pool set kubernetes size 3
cephadm --docker shell ceph osd pool application enable kubernetes rbd
cephadm --docker shell rbd pool init kubernetes   # 初始化名为kubernetes的pool

cephadm --docker shell ceph auth get-or-create client.kubernetes mon 'profile rbd' osd 'profile rbd pool=kubernetes' mgr 'profile rbd pool=kubernetes'  # 可拿到userid 为kubernetes的user key
cephadm --docker shell ceph mon dump  # 可看到monitor地址，其中给ceph-csi用，直接用v1版本的地址

cephadm --docker shell ceph -s | grep id # 可拿到clusterid
```

### 创建 ceph-csi 

#### 0. 创建名称空间

```sh
kubectl create namespace ceph-csi-rbd
```

#### 1. 创建配置文件 ConfigMap

```yaml
# vim cephcm.yaml

apiVersion: v1
kind: ConfigMap
metadata:
  name: ceph-config
  namespace: ceph-csi-rbd
data:
  ceph.conf: |
    [global]
      auth_cluster_required = cephx
      auth_service_required = cephx
      auth_client_required = cephx
  keyring: ""
  
# kubectl create -f cephcm.yaml
```

#### 2. 创建 csi 配置文件 ConfigMap
##### 根据情况修改

- `"clusterID": "37a2ea4a-187b-11ed-8d31-b4055d13cde8"`
- `monitor地址：{10.249.152.177:6789,10.249.152.178:6789,10.249.152.179:6789}`
- `"clusterIDMapping": {}`

```yaml
# vim csi.yaml

apiVersion: v1
kind: ConfigMap
metadata:
  namespace: ceph-csi-rbd
  name: ceph-csi-config
data:
  config.json: |-
    [
      {
        "clusterID": "37a2ea4a-187b-11ed-8d31-b4055d13cde8",
        "monitors": [
          "10.249.152.177:6789",

          "10.249.152.178:6789",

          "10.249.152.179:6789"
        ]
      }
    ]
  cluster-mapping.json: |-
    [
      {
        "clusterIDMapping": {
          "37a2ea4a-187b-11ed-8d31-b4055d13cde8": "37a2ea4a-187b-11ed-8d31-b4055d13cde8"
        }
      }
    ]
    
kubectl create -f csi.yaml
```

#### 3. 创建secret，需要手工修改对应的userKey

> 根据情况修改

- `userID:k8s`
- `userKey: AQCMXvNi3zY3JRAxxxxxxxxxxxgggggg==`

```yaml
# vim secret.yaml

apiVersion: v1
kind: Secret
metadata:
  name: csi-rbd-secret
  namespace: ceph-csi-rbd
stringData:
  userID: k8s
  userKey: AQCMXvNi3zY3JRAAmPqHYqq1HEw+WqAUJ4y72w==

# kubectl create -f secret.yaml
```

#### 4. 创建 provisioner 

```yaml
vim provisioner.yaml

---
# Source: ceph-csi-rbd/templates/nodeplugin-serviceaccount.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: ceph-csi-rbd-nodeplugin
  namespace: ceph-csi-rbd
  labels:
    app: ceph-csi-rbd
    chart: ceph-csi-rbd-3.6.1
    component: nodeplugin
    release: ceph-csi-rbd
    heritage: Helm
---
# Source: ceph-csi-rbd/templates/provisioner-serviceaccount.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: ceph-csi-rbd-provisioner
  namespace: ceph-csi-rbd
  labels:
    app: ceph-csi-rbd
    chart: ceph-csi-rbd-3.6.1
    component: provisioner
    release: ceph-csi-rbd
    heritage: Helm
---
# # Source: ceph-csi-rbd/templates/ceph-conf.yaml
# apiVersion: v1
# kind: ConfigMap
# metadata:
#   name: "ceph-config"
#   namespace: ceph-csi-rbd
#   labels:
#     app: ceph-csi-rbd
#     chart: ceph-csi-rbd-3.6.1
#     component: nodeplugin
#     release: ceph-csi-rbd
#     heritage: Helm
# data:
#   ceph.conf: |
#     [global]
#       auth_cluster_required = cephx
#       auth_service_required = cephx
#       auth_client_required = cephx
    
#   keyring: ""
# ---
# # Source: ceph-csi-rbd/templates/csiplugin-configmap.yaml
# apiVersion: v1
# kind: ConfigMap
# metadata:
#   name: "ceph-csi-config"
#   namespace: ceph-csi-rbd
#   labels:
#     app: ceph-csi-rbd
#     chart: ceph-csi-rbd-3.6.1
#     component: nodeplugin
#     release: ceph-csi-rbd
#     heritage: Helm
# data:
#   config.json: |-
#     []
#   cluster-mapping.json: |-
#     []
# ---
# Source: ceph-csi-rbd/templates/encryptionkms-configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: "ceph-csi-encryption-kms-config"
  namespace: ceph-csi-rbd
  labels:
    app: ceph-csi-rbd
    chart: ceph-csi-rbd-3.6.1
    component: nodeplugin
    release: ceph-csi-rbd
    heritage: Helm
data:
  config.json: |-
    {}
---
# Source: ceph-csi-rbd/templates/nodeplugin-clusterrole.yaml
kind: ClusterRole
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: ceph-csi-rbd-nodeplugin
  labels:
    app: ceph-csi-rbd
    chart: ceph-csi-rbd-3.6.1
    component: nodeplugin
    release: ceph-csi-rbd
    heritage: Helm
rules:
  # allow to read Vault Token and connection options from the Tenants namespace
  - apiGroups: [""]
    resources: ["secrets"]
    verbs: ["get"]
  - apiGroups: [""]
    resources: ["configmaps"]
    verbs: ["get"]
  - apiGroups: [""]
    resources: ["serviceaccounts"]
    verbs: ["get"]
  - apiGroups: [""]
    resources: ["persistentvolumes"]
    verbs: ["get"]
  - apiGroups: ["storage.k8s.io"]
    resources: ["volumeattachments"]
    verbs: ["list", "get"]
---
# Source: ceph-csi-rbd/templates/provisioner-clusterrole.yaml
kind: ClusterRole
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: ceph-csi-rbd-provisioner
  labels:
    app: ceph-csi-rbd
    chart: ceph-csi-rbd-3.6.1
    component: provisioner
    release: ceph-csi-rbd
    heritage: Helm
rules:
  - apiGroups: [""]
    resources: ["secrets"]
    verbs: ["get", "list", "watch"]
  - apiGroups: [""]
    resources: ["persistentvolumes"]
    verbs: ["get", "list", "watch", "create", "update", "delete", "patch"]
  - apiGroups: [""]
    resources: ["persistentvolumeclaims"]
    verbs: ["get", "list", "watch", "update"]
  - apiGroups: ["storage.k8s.io"]
    resources: ["storageclasses"]
    verbs: ["get", "list", "watch"]
  - apiGroups: [""]
    resources: ["events"]
    verbs: ["list", "watch", "create", "update", "patch"]
  - apiGroups: [""]
    resources: ["endpoints"]
    verbs: ["get", "create", "update"]
  - apiGroups: ["storage.k8s.io"]
    resources: ["volumeattachments"]
    verbs: ["get", "list", "watch", "update", "patch"]
  - apiGroups: ["storage.k8s.io"]
    resources: ["volumeattachments/status"]
    verbs: ["patch"]
  - apiGroups: ["snapshot.storage.k8s.io"]
    resources: ["volumesnapshots"]
    verbs: ["get", "list", "patch"]
  - apiGroups: ["snapshot.storage.k8s.io"]
    resources: ["volumesnapshots/status"]
    verbs: ["get", "list", "patch"]
  - apiGroups: ["snapshot.storage.k8s.io"]
    resources: ["volumesnapshotcontents"]
    verbs: ["create", "get", "list", "watch", "update", "delete", "patch"]
  - apiGroups: ["snapshot.storage.k8s.io"]
    resources: ["volumesnapshotclasses"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["snapshot.storage.k8s.io"]
    resources: ["volumesnapshotcontents/status"]
    verbs: ["update", "patch"]
  - apiGroups: [""]
    resources: ["configmaps"]
    verbs: ["get"]
  - apiGroups: [""]
    resources: ["serviceaccounts"]
    verbs: ["get"]
  - apiGroups: [""]
    resources: ["persistentvolumeclaims/status"]
    verbs: ["update", "patch"]
---
# Source: ceph-csi-rbd/templates/provisioner-rules-clusterrole.yaml
kind: ClusterRole
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: ceph-csi-rbd-provisioner-rules
  labels:
    app: ceph-csi-rbd
    chart: ceph-csi-rbd-3.6.1
    component: provisioner
    release: ceph-csi-rbd
    heritage: Helm
    rbac.rbd.csi.ceph.com/aggregate-to-ceph-csi-rbd-provisioner: "true"
rules:
  - apiGroups: [""]
    resources: ["secrets"]
    verbs: ["get", "list"]
  - apiGroups: [""]
    resources: ["persistentvolumes"]
    verbs: ["get", "list", "watch", "create", "update", "delete", "patch"]
  - apiGroups: [""]
    resources: ["persistentvolumeclaims"]
    verbs: ["get", "list", "watch", "update"]
  - apiGroups: ["storage.k8s.io"]
    resources: ["storageclasses"]
    verbs: ["get", "list", "watch"]
  - apiGroups: [""]
    resources: ["events"]
    verbs: ["list", "watch", "create", "update", "patch"]
  - apiGroups: [""]
    resources: ["endpoints"]
    verbs: ["get", "create", "update"]
  - apiGroups: ["storage.k8s.io"]
    resources: ["volumeattachments"]
    verbs: ["get", "list", "watch", "update", "patch"]
  - apiGroups: ["snapshot.storage.k8s.io"]
    resources: ["volumesnapshots"]
    verbs: ["get", "list"]
  - apiGroups: ["snapshot.storage.k8s.io"]
    resources: ["volumesnapshotcontents"]
    verbs: ["create", "get", "list", "watch", "update", "delete"]
  - apiGroups: ["snapshot.storage.k8s.io"]
    resources: ["volumesnapshotclasses"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["snapshot.storage.k8s.io"]
    resources: ["volumesnapshotcontents/status"]
    verbs: ["update"]
  - apiGroups: [""]
    resources: ["persistentvolumeclaims/status"]
    verbs: ["update", "patch"]
---
# Source: ceph-csi-rbd/templates/nodeplugin-clusterrolebinding.yaml
kind: ClusterRoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: ceph-csi-rbd-nodeplugin
  labels:
    app: ceph-csi-rbd
    chart: ceph-csi-rbd-3.6.1
    component: nodeplugin
    release: ceph-csi-rbd
    heritage: Helm
subjects:
  - kind: ServiceAccount
    name: ceph-csi-rbd-nodeplugin
    namespace: ceph-csi-rbd
roleRef:
  kind: ClusterRole
  name: ceph-csi-rbd-nodeplugin
  apiGroup: rbac.authorization.k8s.io
---
# Source: ceph-csi-rbd/templates/provisioner-clusterrolebinding.yaml
kind: ClusterRoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: ceph-csi-rbd-provisioner
  labels:
    app: ceph-csi-rbd
    chart: ceph-csi-rbd-3.6.1
    component: provisioner
    release: ceph-csi-rbd
    heritage: Helm
subjects:
  - kind: ServiceAccount
    name: ceph-csi-rbd-provisioner
    namespace: ceph-csi-rbd
roleRef:
  kind: ClusterRole
  name: ceph-csi-rbd-provisioner
  apiGroup: rbac.authorization.k8s.io
---
# Source: ceph-csi-rbd/templates/provisioner-role.yaml
kind: Role
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: ceph-csi-rbd-provisioner
  namespace: ceph-csi-rbd
  labels:
    app: ceph-csi-rbd
    chart: ceph-csi-rbd-3.6.1
    component: provisioner
    release: ceph-csi-rbd
    heritage: Helm
rules:
  - apiGroups: [""]
    resources: ["configmaps"]
    verbs: ["get", "list", "watch", "create","update", "delete"]
  - apiGroups: ["coordination.k8s.io"]
    resources: ["leases"]
    verbs: ["get", "watch", "list", "delete", "update", "create"]
---
# Source: ceph-csi-rbd/templates/provisioner-rolebinding.yaml
kind: RoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: ceph-csi-rbd-provisioner
  namespace: ceph-csi-rbd
  labels:
    app: ceph-csi-rbd
    chart: ceph-csi-rbd-3.6.1
    component: provisioner
    release: ceph-csi-rbd
    heritage: Helm
subjects:
  - kind: ServiceAccount
    name: ceph-csi-rbd-provisioner
    namespace: ceph-csi-rbd
roleRef:
  kind: Role
  name: ceph-csi-rbd-provisioner
  apiGroup: rbac.authorization.k8s.io
---
# Source: ceph-csi-rbd/templates/nodeplugin-http-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: ceph-csi-rbd-nodeplugin-http-metrics
  namespace: ceph-csi-rbd
  labels:
    app: ceph-csi-rbd
    chart: ceph-csi-rbd-3.6.1
    component: nodeplugin
    release: ceph-csi-rbd
    heritage: Helm
spec:
  ports:
    - name: http-metrics
      port: 8080
      targetPort: 8080
  selector:
    app: ceph-csi-rbd
    component: nodeplugin
    release: ceph-csi-rbd
  type: "ClusterIP"
---
# Source: ceph-csi-rbd/templates/provisioner-http-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: ceph-csi-rbd-provisioner-http-metrics
  namespace: ceph-csi-rbd
  labels:
    app: ceph-csi-rbd
    chart: ceph-csi-rbd-3.6.1
    component: provisioner
    release: ceph-csi-rbd
    heritage: Helm
spec:
  ports:
    - name: http-metrics
      port: 8080
      targetPort: 8080
  selector:
    app: ceph-csi-rbd
    component: provisioner
    release: ceph-csi-rbd
  type: "ClusterIP"
---
# Source: ceph-csi-rbd/templates/nodeplugin-daemonset.yaml
kind: DaemonSet
apiVersion: apps/v1
metadata:
  name: ceph-csi-rbd-nodeplugin
  namespace: ceph-csi-rbd
  labels:
    app: ceph-csi-rbd
    chart: ceph-csi-rbd-3.6.1
    component: nodeplugin
    release: ceph-csi-rbd
    heritage: Helm
spec:
  selector:
    matchLabels:
      app: ceph-csi-rbd
      component: nodeplugin
      release: ceph-csi-rbd
  updateStrategy:
    type: RollingUpdate
  template:
    metadata:
      labels:
        app: ceph-csi-rbd
        chart: ceph-csi-rbd-3.6.1
        component: nodeplugin
        release: ceph-csi-rbd
        heritage: Helm
    spec:
      serviceAccountName: ceph-csi-rbd-nodeplugin
      hostNetwork: true
      hostPID: true
      priorityClassName: system-node-critical
      # to use e.g. Rook orchestrated cluster, and mons' FQDN is
      # resolved through k8s service, set dns policy to cluster first
      dnsPolicy: ClusterFirstWithHostNet
      containers:
        - name: driver-registrar
          # This is necessary only for systems with SELinux, where
          # non-privileged sidecar containers cannot access unix domain socket
          # created by privileged CSI driver container.
          securityContext:
            privileged: true
          image: "ecr-sh.yun.lsne.cn/kubevirt/csi-node-driver-registrar:v2.4.0"
          imagePullPolicy: IfNotPresent
          args:
            - "--v=5"
            - "--csi-address=/csi/csi.sock"
            - "--kubelet-registration-path=/var/lib/kubelet/plugins/rbd.csi.ceph.com/csi.sock"
          env:
            - name: KUBE_NODE_NAME
              valueFrom:
                fieldRef:
                  fieldPath: spec.nodeName
          volumeMounts:
            - name: socket-dir
              mountPath: /csi
            - name: registration-dir
              mountPath: /registration
          resources:
            {}
        - name: csi-rbdplugin
          image: "ecr-sh.yun.lsne.cn/kubevirt/cephcsi:v3.6.1"
          imagePullPolicy: IfNotPresent
          args:
            - "--nodeid=$(NODE_ID)"
            - "--pluginpath=/var/lib/kubelet/plugins"
            - "--stagingpath=/var/lib/kubelet/plugins/kubernetes.io/csi/pv/"
            - "--type=rbd"
            - "--nodeserver=true"
            - "--pidlimit=-1"
            - "--endpoint=$(CSI_ENDPOINT)"
            - "--csi-addons-endpoint=$(CSI_ADDONS_ENDPOINT)"
            - "--v=5"
            - "--drivername=$(DRIVER_NAME)"
          env:
            - name: POD_IP
              valueFrom:
                fieldRef:
                  fieldPath: status.podIP
            - name: DRIVER_NAME
              value: rbd.csi.ceph.com
            - name: NODE_ID
              valueFrom:
                fieldRef:
                  fieldPath: spec.nodeName
            - name: CSI_ENDPOINT
              value: "unix:///csi/csi.sock"
            - name: CSI_ADDONS_ENDPOINT
              value: "unix:///csi/csi-addons.sock"
          securityContext:
            privileged: true
            capabilities:
              add: ["SYS_ADMIN"]
            allowPrivilegeEscalation: true
          volumeMounts:
            - name: socket-dir
              mountPath: /csi
            - mountPath: /dev
              name: host-dev
            - mountPath: /run/mount
              name: host-mount
            - mountPath: /sys
              name: host-sys
            - mountPath: /etc/selinux
              name: etc-selinux
              readOnly: true
            - mountPath: /lib/modules
              name: lib-modules
              readOnly: true
            - name: ceph-csi-config
              mountPath: /etc/ceph-csi-config/
            - name: ceph-config
              mountPath: /etc/ceph/
            - name: ceph-csi-encryption-kms-config
              mountPath: /etc/ceph-csi-encryption-kms-config/
            - name: plugin-dir
              mountPath: /var/lib/kubelet/plugins
              mountPropagation: "Bidirectional"
            - name: mountpoint-dir
              mountPath: /var/lib/kubelet/pods
              mountPropagation: "Bidirectional"
            - name: keys-tmp-dir
              mountPath: /tmp/csi/keys
            - name: ceph-logdir
              mountPath: /var/log/ceph
            - name: oidc-token
              mountPath: /run/secrets/tokens
              readOnly: true
          resources:
            {}
        - name: liveness-prometheus
          securityContext:
            privileged: true
          image: "ecr-sh.yun.lsne.cn/kubevirt/cephcsi:v3.6.1"
          imagePullPolicy: IfNotPresent
          args:
            - "--type=liveness"
            - "--endpoint=$(CSI_ENDPOINT)"
            - "--metricsport=8080"
            - "--metricspath=/metrics"
            - "--polltime=60s"
            - "--timeout=3s"
          env:
            - name: CSI_ENDPOINT
              value: "unix:///csi/csi.sock"
            - name: POD_IP
              valueFrom:
                fieldRef:
                  fieldPath: status.podIP
          ports:
            - containerPort: 8080
              name: metrics
              protocol: TCP
          volumeMounts:
            - name: socket-dir
              mountPath: /csi
          resources:
            {}
      volumes:
        - name: socket-dir
          hostPath:
            path: "/var/lib/kubelet/plugins/rbd.csi.ceph.com"
            type: DirectoryOrCreate
        - name: registration-dir
          hostPath:
            path: /var/lib/kubelet/plugins_registry
            type: Directory
        - name: plugin-dir
          hostPath:
            path: /var/lib/kubelet/plugins
            type: Directory
        - name: mountpoint-dir
          hostPath:
            path: /var/lib/kubelet/pods
            type: DirectoryOrCreate
        - name: ceph-logdir
          hostPath:
            path: /var/log/ceph
            type: DirectoryOrCreate
        - name: host-dev
          hostPath:
            path: /dev
        - name: host-mount
          hostPath:
            path: /run/mount
        - name: host-sys
          hostPath:
            path: /sys
        - name: etc-selinux
          hostPath:
            path: /etc/selinux
        - name: lib-modules
          hostPath:
            path: /lib/modules
        - name: ceph-config
          configMap:
            name: "ceph-config"
        - name: ceph-csi-config
          configMap:
            name: "ceph-csi-config"
        - name: ceph-csi-encryption-kms-config
          configMap:
            name: "ceph-csi-encryption-kms-config"
        - name: keys-tmp-dir
          emptyDir: {
            medium: "Memory"
          }
        - name: oidc-token
          projected:
            sources:
              - serviceAccountToken:
                  path: oidc-token
                  expirationSeconds: 3600
                  audience: ceph-csi-kms
---
# Source: ceph-csi-rbd/templates/provisioner-deployment.yaml
kind: Deployment
apiVersion: apps/v1
metadata:
  name: ceph-csi-rbd-provisioner
  namespace: ceph-csi-rbd
  labels:
    app: ceph-csi-rbd
    chart: ceph-csi-rbd-3.6.1
    component: provisioner
    release: ceph-csi-rbd
    heritage: Helm
spec:
  replicas: 1
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 50%
  selector:
    matchLabels:
      app: ceph-csi-rbd
      component: provisioner
      release: ceph-csi-rbd
  template:
    metadata:
      labels:
        app: ceph-csi-rbd
        chart: ceph-csi-rbd-3.6.1
        component: provisioner
        release: ceph-csi-rbd
        heritage: Helm
    spec:
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            - labelSelector:
                matchExpressions:
                  - key: app
                    operator: In
                    values:
                      - ceph-csi-rbd
                  - key: component
                    operator: In
                    values:
                      - provisioner
              topologyKey: "kubernetes.io/hostname"
      serviceAccountName: ceph-csi-rbd-provisioner
      priorityClassName: system-cluster-critical
      containers:
        - name: csi-provisioner
          image: "ecr-sh.yun.lsne.cn/kubevirt/csi-provisioner:v3.1.0"
          imagePullPolicy: IfNotPresent
          args:
            - "--csi-address=$(ADDRESS)"
            - "--v=5"
            - "--timeout=60s"
            - "--leader-election=true"
            - "--retry-interval-start=500ms"
            - "--default-fstype=ext4"
            - "--extra-create-metadata=true"
          env:
            - name: ADDRESS
              value: "unix:///csi/csi-provisioner.sock"
          volumeMounts:
            - name: socket-dir
              mountPath: /csi
          resources:
            {}
        - name: csi-resizer
          image: "ecr-sh.yun.lsne.cn/kubevirt/csi-resizer:v1.4.0"
          imagePullPolicy: IfNotPresent
          args:
            - "--v=5"
            - "--csi-address=$(ADDRESS)"
            - "--timeout=60s"
            - "--leader-election"
            - "--retry-interval-start=500ms"
            - "--handle-volume-inuse-error=false"
          env:
            - name: ADDRESS
              value: "unix:///csi/csi-provisioner.sock"
          volumeMounts:
            - name: socket-dir
              mountPath: /csi
          resources:
            {}
        - name: csi-snapshotter
          image: ecr-sh.yun.lsne.cn/kubevirt/csi-snapshotter:v4.2.0
          imagePullPolicy: IfNotPresent
          args:
            - "--csi-address=$(ADDRESS)"
            - "--v=5"
            - "--timeout=60s"
            - "--leader-election=true"
          env:
            - name: ADDRESS
              value: "unix:///csi/csi-provisioner.sock"
          volumeMounts:
            - name: socket-dir
              mountPath: /csi
          resources:
            {}
        - name: csi-attacher
          image: "ecr-sh.yun.lsne.cn/kubevirt/csi-attacher:v3.4.0"
          imagePullPolicy: IfNotPresent
          args:
            - "--v=5"
            - "--csi-address=$(ADDRESS)"
            - "--leader-election=true"
            - "--retry-interval-start=500ms"
          env:
            - name: ADDRESS
              value: "unix:///csi/csi-provisioner.sock"
          volumeMounts:
            - name: socket-dir
              mountPath: /csi
          resources:
            {}
        - name: csi-rbdplugin
          image: "ecr-sh.yun.lsne.cn/kubevirt/cephcsi:v3.6.1"
          imagePullPolicy: IfNotPresent
          args:
            - "--nodeid=$(NODE_ID)"
            - "--type=rbd"
            - "--controllerserver=true"
            - "--pidlimit=-1"
            - "--endpoint=$(CSI_ENDPOINT)"
            - "--csi-addons-endpoint=$(CSI_ADDONS_ENDPOINT)"
            - "--v=5"
            - "--drivername=$(DRIVER_NAME)"
            - "--rbdhardmaxclonedepth=8"
            - "--rbdsoftmaxclonedepth=4"
            - "--maxsnapshotsonimage=450"
            - "--minsnapshotsonimage=250"
          env:
            - name: POD_IP
              valueFrom:
                fieldRef:
                  fieldPath: status.podIP
            - name: DRIVER_NAME
              value: rbd.csi.ceph.com
            - name: NODE_ID
              valueFrom:
                fieldRef:
                  fieldPath: spec.nodeName
            - name: CSI_ENDPOINT
              value: "unix:///csi/csi-provisioner.sock"
            - name: CSI_ADDONS_ENDPOINT
              value: "unix:///csi/csi-addons.sock"
          volumeMounts:
            - name: socket-dir
              mountPath: /csi
            - mountPath: /dev
              name: host-dev
            - mountPath: /sys
              name: host-sys
            - mountPath: /lib/modules
              name: lib-modules
              readOnly: true
            - name: ceph-csi-config
              mountPath: /etc/ceph-csi-config/
            - name: ceph-config
              mountPath: /etc/ceph/
            - name: ceph-csi-encryption-kms-config
              mountPath: /etc/ceph-csi-encryption-kms-config/
            - name: keys-tmp-dir
              mountPath: /tmp/csi/keys
            - name: oidc-token
              mountPath: /run/secrets/tokens
              readOnly: true
          resources:
            {}
        - name: csi-rbdplugin-controller
          image: "ecr-sh.yun.lsne.cn/kubevirt/cephcsi:v3.6.1"
          imagePullPolicy: IfNotPresent
          args:
            - "--type=controller"
            - "--v=5"
            - "--drivername=$(DRIVER_NAME)"
            - "--drivernamespace=$(DRIVER_NAMESPACE)"
          env:
            - name: DRIVER_NAMESPACE
              valueFrom:
                fieldRef:
                  fieldPath: metadata.namespace
            - name: DRIVER_NAME
              value: rbd.csi.ceph.com
          volumeMounts:
            - name: ceph-csi-config
              mountPath: /etc/ceph-csi-config/
            - name: keys-tmp-dir
              mountPath: /tmp/csi/keys
            - name: ceph-config
              mountPath: /etc/ceph/
          resources:
            {}
        - name: liveness-prometheus
          image: "ecr-sh.yun.lsne.cn/kubevirt/cephcsi:v3.6.1"
          imagePullPolicy: IfNotPresent
          args:
            - "--type=liveness"
            - "--endpoint=$(CSI_ENDPOINT)"
            - "--metricsport=8080"
            - "--metricspath=/metrics"
            - "--polltime=60s"
            - "--timeout=3s"
          env:
            - name: CSI_ENDPOINT
              value: "unix:///csi/csi-provisioner.sock"
            - name: POD_IP
              valueFrom:
                fieldRef:
                  fieldPath: status.podIP
          ports:
            - containerPort: 8080
              name: metrics
              protocol: TCP
          volumeMounts:
            - name: socket-dir
              mountPath: /csi
          resources:
            {}
      volumes:
        - name: socket-dir
          emptyDir: {
            medium: "Memory"
          }
        - name: host-dev
          hostPath:
            path: /dev
        - name: host-sys
          hostPath:
            path: /sys
        - name: lib-modules
          hostPath:
            path: /lib/modules
        - name: ceph-config
          configMap:
            name: "ceph-config"
        - name: ceph-csi-config
          configMap:
            name: "ceph-csi-config"
        - name: ceph-csi-encryption-kms-config
          configMap:
            name: "ceph-csi-encryption-kms-config"
        - name: keys-tmp-dir
          emptyDir: {
            medium: "Memory"
          }
        - name: oidc-token
          projected:
            sources:
              - serviceAccountToken:
                  path: oidc-token
                  expirationSeconds: 3600
                  audience: ceph-csi-kms
---
# Source: ceph-csi-rbd/templates/csidriver-crd.yaml
apiVersion: storage.k8s.io/v1

kind: CSIDriver
metadata:
  name: rbd.csi.ceph.com
spec:
  attachRequired: true
  podInfoOnMount: false

kubectl create -f provisioner.yaml 
```

#### 5. 创建 storageclass   

> 根据实际情况修改:

- `clusterID: 37a2ea4a-187b-11ed-8d31-b4055d13cde8`
- `pool: k8s`

```yaml
# vim storageclass.yaml

apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
   name: cephcsi
provisioner: rbd.csi.ceph.com
# volumeBindingMode: WaitForFirstConsumer
parameters:
   clusterID: 37a2ea4a-187b-11ed-8d31-b4055d13cde8
   pool: k8s
   imageFeatures: "layering"
   csi.storage.k8s.io/provisioner-secret-name: csi-rbd-secret
   csi.storage.k8s.io/provisioner-secret-namespace: ceph-csi-rbd
   csi.storage.k8s.io/controller-expand-secret-name: csi-rbd-secret
   csi.storage.k8s.io/controller-expand-secret-namespace: ceph-csi-rbd
   csi.storage.k8s.io/node-stage-secret-name: csi-rbd-secret
   csi.storage.k8s.io/node-stage-secret-namespace: ceph-csi-rbd
   csi.storage.k8s.io/fstype: ext4
reclaimPolicy: Delete
allowVolumeExpansion: true
mountOptions:
   - discard
   
# kubectl create -f storageclass.yaml
```


### 在 k8s 中使用: 创建 pvc

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: rbd-pvc
  namespace: test
spec:
  storageClassName: cephcsi
  accessModes:
    - ReadWriteOnce
  volumeMode: Filesystem
  resources:
    requests:
      storage: 1Gi
```

### 将该pv挂进Pod

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx
  namespace: test
spec:
  selector:
    matchLabels:
      app: nginx
  replicas: 1
  template:
    metadata:
      labels:
        app:  nginx
    spec:
      containers:
      - name:  nginx
        image:  nginx:latest
        resources:
          requests:
            cpu: 100m
            memory: 200Mi
          limits:
            cpu: 100m
            memory: 200Mi
        ports:
        - containerPort: 80
          name: web
        volumeMounts:
        - name: www
          mountPath: /usr/share/nginx/html
      volumes:
      - name: www
        persistentVolumeClaim:
          claimName: rbd-pvc
```