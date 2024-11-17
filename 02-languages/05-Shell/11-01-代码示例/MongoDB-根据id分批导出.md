```shell
#!/usr/bin/env bash
# @Author : lsne
# @Date : 2021-09-16 10:07

dbname=""
colname=""
start_time=""
end_time=""
export_file=""
log_file=""

auth_db="admin"
host=127.0.0.1
port=20000
username="os_admin"
password="123456"
cmd="/usr/local/mongodb/bin/mongoexport"

# 使用示例以及参数说明
function usage() {
    echo "usage:  sh $0 -d morpheus -c dynamic_behavior -s '2020-01-01 00:00:00' -e '2020-01-02 00:00:00' -f 'dynamic_behavior_20200101.json'
    -d      要导出集合所在的库名, 必选
    -c      要导出的集合名, 必选
    -s      要导出数据的写入起始时间, 必选
    -e      要导出数据的写入终止时间, 必选
    -f      要导出到哪个文件, 必选
    -l      导出过程产生的日志文件(默认将 -f 导出文件扩展名改为 .log), 可选
"
}

# 根据命令行参数初始化需要用到的各个变量的值
function args_parse() {
    while getopts d:c:s:e:l:f:h: OPTION; do
        case "$OPTION" in
        d)
            dbname=$OPTARG
            ;;
        c)
            colname=$OPTARG
            ;;
        s)
            start_time=$OPTARG
            ;;
        e)
            end_time=$OPTARG
            ;;
        f)
            export_file=$OPTARG
            ;;
        l)
            log_file=$OPTARG
            ;;
        h)
            usage
            exit 0
            ;;
        *)
            usage
            exit 1
            ;;
        esac
    done

    # 必须指定库名
    if [[ "${dbname}AA" == "AA" ]]; then
        usage
        echo "必须指定库名: -d "
        exit 2
    fi

    # 必须指定集合名
    if [[ "${colname}AA" == "AA" ]]; then
        usage
        echo "必须指定集合名: -c "
        exit 2
    fi

    # 起始时间必须是日期时间格式
    if [[ "$(echo "${start_time}" | grep -c -E '^[0-9]{4}-[0-9]{1,2}-[0-9]{1,2} [0-9]{2}:[0-9]{2}:[0-9]{2}$')" != 1 ]]; then
        usage
        echo "起始时间: ${start_time} 无效, 必须是日期时间格式, 如: 2021-09-16 15:30:00"
        exit 2
    fi

    # 结束时间必须是日期时间格式
    if [[ "$(echo "${end_time}" | grep -c -E '^[0-9]{4}-[0-9]{1,2}-[0-9]{1,2} [0-9]{2}:[0-9]{2}:[0-9]{2}$')" != 1 ]]; then
        usage
        echo "结束时间: ${end_time} 无效, 必须是日期时间格式, 如: 2021-09-17 15:30:00"
        exit 2
    fi

    # 必须指定输出文件
    if [[ "${export_file}AA" == "AA" ]]; then
        usage
        echo "必须指定输出文件: -f "
        exit 2
    fi

    # 必须指定输出文件
    if [[ "${log_file}AA" == "AA" ]]; then
        log_file="${export_file%.*}.log"
    fi
}

function timeToObjID() {
    timestampFor10=$(date -d "$1" +%s) || return 2
    timestampFor16=$(printf '%x' "${timestampFor10}") || return 2
    echo "${timestampFor16}0000000000000000"
    return 0
}

function mongodb_export() {
    start_obj=$(timeToObjID "${start_time}") || return 2
    end_obj=$(timeToObjID "${end_time}") || return 2
    if ! ${cmd} --authenticationDatabase=${auth_db} --host=${host} --port=${port} --username=${username} --password=${password} --db=${dbname} --collection=${colname} --query='{"_id": {"$gte": ObjectId("'${start_obj}'"), "$lt": ObjectId("'${end_obj}'")}}' --out=${export_file} > ${log_file} 2>&1; then
        echo "导出 ${dbname}.${colname} 集合从 ${start_time}, ObjectId: ${start_obj} 到 ${end_time}, ObjectId: ${end_obj} 的数据失败, 具体请看日志文件: ${log_file}"
    else
        echo "导出 ${dbname}.${colname} 集合从 ${start_time}, ObjectId: ${start_obj} 到 ${end_time}, ObjectId: ${end_obj} 的数据成功！！！"
    fi
}

function main() {
    args_parse "$@"
    mongodb_export
}

main "$@"

```