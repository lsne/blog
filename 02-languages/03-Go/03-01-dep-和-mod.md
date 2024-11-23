# dep 和 mod
## dep使用方法

使用 dep 前提条件
- 项目必须在 GOPATH/src 目录下的子目录中
- 执行 `dep init` 对项目做初始化

```bash
cd $GOPATH/src/github.com/xiaopengfeng/testdep/
dep init

# 作用:
# 备份当前的vender，创建vender目录并下载项目中的所有依赖包，生成Gopkg.lock和Gopkg.toml
# 以下是两个文件的作用说明:
# 简单讲Gopkg.toml是清单文件，Gopkg.lock是校验描述文件。尽量不要修改，避免造成两个文件不同步# 的错误。
```

 ###### `dep status`

> 用来查看项目依赖的详细信息和状态，非常清晰。

 ###### `dep ensure`

> 尝试确保所有的依赖库都已经安装，如果没有即下载，相当于对依赖库做增量更新。

 ###### `dep ensure add github.com/RoaringBitmap/roaring@^1.0.1`

> 下载添加新的依赖库，并增量更新清单文件和校验描述文件。github.com/RoaringBitmap/roaring 是依赖库的包名，1.0.1是库的版本号。

## mod使用方法

> 官方出品, 项目可以在任何地方(不必非在GOPATH/src 目录中)

```text
GO111MODULE=off go命令从不使用新模块支持。使用GOPATH模式(查找vendor目录和GOPATH路径下的依赖)
GO111MODULE=on go命令开启模块支持,只根据go.mod下载和查找依赖
GO111MODULE=auto 默认值,go命令根据当前目录启用或禁用模块支持。仅当当前目录位于$GOPATH/src之外并且其本身包含go.mod文件或位于包含go.mod文件的目录下时，才启用模块支持。
```

### 常用操作

##### go mod 初始化项目

> `go mod init github.com/lsne/dbmapi`

一定要写 `github.com/lsne/dbmapi` , 因为这样和 GOPATH 方式导入的路径是一样的.不这样起名,如果有人用 GOPATH 方式引用这个项目的包或函数的时候,会提示找不到路径。
此命令会在当前目录中初始化和创建一个新的 `go.mod` 文件
当然你也可以手动创建一个 `go.mod` 文件，然后包含一些module声明，这样就比较麻烦。`go mod init` 命令可以帮助我们自动创建

##### go mod 依赖自动管理

> 自动下载缺少的依赖并添加到 go.mod 文件
> 自动清理不需要的依赖

默认情况下，Go不会移除 `go.mod` 文件中的无用依赖。所以当你的依赖中有些使用不到了，可以使用go mod tidy命令来清除它。
用法：`go mod tidy [-v]` 它会添加缺失的模块以及移除不需要的模块。执行后会生成go.sum文件(模块下载条目)。添加参数 `-v`，例如go mod tidy -v 可以将执行的信息，即移除的模块打印到标准输出。
##### go mod 下载包

> 命令: `go mod download`

用法：`go mod download [-dir] [-json] [modules]`。使用此命令来下载指定的模块，模块的格式可以根据主模块依赖的形式或者path@version形式指定。如果没有指定参数，此命令会将主模块下的所有依赖下载下来。
`go mod download` 命令非常有用，主要用来预填充本地缓存或者计算Go模块代理的回答。默认情况下，下载错误会输出到标准输出，正常情况下没有任何输出。-json参数会以JSON的格式打印下载的模块对象，对应的Go对象结构是这样。

##### go mod vendor

用法：go mod vendor [-v]，此命令会将build阶段需要的所有依赖包放到主模块所在的vendor目录中，并且测试所有主模块的包。同理go mod vendor -v会将添加到vendor中的模块打印到标准输出

##### go mod verify

用法：go mod verify。此命令会检查当前模块的依赖是否已经存储在本地下载的源代码缓存中，以及检查自从下载下来是否有修改。如果所有的模块都没有修改，那么会打印all modules verified，否则会打印变化的内容。

### `go.mod` 文件翻墙

```go
// go.mod 添加
replace (
    golang.org/x/crypto => github.com/golang/crypto latest
    golang.org/x/sys => github.com/golang/sys latest
)
```