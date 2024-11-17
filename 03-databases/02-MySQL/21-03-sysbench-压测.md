```
1. mysql 里提前创建测试用户. 例: sysbench

2. mysql 里提前创建测试库. 例: sysbench

3. 安装 sysbench
curl -s https://packagecloud.io/install/repositories/akopytov/sysbench/script.rpm.sh | sudo bash 
yum -y install sysbench

4. 准备向库里写入表数据:
sysbench /usr/share/sysbench/oltp_read_write.lua --time=300 --mysql-host=10.249.22.179 --mysql-port=11086 --mysql-user=sysbench --mysql-password='123456' --mysql-db=sysbench --table-size=10000000 --tables=30 --threads=30 prepare

5. 压测 oltp 读写场景
sysbench /usr/share/sysbench/oltp_read_write.lua --time=600 --mysql-host=10.249.22.179 --mysql-port=11086 --mysql-user=sysbench --mysql-password='123456' --mysql-db=sysbench --table-size=10000000 --tables=30 --threads=300 run

6. 压测 oltp 写
sysbench /usr/share/sysbench/oltp_read_only.lua --time=600 --mysql-host=10.249.22.179 --mysql-port=11086 --mysql-user=sysbench --mysql-password='123456' --mysql-db=sysbench --table-size=10000000 --tables=30 --threads=300 run
```