## gPRC使用方法


##### 1. 下载并安装protocbuf生成器

> 分windows版本和linux版本,拷贝到path目录下

```text
https://github.com/google/protobuf/releases
```

##### 2. 下载依赖包

> 将protoc-gen-go 拷贝到path目录下

```bash
git clone https://github.com/grpc/grpc-go.git $GOPATH/src/google.golang.org/grpc

git clone https://github.com/golang/net.git $GOPATH/src/golang.org/x/net

git clone https://github.com/golang/text.git $GOPATH/src/golang.org/x/text

go get -u github.com/golang/protobuf/{proto,protoc-gen-go}

git clone https://github.com/google/go-genproto.git $GOPATH/src/google.golang.org/genproto

cd $GOPATH/src/

go install google.golang.org/grpc
```

##### 3. 开始使用, 示例项目的目录结构如下

```text
myapp
-- grpc_cli
    -- grpc_cli.go
-- grpc_proto
    -- testD.pb.go
    -- testD.proto
-- grpc_server
    -- grpc_server.go
```

##### 4. 第一步,编写 `proto` 文件

```proto
cat myapp/grpc_proto/testD.proto

syntax = "proto3";

package grpc_proto;

message Request {
    int64 a = 1;
    int64 b = 2;
}

message Response {
    string l = 1;
    int64 result = 2;
}

service AddService {
    rpc Add (Request) returns (Response);
}

```

##### 5. 生成 pb.go 文件

```text
cd myapp/grpc_proto
protoc -I ./ ./testD.proto --go_out=plugins=grpc:./

或者这样？？没试过
protoc --proto_path=myapp/grpc_proto/ --go_out=myapp/grpc_proto/ --micro_out=myapp/grpc_proto/ myapp/grpc_proto/testD.proto
```

##### 6. 编写 server 代码

```go
package main

import (
    "context"
    "net"
    "wserver/grpc_proto"          #wserver是用mod初始化的模块名

    "google.golang.org/grpc"
)

type TestService struct{}

func (TestService) Add(ctx context.Context, request *grpc_proto.Request) (response *grpc_proto.Response, err error) {
    a, b := request.A, request.B
    result := a + b
    return &grpc_proto.Response{L:"Golang", Result: result}, nil
}

func main() {
    conn, err := net.Listen("tcp", ":8080")
    if err != nil {
        panic(err)
    }
    srv := grpc.NewServer()
    grpc_proto.RegisterAddServiceServer(srv, &TestService{})
    if err := srv.Serve(conn); err != nil {
        panic(err)
    }
}

```

##### 7. 编写client代码

```go
package main

import (
    "context"
    "fmt"
    "wserver/grpc_proto"

    "google.golang.org/grpc"
)

func main() {
    conn, err := grpc.Dial("127.0.0.1:8080", grpc.WithInsecure())
    if err != nil {
        panic(err)
    }
    defer conn.Close()
    aC := grpc_proto.NewAddServiceClient(conn)
    a := &grpc_proto.Request{}
    a.B = 2
    a.A = 1
    rs, err := aC.Add(context.Background(), a)
    if err != nil {
        panic(err)
    }
    fmt.Print(rs.L, rs.Result)
}

```

##### 8. 完成

> 并亲测与python的相同的proto文件生产的server和client联动，可以互相访问

## go-micro使用方法


#### 1. 安装依赖

> 在以上gprc 的基础上。还需要安装proto工具的micro插件

```text
go get github.com/micro/protoc-gen-micro
```

#### 2. 编写proto文件,这里还是用上面grpc用的那个

#### 3. 生成pb.go 和 pb.micro.go 文件

```text
protoc --proto_path=. --micro_out=. --go_out=. proto/test.proto
```

#### 4. server代码

```go
/*
@Author : lsne
@Date : 2020-01-01 21:12
*/

package main

import (
    "context"
    "fmt"
    "github.com/micro/go-micro"
    test "github.com/xiaopingfeng/test/micro/proto"
    "time"
)

type As struct {}

func (As) Add(ctx context.Context, request *test.Request, response *test.Response) error {
    fmt.Println("Golang start ....")
    a, b := request.A, request.B
    result := a + b
    response.L = "Golang"
    response.Result = result
    return nil
}

func main() {
    service := micro.NewService(
            micro.Name("addserverhaha"),
            micro.RegisterTTL(time.Second*30),
            micro.RegisterInterval(time.Second*10),
            micro.Address(":9090"),
        )

    service.Init()
    test.RegisterAddServiceHandler(service.Server(), new(As))

    if err := service.Run(); err != nil {
        fmt.Println(err)
    }
}

```

#### 5. client端代码

```go
/*
@Author : lsne
@Date : 2020-01-01 23:07
*/

package main

import (
    "context"
    "fmt"
    "github.com/micro/go-micro"
    test "github.com/xiaopingfeng/test/micro/proto"
)

func main() {
    // Create a new service
    service := micro.NewService(
        micro.Name("addhahaaha.client"),
    )
    // Initialise the client and parse command line flags
    service.Init()

    // Create new greeter client, 这里的第一个参数"addserverhaha" 一定要与server端注册的 micro.Name("addserverhaha") 保持一致; 具体他是怎么依靠这个标识找到server端的没有研究
    as := test.NewAddService("addserverhaha", service.Client())

    // Call the greeter
    rsp, err := as.Add(context.TODO(), &test.Request{A: 1,B:2})
    if err != nil {
        fmt.Println(err)
    }

    fmt.Println(rsp)

    // Print response
    fmt.Println(rsp.L, rsp.Result)
}
```