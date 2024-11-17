
### 所有k8s集群节点创建数据目录和prometheus配置文件

```yaml
# mkdir -p  /data1/k8s/prometheus/{data,config}
# vim /data1/k8s/prometheus/config/prometheus.yaml

# my global config
global:
  scrape_interval:     15s # Set the scrape interval to every 15 seconds. Default is every 1 minute.
  evaluation_interval: 15s # Evaluate rules every 15 seconds. The default is every 1 minute.
  # scrape_timeout is set to the global default (10s).

# Alertmanager configuration
alerting:
  alertmanagers:
  - static_configs:
    - targets:
      - localhost:9093

# Load rules once and periodically evaluate them according to the global 'evaluation_interval'.
rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

# A scrape configuration containing exactly one endpoint to scrape:
# Here it's Prometheus itself.
scrape_configs:
  # The job name is added as a label `job=<job_name>` to any timeseries scraped from this config.
  - job_name: 'prometheus'

    # metrics_path defaults to '/metrics'
    # scheme defaults to 'http'.

    static_configs:
    - targets: ['localhost:9090','wmdb99.add.bjyt:9100','10.208.66.147:9100']

  - job_name: 'testdic'
    metrics_path: "/metrics"
    file_sd_configs:
    - files:
      - testdic/*.json
      refresh_interval: 1m
```


### 改权限为 777

```sh
cd  /data1/k8s/prometheus/
chmod 777 -R *
```


### 创建内部账户

```yaml
# vim rbac.yaml

apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: prometheus
rules:
- apiGroups: [""]
  resources:
  - nodes
  - nodes/proxy
  - services
  - endpoints
  - pods
  verbs: ["get", "list", "watch"]
- apiGroups:
  - extensions
  resources:
  - ingresses
  verbs: ["get", "list", "watch"]
- nonResourceURLs: ["/metrics"]
  verbs: ["get"]
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: prometheus
  namespace: testrc
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: prometheus
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: prometheus
subjects:
- kind: ServiceAccount
  name: prometheus
  namespace: testrc
  
kubectl apply -f rbac.yaml
```

### 创建 prometheus

```yaml
# vim prometheus.yaml

apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    name: prometheus-deployment
  name: prometheus
  #namespace: kube-system
  namespace: testrc
spec:
  replicas: 1
  selector:
    matchLabels:
      app: prometheus
  template:
    metadata:
      labels:
        app: prometheus
    spec:
      containers:
      - image: prom/prometheus:v2.39.1
        name: prometheus
        command:
        - "/bin/prometheus"
        args:
        - "--config.file=/etc/prometheus/prometheus.yaml"
        - "--storage.tsdb.path=/prometheus"
        - "--storage.tsdb.retention=24h"
        ports:
        - containerPort: 9090
          protocol: TCP
        volumeMounts:
        - mountPath: "/prometheus"
          name: data
        - mountPath: "/etc/prometheus"
          name: config-volume
      serviceAccountName: prometheus
      volumes:
      - name: data
        hostPath:
          path: /data1/k8s/prometheus/data
          type: Directory
      - name: config-volume
        hostPath:
          path: /data1/k8s/prometheus/config
          type: Directory
          
kubectl apply -f prometheus.yaml
```


### 创建 service 对外暴露

```yaml
kind: Service
apiVersion: v1
metadata:
  labels:
    app: prometheus
  name: prometheus
  namespace: testrc
spec:
  type: NodePort
  ports:
  - port: 9090
    targetPort: 9090
    nodePort: 30003
  selector:
    app: prometheus
```


### 创建 grafana 数据目录

```sh
mkdir -p /data1/k8s/grafana
mkdir -p /data1/k8s/grafana/lib/grafana/plugins
chmod 777 -R /data1/k8s/grafana
```

### 创建grafana

```yaml
# vim grafana.yaml

apiVersion: apps/v1
kind: Deployment
metadata:
  name: grafana-core
  namespace: testrc
  labels:
    app: grafana
    component: core
spec:
  selector:
    matchLabels:
      app: grafana
  replicas: 1
  template:
    metadata:
      labels:
        app: grafana
        component: core
    spec:
      containers:
      - image: grafana/grafana:9.2.2
        name: grafana-core
        imagePullPolicy: IfNotPresent
        env:
          # The following env variables set up basic auth twith the default admin user and admin password.
          - name: GF_AUTH_BASIC_ENABLED
            value: "true"
          - name: GF_AUTH_ANONYMOUS_ENABLED
            value: "false"
          # - name: GF_AUTH_ANONYMOUS_ORG_ROLE
          #   value: Admin
          # does not really work, because of template variables in exported dashboards:
          # - name: GF_DASHBOARDS_JSON_ENABLED
          #   value: "true"
        readinessProbe:
          httpGet:
            path: /login
            port: 3000
          # initialDelaySeconds: 30
          # timeoutSeconds: 1
        volumeMounts:
        - name: grafana-persistent-storage
          mountPath: /var
      volumes:
      - name: grafana-persistent-storage
        hostPath:
          path: /data1/k8s/grafana
          type: DirectoryOrCreate
          
kubectl apply -f grafana.yaml
```

### 创建 grafana_service

```yaml
# vim grafana_service.yaml

apiVersion: v1
kind: Service
metadata:
  name: grafana
  namespace: testrc
  labels:
    app: grafana
    component: core
spec:
  type: NodePort
  ports:
    - port: 3000
      nodePort: 30011
  selector:
    app: grafana
    component: core
    
# kubectl apply -f grafana_service.yaml
```