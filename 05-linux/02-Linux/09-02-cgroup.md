#### 限制进程使用CPU

> 以 限制端口 5068 的mongodb 进程(PID 322079) 使用CPU限制到70% 为例

#### 一 安装cgroup 工具

```
yum install libcgroup libcgroup-tools
```

#### 二 创建新的资源组(组名随便起, 这里我以 端口号 5068 为组名)

```
cgcreate -g cpu,cpuset:/5068
```

#### 三 设置新资源组的CPU配额

```
这里设置 cpu 70%, 计算方式为 每个CPU的时间片(100000) * CPU核数(40) * 要限制到的CPU比例(70) / 100  = 2800000
 
cgset -r cpu.cfs_quota_us=2800000 5068
```

#### 四 将要限制的进程PID 写入资源组里的 cgroup.procs 文件

```
echo 322079 >>  /sys/fs/cgroup/cpu/5068/cgroup.procs
```

#### 五 完成