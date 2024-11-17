# go pprof 使用方法

### 导入包并编译启动
#### 1.  导入包

> 导入pprof以及http包,并在main函数中,在所有任务之前加入 go func() { }  启动web监听

```go
import (
    "net/http"
    _ "net/http/pprof"
)

func main() {
    go func() {
        log.Println(http.ListenAndServe("0.0.0.0:10000", nil))
    }()
    execTask()  //这里是原本的正常任务,必须是一个运行时间长的任务。不然程序顺间就退出了。没办法用pprof分析
}
```

#### 2.  编译并启动

```go
go build -o test_mem visitmongo.go

./test_mem
```

#### 3.  话外小结: 输出内存GC信息(pprof用不到,直接忽略)

```go
可以通过设置 GODEBUG='gctrace=1' 将程序的每次内存回收信息记录信息打印出来。如:

go build -o test_mem visit_mongo.go && GODEBUG='gctrace=1' ./test_mem
```

## 开始使用

#### 1.  可以直接打开浏览器,查看相关信息

```text
http://10.209.32.135:10000/debug/pprof/
```

#### 2.  可以生产svg格式的文件，通过浏览器打开文件观察所关注的信息走向

```text
生成 内存 相关信息:
go tool pprof -alloc_space -cum -svg http://127.0.0.1:10000/debug/pprof/heap > heap.svg
```

#### 3.  命令行方式,查看内存信息

```go
go tool pprof http://localhost:6060/debug/pprof/heap

然后就可以执行命令查看相关信息了
(pprof) top

(pprof) list

(pprof) traces

等命令

```

#### 4.  使用 base 比较两个时间的差值

```go
go tool pprof http://localhost:6060/debug/pprof/heap
Ctrl + d

sleep 300

go tool pprof http://localhost:6060/debug/pprof/heap
Ctrl + d

go tool pprof -base /home/lsne/pprof/pprof.test_mem.alloc_objects.alloc_space.inuse_objects.inuse_space.013.pb.gz /home/lsne/pprof/pprof.test_mem.alloc_objects.alloc_space.inuse_objects.inuse_space.014.pb.gz

然后就可以执行命令查看相关信息了
(pprof) top

(pprof) list

(pprof) traces

等命令

```

#### 5.  查看 goroutine 信息

```go
go tool pprof http://localhost:10000/debug/pprof/goroutine
然后就可以执行命令查看相关信息了
(pprof) top

(pprof) list

(pprof) traces

等命令

```

#### 6.  或者,使用 base 比较两个时间的差值

```go
go tool pprof http://localhost:6060/debug/pprof/goroutine
Ctrl + d

sleep 300

go tool pprof http://localhost:6060/debug/pprof/goroutine
Ctrl + d

go tool pprof -base /home/lsne/pprof/pprof.test_mem.goroutine.002.pb.gz /home/lsne/pprof/pprof.test_mem.goroutine.003.pb.gz

然后就可以执行命令查看相关信息了
(pprof) top

(pprof) list

(pprof) traces

等命令

```

#### 7.  通过web查看goroutine阻塞问题

```go
http://10.209.32.135:10000/debug/pprof/goroutine?debug=1

页面(不能上图,只能这样了):
goroutine profile: total 405                                                                                     //阻塞的线程总数量
288 @ 0x42f83b 0x42f8e3 0x40762e 0x40735b 0x83a0ff 0x45cd41                                                      //这个位置阻塞的数量
#    0x83a0fe    main.doRedis+0xce    /data/workspaces/myscript/src/visitmongo/visitmongo.go:544       //阻塞的函数 和在哪个文件的哪一行
2 @ 0x42f83b 0x42f8e3 0x40762e 0x40735b 0x83ba2c 0x45cd41                                                        //这个位置阻塞的数量
#    0x83ba2b    main.writeNewStat+0x6b    /data/workspaces/myscript/src/visitmongo/visit_mongo.go:623   //阻塞的函数 和在哪个文件的哪一行
```

#### 8.  或者，查看每一个goroutine阻塞的详细情况，比如堵塞时间等

```go
http://10.209.32.135:10000/debug/pprof/goroutine?debug=2

页面(不能上图,只能这样了):
goroutine 92406 [chan receive]:                                                                                     //阻塞原因，阻塞时长
main.doRedis(0xc0001842a0, 0xc000212180, 0xc0002121e0, 0xc0022bf920, 0xc0022bf930, 0xc0022bf940)
    /data/workspaces/myscript/src/visitmongo/visitmongo.go:544 +0xcf                                    //代码行数
created by main.startTask
    /data/workspaces/myscript/src/visitmongo/visitmongo.go:657 +0x2d2
```

## 第二种使用方法，查看性能消耗

#### 1.  生产profile文件

```go
go test -bench . -cpuprofile cpu.out
```

#### 2.  查看profile文件

```go
to tool pprof cpu.out
```

#### 3.  在交互界面输入命令

```go
(pprof)web
```

