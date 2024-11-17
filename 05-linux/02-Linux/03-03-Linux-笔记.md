# Linux 笔记

## 共享库


#### 指定共享库搜索路径

> `LD_LIBRARY_PATH` 变量指定了动态链接器在运行时搜索共享库的路径

```sh
export LD_LIBRARY_PATH=/usr/local/pgsql12.16/lib:$LD_LIBRARY_PATH
```
#### 指定共享库

>  `LD_PRELOAD` 变量用于指定在其他共享库之前加载的共享库。它可以用于覆盖某些函数或进行调试

```sh
export LD_PRELOAD=/path/to/your/library.so
```
#### 调试加载过程

> `LD_DEBUG`: 这个变量用于调试动态链接器的行为。设置为 `libs` 可以让您看到库的加载过程。

```sh
export LD_DEBUG=libs
```

#### 配置文件

> `/etc/ld.so.conf` 这个文件包含了动态链接器的默认搜索路径。您可以在这个文件中添加新的路径。
> 
> `/etc/ld.so.conf.d/` 这个目录中的每个文件也可以指定额外的库搜索路径。将路径添加到该目录中的文件后，您需要运行 `ldconfig`。

#### ldconfig

> 这个命令用于更新系统的共享库缓存。运行 `ldconfig` 可以使新的库路径生效。它会在 `/etc/ld.so.cache` 中存储共享库的路径，以加快后续的查找速度

#### 默认搜索路径

> 如果没有设置以上环境变量或配置文件，动态链接器会在以下默认路径中搜索共享库

```
/lib
/usr/lib
/lib64
/usr/lib64
```

## 常用操作

#### ssh 不提示 `yes/no`

```sh
ssh -o StrictHostKeyChecking=no username@hostname
```

#### Linux 设置代理

```sh
# 网络代理
export http_proxy=http://proxy.lsne.cn:3128
export https_proxy=http://proxy.lsne.cn:3128

# 取消代理
unset http_proxy
unset https_proxy
```

#### 编译, 升级内核

```sh
yum install -y centos-release-scl
yum -y install devtoolset-9-gcc devtoolset-9-gcc-c++ devtoolset-9-binutils
scl enable devtoolset-9 bash
source /opt/rh/devtoolset-9/enable
```

#### vim 命令取消自动注释

```sh
# vim 复制代码包含 注释 或 缩进 时格式会乱掉
# 粘贴代码时取消自动缩进

set paste

# 取消纯复制模式
set nopaste
```

#### 设置不记录历史命令

```sh
set +o history
```
## 基本操作

#### 在常用脚本里查找关键字

```sh
find /usr/local/addops/scripts/dba/ /etc/dbscript/script -type f |xargs grep 'findkey' | awk -F':' '{print $1}'|sort -u
```

#### 排序筛选

> 获取以 `数字 + ms` 结尾的记录, 并以数值排序

```sh
tail -n 5000 mongod.log|grep -E "[0-9]{1,20}ms$" |awk '{print $NF,$0}' | sort -n
```

#### 按以 `.` 分割的第3列数值排序

```sh
cat abc | sort -n -t="." -k=3

# 或
cat abc | sort --numeric-sort --field-separator="." --key=3
```
#### 解析dns域名

```sh
dig  db01v.cpp.shjt2.lsne.cn  +short
```
#### 查看僵尸进程

```sh
ps -A -ostat,ppid,pid,cmd | grep -e '^[Zz]'
```

#### `curl` +  `用户密码` 下载文件

```sh
curl -ulsne:xxxxxxx -O https://af-biz.lsne.cn/artifactory/test/test-file.tar.gz 
```

#### `wget` +  `用户密码` 下载文件

```sh
wget --user='lsne' --password='xxxxxxxxxxxx' https://af-biz.lsne.cn:443/artifactory/lsne-test/test-file.tar.gz
```

#### systemctl 相关

```sh
systemctl daemon-reload

journalctl -f -u clickhouse-server
```

#### sudo 自动输入密码

```sh
# 设置 sudo 每次都必须输入密码, 没有保持时间
vim /etc/sudoers
Defaults timestamp_timeout=0

echo "xxxx" | sudo -S -k ls /root

sudo -S表示从标准输入读取密码
sudo -k 表示撤销用户缓存的密码, 因为sudo会话默认会保留15min
```

#### 获取 passwd 文件信息

```sh
getent passwd
```

#### 修改时区

```
# 修改时区
cd /etc && ln -snf ../usr/share/zoneinfo/Asia/Shanghai localtime && cd -
```

#### `set` 和 `--` 的使用

```sh
# set 可以配置脚本的行为
set -e  # 当任何命令返回非零状态时，立即退出脚本。
set -u  # 使用未定义变量时，立即退出脚本。
set -x  # 在执行每个命令时打印该命令，这对于调试很有用。

# set 可以重新设置位置参数 $1、$2 等
$ set a b c
$ echo $1
a
$ echo $2
b
$ echo $3
c

# -- 是标准的“不要将此后的任何内容视为选项”, 
# 如下示例: 如果 set 后没有 -- 则 --haproxy 会被认为是 set 这个命令本身的参数(set --help), 找不到这个参数会报错

$ set -- --haproxy "$@"
$ echo $1, $2, $3, $4
# 输出: --haproxy, a, b, c
```

#### sudo 命令用法

```sh
sudo -H -S -p 'sudo passwordaa:' /bin/bash -l -c "if [ 1 == 1 ];then echo 1111; fi;"

# -H 表示环境变量用root用户的环境
# -S 表示从标准输入获取密码
# -p 表示提示输入密码的提示符

/bin/bash -l 使bash就像被作为登录shell调用一样
/bin/bash -c 从字符串读取命令。 如果字符串后面有参数，则将它们分配给位置参数

user_flags = ""
        if user is not None:
            user_flags = "-H -u {} ".format(user)
        command = self._prefix_commands(command)
        cmd_str = "sudo -S -p '{}' {}{}".format(prompt, user_flags, command)
        watcher = FailingResponder(
            pattern=re.escape(prompt),
            response="{}\n".format(password),
            sentinel="Sorry, try again.\n",
        )
```

#### 设置指定用户对指定文件只读

> 设置 lsne 操作系统用户, 对 `/etc/ceph/ceph.client.admin.keyring` 文件具有读权限

```sh
sudo setfacl -m u:lsne:r /etc/ceph/ceph.client.admin.keyring
```

## 磁盘操作

#### 磁盘挂载

```sh
# 1. 分区
# MBR分区格式:
echo -e "n\np\n1\n\n\nw\n" | fdisk /dev/sdb

# GPT分区格式:
parted --script /dev/sdb \
    mklabel gpt \
    unit s \
    mkpart primary 2048s 100%
 
2. 格式化
mkfs -t ext4 /dev/sdb1
 
3. 挂载
mkdir /disk01
echo "UUID=`lsblk /dev/sdb1 -no UUID`  /disk01  ext4  defaults  0  0" >> /etc/fstab
# mount -a
```

#### 查看磁盘raid 情况

```sh
# 查看磁盘设备ID和状态
/sbin/MegaCli -PDlist -aALL |egrep -E 'Enclosure Device ID|Firmware state|Slot Number' | awk '{if(NR%3!=0)ORS=" ";else ORS="\n"}1'

# 查看磁盘是raid几
/sbin/MegaCli -LDInfo -Lall -aALL
RAID Level          : Primary-1, Secondary-0, RAID Level Qualifier-0    # Primary-1 表示 raid1
RAID Level          : Primary-5, Secondary-0, RAID Level Qualifier-3    # Primary-5 表示 raid5
```

#### 磁盘做 `raid 0`

```sh
mdadm --stop /dev/md127
umount /data1 /data2 /data3 /data4 /data5
mdadm -Cv /dev/md127 -l0 -n5 /dev/sd[b-f]
mkfs.xfs /dev/md127

-l0 ：设定 raid level;raid0模式
-n5 : 指定阵列中可用 device 数目，这个数目只能由 --grow 修改; 5块
```

#### 宝存卡磁盘检查

```text
shannon-status -a /dev/dfa
```

## 系统操作

#### swap回收

```sh
swapoff -a && swapon -a
```

#### 查看进程数量

```sh
ps -eLf | wc -l
```

#### 查看最大进程数

```sh
sysctl kernel.pid_max
```

#### 按进程监控CPU,内存,磁盘

```sh
yum -y install sysstat
pidstat -urd -p <port> | tail -n1
```

#### 按进程监控流量

```sh
yum -y install iftop
iftop  -Pp -Nn -t -L 1000 -s 1 -B -i eth0
然后聚合汇总
```

#### 查看进程内存态

```sh
pstack <PID>
```

#### 查看进程启动时间

```sh
ps -eo pid,lstart,etime,cmd | grep 1868
```

#### 检测机器资产信息

> 获取系统版本, MAC地址, 硬件厂商,  机型, 序列号SN

```sh
#获取主机名
hostname; uname -a  ; cat /etc/sysconfig/network;     #推荐第一个

#获取系统版本
cat /etc/issue; cat /etc/redhat-release; uname ; lsb_release; #用前两个结合。因为只用其中一个可能获取不到

#获取mac地址
cat /sys/class/net/eth0/address ; ifconfig eth0 ; ip a;   #推荐第一个
cat /sys/class/net/[^vtlsb]*/address                      #^不是以 vtlsb 开头

#esxi 获取mac  :   esxcfg-vmknic -l | awk '{print $8}' | grep ':'

cat /sys/class/net/[^vtlsb]*/address  || esxcfg-vmknic -l | awk '{print $8}' | grep ':'

#获取硬件厂商，机型,序列号SN
dmidecode -s system-manufacturer;
dmidecode -s system-product-name;
dmidecode -s system-serial-number;
```
## 网络操作

#### 忽略icmp包(禁ping)

```sh
echo 1 > /proc/sys/net/ipv4/icmp_echo_ignore_all
```

#### nmap使用

```sh
# 向180发送一个包问谁是这个IP，用参数 -sP 。 资产扫描要用这个方式。 比较效率
# -n 表示不用反解析
nmap -n -sP 10.209.4.180

#探测主机的端口
nmap -n -PE 10.209.4.180

# 探测某一个网段有哪些主机存活, 之所以 -sP -PE 两种参数都加上。 是因为如果被探测主机禁用了某一个协议(如: icmp)。有可能探测不出来。用两种比较保险
nmap -n -sP -PE 10.209.4.0/24
```

#### tcpdump 抓包工具

```sh
tcpdump -np -i eth0 src host 10.209.32.135
```
#### 抓包

```sh
sar -n DEV 1
mpstat -P ALL 1

# 抓包
tcpdump -nn -i any -w test.cap &

# 分析
tcpdump -nn -r test.cap dst host 10.208.56.246 |awk '{print $3}'|awk -F "." '{print $1"."$2"."$3"."$4}'|sort |uniq -c |sort -n

# 或用 windows 上的 Wireshark 分析

```

## 设置历史命令格式


> [!WARNING] 失败了
> 发现显示的用户和登录终端登录IP都是当前执行history命令时的信息,失败！！！

```shell
export LOGIN_USER=`who -m 2>/dev/null| awk '{print $1, $2}'`
export LOGIN_IP=`who -m 2>/dev/null| awk '{print $NF}'|sed -e 's/[()]//g'`
export HISTFILESIZE=10000000
export HISTSIZE=1000000
export PROMPT_COMMAND="history -a"
export HISTTIMEFORMAT="[ %F %T $LOGIN_USER $LOGIN_IP ] "
```