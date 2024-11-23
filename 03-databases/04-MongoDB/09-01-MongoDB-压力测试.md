# MongoDB 压力测试
## 下载安装java

```sh
https://www.java.com/zh-CN/download/manual.jsp

rpm -ivh jre-8u311-linux-x64.rpm

```

## 下载安装Maven 

> 这一步是为了使用 mongodb-async 的, 最终也没搞好。所以没必要搞这一步了

```sh
http://ftp.heanet.ie/mirrors/www.apache.org/dist/maven/maven-3/3.8.4/binaries/

tar zxvf apache-maven-3.8.4-bin.tar.gz -C /usr/local
ln -s apache-maven-3.8.4 maven

vim /etc/bashrc
export M2_HOME=/usr/local/maven
export PATH=${M2_HOME}/bin:${PATH}
source /etc/bashrc
```

## 下载并安装mongodb驱动包

> 这一步是为了使用 mongodb-async 的, 最终也没搞好。所以没必要搞这一步了

```sh
wget http://www.allanbank.com/repo/com/allanbank/mongodb-async-driver/2.0.1/mongodb-async-driver-2.0.1.jar

cd ycsb-0.17.0/

mvn install:install-file -Dfile=../mongodb-async-driver-2.0.1.jar  -DgroupId=com.allanbank -DartifactId=mongodb-async-driver -Dversion=2.0.1 -Dpackaging=jar
```

## 下载解压ycsb

```sh
ycsb-mongodb-binding-0.17.0.tar.gz
tar zxvf ycsb-mongodb-binding-0.17.0.tar.gz
cd ycsb-mongodb-binding-0.17.0
```

## 修改压测文件

```sh
cp workloads/workloada workloads/testa
vim workloads/testa

fieldcount: 每条记录字段个数 (default: 10)
fieldlength: 每个字段长度 (default: 100)
readallfields: 是否读取所有字段true或者读取一个字段false (default: true)
readproportion: 读取作业比例 (default: 0.95)
updateproportion: 更新作业比例 (default: 0.05)
insertproportion: 插入作业比例 (default: 0)
scanproportion: 扫描作业比例 (default: 0)
readmodifywriteproportion: 读取一条记录修改它并写回的比例 (default: 0)
requestdistribution: 请求的分布规则 uniform, zipfian or latest (default: uniform)
maxscanlength: 扫描作业最大记录数 (default: 1000)
scanlengthdistribution: 在1和最大扫描记录数的之间的分布规则 (default: uniform)
insertorder: 记录被插入的规则ordered或者hashed (default: hashed)
operationcount: 执行的操作数.
maxexecutiontime: 执行操作的最长时间，当然如果没有超过这个时间以运行时间为主。
table: 测试表的名称 (default: usertable)
recordcount: 加载到数据库的纪录条数 (default: 0)
```

## 载入数据, 可同时记录insert压测效果

```sh
./bin/ycsb load mongodb -p mongodb.url='mongodb://lsne:123456@mongo35055a.yun.lsne.cn:35055,mongo35055b.yun.lsne.cn:35055,mongo35055c.yun.lsne.cn:35055/ycsb?authSource=admin' -threads 300 -s -P workloads/testa
```

## 压测

```sh
./bin/ycsb run mongodb -p mongodb.url='mongodb://lsne:123456@mongo35055a.yun.lsne.cn:35055,mongo35055b.yun.lsne.cn:35055,mongo35055c.yun.lsne.cn:35055/ycsb?authSource=admin' -threads 1000 -s -P workloads/testa
```