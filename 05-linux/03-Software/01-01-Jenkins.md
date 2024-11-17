# Jenkins 安装部署

### 项目规范

```
1. 一个应用对应一份基准代码仓库(在构建和发布的时候方便)
2. 依赖应该列依赖清单(如go的 go.mod 或 python 的 requirements.txt)
3. 配置要根据部署环境单独写配置文件, 并且不能上传到代码仓库(推荐写到环境变量 或 etcd )
4. mysql,redis等数据库和第三方调用或者其他资源当作附加资源, 要做到无论附加资源怎么变,只需要修改项目中的配置就可以使用。 一定不能改代码
5. 构建 - 将代码仓库转化为可执行包的过程。构建时会使用指定版本的代码，获取和打包 依赖项，编译成二进制文件和资源文件
6. 发布 - 将构建的结果和当前部署所需 配置 相结合，并能够立刻在运行环境中投入使用
7. 运行 - 针对选定的发布版本，在执行环境中启动一系列应用程序 进程
8. 将所有发布版本都存储在一个叫 releases 的子目录中，当前的在线版本只需映射至对应的目录即可
9. 
```

### Jenkins 安装

```
1. 下载 jre
https://www.java.com/en/download/help/linux_x64_install.xml

2. 下载 jenkins
https://get.jenkins.io/war/2.253/jenkins.war

3. 解压jre
tar zxvf jre-8u261-linux-x64.tar.gz 

4. 用jre启动jenkins(默认8080)
./jre1.8.0_261/bin/java -jar jenkins.war --httpPort=8000

4.1 用tomcat启动jenkins
    创建配置文件

4.2 用rpm 包安装并启动
     http://mirrors.jenkins-ci.org/redhat/
     修改配置文件 /etc/sysconfig/jenkins
     JENKINS_USER="root"
     JENKINS_JAVA_OPTIONS="-Djava.awt.headless=true -Xms256m -Xmx512m -XX:MaxNewSize=256m -XX:MaxPermSize=256m"
     systemctl start jenkins

5. 用默认密码(~/.jenkins/secrets/initialAdminPassword ) 访问http页面
    如果是 rpm 或yum 安装的, 默认密码在  /var/lib/jenkins/secrets/initialAdminPassword


6. 跳过插件安装(后面将插件下载地址改成国内的地址之后再安装)

7. 创建默认用户

8. 插件安装

8.1  manage jenkins -- Manage Plugins -- Available -- Check now (等待扫描完成)
8.2 扫描完成后, 修改defalut.json 文件里的插件下载地址(我用的新版本, 好像不用这两步了,直接8.3 修改地址然后重启就可以):
    cd /var/lib/jenkins/updates/
    sed -i 's/https:\/\/updates.jenkinsci.org\/download/https:\/\/mirrors.tuna.tsinghua.edu.cn\/jenkins/g' default.json 
    sed -i 's/http:\/\/www.google.com/https:\/\/www.baidu.com/g' default.json
    
8.3  设置插件下载地址:
    manage jenkins -- Manage Plugins -- Advanced
    https://mirrors.tuna.tsinghua.edu.cn/jenkins/updates/update-center.json
    
8.4  重启jenkins:
    直接访问http请求重启:
    http://1.1.1.1:8000/restart

8.5  安装插件:
    请看下面的插件列表
    
9.  用户与权限管理
    系统管理 -- Configure GlobalSecurity--授权策略 -- 安全矩阵--添加用户/组
    或
    系统管理 -- Configure GlobalSecurity--授权策略 -- Role-based Authorization
    如果用role-based 则需要设置 Access Control for Builds 选项 (一定要选 run as system, 要不然git配置认证时, 显示不出凭据, 或者就不jinxAccess Control 设置, 直接把警告关闭也行)
    
10.  系统管理 -- Manage and Assign Roles (Add 创建角色)
      全局角色, 项目角色, slave角色
      项目角色的 pattern 是角色的名字, 可以加统配符(比如test开头的项目)

    
```

### 插件列表


| 功能                 | 插件名                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------ |
| 汉化                 | Localization: Chinese (Simplified)                                                         |
| 用户权限控制             | Role-based Authorization Strategy                                                          |
| 用户权限控制附加插件         | Authorize Project                                                                          |
| 管理ssh 或git 等密钥     | Credentials Binding                                                                        |
| git 插件             | Git                                                                                        |
| git 操作系统命令         | git                                                                                        |
| 远程部署插件(好像只对war包有用) | deploy to container                                                                        |
| go 项目插件            | go                                                                                         |
| 流水线项目              | Pipeline                                                                                   |
| git钩子使用插件          | gitlab hook plugin , gitlab plugin 这两个废弃了, 不能获取githook请求的参数.  现在用: Generic Webhook Trigger |
| 发送邮件扩展插件(可以定制邮件模板) | Email Extension Template                                                                   |
| 代码审查插件             | sonarQube Scanner                                                                          |
|                    |                                                                                            |
| Safe Restart


### 代码审查工具 sonarqube

#### 使用

```
1. 创建凭证
    系统管理 -- 安全 -- Manage Credentials -- 全局 -- 添加凭据 -- (除了ID, 其他都写)
    
2. 点项目  -- 配置 -- 源码管理 -- git 

3. 系统管理 -- 系统配置 -- 环境变量 (可以在这里添加系统变量)

1. 系统管理 -- 管理节点 -- 新建节点


```

### 构建自由风格项目

```
1. 新建任务
2. 配置 -- 源码管理 -- git -- 填写 URL 和 认证
3. 配置 -- 构建 -- 增加构建步骤 -- 执行shell -- 然后填写 shell 内容
4. 脚本内容一般是三步: 环境变量设置, 构建编译, 发布代码

5. git 合并代码自动构建(构建触发器):
5.1 安装插件: Generic Webhook Trigger (如果之前有配置过GitLab webhook, 请去除这个，不然Generic Webhook Trigger不会生效)
5.2 配置 -- 构建触发器 -- Generic Webhook Trigger(选中) -- Token -- 随机写一个token (如果Git仓库的验证使用的是用户名和密码，那么就不需要配置Token)

5.3 设置变量, 从githook的post请求中取值
    配置 -- 构建触发器 -- Generic Webhook Trigger -- Post content parameters : (变量名: branch, 取值表达式: $.ref, 正则过滤, 默认值; 变量名: repository, 取值表达式: $.repository.url,)
    在最后 Optional filter -- 表示匹配符合规则之后才触发构建操作, 比如匹配 develop 分支, Expression 填写正则表达式: ^(refs/heads/develop|refs/heads/master)_(git@git-biz.lsne.cn:cloud_platform/cloud_paas/dbaapi.git)$ ; Text 填写上面设置的变量和文本组合: $branch_$repository

5.4 配置 -- 系统配置 -- Gitlab:
    取消选中状态: Enable authentication for '/project' end-point
    
5.5 登录gitlab, 找到该项目 -- Settins -- Integrations -- URL 填写jenkins里构建触发器时看到的地址, Secret Token 填写上面随机写的Token， 选择触发条件, 保存。 然后可以点test测试效果

5.6 设置匹配符合

6.  参数传递
6.1  配置 -- general -- 参数化构建过程 -- 添加参数
     字符串类型 -- test_branch 默认值"master"
     

6.2  配置 -- git -- Branches to build 改为: */${test_branch}   (或从 generic webhook trigger中定义的变量<branch: /refs/heads/develop>: 直接改为: ${branch})

6.3  在shell脚本里也可以直接用 ${var} 的方法直接使用自定义的变量 和 从 generic webhook trigger 获取到的变量
     最好在这个shell里只写一两行信息, 只为了传参数给项目下的文件, 具体的部署逻辑放到项目下的shell文件里



```


## 使用 Generic Webhook Trigger 构建自动部署

```sh
# 安装 Generic Webhook Trigger 插件
# 构建 - 执行 shell 脚本
# sh tools/deploy.sh ${branch}


#!/usr/bin/env bash
# @Author : lsne
# @Date : 2020-11-13 12:05

# 测试环境机器: dbaapi00v.cpp.shjt2.lsne.cn
# 生产环境机器: dbaapi00v.cpp.shjt2.lsne.cn, db01v.cpp.zzbm.lsne.cn
TEST_HOSTS="10.249.104.68"
PROD_HOSTS="10.249.104.68 10.46.56.227"
#PROD_HOSTS="10.95.58.81"
APP_NAME="dbaapi"
APPS_ROOT_DIR="/usr/local/dbaapi"
#USER="lsne"
USER="root"
# Project Version
VERSION=$(date +%Y%m%d%H%M%S)

DIR_CONF="conf"
CONF_POSTFIX="toml"
# 项目部署的目录， link 到  $REAL_REMOTE_DEPLOY_DIR 上
REMOTE_DEPLOY_DIR="$APPS_ROOT_DIR/$APP_NAME"
REAL_REMOTE_DEPLOY_DIR="$APPS_ROOT_DIR/bin/$APP_NAME-${VERSION}"

SSHOPTION="-q  -o ConnectTimeout=6 -o ConnectionAttempts=5 -o PasswordAuthentication=no -o StrictHostKeyChecking=no "

# 根据命令行参数初始化需要用到的各个变量的值
function args_parse() {
    branch=${1:-""}
    if [[ "master" == "${branch##*/}" ]]; then
        env="prod"
        hosts="${PROD_HOSTS}"
        #conf="app.prod.toml"
        #conf=app.${env}.toml
    elif [[ "develop" == "${branch##*/}" ]]; then
        env="dev"
        hosts="${TEST_HOSTS}"
#        addr=$(ip a | grep "inet " | grep "brd.*scope" | grep -v "docker" | awk '{print $2}' | awk -F'/' '{print $1}' | head -n 1)
#        if [[ "${hosts}" != "${addr}" ]]; then
#            echo "非测试环境机器, 退出!"
#            exit 0
#        fi
        #conf="app.dev.toml"
        # 下面几行是由于测试环境目录为 dbaapi_test所以临时加的, 后面会取消掉
        APP_NAME="dbaapi-test"
        APPS_ROOT_DIR="/usr/local/dbaapi_test"
        REMOTE_DEPLOY_DIR="$APPS_ROOT_DIR/$APP_NAME"
        REAL_REMOTE_DEPLOY_DIR="$APPS_ROOT_DIR/bin/$APP_NAME-${VERSION}"
    else
        exit 2
    fi
}

function env() {
    export GOROOT="/usr/local/go115"
    export GOPATH="/usr/local/goenv"
    export GOBIN="$GOPATH/bin"
    export GOPRIVATE="*.private.repo"
    export GOPROXY="https://goproxy.cn,direct"
    export GO111MODULE="on"
    export PATH="$GOROOT/bin:$GOBIN:$PATH"
}

function build() {
    mkdir -p jenkins_deploy && rm -rf jenkins_deploy/* || exit 1
    touch jenkins_deploy/"${VERSION}"

    echo -e "[INFO]根据环境选择配置文件"
    if ! cp "${DIR_CONF}/app.${env}.${CONF_POSTFIX}" "jenkins_deploy/app.${CONF_POSTFIX}"; then
        echo -e "初始化配置文件失败"
        exit 1
    fi

    if ! cp soar "jenkins_deploy/"; then
        echo -e "拷贝soar文件失败"
        exit 1
    fi
    chmod a+x jenkins_deploy/soar

    # 添加认证rpc公钥+私钥 移动到bin下面
    #cp -R ${DIR_CONF}/ssl jenkins_deploy/conf/

    # 启动脚本
    if ! cp tools/${APP_NAME}.service jenkins_deploy/; then
        echo -e "未找到启动脚本"
        exit 1
    fi

    echo -e "[INFO]开始编译 ${APP_NAME}"
    if ! go build -o jenkins_deploy/${APP_NAME} main.go; then
        echo -e "[ERROR]编译失败."
        exit 1
    fi
}

# 远程用ssh进行部署
function deploy() {
    for host in ${hosts}; do
        # 开始上传
        echo -e "[INFO] 开始上传代码 ${host}"
        ssh $SSHOPTION ${USER}@${host} "mkdir -p /tmp/dbaapi_deploy/"
        ssh $SSHOPTION ${USER}@${host} "sudo mkdir -p ${APPS_ROOT_DIR}/bin"
        ssh $SSHOPTION ${USER}@${host} "sudo mkdir -p ${APPS_ROOT_DIR}/logs"
        scp $SSHOPTION -r jenkins_deploy ${USER}@${host}:/tmp/dbaapi_deploy/
        ssh $SSHOPTION ${USER}@${host} "sudo mv /tmp/dbaapi_deploy/jenkins_deploy ${REAL_REMOTE_DEPLOY_DIR}"
        # 生成软连
        echo -e "[INFO] 开始生成软连"
        ssh $SSHOPTION ${USER}@$host "sudo ln -sfn $REAL_REMOTE_DEPLOY_DIR $REMOTE_DEPLOY_DIR"
        version_exist_flag=$(ssh ${USER}@$host "if [[ -f "${REMOTE_DEPLOY_DIR}/${VERSION}" ]];then echo yes; else echo no; fi")
        if [[ "${version_exist_flag}AA" != "yesAA" ]]; then
            echo -e "软连接生成失败"
            exit 1
        fi

        systemctl_exist_flag=$(ssh ${USER}@$host "if [[ -f "/usr/lib/systemd/system/${APP_NAME}.service" ]];then echo yes; else echo no; fi")
        if [[ "${systemctl_exist_flag}AA" != "yesAA" ]]; then
            ssh $SSHOPTION ${USER}@$host "sudo cp -f $REAL_REMOTE_DEPLOY_DIR/${APP_NAME}.service /usr/lib/systemd/system/"
            ssh $SSHOPTION ${USER}@$host sudo systemctl daemon-reload && sudo systemctl enable ${APP_NAME}
        fi
        if ssh $SSHOPTION ${USER}@$host sudo systemctl restart ${APP_NAME}; then
            echo -e "[INFO] 发布 ${host} 成功"
        else
            echo -e "启动失败"
            exit 1
        fi
    done
}

# 用 jenkins 的 node 功能,添加node并安装agent进行部署，新部署
function deploy_local() {
    mkdir -p ${APPS_ROOT_DIR}/bin
    mkdir -p ${APPS_ROOT_DIR}/logs
    mv jenkins_deploy ${REAL_REMOTE_DEPLOY_DIR}
    ln -sfn $REAL_REMOTE_DEPLOY_DIR $REMOTE_DEPLOY_DIR
    version_exist_flag=$(if [[ -f "${REMOTE_DEPLOY_DIR}/${VERSION}" ]];then echo yes; else echo no; fi)
    if [[ "${version_exist_flag}AA" != "yesAA" ]]; then
        echo -e "软连接生成失败"
        exit 1
    fi
    systemctl_exist_flag=$(if [[ -f "/usr/lib/systemd/system/${APP_NAME}.service" ]];then echo yes; else echo no; fi)
    if [[ "${systemctl_exist_flag}AA" != "yesAA" ]]; then
        cp -f $REAL_REMOTE_DEPLOY_DIR/${APP_NAME}.service /usr/lib/systemd/system/
        systemctl daemon-reload && sudo systemctl enable ${APP_NAME}
    fi
    if systemctl restart ${APP_NAME}; then
        echo -e "[INFO] 发布 ${host} 成功"
    else
        echo -e "启动失败"
        exit 1
    fi
}

function main() {
    args_parse "$@"
    env
    build
    deploy
#    deploy_local
}

main "$@"
```