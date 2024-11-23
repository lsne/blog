# monitor 监视器的使用

### 监视器的作用

#### 1. 监控数据守护系统

>  接收守护进程发送的消息，显示主、备数据库状态变化，以及故障切换过程中，数据库模式、状态变化的完整过程。

#### 2. 管理数据守护系统

>  用户可以在监视器上输入命令，启动、停止守护进程的监控功能，执行主备库切换、备库故障接管等操作。

#### 3. 确认状态信息

>  用于故障自动切换的数据守护系统中，主、备库进行故障处理之前，需要通过监视器进行信息确认，确保对应的备库或者主库是真的产生异常了，避免主备库之间网络故障引发脑裂。

#### 4. 发起故障自动接管命令

>  用于故障自动切换的数据守护系统中，主库发生故障时，挑选符合接管条件的备库，并通知备库执行接管操作


### 监视器类型

>  监控模式（dmmonitor.ini: MON_DW_CONFIRM=0）
>  确认模式（dmmonitor.ini: MON_DW_CONFIRM=1）
>  区别：确认监视器除了具备监控模式监视器所有功能外，还具有状态确认和自动接管两个功能。
>  通常我们是把确认监视器注册成服务后台运行。
>  前台则启动一个非确认监视器用来查看数据库状态信息。

### 确认监视器的配置文件 dmmonitor.ini

```
MON_DW_CONFIRM = 1 #确认监视器模式
MON_LOG_PATH = /home/dmdba/dmdbms/data/log #监视器日志文件存放路径
MON_LOG_INTERVAL = 60 #每隔 60s 定时记录系统信息到日志文件
MON_LOG_FILE_SIZE = 32 #每个日志文件最大 32M
MON_LOG_SPACE_LIMIT = 0 #不限定日志文件总占用空间
[GRP1]
MON_INST_OGUID = 453332 #组 GRP1 的唯一 OGUID 值
#以下配置为监视器到组 GRP1 的守护进程的连接信息，以IP:PORT的形式配置
#IP 对应 dmmal.ini 中的 MAL_HOST，PORT 对应 dmmal.ini 中的 MAL_DW_PORT
MON_DW_IP = 172.16.1.141:52141
MON_DW_IP = 172.16.1.142:52142
```

### 普通监视器的配置文件 dmmonitor1.ini

```
MON_DW_CONFIRM = 0 #非确认监视器模式
MON_LOG_PATH = /home/dmdba/dmdbms/data/log #监视器日志文件存放路径
MON_LOG_INTERVAL = 60 #每隔 60s 定时记录系统信息到日志文件
MON_LOG_FILE_SIZE = 32 #每个日志文件最大 32M
MON_LOG_SPACE_LIMIT = 0 #不限定日志文件总占用空间
[GRP1]
MON_INST_OGUID = 453332 #组 GRP1 的唯一 OGUID 值
MON_DW_IP = 172.16.1.141:52141
MON_DW_IP = 172.16.1.142:52142

```

### 注册监视器服务

```
[root@dw_p /home/dmdba/dmdbms/script/root]# ./dm_service_installer.sh -t dmmonitor -monitor_ini /home/dmdba/dmdbms/bin/dmmonitor.ini -p _MONITOR
```

### 启动服务：

```
[root@dw_p /home/dmdba/dmdbms/bin]# ./DmMonitorService_MONITOR start
```

### 启动普通监视器

```
[root@dw_p /home/dmdba/dmdbms/bin]# ./dmmonitor dmmonitor1.ini
```

### 使用普通监视器

- tip 查看系统当前运行状态
- list 列出所有守护进程配置信息
- show 显示全局信息
- login 登录监视器
- logout 登出监视器
- 更多命令使用方法可以输入help查找