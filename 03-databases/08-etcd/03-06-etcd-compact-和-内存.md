
### compact 的作用

#### compcat 参数

> auto-compact 相当于etcd定期执行 `compact` 命令

```yaml
# 按时间设置, 保留72h, 清理72小时之前的历史 revision 版本
# periodic 模式每一小时扫描清理一次
auto-compaction-mode: "periodic"
auto-compaction-retention: "72h"

# 按版本设置, 保留最近 3000 个 revision
# revision 模式每5分钟扫描清理一次
auto-compaction-mode: revision
auto-compaction-retention: 3000
```

#### compact 不回收内存使用大小

```
compact 操作只是将内存中早期 revision 版本的数据标记为过期, 这部分数据的存储空间可以被新数据覆盖写入, 并不会减小当前使用内存的总体大小。
只是把清理出来的内存空间可以给新写入的数据使用。
在内存空洞再次被写满之前不会在增大内存使用大小了。
```

#### 回收内存空间

```
想要实际的回收 etcd 当前使用的总内存大小, 需要在完成 compact 操作之后,  手动执行 defrag 命令 
```