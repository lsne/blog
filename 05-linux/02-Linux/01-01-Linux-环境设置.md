# Linux 环境设置

#### 1. 关闭服务

```shell
netstat -ntlp

chkconfig rpcbind off
chkconfig cups off
chkconfig postfix off
chkconfig nfslock off
chkconfig iptables off

service rpcbind stop
service cups stop
service postfix stop
service nfslock stop
service iptables stop

selinux

hosts,IP,主机名

ssh 关闭参数
ntp
yum_ftp (一定不要把iso复制到ftp下,克隆之后在复制)
```
