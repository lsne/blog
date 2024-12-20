# Clickhouse 问题处理
## Too many parts

```
这个问题在clickhouse写入过程中还是比较常见的，根因是clickhouse merge的速度跟不上part的 生成速度。这个时候我们的优化方向可以从两个方面层面考虑，写入侧和clickhouse侧。

在日志的写入侧我们降低写入的频次，通过攒batch这种方式来降低clickhouse part的生成速度。缺点是这种攒批会导致数据的时延会增高，对于实时查询的体感较差。而且，如果写入只由batch大小控制，那么在数据断流的时候就会有一部分数据无法写入。因为日志场景下对数据查询的时效性要求比较高，所以我们除了设置batch大小还会有一个超时时间的配置项。当达到这个超时时间，即便batch大小没有达到指定大小，也会执行写入操作。

在写入侧配置了满足业务需求的参数配置之后，我们的part生成速度依然超过了merge的速度。所以我们在clickhouse这边也进行了merge相关的参数配置，主要目的是控制merge的消耗的资源，同时提升merge的速度。

Merge相关的参数，我们主要修改了以下几个：

min_bytes_for_wide_part
这个参数是用来指定落盘的part格式。当part的大小超过了配置就会生成wide part，否则为compact part。日志属于写多读少的一个场景，通过增大这个参数，我们可以让频繁生成的part在落盘时多为compact part。因为compact part相较于wide part小文件的个数要更少一些，测试下来，我们发现相同的数据量，compact part的merge速度要优于wide part。相关的还有另一个参数min_rows_for_wide_part，作用跟min_bytes_for_wide_part相似。

max_bytes_to_merge_at_min_space_in_pool
当merge的线程资源比较紧张时，我们可以通过调整这个参数来配置可merge part的最大大小。默认大小是1M，我们将这个参数上调了。主要的原因是，我们在频繁写入的情况下，merge资源基本处于打满的状态。而写入的part大小基本也都超过了1M，此时这些part就不被merge，进而导致part数据不断变多，最终抛出Too many parts的问题。

max_bytes_to_merge_at_max_space_in_pool
这个参数是用来指定merge线程资源充足时可merge的最大part大小。通过调整这个参数，我们可以避免去merge一些较大的part。因为这些part的合并耗时可能是小时级别的，如果在这期间有较为频繁的数据写入，那就有可能会出现merge线程不够而导致的too many parts问题。

background_pool_size
默认线程池大小为16，我们调整为32，可以有更多的线程资源参与merge。之所以没有继续上调这个参数，是因为较多的merge线程可能会导致系统的CPU和IO负载过高。
```