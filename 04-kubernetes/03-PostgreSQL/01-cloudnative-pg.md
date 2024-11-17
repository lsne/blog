# cloudnative-pg

### 准备

简写: cnpg
cnpg 的 github 地址: https://github.com/cloudnative-pg/cloudnative-pg
cnpg 的 helm 地址: https://github.com/cloudnative-pg/charts
#### image

```
operator: ghcr.io/cloudnative-pg/cloudnative-pg:1.23.3
postgreSQL: ghcr.io/cloudnative-pg/postgresql:16.3
```

#### kubectl 插件

```
https://github.com/cloudnative-pg/cloudnative-pg/releases/download/v1.23.4/kubectl-cnpg_1.23.4_linux_x86_64.tar.gz
```

### 安装部署 cloudnative-pg 环境

#### 安装 kubectl cnpg 插件

1. 下载插件

```
wget https://github.com/cloudnative-pg/cloudnative-pg/releases/download/v1.23.4/kubectl-cnpg_1.23.4_linux_x86_64.tar.gz
```

2. 解压, 并将二进制文件 `kubectl-cnpg` 复制到 PATH 路径下

```
tar zxvf kubectl-cnpg_1.23.4_linux_x86_64.tar.gz
cp kubectl-cnpg /usr/bin/
```

3. 测试
```
kubectl cnpg --help
```

#### 安装 operator

1. 下载