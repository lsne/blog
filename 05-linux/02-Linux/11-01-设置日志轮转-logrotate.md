## 设置 ceph 的日志轮转

#### 添加 ceph 的日志轮转

> `vim /etc/logrotate.d/ceph`

```
/da1/var/log/ceph/*.log {
    rotate 7
    daily
    dateext
    compress
    sharedscripts
    postrotate
        killall -q -1 ceph-mon ceph-mds ceph-osd ceph-fuse radosgw || true
    endscript
    missingok
    notifempty
    su root root
}

/da1/var/log/ceph/*/*.log {
    rotate 7
    daily
    dateext
    compress
    sharedscripts
    postrotate
        killall -q -1 ceph-mon ceph-mds ceph-osd ceph-fuse radosgw || true
    endscript
    missingok
    notifempty
    su root root
}

/da1/ceph/log/rgw/*.log {
    rotate 7
    daily
    dateext
    compress
    sharedscripts
    postrotate
        killall -q -1 ceph-mon ceph-mds ceph-osd ceph-fuse radosgw || true
    endscript
    missingok
    notifempty
    su root root
}

/var/log/ceph/*.log {
    rotate 7
    daily
    dateext
    compress
    sharedscripts
    postrotate
        killall -q -1 ceph-mon ceph-mds ceph-osd ceph-fuse radosgw || true
    endscript
    missingok
    notifempty
    su root root
}

/var/log/ceph/*/*.log {
    rotate 7
    daily
    dateext
    compress
    sharedscripts
    postrotate
        killall -q -1 ceph-mon ceph-mds ceph-osd ceph-fuse radosgw || true
    endscript
    missingok
    notifempty
    su root root
}
```

#### 查看 linux 默认的定时执行

> cat /etc/cron.daily/logrotate

```shell
#!/bin/sh

/usr/sbin/logrotate -s /var/lib/logrotate/logrotate.status /etc/logrotate.conf
EXITVALUE=$?
if [ $EXITVALUE != 0 ]; then
    /usr/bin/logger -t logrotate "ALERT exited abnormally with [$EXITVALUE]"
fi
exit 0
```

#### 其中

```
-s /var/lib/logrotate/logrotate.status

# 是状态文件, 记录上次轮转信息。  上一次没有的新日志。下一次执行只做状态记录，不生成轮转。 下下次才会正常轮转
```