
```go
// Created by lsne on 2023-03-13 16:06:29

package main

import (
	"fmt"
	"time"
)

func gosingle() {
	var quit = make(chan struct{}, 1)
	go func() {
		defer fmt.Println("退出了线程")
		for i := 0; i < 10000; i++ {
			select {
			case <-quit:
				fmt.Println("收到退出信号")
				return
			default:
				fmt.Println("输出 i 的值: ", i)
			}
			time.Sleep(1 * time.Second)
		}
	}()
	fmt.Println("开始等待")
	time.Sleep(10 * time.Second)
	fmt.Println("等待结束")
	quit <- struct{}{}
	fmt.Println("结束子函数")
	return
}

func main() {
	gosingle()
	fmt.Println("进入了主函数")
	time.Sleep(10 * time.Second)
	fmt.Println("结束主函数")
}

```

```go
	mch := make(chan string, 2)
	mch <- "abc"
	mch <- "123"

	go func() {
		for {
			select {
			case s, ok := <-mch:
				if !ok {           // 如果不判断 ok ,  通道在 close 之后会死循环一直输出
					return
				}
				fmt.Println("输出第一行:", s)
			}
		}
	}()

	for i := 0; i < 100; i++ {
		time.Sleep(1 * time.Second)
		mch <- "test"
	}

	close(mch)
```