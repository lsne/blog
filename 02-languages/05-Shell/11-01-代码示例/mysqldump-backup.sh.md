
```shell
#!/usr/bin/env bash
# @Author: lsne
# @Date: 2024-09-25 21:49:10

mysqldump_bin="/usr/local/mysql80/bin"   # mysqldump 命令路径
host=""                     # 要备份的mysql实例域名地址
port=""                     # 要备份的mysql实例端口号
username="dumpbackup"       # 备份用户名
password=""                 # 备份密码
dbname=""                   # 要备份的库
character_set="utf8mb4"     # 字符集
outfile=""                  # 备份文件路径

# 使用示例以及参数说明
function usage() {
    echo "usage:  sh $0 -h 1.1.1.1 -P 3306 -u bakuser -p bakpass -d db01 -o /da1/mysql_11111.sql
    -h      要备份的 mysql 实例域名地址
    -P      要备份的 mysql 实例端口号
    -u      备份用户名, 默认: dumpbackup
    -p      备份密码, 不指定会进入交互模式, 提示输入密码
    -d      要备份的库名
    -c      字符集, 默认: utf8mb4
    -o      备份文件路径名称

  $1
"
    exit 1
}

# 根据命令行参数初始化需要用到的各个变量的值
function option() {
    while getopts h:P:u:p:d:c:o: OPTION; do
        case "$OPTION" in
        h) host=$OPTARG ;;
        P) port=$OPTARG ;;
        u) username=$OPTARG ;;
        p) password=$OPTARG ;;
        d) dbname=$OPTARG ;;
        c) character_set=$OPTARG ;;
        o) outfile=$OPTARG ;;
        *) usage "" ;;
        esac
    done

    [[ "${host}" =~ ^mysql[0-9]{3,5}[rw].*yun.lsne.cn$ ]] || usage "mysql host: -h \"${host}\" 无效, 必须是 mysql<port>[rw].*.yun.lsne.cn 格式."
    [[ "${port}" =~ ^[0-9]{3,5}$ ]] || usage "端口号: -P \"${port}\" 无效, 必须是3到5位数字."
    [[ "${username}" =~ ^[a-zA-Z0-9_-]{2,64}$ ]] || usage "用户名: -u \"${username}\" 无效, 必须是 2到64位字符串, 字符串只能包含大小写字母数组和_-两个特殊字符."
    [[ "${password}" =~ ^$|^[a-zA-Z0-9_-]{2,64}$ ]] || usage "密码: -p \"${password}\" 无效, 必须是 2到64位字符串, 字符串只能包含大小写字母数组和_-两个特殊字符."
    [[ "${dbname}" =~ ^[a-zA-Z0-9_-]{2,64}$ ]] || usage "库名: -d \"${dbname}\" 无效, 如果不为空, 必须是 2到64位字符串, 字符串只能包含大小写字母数组和_-两个特殊字符以及空格."
    [[ "${character_set}" =~ ^utf8mb4$|^utf8$|^latin1$|^ascii$|^gbk$|^gb18030$ ]] || usage "字符集: -c \"${character_set}\" 无效, 只支持: <utf8mb4|utf8|latin1|ascii|gbk|gb18030>, 默认: utf8mb4."
    [[ "${outfile}" =~ ^$|^[a-zA-Z0-9./_-]{1,1024}[a-zA-Z0-9]$ ]] || usage "备份路径: -o \"${outfile}\" 无效, 如果不为空, 则必须是 2到64位字符串, 字符串只能包含大小写字母数组和_-两个特殊字符, 结尾只能是大小写字母或数字"
}

function parameter() {
    [[ "${outfile}" =~ ^$ ]] && outfile=${port}_${dbname}_$(date "+%Y%m%d%H%M%S").sql
    [ -e "${outfile}" ] && { echo "文件: ${outfile} 已经存在!"; exit 2; }
    [ -d "${mysqldump_bin}" ] || yum install -y cloud-mysql80 || { echo "yum 安装 cloud-mysql80 失败"; exit 3; }
    
    # 默认使用 mysqldump 8.0, 根据远程 mysql server 版本判断是否需要改为 mysqldump 5.6
    mysql_version=$(${mysqldump_bin}/mysql -h "${host}" -P "${port}" -u "${username}" -p"${password}" -BNe "select version();") || { echo "获取 mysql 的版本号失败"; exit 4; }
    mversion=$(echo "${mysql_version}" | awk -F'.' '{print $1$2}')
    if [ "${mversion}" -ne "80" ]; then
        mysqldump_bin="/usr/local/mysql56/bin"
        [ -d "${mysqldump_bin}" ] || yum install -y cloud-mysql56 || { echo "ERROR: yum 安装 cloud-mysql56 失败"; exit 3; }
    fi
}

function mysqldump_backup() {
    outfile_dir=$(dirname "$outfile")
    [ -d "${outfile_dir}" ] || mkdir -p "${outfile_dir}" || { echo "ERROR: 创建备份目录失败!"; exit 5; }

    echo "开始备份."
    if ! ${mysqldump_bin}/mysqldump -h "${host}" -P "${port}" -u "${username}" -p"${password}" --default-character-set="${character_set}" --max_allowed_packet=1024M --hex-blob --single-transaction --master-data=2 --set-gtid-purged=OFF --routines --triggers --events --databases "${dbname}" > "${outfile}"; then 
        echo "ERROR: 执行 mysqldump 命令报错, 备份失败!"
        exit 6
    fi
    echo "备份完成."

    # 判断备份是否成功
    [[ "$(tail -n 1 "${outfile}")" =~ ^.*Dump\ completed.*$ ]] || { echo "ERROR: 备份失败!"; exit 7; }
    echo "备份成功."
}

function main() {
    option "$@"
    parameter
    mysqldump_backup
}

main "$@"

```