# rsync 使用

## 实现一台机器的脚本同步到其他多台机器上

### 一. 脚本机器部署

> yun01v.cpp.zzt.lsne.cn

#### 1. 创建配置文件: `vim /etc/rsyncd.conf`

```toml
uid = root
gid = root
use chroot = yes
max connections = 500
timeout = 900
pid file = /var/run/rsyncd.pid
log file = /var/log/rsyncd.log
lock file = /var/run/rsyncd.lock

[yun]
path = /usr/local/yun
read only = true
write only = false
auth users = rsync
secrets file = /etc/rsyncd.secrets
list = no
exclude = .git README.md
```

#### 2. 创建密钥文件: `/etc/rsyncd.secrets`

```
rsync:8f38a.0wWa204fbVe7A5deT69d2Z575_dfca603fd8SLN2lhs30SDNK34Sfn
```

#### 3. 设置密钥文件权限

```
chmod 600 /etc/rsyncd.secrets
```

#### 4. 启动 rsync 

```
systemctl enable rsync
systemctl restart rsync
```

#### 5. 使用

> 在其他机器执行

```
# 登录在其他机器执行以下命令。将脚本机上的 /usr/local/yun 目录同步到本地 /usr/local/yun 目录

RSYNC_PASSWORD="123456" rsync -avz rsync@yun01v.lsne.cn::yun /usr/local/yun/
```

### 二. 其他所有机器部署

> 以 mytestceph01v.cpp.bjat.lsne.cn 机器示例

#### 1. 创建配置文件: `vim /etc/rsyncd.conf`

```
uid = root
gid = root
use chroot = yes
max connections = 2
timeout = 900
pid file = /var/run/rsyncd.pid
log file = /var/log/rsyncd.log
lock file = /var/run/rsyncd.lock

[yun]
path = /usr/local/yun
read only = false
write only = true
auth users = rsync
secrets file = /etc/rsyncd.secrets
list = no
exclude = .git README.md
```

#### 2. 创建密钥文件: `/etc/rsyncd.secrets`

```
rsync:b2cY533Pe4dfQ31b80c_f82fcb6Ue8eXacb.a95sw802jnh98SHO2
```

#### 3. 设置密钥文件权限

```
chmod 600 /etc/rsyncd.secrets
```

#### 4. 启动 rsync 

```
systemctl enable rsyncd
systemctl restart rsyncd
```


#### 5. 使用

> 在脚本机执行

```
# 登录脚本机执行以下命令。将脚本机上的 /usr/local/yun 目录同步到开启 rsync 服务的 /usr/local/yun 目录

RSYNC_PASSWORD="123456" rsync --contimeout=5 -avz --delete --exclude ".git" --exclude "README.md" /usr/local/yun/ rsync@mytestceph01v.cpp.lsne.cn::yun
```