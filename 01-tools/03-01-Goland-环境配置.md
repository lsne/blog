# Goland 安装配置

## Goland 环境设置

#### 1. 设置go路径

```text
go -- GOPATH
D:\00_Workspaces\.go
```

#### 2. 设置主题

```text
Appearance & Behavior -- Appearance  Theme: Darcula
    
```

#### 3. 设置字体大小 和 换行符

```text
Editor -- Font -- Font:Consolas
Editor -- Font -- Size:20
Editor -- File Encodings -- 三个地方 utf-8  ,一个地方 with NO BOM

Editor -- Code Style -- Line separator: Unix and macOS (\n)
```

#### 4. 安装插件

```text
Plugins
BashSupport
vue.js
element
file watchers    [[如果是idea环境，需要安装这个插件]](自带gofmt和goimports)
go fmt           [[默认自带]]
go imports       [[需要手动安装]],看第7步
```

#### 5. 启用自动格式化插件gofmt

```text
Tools -- File Watchers -- 增加(go fmt)
```

#### 6. 启用自动删除无用的倒入包插件goimports

```text

一, 直接安装 : go get golang.org/x/tools/cmd/goimports

二, 有可能不能翻墙,访问不了。可以用以下步骤安装

1. 需要先安装git

2. 安装go包管理工具 gopm
go get -v github.com/gpmgo/gopm

3. 下载 goimports 包
gopm get -g -v -u golang.org/x/tools/cmd/goimports

三 编译
go build D:\Workspaces\Golib\src\golang.org\x\tools\cmd\goimports 或看拷贝goimports 文件到Golib\bin目录

或 直接运行  go install golang.org\x\tools\cmd\goimports 直接安装到Golib\bin目录下

按第6步进行设置,配置goimports

```

#### 7. 设置模板文件头

```text
Editor -- File and Code Templates
都选中 Enable Live Templates , 就可以用#[[$END$]]# (bash还是不行)

js vue:
/*!
@Author : lsne
@Date : ${YEAR}-${MONTH}-${DAY} ${TIME}
*/


go:
/*
@Author : lsne
@Date : ${YEAR}-${MONTH}-${DAY} ${TIME}
*/

package ${GO_PACKAGE_NAME}


python:
#!/usr/bin/env python
# -*- coding:utf-8 -*-
# @Author : lsne
# @Date : ${YEAR}-${MONTH}-${DAY} ${TIME}


Bash Script:
#!/usr/bin/env bash
# @Author : lsne
# @Date : ${YEAR}-${MONTH}-${DAY} ${TIME}

```

#### 8. 设置格式化规则

```text
setting -- Code Style -- HTML
Tab size: 2
Indent: 2
Continuation indent: 4
- [x] Keep line breaks
- [x] Keep line breaks in text
Wrap attributes: Do not wrap
- [x] In empty tag
Do not indent children of:  增加 script

setting -- Code Style -- JavaScript
Spaces  -- Within

- [x] ES6 import/export braces

```

## 其它相关

#### 1. go命令安装目录下所有文件

```text
cd project/cmd
go install ./...
```