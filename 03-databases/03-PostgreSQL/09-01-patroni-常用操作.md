# patroni 常用操作

```sh
# 查看集群状态
patronictl  -c /usr/patroni/conf/patroni_postgresql.yml list

patronictl -c /usr/patroni/conf/patroni_postgresql.yml restart batman
```

### 从库修复

```sh
systemctl status patroni
systemctl stop patroni
ls
du -sh *
rm -rf data/
systemctl start patroni
systemctl status patroni
```