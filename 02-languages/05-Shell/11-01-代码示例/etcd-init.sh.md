
> `vim etcd_init.sh`

```shell
#!/usr/bin/env bash
# Created by lsne on 2021-10-26 14:27:05

myip=$(/sbin/ip -o -4 addr list eth0 | awk '{print $4}' | cut -d/ -f1)

# 命令行传入参数
port=0
memory=4
version="etcd35"
state="new"
cluster_ips=""

# ca证书相关参数
ca_config="ca-config.json"
etcd_csr="etcd-csr.json"

data_base="/data1"
config_file="etcd.yaml"
node_name="$(hostname)"

peer_port=0
cluster=""
dbpath=""
quota_backend_bytes=""
peer_urls=""
client_urls=""
cluster_info=""

etcd_dir=
etcd_server=""
etcd_cli=""
cfssl_cmd=""
cfssljson_cmd=""

# 使用示例以及参数说明
function usage() {
    echo "usage:  sh $0 -p 15001 -m 1 -v mongodb42
        -p      端口号 必选项: 例: 15001
        -m      内存(G) 默认: 1
        -v      版本    默认: etcd35
        -s      集群状态 默认: new, 有效值: <new|existing>
        -c      集群所有节点IP
    $1
"
    exit 2
}

# 根据命令行参数初始化需要用到的各个变量的值
function option() {
    while getopts "p:m:v:c:s:" OPTION; do
        case "$OPTION" in
        p) port=$OPTARG ;;
        m) memory=$OPTARG ;;
        v) version=$OPTARG ;;
        s) state=$OPTARG ;;
        c) cluster_ips=$OPTARG ;;
        *) usage ;;
        esac
    done

    [[ "${ip}" =~ ^([0-9]|([1-9][0-9])|(1[0-9]{2})|(2([0-4][0-9]|5[0-5])))$ ]] || echo "不属于 1 到 255范围"
    [[ "${ip}" =~ ^([0-9]|([1-9][0-9])|(1[0-9]{2})|(2([0-4][0-9]|5[0-5])))(\.([0-9]|([1-9][0-9])|(1[0-9]{2})|(2([0-4][0-9]|5[0-5])))){3}$ ]] || echo "不符合IP规范"
    [[ "${port}" =~ ^[0-9]{3,5}$ ]] || usage "端口号: ${port} 无效, 必须是3到5位数字."                                                                                           # 端口检查, 端口号必须是3到5位数字
    [[ "${memory}" =~ ^[1-9][0-9]?$ ]] || usage "内存: ${memory} 无效, 值范围: 1~99 "                                                                                       # 内存检查, 内存必须小于100
    [[ "${version}" =~ ^etcd[345][0-9]$ ]] || usage "版本: ${version} 无效"                                                                                              # 版本检查
    [[ "${state}" =~ ^new$|^existing$ ]] || usage "状态: ${state} 无效"                                                                                                  # 版本检查
    [[ "${cluster_ips}" =~ ^[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}(,[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3})*$ ]] || usage "cluster_ips: ${cluster_ips} 无效" # 版本检查

}

function parameter() {
    peer_port=$((port + 1000))
    cluster="etcd${port}"
    dbpath="${data_base}/${cluster}"
    quota_backend_bytes=$((memory * 1024 * 1024 * 1024))
    peer_urls="https://${myip}:${peer_port}"
    client_urls="http://${myip}:${port}"

    etcd_dir="/usr/local/${version}"
    etcd_server="${etcd_dir}/bin/etcd"
    etcd_cli="${etcd_dir}/bin/etcdctl"
    cfssl_cmd="${etcd_dir}/bin/cfssl"
    cfssljson_cmd="${etcd_dir}/bin/cfssljson"

    ips=${cluster_ips//,/ }
    for ip in $ips; do
        ip_name=$(host ${ip} | grep "lsne" | awk '{print $5}' | sed 's/.$//')
        if [[ "${cluster_info}AA" == "AA" ]]; then
            cluster_info="${ip_name}=https://${ip}:${peer_port}"
        else
            cluster_info="${cluster_info},${ip_name}=https://${ip}:${peer_port}"
        fi
    done

    if [[ ${state} == "existing" ]]; then
        cluster_info="${cluster_info},${node_name}=https://${myip}:${peer_port}"
    fi
}

function environment() {
    if [[ -e "${dbpath}" ]]; then
        echo "目录 ${dbpath} 已经存在..."
        exit 2
    fi

    if [[ $(/bin/netstat -alntp | grep -cE ":::${port} |0.0.0.0:${port} ") -ne 0 ]]; then
        echo "端口: ${port} 已经启用"
        exit 2
    fi

    if [[ $(/bin/netstat -alntp | grep -cE ":::${peer_port} |0.0.0.0:${peer_port} ") -ne 0 ]]; then
        echo "对等端口: ${peer_port} 被占用"
        exit 2
    fi

    if [[ ! -d "/usr/local/etcd35" ]]; then
        yum -y -q install cloud-etcd35
    fi
}

#
function make_version_file() {
    echo "${version}" >>"$1"
}

function ca_config_file() {
    {
        echo "{"
        echo "  \"signing\": {"
        echo "    \"default\": {"
        echo "      \"expiry\": \"876000h\""
        echo "    },"
        echo "    \"profiles\": {"
        echo "      \"etcd\": {"
        echo "         \"expiry\": \"876000h\","
        echo "         \"usages\": ["
        echo "            \"signing\","
        echo "            \"key encipherment\","
        echo "            \"server auth\","
        echo "            \"client auth\""
        echo "        ]"
        echo "      }"
        echo "    }"
        echo "  }"
        echo "}"
    } >>"$1"
}

function etcd_csr_file() {
    {
        echo "{"
        echo "    \"CN\": \"${cluster}\","
        echo "    \"key\": {"
        echo "        \"algo\": \"rsa\","
        echo "        \"size\": 2048"
        echo "    },"
        echo "    \"names\": ["
        echo "        {"
        echo "            \"C\": \"CN\","
        echo "            \"L\": \"Beijing\","
        echo "            \"ST\": \"Beijing\","
        echo "            \"O\": \"etcd\","
        echo "            \"OU\": \"System\""
        echo "        }"
        echo "    ]"
        echo "}"
    } >>"$1"
}

function etcd_config_file() {
    {
        echo "name: \"${node_name}\""
        echo "data-dir: \"${dbpath}/data\""
        echo "wal-dir: \"${dbpath}/wal\""
        echo "snapshot-count: 10000"
        echo "heartbeat-interval: 100"
        echo "election-timeout: 1000"
        echo "quota-backend-bytes: ${quota_backend_bytes}"
        echo "max-request-bytes: 10485760"
        echo "listen-peer-urls: \"${peer_urls}\""
        echo "listen-client-urls: \"${client_urls},http://127.0.0.1:${port}\""
        echo "max-snapshots: 5"
        echo "max-wals: 5"
        echo "cors:"
        echo "initial-advertise-peer-urls: \"${peer_urls}\""
        echo "advertise-client-urls: \"${client_urls}\""
        echo "discovery:"
        echo "discovery-fallback: 'proxy'"
        echo "discovery-proxy:"
        echo "discovery-srv:"
        echo "initial-cluster: \"${cluster_info}\""
        echo "initial-cluster-token: \"${cluster}\""
        echo "initial-cluster-state: \"${state}\""
        echo "strict-reconfig-check: true"
        echo "enable-v2: false"
        echo "enable-pprof: true"
        echo "proxy: 'off'"
        echo "proxy-failure-wait: 5000"
        echo "proxy-refresh-interval: 30000"
        echo "proxy-dial-timeout: 1000"
        echo "proxy-write-timeout: 5000"
        echo "proxy-read-timeout: 0"
        echo ""
        echo "client-transport-security:"
        echo "  auto-tls: false"
        echo "  client-cert-auth: false"
        echo "  cert-file: \"${dbpath}/cert/etcd.pem\""
        echo "  key-file: \"${dbpath}/cert/etcd-key.pem\""
        echo "  trusted-ca-file: \"${etcd_dir}/cert/ca.pem\""
        echo ""
        echo "peer-transport-security:"
        echo "  auto-tls: false"
        echo "  client-cert-auth: true"
        echo "  cert-allowed-cn: etcd15000"
        echo "  cert-file: \"${dbpath}/cert/etcd.pem\""
        echo "  key-file: \"${dbpath}/cert/etcd-key.pem\""
        echo "  trusted-ca-file: \"${etcd_dir}/cert/ca.pem\""
        echo ""
        echo "self-signed-cert-validity: 1"
        echo "log-level: info"
        echo "logger: zap"
        echo "log-outputs: [\"${dbpath}/log/etcd.log\"]"
        echo "force-new-cluster: false"
        echo ""
        echo "auto-compaction-mode: \"periodic\""
        echo "auto-compaction-retention: \"72h\""
    } >>"$1"
}

function etcd_init() {
    grep -E "^${cluster}" /etc/group >/dev/null || groupadd "${cluster}" || exit 2
    grep -E "^${cluster}" /etc/passwd >/dev/null || useradd "${cluster}" -g "${cluster}" -s /sbin/nologin || exit 2

    mkdir -p "${dbpath}"/{config,log,cert} || exit 2
    make_version_file "${dbpath}/version" || exit 2
    ca_config_file "${dbpath}/cert/${ca_config}" || exit 2
    etcd_csr_file "${dbpath}/cert/${etcd_csr}" || exit 2
    etcd_config_file "${dbpath}/config/${config_file}" || exit 2

    ${cfssl_cmd} gencert -ca="${etcd_dir}/cert/ca.pem" -ca-key="${etcd_dir}/cert/ca-key.pem" -config="${dbpath}/cert/${ca_config}" -hostname="127.0.0.1,${myip}" -profile=etcd "${dbpath}/cert/${etcd_csr}" | ${cfssljson_cmd} -bare "${dbpath}/cert/etcd"

    chown -R "${cluster}:${cluster}" "${dbpath}"
}

function main() {
    option "$@"
    parameter
    environment
    etcd_init
}

main "$@"

```