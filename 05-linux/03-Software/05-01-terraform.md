# terraform
## provider仓库

```
https://registry.terraform.io/ #仓库, 包括 provider, modules 等

https://registry.terraform.io/browse/providers # provider 仓库
```

基础架构测试库: https://github.com/gruntwork-io/terratest

## 安装

```sh
wget https://releases.hashicorp.com/terraform/1.3.6/terraform_1.3.6_linux_amd64.zip
unzip terraform_1.3.6_linux_amd64.zip
cp terraform /usr/local/bin/
```

## 版本管理器

```sh
git clone https://github.com/tfutils/tfenv
ln -s tfenv/bin/* /usr/local/bin/
```

## 配置文件

```toml
[lsne@myserver01v testtf]$ cat ~/.terraformrc
plugin_cache_dir = "$HOME/.terraform.d/plugin-cache"

provider_installation {
  dev_overrides {
    "lsne/kubevirt/kubevirt" = "$HOME/.terraform.d/plugins/linux_amd64"
  }
 
  # 其他provider正常从registry安装
  direct {}
}

host "registry.terraform.io" {
    services = {
        "modules.v1" = "https://alkaid-test.yun.lsne.cn:14280/v1/modules/",
        "providers.v1" = "https://alkaid-test.yun.lsne.cn:14280/v1/providers/"
    }
}
```

## 操作

#### 命令行操作

```sh
# 初始化
terraform init
terraform init -upgrade=true

# 查看执行计划
terraform plan

# 执行
terraform apply

# 资源图打印
terraform graph | dot -Tsvg > k8s.svg
或
terraform graph | dot -Tpng > k8s.png

# 销毁资源
terraform destroy

# 格式化代码
terraform fmt --diff=true  // --diff 参数会打印出被格式化的部分内容
terraform fmt --diff=true -recursive // 递归格式化子目录中的文件

# 检查语法
terraform validate 


# 启动控制台
terraform console
```

#### 实例(在 k8s 中创建一个 2 副本的 nginx 的 deployment 控制器)

```toml
# vim main.tf
terraform {
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = ">= 2.0.0"
    }
  }
}
provider "kubernetes" {
  config_path = "~/.kube/config"
}
resource "kubernetes_namespace" "MyTestNS" {
  metadata {
    name = "testtf"
  }
}
resource "kubernetes_deployment" "MyDep" {
  metadata {
    name      = "nginx-dep"
    namespace = kubernetes_namespace.MyTestNS.metadata.0.name
  }
  spec {
    replicas = 2
    selector {
      match_labels = {
        app = "MyTestApp"
      }
    }
    template {
      metadata {
        labels = {
          app = "MyTestApp"
        }
      }
      spec {
        container {
          image = "nginx:1.23.2"
          name  = "nginx-rongqihaha"
          port {
            container_port = 80
          }
        }
      }
    }
  }
}

resource "kubernetes_service" "MySvc" {
  metadata {
    name      = "nginx-svc"
    namespace = kubernetes_namespace.MyTestNS.metadata.0.name
  }
  spec {
    selector = {
      app = kubernetes_deployment.MyDep.spec.0.template.0.metadata.0.labels.app
    }
    type = "NodePort"
    port {
      node_port   = 30201
      port        = 80
      target_port = 80
    }
  }
}
    
# 初始化
terraform init

# 查看执行计划
terraform plan

# 执行
terraform init

# 资源图打印
terraform graph | dot -Tsvg > k8s.svg

# 销毁资源
terraform destroy
```

## 输入变量, 输出信息, 内置函数

```toml
# 变量可以定义在当前项目下的单独文件中, 如: variables.tf
# type 类型(string, int, map, 元组等)
# description 描述信息

# default 默认值, 只能使用字面量值。 如果没有设置默认值
#   在 linux 操作系统环境变量中指定, 变更了名必须加 TF_VAR_ 前缀, 如: TF_VAR_security_group=sg-abcdefg
#   在 terraform apply 时会进入交互, 提示用户输入变量值
#   也可以在命令行提前指定: terraform plan -var security_group=sg-abcdefg -var testvar=teststring
#   也可以在  terraform.tfvars 文件中指定
# security_group = "sg-abcdefg"
# testvar = "teststring"
#  如果变量文件名称不是 terraform.tfvars, 则需要 terraform plan -var-file 指定

# validation 校验

# 变量的使用:  var.<变量名>


# 输出变量也可以定义在单独的文件中, 如: outputs.tf
# value 输出变量的值是哪个便落入值
# description  描述信息
# sensitive = true  如果信息比较敏感
# terraform apply 之后, 在终端显示变量值
# terraform output 命令可查看输出变量值
# terraform output IP 只查看 IP 这个输出变量(这时就不会返回变量名称了, 只有值内容)


# 内置函数: 
  lookup()  从映射中获取值
  file() 从文件中读取
  templatefile("setup_nginx.sh", {time = timestamp()})     使用模板文件, 将变量 time 传入 setup_nginx.sh 

variable "image_id" {
  type        = string
  description = "The id of the machine image (AMI) to use for the server."
 
  validation {
    condition     = length(var.image_id) > 4 && substr(var.image_id, 0, 4) == "ami-"
    error_message = "The image_id value must be a valid AMI id, starting with \"ami-\"."
  }
}


output "instance_ip_addr" {
  value = aws_instance.server.private_ip
  description = "The private IP address of the main server instance."
}


```

## 数据源

>  数据源允许查询或计算一些数据以供其他地方使用。使用数据源可以使得Terraform代码使用在Terraform管理范围之外的一些信息，或者是读取其他Terraform代码保存的状态，每一种Provider都可以在定义一些资源类型的同时定义一些数据源

```toml
data "openstack_compute_flavor_v2" "small" {
  vcpus = 1
  ram   = 512
}
data "openstack_blockstorage_volume_v3" "volume_1" {
  name = "volume_1"
}
```

## 后端存储 backend

> erraform引入了一个独特的概念——状态管理，Terraform将每次执行基础设施变更操作时的状态信息保存在一个状态文件中，默认情况下会保存在当前工作目录下的terraform.tfstate文件里。

> 但是，状态文件保存在本地不利于共享，所以才有了backend后端存储这个关键词，这里的功能是把tfstate状态，和锁信息保存到后端存储中

```toml
# etcd 作为backend存储举例
terraform {
  backend "etcdv3" {
    endpoints = ["etcd-1:2379", "etcd-2:2379", "etcd-3:2379"]
    lock      = true
    prefix    = "terraform-state/"
  }
}
# s3作为backend存储举例
terraform {
  backend "s3" {
    bucket = "mybucket"
    key    = "path/to/my/key"
    region = "us-east-1"
  }
}
```

##  provisioner

```
connection {} 以哪种方式与远端服务进行通信
Provisioner 通常用来在本地机器或者登陆远程主机执行相关的操作，
如:
provisioner local-exec {} 用来执行本地的命令， 
provisioner chef  {} 用来在远程机器安装，配置和执行chef client， 
provisioner remote-exec  {} 用来登录远程主机并在其上执行命令。
provisioner file {} 用来将本地的文件复制到远程服务器
```

```toml
locals {
  hosts = split(",", var.hosts)
}

resource "null_resource" "install" {
  for_each = toset(local.hosts)

    connection {
        type        = "ssh"
        host        = each.value
        user        = var.deploy_user
        password    = var.password
        private_key = var.private_key
        timeout     = "2m"
    }

  provisioner "remote-exec" {
    inline = [
      "mkdir -p /home/${var.deploy_user}/jdk/",
    ]
  }

  provisioner "file" {
    source      = "${path.module}/packages/jdk/${var.jdk_version}/"
    destination = "/home/${var.deploy_user}/jdk/"
  }

  # centos install
  provisioner "remote-exec" {
    inline = [
      "rm -rf ${var.jdk_path}/java ; mkdir -p ${var.jdk_path}; tar xf /home/${var.deploy_user}/jdk/jdk${var.jdk_version}.tgz  -C ${var.jdk_path}/",
    ]
  }
}
```

## 模块 

```
|-- k8s.svg
|-- main.tf
|-- modules
|   |-- base-server
|   |   |-- main.tf
|   |   |-- outputs.tf
|   |   `-- variables.tf
|   `-- prep-ssh
|       |-- main.tf
|       |-- outputs.tf
|       `-- variables.tf
`-- terraform.tfstate
```

#### 调用模块

```toml
vim modules/prep-ssh/variables.tf
variable "public_key" {
    type = string
    description = "SSH public key"
}

vim modules/prep-ssh/outputs.tf
output "key_name" {
    value = aws_key_pair.ssh.key_name
    description = "SSH key name"
}

# 在最外层的 main.tf 调用 prep-ssh 模块
vim main.tf

module "ssh-key-name" {            # 这里定义的名字会被下面 output 使用
    source = "./modules/prep-ssh"  # 模块路径
    
    public_key = var.public_key     # 模块需要的变量值, 可以是字面量, 这里是匀的自己的变量又付值给 prep-ssh 模块了
}

vim outputs.tf
output "my_key_name" {
    value = modules.ssh-key-name.key_name   # 定义输出变量, 并赋值为 module "ssh-key-name" 模块里的 key_name 输出变量
}
```

#### 使用外部模块

```toml
module "ec2-instance" {
    source = "terraform-aws-modles/ec2-instance/aws"
    version = "2.8.0"
    
    ami = ""
    instance_type = ""
    name = ""
    vpc_security_group_ids = ""
}
```


## 技巧

#### 循环 count

```toml
resource "aws_instance" "server" {
    count = 2
    ami = lookup(var.amis, var.region)
    tags = {
        Name = "${var.server_name}-${count.index}"
    }
}

output "ip" {
    value = join("\n", aws_instance.server[*].public_ip)  # join 会将数组里每个值拼接在一起
    description = "AWS EC2 public IP"
}

```

#### 循环 for_each

```toml
resource "aws_instance" "server" {
    for_each = toset(["dev", "test"])
    ami = lookup(var.amis, var.region)
    tags = {
        Name = "${var.server_name}-${each.key}"
    }
}

output "ip" {
    value = join("\n", [aws_instance.server["dev"].public_ip, aws_instance.server["test"].public_ip])  # join 会将数组里每个值拼接在一起
    description = "AWS EC2 public IP"
}

```

#### 条件选择

`terraform.workspace == "test" ? 2 : 4`

```toml
resource "aws_instance" "server" {
    count = terraform.workspace == "test" ? 2 : 4
    ami = lookup(var.amis, var.region)
    tags = {
        Name = "${var.server_name}-${count.index}"
    }
}

output "ip" {
    value = join("\n", aws_instance.server[*].public_ip)  // join 会将数组里每个值拼接在一起
    description = "AWS EC2 public IP"
}
```

#### 生命周期 - 先创建, 再销毁

```toml
resource "aws_instance" "server" {
    ami = lookup(var.amis, var.region)
    tags = {
        Name = "${var.server_name}-${each.key}"
    }
    lifecycle {
        create_before_destroy = true
        // prevent_destroy = true  //阻止 terraform 销毁基础设施资源
        // ignore_changes      // 忽略更新指定的资源对象
    }
}
```


## 示例 provisioner 本地和远程执行命令

```toml
locals {
  hostname = "10.252.177.230"
  username = "lsne"
  password = "123456"
}

resource "null_resource" "myTestTF" {
  connection {
      type        = "ssh"
      host        = local.hostname
      user        = local.username
      password    = local.password
      timeout     = "2m"
  }

  provisioner "local-exec" {
    command = "mkdir -p /home/${local.username}/jdk/ && cp main.tf /home/${local.username}/jdk/main.tf"
  }

  provisioner "local-exec" {
    command = "echo ${local.hostname} >> /home/${local.username}/jdk/main.tf && echo ${local.username} >> /home/${local.username}/jdk/main.tf"
  }

  provisioner "remote-exec" {
    inline = [
      "mkdir -p /home/${local.username}/jdk/",
    ]
  }

  provisioner "file" {
    source      = "main.tf"
    destination = "/home/${local.username}/jdk/main.tf"
  }

  # centos install
  provisioner "remote-exec" {
    inline = [
      "echo ${local.hostname} >> /home/${local.username}//jdk/main.tf",
      "echo ${local.username} >> /home/${local.username}/jdk/main.tf",
    ]
  }
}
```

## 示例, 在 k8s 集群部署 deployment 2 副本的 nginx

```toml
terraform {
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = ">= 2.0.0"
    }
  }
}

provider "kubernetes" {
  config_path = "~/.kube/config"
}

resource "kubernetes_namespace" "MyTestNS" {
  metadata {
    name = "testtf"
  }
}

resource "kubernetes_deployment" "MyDep" {
  metadata {
    name      = "nginx-dep"
    namespace = kubernetes_namespace.MyTestNS.metadata.0.name
  }
  spec {
    replicas = 2
    selector {
      match_labels = {
        app = "MyTestApp"
      }
    }
    template {
      metadata {
        labels = {
          app = "MyTestApp"
        }
      }
      spec {
        container {
          image = "nginx:1.23.2"
          name  = "nginx-rongqihaha"
          port {
            container_port = 80
          }
        }
      }
    }
  }
}

resource "kubernetes_service" "MySvc" {
  metadata {
    name      = "nginx-svc"
    namespace = kubernetes_namespace.MyTestNS.metadata.0.name
  }
  spec {
    selector = {
      app = kubernetes_deployment.MyDep.spec.0.template.0.metadata.0.labels.app
    }
    type = "NodePort"
    port {
      node_port   = 30201
      port        = 80
      target_port = 80
    }
  }
}
```