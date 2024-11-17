# Oracle 安装


### 1. 下载包

```
scp -r lsne@myserver03v.cpp.bjat.lsne.cn:/home/lsne/package/oracle/LINUX.X64_193000_db_home.zip .
```

### 2. 安装依赖

```
yum install -y https://yum.oracle.com/repo/OracleLinux/OL7/latest/x86_64/getPackage/oracle-database-preinstall-19c-1.0-1.el7.x86_64.rpm
```

### 3. 设置 limits.conf

> 安装 oracle-database-preinstall-19c 会自动设置 limits 相关, 这一步不需要了

```
vi /etc/security/limits.conf

oracle soft nproc 2047
oracle hard nproc 16384
oracle soft nofile 1024
oracle hard nofile 65536
```

### 4. 设置环境变量

```
vi /home/oracle/.bash_profile

export ORACLE_SID=mydb01
export ORACLE_BASE=/opt/oracle/app/oracle
export ORACLE_HOME=$ORACLE_BASE/product/19c/dbhome_1
export PATH=$ORACLE_HOME/bin:$ORACLE_HOME/OPatch:$PATH
export TNS_ADMIN=$ORACLE_HOME/network/admin
export LD_LIBRARY_PATH=$ORACLE_HOME/lib:$ORACLE_HOME/lib32:/lib/usr/lib:/usr/local/lib

export TEMP=/tmp

export TMP=/tmp

export LC_ALL=en_US.UTF-8
export LANG=en_US.UTF-8
export NLS_LANG=AMERICAN_AMERICA.ZHS16GBK
```

### 5. 创建目录

```
mkdir -p /opt/oracle/app/oracle/product/19c/dbhome_1
mkdir -p /opt/oracle/data
mkdir -p /opt/oracle/etc
chown -R oracle:oinstall /opt/oracle
```

### 6. 解压

```
cd /home/oracle/oracle/
unzip LINUX.X64_193000_db_home.zip
mv /home/es-ops/oracle/* /opt/oracle/app/oracle/product/19c/dbhome_1/
cp /opt/oracle/app/oracle/product/19c/dbhome_1/install/response/db_install.rsp /opt/oracle/etc/
cp /opt/oracle/app/oracle/product/19c/dbhome_1/assistants/netca/netca.rsp /opt/oracle/etc/
chown -R oracle:oinstall /opt/oracle
```

### 7.  编辑文件并安装

```
vim /opt/oracle/etc/db_install.rsp

修改以下行, 其他保持默认:

oracle.install.responseFileVersion=/oracle/install/rspfmt_dbinstall_response_schema_v19.0.0

oracle.install.option=INSTALL_DB_SWONLY

UNIX_GROUP_NAME=oinstall

INVENTORY_LOCATION=/opt/oracle/app/oraInventory
ORACLE_HOME=

ORACLE_BASE=/opt/oracle/app/oracle




oracle.install.db.InstallEdition=EE

oracle.install.db.OSDBA_GROUP=dba

oracle.install.db.OSOPER_GROUP=dba

oracle.install.db.OSBACKUPDBA_GROUP=dba

oracle.install.db.OSDGDBA_GROUP=dba

oracle.install.db.OSKMDBA_GROUP=dba

oracle.install.db.OSRACDBA_GROUP=dba
```

### 8. 安装 

```
./runInstaller -silent -responseFile /opt/oracle/etc/db_install.rsp -ignorePrereq
```

### 9. root 用户执行脚本

```
su - root

/opt/oracle/app/oraInventory/orainstRoot.sh
/opt/oracle/app/oracle/product/19c/dbhome_1/root.sh
```

### 10. 启动监听

```
netca -silent -responsefile /opt/oracle/app/oracle/product/19c/dbhome_1/assistants/netca/netca.rsp

lsnrctl status
lsnrctl start
lsnrctl stop
```

### 11. 安装数据库实例

```
su - oracle

dbca -silent -createDatabase \
-databaseConfigType SINGLE \
-templateName General_Purpose.dbc \
-gdbname mydb01 \
-sid mydb01 \
-listeners LISTENER \
-responseFile NO_VALUE \
-characterSet AL32UTF8 \
-sysPassword 123456 \
-systemPassword 123456 \
-createAsContainerDatabase true \
-numberOfPDBs 1 \
-pdbName orclpdb \
-pdbAdminPassword 123456 \
-databaseType MULTIPURPOSE \
-memoryPercentage 20 \
-storageType FS \
-datafileDestination "${ORACLE_BASE}/oradata/mydb01" \
-emConfiguration DBEXPRESS
```


## 创建用户

### 1. 创建 CDB 用户

```
// alter session set container=accounts;  # 默认就是好像
sqlplus / as sysdba
create user c##test002 identified by "test002";   // 用户名不能加引号, 要不然 sqlplus 的时候登录不上。加引号测试两次都登录不上
grant connect to c##test002;
grant resource to c##test002;
或
create user C##TSTUSER1 identified by tstuser1 container=all;
grant connect to C##TSTUSER1 container=all;
grant resource to C##TSTUSER1 container=all;
```

### 2. 使用 CDB 用户登录

```
sqlplus C##TEST002/test002
或
sqlplus "C##TEST002"/"test002"@10.57.144.44:1521/mydb01
```

### 3. 创建 PDB 用户

```
alter session set container=ORCLPDB; 
create user "myuser01" identified by "123456";
```

### 4. 使用 PDB 用户登录

```
首先需要创建 $TNS_ADMIN/tnsnames.ora 文件, 文件中添加解析项
# 类似这样, 不过这个示例在测试时没有成功
orcl2=
  (DESCRIPTION=
    (ADDRESS=(PROTOCOL=TCP)(HOST=10.57.144.44)(PORT=1521))
    (CONNECT_DATA=(SERVICE_NAME=MYDB03))
  )
  
 然后登录(未成功)
 sqlplus myuser01/"123456"@orcl2
```

### 13. 查看用户

```
SELECT username,PROFILE FROM dba_users;

# 查看 default 的超时时间
SELECT * FROM dba_profiles s WHERE s.profile='DEFAULT' AND resource_name='PASSWORD_LIFE_TIME';

# 设置 不超时
ALTER PROFILE DEFAULT LIMIT PASSWORD_LIFE_TIME UNLIMITED;
```

### 14. 查看 service 名

```
select value from v$parameter where name = 'service_name';
```

## 卸载

### 1. 停止监听

```
lsnrctl stop
```

