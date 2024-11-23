# Operator 开发
## Operator 常用操作

### 修改POD标签, 不重启POD (待验证)

> go 代码编写

```go
p := &corev1.Pod{}

nameinfo := types.NamespacedName{
	Name:      "nginx-deploy-59d8f5db5d-sqltm",
	Namespace: "default",
}

if err := r.Get(ctx, nameinfo, p); err != nil {
	reqLogger.Error(err, "unable to list child Jobs")
	return ctrl.Result{}, err
}

fmt.Println("获取到pod了")

p.ObjectMeta.Labels["role"] = "master"

if err := r.Update(context.TODO(), p); err != nil {
	fmt.Println("更新失败了！！！！")
	return ctrl.Result{}, err
}
```

> 挂载标签做为pod内文件

```
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
            role: "slave"
          annotations:
            lsne.c/create-by: "lsne admin"
        spec:
          volumes:
            - name: testlabel
              downwardAPI:
                items:
                  - path: "labels"
                    fieldRef:
                      fieldPath: metadata.labels
          containers:
          - name: nginx-c1
            image: nginx:1.20-alpine
            volumeMounts:
              - mountPath: /data1
                name: testlabel
```

> 测试修改 pod 标签, 看是否不用重启 pod

### 强制删除`pod`

#### 命令行方式

```sh
kubectl delete pod podName --grace-period=0 --force

如果不加 --force, 则 --grace-period=0 参数会强制改为 --grace-period=1
如果加上 --force, 则 --grace-period=0 生效。

--grace-period=0 可用 client-go这样实现:

client.pods().inNamespace(namespace).withName(podName).withGracePeriod(0).delete();

实际上是设置了  metav1.DeleteOptions.GracePeriodSeconds 参数
DeleteOptions{GracePeriodSeconds: &grace}
```

#### 使用 client-go 包强制删除

```go
import (
	"context"
	"fmt"

	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/kubernetes/scheme"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
)

func main() {

    // 初始化配置
    config, err := clientcmd.BuildConfigFromFlags("", clientcmd.RecommendedHomeFile)
	if err != nil {
		panic(err)
	}

	config.GroupVersion = &v1.SchemeGroupVersion
	config.NegotiatedSerializer = scheme.Codecs
	config.APIPath = "/api"

    // 创建 reset 客户端
	restClient, err := rest.RESTClientFor(config)
	if err != nil {
		panic(err)
	}

    // 创建 clientset 客户端
	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		panic(err.Error())
	}

    // 用 reset 客户端查询(reset 客户端也可以删除, 但没办法强制删除)
	pod1 := v1.Pod{}
	if err := restClient.Get().Namespace("testrc").Resource("pods").Name("drc-mytestrc-1-0").Do(context.TODO()).Into(&pod1); err != nil {
		panic(err)
	}
	fmt.Println(pod1.Name)
	
	// 用 clientset 客户端强制删除
	var s int64 = 0
	if err := clientset.CoreV1().Pods("testrc").Delete(context.TODO(), "drc-mytestrc-1-0", metav1.DeleteOptions{GracePeriodSeconds: &s}); err != nil {
		fmt.Println("删除报错了:", err)
	}
    
}
```

#### 使用 kubebuilder && controller-runtime 包强制删除

```go
import (
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

// RedisClusterReconciler reconciles a RedisCluster object
type RedisClusterReconciler struct {
	client.Client
	Scheme *runtime.Scheme
}

func (r *RedisClusterReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    pod := &corev1.Pod{}
	if err := r.Client.Get(context.TODO(), types.NamespacedName{
		Name:      "drc-mytestrc-2-1",
		Namespace: "testrc",
	}, pod); err != nil {
		fmt.Println("获取 pod drc-mytestrc-2-1 失败了")
	}

	var s client.GracePeriodSeconds = 0
	if err := r.Client.Delete(context.TODO(), pod, s); err != nil {
		fmt.Println("删除 pod drc-mytestrc-2-1 失败了")
	}
	
	return ctrl.Result{RequeueAfter: time.Second * 6000}, nil
}
```