
# windows创建service

> 发现用这个方法会导致windows蓝屏，不能用了

#### 代码

```go
/*
@Author : lsne
@Date : 2020-06-24 21:13
*/

package main

import (
	"fmt"
	"os"

	"github.com/kardianos/service"
)

type program struct{}

func (p *program) Stop(s service.Service) error {
	panic("implement me")
}

func (p *program) Start(s service.Service) error {
	go p.run()
	return nil
}

func (p *program) run() {
	select {}
}

func main() {
	svcConfig := &service.Config{
		Name:        "QClient", //服务显示名称
		DisplayName: "QClient", //服务名称
		Description: "QClient", //服务描述
	}

	prg := &program{}
	s, err := service.New(prg, svcConfig)
	if err != nil {
		fmt.Println("创建service失败")
	}

	if len(os.Args) > 1 {
		if os.Args[1] == "install" {
			s.Install()
			fmt.Println("服务安装成功")
			return
		}

		if os.Args[1] == "remove" {
			s.Uninstall()
			fmt.Println("服务卸载成功")
			return
		}
	}

	err = s.Run()
	if err != nil {
		fmt.Println("运行出错")
	}

}

```

## 编译参数

```
 go build -ldflags="-H windowsgui"
```

## 注册服务

```
sc create QClient binPath= "D:\00_Program_Files\QClient\QClient.exe" start= auto
```