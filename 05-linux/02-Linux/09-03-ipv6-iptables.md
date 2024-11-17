# IPV6

## ipv6 私有网段

```linux
fd00::/8

使用
fd01::1:1/112
```

```linux
▷ 公网地址：“全球单播地址”（Global Unicast Address，2000::/3）
▷ 私网地址：“唯一本地地址”（Unique-Local Address，fc00::/7）
```

## ipv6 私网IP划分规则

```linux
在IPv4中，可以使用10.0.0.0/8；172.16.0.0/12；192.168.0.0/16作为私有地址，为实验或内网使用。同样，在IPv6中也有私有地址。

IPv6中的私有地址被称为“唯一本地地址”，其固定前缀为FC00::/7

地址结构：
001～007位：固定为“1111110”
008～008位：取值为“1”表示是本地地址；取值为“0”表示保留
009～048位：全球唯一前缀，随机生成
049～064位：子网ID，由管理者自行划分
065～128位：主机地址
```

## 配置示例

```linux
[root@test3 ~]# cat /etc/sysconfig/network-scripts/ifcfg-ens33 
TYPE=Ethernet
PROXY_METHOD=none
BROWSER_ONLY=no
BOOTPROTO=static
DEFROUTE=yes
IPV4_FAILURE_FATAL=no
IPV6INIT=yes
IPV6_AUTOCONF=yes
IPV6_DEFROUTE=yes
IPV6_FAILURE_FATAL=no
IPV6_ADDR_GEN_MODE=stable-privacy
IPV6ADDR=fd01::1:51/112
IPV6_DEFAULTGW=fd01::1:1
NAME=ens33
UUID=b624026b-a9f8-4eed-8744-958f368459e0
DEVICE=ens33
ONBOOT=yes
IPADDR=192.168.43.123
PREFIX=24
GATEWAY=192.168.43.16
DNS1=192.168.43.16
IPV6_PRIVACY=no
```

## iptables 

```
Linux 6：
 
iptables -I INPUT -p tcp --dport 2181 -j DROP
iptables -I INPUT -s 10.46.177.0/24 -p tcp --dport 2181 -j ACCEPT
iptables -I INPUT -s 10.46.172.xx -p tcp --dport 2181 -j ACCEPT
 
service iptables save
service iptables restart
 
iptables -L
Linux 7:
 
firewall-cmd --zone=public --remove-port=2181/tcp --permanent
firewall-cmd --permanent --add-rich-rule=“rule family=“ipv4” source address=“10.xx.xx.xx” port protocol=“tcp” port=“2181” accept”
firewall-cmd --reload
firewall-cmd --list-all
```