# 配置时间同步

## server 端部署

### 1. 安装 chrony

```
apt install chrony
```

### 2. 编辑配置文件: `vim /etc/chrony/chrony.conf`

> server 指令用于指定要同步的 NTP 服务器。
> iburst 是参数, 一般用此参数即可。该参数的含义是在头四次 NTP 请求以 2s 或者更短的间隔，而不是以 minpoll x 指定的最小间隔，这样的设置可以让 chronyd 启动时快速进行一次同步
>
> server hostname [option]


```ini
# Welcome to the chrony configuration file. See chrony.conf(5) for more
# information about usuable directives.

# This will use (up to):
# - 4 sources from ntp.ubuntu.com which some are ipv6 enabled
# - 2 sources from 2.ubuntu.pool.ntp.org which is ipv6 enabled as well
# - 1 source from [01].ubuntu.pool.ntp.org each (ipv4 only atm)
# This means by default, up to 6 dual-stack and up to 2 additional IPv4-only
# sources will be used.
# At the same time it retains some protection against one of the entries being
# down (compare to just using one of the lines). See (LP: #1754358) for the
# discussion.
#
# About using servers from the NTP Pool Project in general see (LP: #104525).
# Approved by Ubuntu Technical Board on 2011-02-08.
# See http://www.pool.ntp.org/join.html for more information.
# 因为想修改本地时间，不去和其他服务器同步，将下面这四个pool注释掉
#pool ntp.ubuntu.com        iburst maxsources 4
#pool 0.ubuntu.pool.ntp.org iburst maxsources 1
#pool 1.ubuntu.pool.ntp.org iburst maxsources 1
#pool 2.ubuntu.pool.ntp.org iburst maxsources 2

# 添加自己作为服务器(如果需要同步其他服务器的时间, 需要修改这里的IP)
server 192.168.1.1 iburst
# 为了方便客户端连接权限设置为允许所有
allow all
# 当无法和其他同步时，使用本地的时间去给客户端同步
local stratum 10

# This directive specify the location of the file containing ID/key pairs for
# NTP authentication.
keyfile /etc/chrony/chrony.keys

# This directive specify the file into which chronyd will store the rate
# information.
driftfile /var/lib/chrony/chrony.drift

# Uncomment the following line to turn logging on.
#log tracking measurements statistics

# Log files location.
logdir /var/log/chrony

# Stop bad estimates upsetting machine clock.
maxupdateskew 100.0

# This directive enables kernel synchronisation (every 11 minutes) of the
# real-time clock. Note that it can’t be used along with the 'rtcfile' directive.
rtcsync

# Step the system clock instead of slewing it if the adjustment is larger than
# one second, but only in the first three clock updates.
makestep 1 3
```

#### 重启服务

```sh
service chrony restart
```

#### 查看当前时间

```sh
timedatectl status
```

#### 手动同步时间

```sh
chronyc makestep
```

#### 检查时间同步状态

```sh
chronyc tracking
```

#### 查看 NTP 服务器

```sh
chronyc sources
```