
```go
// Created by lsne on 2022-02-08 12:31:04

package main

import (
	"flag"
	"fmt"
	"os"
	"strings"
	"tools/go/sshkey/sshtask"
)

//用来接收命令行参数
type sshOption struct {
	username string
	password string
	hosts    string
	timeout  int64
	force    bool
}

//解析命令行参数
func optionParse() sshOption {

	var (
		opt sshOption
	)

	flag.StringVar(&opt.username, "username", "", "登录用户,默认空")
	flag.StringVar(&opt.password, "password", "", "密码，默认空")
	flag.StringVar(&opt.hosts, "hosts", "1.1.1.1,2.2.2.2:2222", "要创建互信的源主机列表, 以逗号(,)分割")
	flag.Int64Var(&opt.timeout, "timeout", 10, "mongodb连接的超时时间,单位秒默认10")
	flag.BoolVar(&opt.force, "force", false, "遇到公钥私钥只存在一个的情况, 是否强制重新生成密钥对, 并覆盖. 默认: false")

	flag.Parse()

	if opt.username == "" {
		fmt.Println("请通过 -username 参数指定 ssh 用户名; 如果需要密码, 请通过 -password 参数指定 ssh 密码 ")
		os.Exit(1)
	}

	if len(strings.Split(opt.hosts, ",")) <= 1 {
		fmt.Println("主机列表必须大于等于2")
		os.Exit(1)
	}

	return opt
}

func main() {
	opt := optionParse()
	task := &sshtask.SSHKeyTask{
		Username: opt.username,
		Password: opt.password,
		Hosts:    strings.Split(opt.hosts, ","),
		Timeout:  opt.timeout,
	}
	if err := task.Connect(); err != nil {
		fmt.Println("创建连接失败")
		os.Exit(1)
	}

	if err := task.GenerateKeyFiles(opt.force); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}

	if err := task.SSHKeyscan(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}

	if err := task.SSHCopyID(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}

```