
#### 尽量简写

```shell
[ $RETVAL = 0 ] && rm -f ${pidfile:=/tmp/test} /var/lock/subsys/${prog:=/tmp/test}
```
#### MAIN

```shell
# ${0##*/} 表示对当前执行的脚本, 去掉路径, 只获取脚本的文件名
# "${_:-""}" 表示上一条命令执行的是什么, 防止脚本被嵌入其他脚本调用
# 如果脚本名是 $TOOL, 或者脚本以 bash 执行时, 上一条执行的命令是脚本名, 才开始执行 MAIN 函数。 否则表示 shell 脚本不是直接运行的，而是通过其他脚步调用的, 这时就禁止执行
#----------------------------EXEC ---------------------------------------------
if [ "${0##*/}" = "$TOOL" ] || [ "${0##*/}" = "bash" -a "${_:-""}" = "$0" ]; then
{
        MAIN "${@:-""}"
}
fi
```

#### IFS

> IFS 是一个环境变量，定义了分隔符的字符。默认情况下，IFS 包含空格、制表符和换行符

> 将字符串以 `,` 做为分隔符分割成数组, 并遍历数组

```shell
OLD_IFS="$IFS"
IFS=","
ip_arr=($MASTERIP)
IFS="$OLD_IFS"

for ip in "${ip_arr[@]}"; do
    echo ${ip}
done
```

> `for` 和 `while` 循环时, 可以提前指定以什么字符作为分割符

```shell
for循环时,用 IFS=$'\n' 指定按行循环

while IFS= read -r line; do
```

> IFS 可以用来处理文件名

```shell
while IFS= read -r -d '' file
do
  let count++
  echo "Playing file no. $count"
  play "$file"
done <   <(find mydir -mtime -7 -name '*.mp3' -print0)
echo "Played $count files"

# 或

while IFS= read -r -d $'\0' file
do
    # do something to each file
done < <(find ~/music -type f -print0)
```

#### 变量的 `-` 和 `+` 操作符 

> `-` 表示如果变量未设置,则输出后面的字符串，`+` 则相反

```sh
echo ${NAME:-lsne}

NAME=lsne
echo ${NAME:+haha}
```

#### `FUNCNAME` 变量

> `FUNCNAME` 变量必须在函数里使用,  列出来当前行的函数调用列表

```shell
# vim test.sh

function isSourced() {
  for f in "${FUNCNAME[@]}"; do
    echo "遍历: $f"
  done
}
isSourced

# 执行: bash test.sh 
# 结果:
# 遍历: isSourced
# 遍历: main

# 执行: source test.sh
# 结果:
# 遍历: isSourced
# 遍历: source
```

#### 设置 `PATH` 路径

> 自动将 `/usr/local/yun/` 目录下所有的子目录设置到 `PATH` 路径中

```shell
for yun_path in /usr/local/yun/*; do
    if [ -d "$yun_path" ]; then
        export PATH="$yun_path:$PATH"
    fi
done
```
#### ssh 以 `root` 执行

```shell
sshpass -p '123456' ssh -o "StrictHostKeyChecking no" lsne@10.10.10.10 "echo '123456' | sudo -S /bin/sh /tmp/tmp.sh ${port}" &
```

#### 命令行生成密钥时, 自动输入交互提示

```shell
# 将 echo -e '\n' 命令作为交互命令的输入

if [ ! -f "${keypath}/${keyname}.pub" ]; then
        sudo -u ${username} echo -e '\n' | sudo -u ${username} ssh-keygen -q -o -t rsa -P '' >/dev/null 2>&1
fi
```

#### 判断当前脚本是否正在运行

> 方案一

```shell
function is_running() {
    current_pid=$$
    running_pids=$(pgrep -f "${0##*/}")
    if echo -e "$running_pids" | grep -v "$current_pid"; then
        exit
    fi
}
```

> 方案二

```shell
# 如果当前脚本正在运行, 则取消本次运行
function is_running() {
    # 获取当前脚本的PID
    current_pid=$$

    # 检查是否已经有相同的脚本在运行
    running_pids=$(pgrep -f "${0##*/}")

    # 将PID列表转换为数组
    IFS=$'\n' read -rd '' -a pid_array <<<"$running_pids"
    echo 111
    # 排除当前脚本的PID
    filtered_pids=()
    for pid in "${pid_array[@]}"; do
        if [ "$pid" != "$current_pid" ]; then
            filtered_pids+=("$pid")
        fi
    done

    if [ "${#filtered_pids[@]}" -gt 0 ]; then
        exit
    fi
}
```

#### 处理长参数

```shell
usage()
{
    echo "$0 --backuppath path --project  projectname  

"
}

ARGS=`getopt -o hb:p: --long help,backuppath:,projectname: -- "$@"`
if [ $? != 0 ] ; then echo "Failed parsing options." >&2 ; exit 1 ; fi

eval set -- "$ARGS"
while true;do
    case "$1" in
        -b|--backuppath)
            backuppath=$2
            shift 2
            ;;
        -p|--projectname)
            projectname=$2
            shift 2
            ;;
        -h|--help)
            usage;
            shift
            ;;
        --)
            shift
            break
            ;;
        *)
            echo "未知的属性:{$1}"
            exit 1
            ;;
    esac
done
```