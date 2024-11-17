# Python gPRC 使用方法

#### 安装 proto 模块, 安装 proto 工具

```shell
pip install grpcio
pip install grpcio-tools
```

#### 开始使用

> 示例项目的目录结构如下

```
myapp
-- grpc_cli
    -- grpc_cli.go
-- grpc_proto
    -- testD.pb.go
    -- testD.proto
-- grpc_server
    -- grpc_server.go
```

#### 编写proto文件

> `cat myapp/grpc_proto/testD.proto`

```proto
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

#### 编译 proto 文件

```
# 编译 proto 文件
python -m grpc_tools.protoc --python_out=. --grpc_python_out=. -I. helloworld.proto

python -m grpc_tools.protoc: 
python 下的 protoc 编译器通过 python 模块(module) 实现, 所以说这一步非常省心
--python_out=. : 编译生成处理 protobuf 相关的代码的路径, 这里生成到当前目录
--grpc_python_out=. : 编译生成处理 grpc 相关的代码的路径, 这里生成到当前目录
-I. helloworld.proto : proto 文件的路径, 这里的 proto 文件在当前目录
```

#### 编写 server 代码

```python
#!/usr/bin/env python
# -*- coding:utf-8 -*-
# @Author : lsne
# @Date : 2020-01-01 13:45

from concurrent import futures
import time
import grpc
from test.grpc.proto import test_pb2
from test.grpc.proto import test_pb2_grpc

# 实现 proto 文件中定义的 GreeterServicer
class AddService(test_pb2_grpc.AddServiceServicer):
    # 实现 proto 文件中定义的 rpc 调用
    def Add(self, request, context):
        a = request.a
        b = request.b
        result = a + b
        return test_pb2.Response(l="Python", result=result)

def serve():
    # 启动 rpc 服务
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    test_pb2_grpc.add_AddServiceServicer_to_server(AddService(), server)
    server.add_insecure_port('[::]:50051')
    server.start()
    try:
        while True:
            time.sleep(60*60*24)  # one day in seconds
    except KeyboardInterrupt:
        server.stop(0)

if __name__ == '__main__':
    serve()
```

#### 编写 client 代码

```python
#!/usr/bin/env python
# -*- coding:utf-8 -*-
# @Author : lsne
# @Date : 2020-01-01 14:05

import grpc
from test.grpc.proto import test_pb2
from test.grpc.proto import test_pb2_grpc

def run():
    # 连接 rpc 服务器
    channel = grpc.insecure_channel('localhost:50051')
    # 调用 rpc 服务
    stub = test_pb2_grpc.AddServiceStub(channel)
    r = stub.Add(test_pb2.Request(a=1, b=2))
    print("Greeter client received: " + r.l + "..." + str(r.result))

if __name__ == '__main__':
    run()
```

#### 完成

> 并亲测与Golang的相同的proto文件生产的server和client联动，可以互相访问