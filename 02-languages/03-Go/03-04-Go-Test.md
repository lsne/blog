# Golang 测试

## go test -v

#### 示例

> `testgo.go` 为正常程序文件

```go
package main

import "fmt"

func Print1to20() (resa int) {
    res := 0
    for i := 1; i <= 20; i++ {
        res += i
    }
    resa = res
    return resa
}

func main() {
    a := Print1to20()
    fmt.Println(a)
}
```

>  `testgo_test.go` 为对 `testgo.go` 文件的测试文件

```go
package main

import (
    "fmt"
    "testing"
)

func TestPrint1to20(t *testing.T) {
    res := Print1to20()
    fmt.Println("hey")
    if res != 210 {
        t.Error("Wrong result of Print1to20")
    }
}
```

>  执行 `go` 测试命令

```bash
go test -v
```

####  解释

```text
1. import testing
2. 测试函数必须Test开头,T必须大写. 如 TestPrint ,而如果定义了testPrint函数,可以在TestPrint这个测试函数里调用
3. TestPrint 函数传参: 只能传两种类型: *testing.T (测试功能 ) 或 *testing.B  (测试性能)
4. 判断逻辑,如果不符合结果 用 t.Errorf() 输出错误信息
5. t.SkipNow() 写在测试函数内第一行,跳过当前TEST

6. t.RUN  子函数测试
    t.RUN("a1", func(t testing.T) { } )

7. TestMain(m testing.M)  在所有test测试函数运行之前先运行(比如初始化的东西,打开文件,数据库连接等)
TestMain() 函数里必须要有 m.RUN() 否则所有TEST都不会被执行


8. 性能测试函数要以 Benchmark 开头， 测试时会运行 b.N 次
这个值会根据case的执行时间进行调整

for n := 0; n < b.N; n++ {
    Print1to20()
}
```

