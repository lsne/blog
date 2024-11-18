### 1. 家目录创建常用文件夹

```sh
mkdir -p bin
mkdir -p package
# mkdir -p process  # 好像没啥用
mkdir -p tmp
mkdir -p work
mkdir -p workspace/test
mkdir -p .go
# mkdir -p .venv    # python3 使用 venv 环境在每个项目根目录创建环境
```

### 2. 安装各语言环境

- [安装 Rust 环境](../02-languages/02-Rust/01-01-Rust-开发环境准备)
- [安装 Go 环境](../02-languages/03-Go/01-01-Go-开发环境准备)
- [安装 Python 环境](../02-languages/04-Python/01-01-Python3-编译安装)
- [安装 Nodejs 环境](../02-languages/06-Node.js/01-01-Node.js-安装部署)

### 3. 设置环境变量: `vim ~/.bashrc  `

```sh
# go && python && nodejs sdk
export GITROOT=/usr/local/git235
export GOROOT=/usr/local/go0121
export PYROOT=/usr/local/python0311
export NODEJSROOT=/usr/local/nodejs2005

# Go Env

# go path，根据各人习惯，一般都放在各人的home目录下面
export GOPATH=~/.go

# go 的可执行文件
export GOBIN=$GOPATH/bin

# go 1.13 开始支持 go get 时哪些仓库绕过代理，多用于私有仓库
export GOPRIVATE=*.private.repo

# go proxy 设置 go get 时的代理，direct 用来表示 go get 时如果遇到404，则直接走直连
export GOPROXY=https://goproxy.cn,direct

# 开启 go mod 管理依赖，默认为 auto
export GO111MODULE=on

# PATH
export PATH=$GITROOT/bin:$GOROOT/bin:$GOBIN:$PYROOT/bin:$NODEJSROOT/bin:$PATH

## 最近都流行 python3 自带的 venv 环境。 以下这些 python 的 pipenv 环境相关的变量可能用不上了
## # Python Env
## 
## # 设置这个环境变量，pipenv会在当前目录下创建.venv的目录，以后都会把模块装到这个.venv下。
## export PIPENV_VENV_IN_PROJECT=1
## 
## # 更改pipenv cache目录，默认也是放在/home/user
## #export PIPENV_CACHE_DIR=~/.py/cache/
## 
## # 设置WORKON_HOME到其他的地方(如果当前目录下已经有.venv,此项设置失效)
## export WORKON_HOME=~/.py
```

## ubuntu 开发环境初始化脚本

> `vim dev_init.sh`
>  `sudo bash -x dev_init.sh -a install -t all`

```Shell
#!/usr/bin/env bash
# @Author: lsne
# @Date: 2023-12-02 13:32:41

go_wget_url="https://go.dev/dl/go1.21.4.linux-amd64.tar.gz"
nodejs_wget_url="https://nodejs.org/dist/v20.10.0/node-v20.10.0-linux-x64.tar.xz"
python_wget_url="https://www.python.org/ftp/python/3.12.0/Python-3.12.0.tgz"

go_tar_filename=$(basename "${go_wget_url}")
nodejs_tar_filename=$(basename "${nodejs_wget_url}")
python_tar_filename=$(basename "${python_wget_url}")

go_version=$(echo ${go_tar_filename} | awk -F'.linux' '{print $1}' | awk -F'o' '{print $NF}')
nodejs_version=$(echo ${nodejs_tar_filename} | awk -F'-linux' '{print $1}' | awk -F'-v' '{print $NF}')
python_version=$(echo ${python_tar_filename} | awk -F'.tgz' '{print $1}' | awk -F'-' '{print $NF}')

go_proxy="https://goproxy.cn,direct"
go_private_repo="*.private.repo"
nodejs_source="https://registry.npm.taobao.org/"
python_source_index_url="https://mirrors.aliyun.com/pypi/simple"
python_source_trusted_host="https://mirrors.aliyun.com"

action=""
type="all"
username="$SUDO_USER"
user_home=""

# 使用示例以及参数说明
function usage() {
    cat <<EOF
    usage:  sh $0 -a <install> -t <all> -u <username>
        -a      <install|uninstall>
        -t      <all|go|nodejs|python>
        -u      <username>

        $1
EOF
    exit 1
}

# 根据命令行参数初始化需要用到的各个变量的值
function options() {
    while getopts a:t:u: OPTION; do
        case "$OPTION" in
        a) action=$OPTARG ;;
        t) type=$OPTARG ;;
        u) username=$OPTARG ;;
        *) usage "" ;;
        esac
    done

    [[ $(id -u) -eq 0 ]] || usage "请使用 root 用户执行此脚本, 并使用 -u 参数指定要初始化的用户"
    [[ "${action}" =~ ^install$|^uninstall$ ]] || usage "不支持的操作类型: -a ${action}"
    [[ "${type}" =~ ^all$|^go$|^nodejs$|^python$ ]] || usage "不支持的语言环境: -t ${type}"
    [[ "${username}" =~ ^[a-zA-Z][0-9a-zA-Z_.\\-]{1,31}$ ]] || usage "集群名称 -c: ${username} 无效, 必须是两位以上字符串, 只能包含数字,大小写字母, 和( - _ .) 三个特殊字符, 只能以大小写字母开头."
    
    user_home=$(getent passwd ${username} | cut -d: -f6)
    [[ ! "${user_home}" =~ ^$ ]] || usage "没有找到用户家目录"
    
}

function linux_http_proxy_up() {
    export http_proxy=http://proxy.ls.cn:3128
    export https_proxy=http://proxy.ls.cn:3128
}

function linux_http_proxy_down() {
    unset http_proxy
    unset https_proxy
}

function init_vimrc() {
    sed -i "/^set paste/d" /etc/vim/vimrc
    echo "set paste" >> /etc/vim/vimrc
}

function init_path() {
    sudo -u ${username} mkdir -p ${user_home}/bin
    sudo -u ${username} mkdir -p ${user_home}/package
    sudo -u ${username} mkdir -p ${user_home}/.nodejs/node_modules
    sudo -u ${username} mkdir -p ${user_home}/.nodejs/node_cache
    sudo -u ${username} mkdir -p ${user_home}/tmp
    sudo -u ${username} mkdir -p ${user_home}/work
    sudo -u ${username} mkdir -p ${user_home}/workspace/test
    sudo -u ${username} mkdir -p ${user_home}/.go
}

function init_bashrc_for_go() {
    sed -i "/^export GOROOT=/d" ${user_home}/.bashrc
    sed -i "/^export GOPATH=/d" ${user_home}/.bashrc
    sed -i "/^export GOBIN=/d" ${user_home}/.bashrc
    sed -i "/^export GOPRIVATE=/d" ${user_home}/.bashrc
    sed -i "/^export GOPROXY=/d" ${user_home}/.bashrc
    sed -i "/^export GO111MODULE=/d" ${user_home}/.bashrc
    sed -i "/^export PATH=\$GOROOT/d" ${user_home}/.bashrc
    {
        echo ""
        # go sdk
        echo "export GOROOT=/usr/local/go-${go_version}"
        # go path, 根据各人习惯, 一般都放在各人的home目录下面
        echo "export GOPATH=~/.go"
        # go 的可执行文件
        echo "export GOBIN=\$GOPATH/bin"
        # go 1.13 开始支持 go get 时哪些仓库绕过代理，多用于私有仓库
        echo "export GOPRIVATE=${go_private_repo}"
        # go proxy 设置 go get 时的代理, direct 用来表示 go get 时如果遇到404, 则直接走直连
        echo "export GOPROXY=${go_proxy}"
        # 开启 go mod 管理依赖，默认为 auto
        echo "export GO111MODULE=on"
        # PATH
        echo "export PATH=\$GOROOT/bin:\$GOBIN:\$PATH"
    } >> ${user_home}/.bashrc
}

function init_bashrc_for_nodejs() {
    sed -i "/^export NODEJSROOT=/d" ${user_home}/.bashrc
    sed -i "/^export PATH=\$NODEJSROOT/d" ${user_home}/.bashrc
    {
        echo ""
        # nodejs sdk
        echo "export NODEJSROOT=/usr/local/nodejs-${nodejs_version}"
        # PATH
        echo "export PATH=\$NODEJSROOT/bin:\$PATH"
    } >> ${user_home}/.bashrc
}

function init_bashrc_for_python() {
    sed -i "/^export PYROOT=/d" ${user_home}/.bashrc
    sed -i "/^export PATH=\$PYROOT/d" ${user_home}/.bashrc
    {
        echo ""
        # nodejs sdk
        echo "export PYROOT=/usr/local/python-${python_version}"
        # PATH
        echo "export PATH=\$PYROOT/bin:\$PATH"
    } >> ${user_home}/.bashrc
}

function wget_go() {
    linux_http_proxy_up
    [ -e "${user_home}/package/${go_tar_filename}" ] || sudo -u ${username}  wget -O "${user_home}/package/${go_tar_filename}" "${go_wget_url}" || exit 2
    linux_http_proxy_down
}

function wget_nodejs() {
    linux_http_proxy_up
    [ -e "${user_home}/package/${nodejs_tar_filename}" ] || sudo -u ${username}  wget -O "${user_home}/package/${nodejs_tar_filename}" "${nodejs_wget_url}" || exit 2
    linux_http_proxy_down
}

function wget_python() {
    linux_http_proxy_up
    [ -e "${user_home}/package/${python_tar_filename}" ] || sudo -u ${username}  wget -O "${user_home}/package/${python_tar_filename}" "${python_wget_url}" || exit 2
    linux_http_proxy_down
}

function install_go() {
    dir=""
    dir="go"
    cd "${user_home}/package"
    rm -rf "${dir}" || exit 2
    tar -zxf ${go_tar_filename} || exit 2
    mv "${user_home}/package/${dir}" /usr/local/go-${go_version} || exit 2
    init_bashrc_for_go
    source ${user_home}/.bashrc
}

function install_nodejs() {
    dir=""
    dir=$(echo ${nodejs_tar_filename} | awk -F '.tar' '{print $1}')
    [[ ! "${dir}" =~ ^$ ]] || usage "获取 nodejs 解码目录失败"
    cd "${user_home}/package"
    rm -rf "${dir}" || exit 2
    tar -xf ${nodejs_tar_filename} || exit 2
    mv "${user_home}/package/${dir}" /usr/local/nodejs-${nodejs_version} || exit 2

    sudo -u ${username} /usr/local/nodejs-${nodejs_version}/bin/npm config set prefix ${user_home}/.nodejs/node_modules
    sudo -u ${username} /usr/local/nodejs-${nodejs_version}/bin/npm config set cache  ${user_home}/.nodejs/node_cache
    sudo -u ${username} /usr/local/nodejs-${nodejs_version}/bin/npm config set registry ${nodejs_source} --global
    sudo -u ${username} /usr/local/nodejs-${nodejs_version}/bin/npm install pnpm --global

    sudo -u ${username} ${user_home}/.nodejs/node_modules/pnpm config set electron_mirror http://npm.taobao.org/mirrors/electron/
    sudo -u ${username} ${user_home}/.nodejs/node_modules/pnpm config set global-bin-dir ~/bin/
    # pnpm install electron
    init_bashrc_for_nodejs
    source ${user_home}/.bashrc
}

function install_python() {
    dir=""
    dir=$(echo ${python_tar_filename} | awk -F '.tgz' '{print $1}')
    [[ ! "${dir}" =~ ^$ ]] || usage "获取 python 解压目录失败"
    cd "${user_home}/package" || exit 2
    rm -rf "${dir}" || exit 2
    tar -zxf ${python_tar_filename} || exit 2

    if ! apt update; then
            echo "apt update 失败"
            exit 102
    fi

    if ! DEBIAN_FRONTEND=noninteractive apt -y --quiet install make pkg-config zlib1g-dev libffi-dev libssl-dev libcurl4-openssl-dev libbz2-dev; then
            echo "apt 安装 依赖包 失败"
            exit 102
    fi

    cd "${user_home}/package/${dir}"
    ./configure --prefix=/usr/local/python-${python_version} --enable-optimizations
    make || exit 2
    make install || exit 2
    sudo -u ${username} /usr/local/python-${python_version}/bin/pip3 config set global.index-url ${python_source_index_url}
    sudo -u ${username} /usr/local/python-${python_version}/bin/pip3 config set install.trusted-host ${python_source_trusted_host}
    init_bashrc_for_python
    source ${user_home}/.bashrc
}

function install() {
    case "${type}" in
        "all")
            wget_go
            wget_nodejs
            wget_python
            install_go
            install_nodejs
            install_python
            ;;
        "go")
            wget_go
            install_go
            ;;
        "nodejs")
            wget_nodejs
            install_nodejs
            ;;
        "python")
            wget_python
            install_python
            ;;
        *) usage "不支持的操作" ;;
    esac
}

function uninstall() {
    # TODO: 暂时先不考虑
    return
}

function setup() {
    case "${action}" in
        "install") install ;;
        "uninstall") uninstall ;;
        *) usage "不支持的操作" ;;
    esac
}

function main() {
    options "$@"
    init_vimrc
    init_path
    setup
}

script_name="dev_init.sh"
if [ "${0##*/}" = "$script_name" ]; then
    main "$@"
fi
```
