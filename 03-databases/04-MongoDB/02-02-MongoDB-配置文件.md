# Mongodb 配置文件

####  yaml 格式 mongod  配置

```yaml
processManagement:
  fork: true
  pidFilePath: /opt/mongodb27022/mongod.pid
net:
  bindIp: 127.0.0.1,10.249.105.53     # 等保三级需要非0.0.0.0
  port: 27022                         # 等保三级需要非27017端口
  maxIncomingConnections: 5000
  serviceExecutor: adaptive
  #ssl:
  #  mode: requireSSL
  #  PEMKeyFile: /opt/mongodb27022/config/mongodb.pem     # 等保三级可能需要
systemLog:
  destination: file
  path: /opt/mongodb27022/logs/mongod.log
  logAppend: true
storage:
  dbPath: /opt/mongodb27022/data
  journal:
    enabled: true
    commitIntervalMs: 100
  directoryPerDB: true
  wiredTiger:
    engineConfig:
      cacheSizeGB: 1
      journalCompressor: snappy
      directoryForIndexes: true
    collectionConfig:
      blockCompressor: snappy
operationProfiling:
  mode: slowOp
  slowOpThresholdMs: 10000
replication:
  oplogSizeMB: 51200
  replSetName: testmdb
security:
  keyFile: /opt/mongodb27022/data/keyfile
  authorization: enabled                     # 等保三级需要
setParameter:
  enableLocalhostAuthBypass: true
  honorSystemUmask: true
cloud:
  monitoring:
    free:
      state: "off"
```

---
#### ini 格式 mongod 配置

```ini
#SERVER
fork = true
port = 7469
quiet = true
bind_ip = 0.0.0.0
maxConns = 20000
logappend = true
dbpath = /data1/mongodb7469
logpath = /data1/mongodb7469/log/mongod.log
journal = true
#nohttpinterface = true
directoryperdb = true

storageEngine=wiredTiger
wiredTigerCacheSizeGB=10
wiredTigerCollectionBlockCompressor=snappy

#SLOW_LOG
profile = 1
slowms = 10

#RS
replSet=7469
oplogSize=8192
# add for 3.4
#shardsvr = false

#SCO
#configsvr = false
#configdb = MSCHOST
#setParameter=enableLocalhostAuthBypass=1

#USER
keyFile=/data1/mongodb7469/keyFile
setParameter=enableLocalhostAuthBypass=1
setParameter=failIndexKeyTooLong=0
setParameter=honorSystemUmask=true

#VER
#mongo_version=mongodb40

```

#### ini 格式 config 配置

```ini
#SERVER
fork = true
port = 27117
quiet = true
bind_ip = 0.0.0.0
maxConns = 20000
logappend = true
dbpath = /data1/mongodb27117
logpath = /data1/mongodb27117/log/mongod.log
journal = true
#nohttpinterface = true
directoryperdb = true

storageEngine=wiredTiger
wiredTigerCacheSizeGB=15
wiredTigerCollectionBlockCompressor=snappy

#SLOW_LOG
profile = 1
slowms = 10

#RS
replSet=27117
oplogSize=30720
# add for 3.4
#shardsvr = false

#SCO
configsvr=true
#configdb = MSCHOST
#setParameter=enableLocalhostAuthBypass=1

#USER
keyFile=/data1/mongodb27117/keyFile
setParameter=enableLocalhostAuthBypass=1
setParameter=failIndexKeyTooLong=0
setParameter=honorSystemUmask=true

#VER
#mongo_version=mongodb40
```

#### ini 格式 mongos 配置

```ini
#SERVER
fork = true
port = 37943
quiet = true
bind_ip = 0.0.0.0
logpath = /data1/mongodb37943/log/mongod.log
logappend = true
#nohttpinterface = true
maxConns = 20000

#SLOW_LOG

configdb=27943/10.208.66.37:27943,10.208.66.36:27943,10.208.66.35:27943

#USER
keyFile=/data1/mongodb37943/keyFile
setParameter=enableLocalhostAuthBypass=1
setParameter=honorSystemUmask=true

#VER
#mongo_version=mongodb40

```

