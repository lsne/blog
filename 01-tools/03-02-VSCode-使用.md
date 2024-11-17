# VSCode 使用
## VSCode 设置

#### 1. 自动保存

```
搜索: auto save
参数说明：
	off：自动保存关闭
	afterDelay：延时自动保存，延长时间为 Auto Save Delay 中设置的数值（单位：ms）
	onFocusChange：焦点发生更改自动保存（个人认为翻译为：VS Code 中某标签页失去焦点后自动保存）
	onWindowChange：当当前 VS Code 窗口失去焦点后自动保存
	
Files: Auto Save Delay:  1000 即1秒保存一次
```

#### 2. 在新窗口打开文件夹或工作区

```
文件--首选项--设置--窗口--新建窗口-- Open Folders In New Window: on
```

#### 3. 设置字体 安装 jetbrains mono 字体

```
1. 下载字体
https://www.jetbrains.com/lp/mono/#support-languages

2. 解压并全选ttf右击安装

3. 文件--首选项--设置--文本编辑器--字体--Font Family: JetBrains Mono, Consolas, 'Courier New', monospace
4. 文件--首选项--设置--文本编辑器--字体--Font Size: 16

5. 如果有C/C++ 相关, 设置花括号在 if for 关键词的同一行
  文件--首选项--设置 , 然后搜索: C_Cpp.clang_format_fallbackStyle
  然后将值从: Visual Studio 修改为: { BasedOnStyle: Google, IndentWidth: 4 }

第6步好像没什么用。不要配置
6. 文件--首选项--设置--搜索<code runner> -- 找到 <扩展-Run Code co...>
    勾选以下信息:
        Code-runner: Clear Previous Output
        Code-runner: Run In Terminal
        Code-runner: Save All Files Before Run
        Code-runner: Save File Before Run

```

#### 4. 设置 `Remote - SSH` 插件配置

> 一般不需要手动设置, 遇到问题再看要不要设置

```
// 看情况设置, 将机器连接需要交互就不能添加这个参数
文件--首选项--设置--编辑文件;  然后添加根属性:

{
    "remote.SSH.useLocalServer": true,
}
```

#### 5. Tab 设置

```json
// 默认是4个空格, 然后设置特殊的为2个
// 文件--首选项--设置--右上脚setting.json
{
	"[typescript]": {
		"editor.tabSize": 2
	},
	"[javascript]": {
		"editor.tabSize": 2
	},
	"[html]": {
		"editor.tabSize": 2
	},
	"[json]": {
		"editor.tabSize": 2
	},
	"[css]": {
		"editor.tabSize": 2
	},
}
```

#### 6. Remote Development

```
1. windows 机器安装ssh 命令, 或者安装 git 客户端会自带ssh命令
2. 打开 git bash
2. 执行 ssh-keygen
3. 将 生成的 user/username/.ssh/id_rsa.pub 内容复制到要远程连接的机器 /home/lsne/.ssh/authorized_keys 文件里
4. chmod 400 /home/lsne/.ssh/authorized_keys

5. 添加 Remote Development 插件, 点击 <最左电视> -- <设置图标> -- <选择第一个: C:\Users\lsne\.ssh\config> 进行编辑
Host web01v
    HostName web01v.ls.cn
    User lsne

Host 开发机
    HostName 10.249.104.8
    User lsne
    Port 22
    IdentityFile "C:\Users\lsne\.ssh\id_rsa"
    
6. 完成后, 在远程机器列表右击点 connect 进行连接
7. 连接后, 根据提示, 在远程机器上安装相应插件
```

#### 7. 以上全部设置完成后, 会同步修改到配置文件如下:

```json
{
    "files.autoSave": "afterDelay",
    "window.openFoldersInNewWindow": "on",
    "editor.fontFamily": "JetBrains Mono, Consolas, 'Courier New', monospace",
    "editor.fontSize": 16,
    "[typescript]": {
        "editor.tabSize": 2
    },
    "[javascript]": {
        "editor.tabSize": 2
    },
    "[html]": {
        "editor.tabSize": 2
    },
    "[json]": {
        "editor.tabSize": 2
    },
    "[css]": {
        "editor.tabSize": 2
    },
    "remote.SSH.remotePlatform": {
        "myserver05": "linux"
    },
}
```

#### 8. 配置同步 -- 左下角账号注销--重新登录--根据提示设置(可选)

---
## 设置代码段

#### 1. 设置golang代码片段

```json
{
	"go header": {
		"prefix": "goh",
		"body": [
			"/*",
			" * @Author: lsne",
			" * @Date: $CURRENT_YEAR-$CURRENT_MONTH-$CURRENT_DATE $CURRENT_HOUR:$CURRENT_MINUTE:$CURRENT_SECOND",
			" */",
			"",
			"package ${TM_DIRECTORY/.*\\///g}",
		],
		"description": "my go template",
	},
	"go main": {
		"prefix": "gom",
		"body": [
			"/*",
			" * @Author: lsne",
			" * @Date: $CURRENT_YEAR-$CURRENT_MONTH-$CURRENT_DATE $CURRENT_HOUR:$CURRENT_MINUTE:$CURRENT_SECOND",
			" */",
			"",
			"package main",
			"",
			"func main() {",
			"",
			"}"
		],
		"description": "my go template",
	},
}
```

#### 2. 设置python代码片段

```json
{
	"python header": {
		"prefix": "pyh",
		"body": [
			"#!/usr/bin/env python",
			"# -*- coding:utf-8 -*-",
			"# @Author: lsne",
			"# @Date: $CURRENT_YEAR-$CURRENT_MONTH-$CURRENT_DATE $CURRENT_HOUR:$CURRENT_MINUTE:$CURRENT_SECOND",
			"",
		],
		"description": "my python template",
	},
	"python main": {
		"prefix": "pym",
		"body": [
			"def main():",
			"    print('test')",
			"    opts = _options()",
			"",
			"",
			"if __name__ == '__main__':",
			"    main()",
		],
		"description": "my python template",
	},
	"python options": {
		"prefix": "pyp",
		"body": [
			"# import argparse",
			"# import sys",
			"",
			"def _options():",
			"    # epilog 一些程序喜欢在 description 参数后显示额外的对程序的描述。这种文字能够通过给 ArgumentParser:: 提供 epilog= 参数而被指定",
			"    # -p 短参数; --port 长参数； dest='port' 命令行指定 -p 或 --port 的值。保存在 parser 对象里的属性名称",
			"",
			"    parser = argparse.ArgumentParser(usage=\"it's usage tip.\", description=\" %prog -p port\", epilog='帮助底部的文本')",
			"    parser.add_argument('-p', '--port', dest=\"port\",  type=int, help=\"端口号\")",
			"    parser.add_argument('-n', '--serial_number', dest=\"serial_number\", type=str, help=\"-n serial_number is required !!!\")",
			"    parser.add_argument('-s', '--source_ip', dest=\"source_ip\", type=str, default=100, help=\"-s 源IP\")",
			"    parser.add_argument('-d', '--desc_ip', dest=\"desc_ip\", type=str, default=100, help=\"-d 目的IP\")",
			"    opts = parser.parse_args()",
			"",
			"    if opts.port is None or opts.desc_ip is None or opts.source_ip is None or opts.serial_number is None:",
			"        parser.print_help()",
			"        sys.exit(1)",
			"    return opts",
		],
		"description": "my python template",
	},
}
```

#### 3. 设置shell代码片段

```json
{
	"shell header": {
		"prefix": "shh",
		"body": [
			"#!/usr/bin/env bash",
			"# @Author: lsne",
			"# @Date: $CURRENT_YEAR-$CURRENT_MONTH-$CURRENT_DATE $CURRENT_HOUR:$CURRENT_MINUTE:$CURRENT_SECOND",
			"",
		],
		"description": "my go template",
	},
	"shell main": {
		"prefix": "shm",
		"body": [
			"function main() {",
			"    options \"\\$@\"",
			"}",
			"",
			"script_name=\"a.sh\"",
			"if [ \"\\${0##*/}\" = \"\\$script_name\" ]; then",
			"    main \"\\$@\"",
			"fi",
		],
		"description": "my python template",
	},
	"shell parse": {
		"prefix": "shp",
		"body": [
		    "port=\"\"",
			"memory=\"\"",
			"",
			"# 使用示例以及参数说明",
			"function usage() {",
			"    cat <<EOF"
			"    usage:  sh \\$0 -p <port> -m <memory>",
			"        -p      端口号",
			"        -m      内存",
			"",
			"        \\$1"
			"EOF",
			"    exit 1",
			"}",
			"",
			"# 根据命令行参数初始化需要用到的各个变量的值",
			"function options() {",
			"    while getopts p:m: OPTION; do",
			"        case \"\\$OPTION\" in",
			"        p) port=\\$OPTARG ;;",
			"        m) memory=\\$OPTARG ;;",
			"        *) usage \"\" ;;",
			"        esac",
			"    done",
			"",
			"    [[ \"\\${port}\" =~ ^[0-9]{3,5}$ ]] || usage \"端口号: \\${port} 无效, 必须是3到5位数字.\" ",
			"    [[ \"\\${memory}\" =~ [mMgG]$ ]] || usage \"内存: \\${memory} 无效, 不是以 m, M, g, G 结尾.\" ",
			"    # [[ ! \"\\${memory}\" =~ [mMgG]$ ]] && usage \"内存: \\${memory} 无效, 不是以 m, M, g, G 结尾.\"    # 正则不匹配, 以 ! 开头",
			"",
			"}",
			"",
		],
		"description": "my go template",
	},
	"shell is_running1": {
		"prefix": "shr",
		"body": [
			"# 如果当前脚本正在运行, 则取消运行",
			"function is_running() {",
			"    current_pid=$$",
			"    running_pids=$(pgrep -f \"${0##*/}\")",
			"    if echo -e \"\\$running_pids\" | grep -v \"\\$current_pid\" >/dev/null; then",
			"        exit",
			"    fi",
			"}",
			"",
		],
		"description": "my shell template",
	},
	"shell is_running2": {
		"prefix": "shr2",
		"body": [
			"# 如果当前脚本正在运行, 则取消运行",
			"function is_running() {",
			"    # 获取当前脚本的PID",
			"    current_pid=$$",
			"",
			"    # 检查是否已经有相同的脚本在运行",
			"    running_pids=$(pgrep -f \"${0##*/}\")",
			"",
			"    # 将PID列表转换为数组",
			"    IFS=$'\\n' read -rd '' -a pid_array <<<\"\\$running_pids\"",
			"    # 排除当前脚本的PID",
			"    filtered_pids=()",
			"    for pid in \"${pid_array[@]}\"; do",
			"        if [ \"\\$pid\" != \"\\$current_pid\" ]; then",
			"            filtered_pids+=(\"\\$pid\")",
			"        fi",
			"    done",
			"",
			"    if [ \"${#filtered_pids[@]}\" -gt 0 ]; then",
			"        exit",
			"    fi",
			"}",
			"",
		],
		"description": "my shell template",
	},
}
```


#### 4. 设置VUE代码片段

```json
{
	"vue template": {
		"prefix": "vuet",
		"body": [
			"<!--",
			" * @Author: lsne",
			" * @Date: $CURRENT_YEAR-$CURRENT_MONTH-$CURRENT_DATE $CURRENT_HOUR:$CURRENT_MINUTE:$CURRENT_SECOND",
			"-->",
			"",
			"<script setup lang=\"ts\">",
			"import { ref } from 'vue'",
			"",
			"const msg = ref('Hello World!')",
			"",
			"</script>",
			"",
			"<template>",
			"  <div class=\"example\">",
			"    <h1>{{ msg }}</h1>",
			"    <input v-model=\"msg\">",
			"  </div>",
			"  ",
			"</template>",
			"",
			"<style scoped lang=\"scss\"></style>",
			""
		],
		"description": "my vue template",
	}
}
```

#### 5. 设置 typescript 代码片段

```json
{
	"ts template": {
		"prefix": "tsh",
		"body": [
			"/*",
			" * @Author: lsne",
			" * @Date: $CURRENT_YEAR-$CURRENT_MONTH-$CURRENT_DATE $CURRENT_HOUR:$CURRENT_MINUTE:$CURRENT_SECOND",
			" */",
			"",
			"const msg = {}",
			"export default msg",

		],
		"description": "my ts template",
	}
}
```

---

## 插件安装

### 设置代理

```
// 如果插件来自 google 等网络不通的地方, 插件下载不下来。则可以设置代理

1.  vim ~/.bashrc
export http_proxy=http://static-proxy.ls.cn:3128
export https_proxy=http://static-proxy.ls.cn:3128

2. ctrl + shift + p  弹出窗口中输入: kill

3. 选择: Remote-SSH: Kill Current VS Code Server

4. 重新安装 插件
```

### Global

```
Remote - SSH  // 远程连接
Code Runner

TODO Tree 
GitLens
Even Better TOML

Markdown All in One：提供了一系列功能，包括格式化、预览、表格生成等。
Markdownlint：用于检查和纠正 Markdown 文件中的语法和风格错误。
Markdown Preview Enhanced：提供了强大的 Markdown 预览功能，支持实时预览、导出为 PDF、自定义样式等。

vscode-icons-mac  // 文件图标, 可选
Bracket Pair Colorizer // 不同括号颜色不同, 可选
```

### Rust

```
rust-analyzer    // rust 
crates           // Cargo.toml 文件提示等
Rust Syntax      // 语法高亮, 但需要配置,  可选
```

### Go

```
Go
go fmt
goimports
```

### Python

```
Python
pylint
yapf
```
### Shell

```
shell 代码提示            | shellman    
shell 代码检查            | shellcheck  
shell 代码格式化          | shell-format
shell 脚本跳转            | Bash IDE    
```
### Nodejs

```
Vue Language Features (Volar)  vue3 环境插件
TypeScript Vue Plugin  vue 中写ts插件
```

### http 请求

```
REST Client
```