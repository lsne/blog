# Redis ACL 和 TLS
### 配置

```
daemonize no

# ACL 用户密码
user default off
user admin on #39e2f9c7fec0156f4d96cfb4856399cb94b64db062e399577726a5c72a7184ea ~* +@all

# TLS 关闭非ssl端口, 开启
port 0
tls-port 6389
tls-cert-file /opt/tls/redis.crt
tls-key-file /opt/tls/redis.key
tls-ca-cert-file /opt/tls/ca.crt
tls-dh-params-file /opt/tls/redis.dh

# 开启客户ssl端认证
tls-auth-clients yes

# replication 配置
tls-replication yes
# masteruser default
# masterauth 123456

# cluster 配置
cluster-enabled yes
tls-cluster yes
```

### 生成密钥文件

```sh
cd redis-6.0.16
./utils/gen-test-certs.sh
ll tests/tls
-extfile extfile.cnf


如果需要添加IP:
首先创建 extfile.cnf 文件
echo subjectAltName = IP:10.30.0.163 > extfile.cnf

然后在 get-test-certs.sh 倒数第二行添加 -extfile extfile.cnf
[root@dbuptest04v utils]# cat gen-test-certs.sh 
#!/bin/bash
mkdir -p tests/tls
openssl genrsa -out tests/tls/ca.key 4096
openssl req \
    -x509 -new -nodes -sha256 \
    -key tests/tls/ca.key \
    -days 3650 \
    -subj '/O=Redis Test/CN=Certificate Authority' \
    -out tests/tls/ca.crt
openssl genrsa -out tests/tls/redis.key 2048
openssl req \
    -new -sha256 \
    -key tests/tls/redis.key \
    -subj '/O=Redis CN=10.249.105.53 IP=10.249.105.53 Test/CN=Server' | \
    openssl x509 \
        -req -sha256 \
        -CA tests/tls/ca.crt \
        -CAkey tests/tls/ca.key \
        -CAserial tests/tls/ca.txt \
        -CAcreateserial \
        -days 365 \
        -out tests/tls/redis.crt -extfile extfile.cnf
openssl dhparam -out tests/tls/redis.dh 2048


```

### 创建集群

```sh
/opt/redis6378/server/bin/redis-cli --user admin --pass 0e4b6bad2b3c1908 --tls --cert /opt/tls/redis.crt --key /opt/tls/redis.key --cacert /opt/tls/ca.crt --cluster create 127.0.0.1:6201 127.0.0.1:6202 127.0.0.1:6203 127.0.0.1:6204 127.0.0.1:6205 127.0.0.1:6206 --cluster-replicas 1
```

### 连入集群

```sh
/opt/redis6378/server/bin/redis-cli -p 6201 --tls --cert /opt/tls/redis.crt --key /opt/tls/redis.key --cacert /opt/tls/ca.crt
```

### Centos 7.6 编译选项

```sh
yum install -y centos-release-scl
yum -y install devtoolset-9-gcc devtoolset-9-gcc-c++ devtoolset-9-binutils
yum install openssl openssl-devel -y

scl enable devtoolset-9 bash
source /opt/rh/devtoolset-9/enable

可能需要安装: yum install -y libatomic

make BUILD_TLS=yes
```


```sh
include /opt/redis6379/data/conf/abc.conf

# Fatal error, can't open config file '/opt/redis6379/data/conf/*.conf': No such file or directory

晚写入的参数生效

```

### redis config 生成流程(开启 tls 后强制 port = 0)

```
关键参数传入POD环境变量
其他参数用直接用 configmap 定义为变量配置文本, 一个key 多行文本方式,  判断key有效性后直接将全部文本传入POD变量
    其他参数中 rename-command 行直接删除, 单独定义 rename-command
    其他参数中 client-output-buffer-limit 行直接删除, 单独定义 client-output-buffer-limit
    其他参数中 save 行直接删除, 单独定义 save

POD中:
    首先用其他参数的环境变量文本生成 redis.conf 文件
    
    然后把关键参数的环境变量追加到 redis.conf 文件
        关键参数中, 涉及到密码部分, 需要用 echo -n 'xxxxx' | sha256sum 转换
        masteruser, masterauth 参数密码需要明文追加
```