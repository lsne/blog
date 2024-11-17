# Ubuntu 环境准备

## 磁盘划分

> 未归化, 后续具体归化时再补充这一部分

| 盘符    | 大小   | 备注  |
| ----- | ---- | --- |
| /boot | 2G   | sss |
| /     | 200G | sss |

## 准备 U盘系统盘

> 可使用 `Rufus` 或 `balenaEtcher` 工具制作 `U盘系统盘`

## 安装系统

#### 1. 将 U盘系统盘插入电脑

#### 2. 重启电脑, 按键进入启动项选择

> 小米笔记本是按 F12 进入选择启动

#### 3. 选择 `English` 安装

#### 4. 选择安装类型

> 正常安装
> 安装 Ubuntu 时下载更新

#### 5. 分区

> 这里选择的是清除整个磁盘
> 也可以选择自定义分区, 然后对每个分区进行自己的归化

#### 6. 输入用户, 主机名, 进安装系统

## 调整系统

#### 1. 第一次进入系统, 会提示是否更新所有软件。选择更新

#### 2. 中文键盘

```
设置，区域和语言， 管理已安装的语言(第一次打开会提示安装语言包, 选择安装)

添加中文以及中文键盘布局
```

#### 3. 输入法

```
设置 --- 键盘 --- 输入源
删除 English 
添加 汉语
添加 中文(极点五笔)
```

#### 4. `sudoer`

> `vi /etc/sudoer`
```
# 末尾添加一行:
# 一定要在末尾添加, 否则后面的规则会覆盖前面的规则

ls      ALL=(ALL) NOPASSWD: ALL
```

#### 5. 修改 `source` 文件

> `mv /etc/apt/sources.list /etc/apt/sources.list.bak`
> `vi /etc/apt.sources.list`

```
# 阿里云
deb http://mirrors.aliyun.com/ubuntu/ jammy main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ jammy main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ jammy-security main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ jammy-security main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ jammy-updates main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ jammy-updates main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ jammy-proposed main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ jammy-proposed main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ jammy-backports main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ jammy-backports main restricted universe multiverse
```

#### 6. 安装必要包

```sh
apt install vim 
apt install curl
apt install git
apt install ssh    # 如果不会被别人连，可以不安装
apt install net-tools   # ifconfig netstat 等网络命令
```

#### 7. 安装第三方输入法

```
1. apt install fcitx5 fcitx5-chinese-addons   # 五笔拼音, 只安装这两个就行

2. 设置 - 区域和语言 - 管理已安装的语言 - 键盘输入法系统: Fcitx5

3. 重启系统

4. 右上角托盘 - 键盘 - 配置 - 可用输入法: 选择<五笔拼音> 到默认分组第二个(第一个是英文) 
```

## 目录结构创建

```sh
mkdir -p bin
mkdir -p package
# mkdir -p process  # 好像没啥用
mkdir -p tmp
mkdir -p work
mkdir -p data/QQ
mkdir -p data/Wechat
mkdir -p data/YouDao
mkdir -p data/LX
mkdir -p data/vmware
mkdir -p workspace/test
mkdir -p .go
mkdir -p .nodejs/cache
mkdir -p .nodejs/prefix
# mkdir -p .venv    # python3 使用 venv 环境在每个项目根目录创建环境
```

## 安装软件

| 序号  | 名称                  | 备注                                               |     |
| --- | ------------------- | ------------------------------------------------ | --- |
| 1   | Thunderbird         | 系统自带 	work 邮箱                                    |     |
| 2   | Firefox             | 系统自带                                             |     |
| 3   | LiberOffice         | 系统自带                                             |     |
| 4   | Chrome              | 设置保存路径为: ~/Downloads                             |     |
| 5   | QQ for linux        | 设置保存路径为: ~/Data\QQ                               |     |
| 7   | WeChat for linux    | 应该需要订制版, 以后用到再找, 设置保存路径为: ~/Data\Wechat , 暂无替代产品 |     |
| 8   | 文档查看器               | 系统自带，但 pdf 好用                                    |     |
| 9   | mpv                 | `apt install mpv`, 设置 -- 默认程序 -- mpv             |     |
| 10  | 有道云笔记               | 设置文件保存路径为: ~\Data\YouDao, obsidian 二选一           |     |
| 11  | sublime text 4      | 需要激活, 具体看下一步激活步骤                                 |     |
| 12  | Obsidian +          | 有道云笔记 二选一                                        |     |
| 13  | VSCode              | 安装插件, 详情看                                        |     |
| 14  | windterm            | Linux 环境 Xshell 替代产品, 未用过                        |     |
|     | tabby               | Linux 环境 Xshell 替代产品, 用过, 不好用                    |     |
| 17  | utools 的 备用贴纸       | win Quicker 的替代方案, 安装插件, 详情见下面                   |     |
| 18  | 阿里云盘                | 没找到 linux 版本, 用的网页版. 设置下载路径到: ~/DownloadND       |     |
| 19  | 百度网盘                | 设置下载路径到: ~/DownloadND                            |     |
| 20  | flameshot           | 截图工具, win 环境下 Snipste 在 linux 环境的替代产品            |     |
| 22  | Lanxin for linux    | work 设置文件保存路径为: ~\Data\LX 。 只有统信和麒麟版本, 安装失败      |     |
| 23  | virtualBox          | work, 需要安装 `apt install gcc-12`                  |     |
| 23  | Wireshark           | work                                             |     |
| 24  | workbench for mysql | work                                             |     |
| 25  | PDMan               | work                                             |     |

## 特殊软件安装步骤
### 安装  tabby

#### 1 下载并安装: `deb`

```
https://github.com/Eugeny/tabby/releases
```

#### 2 设置

```
应用 - 语言: 中文
外观 - 字体: 16
终端 - 复制带格式: false
终端 - 鼠标 - 按下鼠标滚轮时粘贴: true
终端 - 启动时 - 自动打开一个窗口: false
终端 - 启动时 - 恢复终端标签页: false
```

#### 3 安装插件

```
# 设置 - 插件

quick-cmds # 发送命令到所有窗口 
save-output  # 保存输出到日志文件
workspace manager # 可以按分组一次打开多个窗口:  但需要手写配置文件 
sync-config # 同步配置到 github 或 gitee
```

#### 4 workspace manager 配置文件示例

> 最简( profile 的值为 配置文件中 profiles.name)

```
- name: 测试
  tabs:
    - title: 开发机
      profile: 开发机
    - title: 瞎搞机
      profile: 瞎搞机

```

> 稍微复杂一点(测试时, commands 参数没生效, 因为用不到所以没具体研究)

```
- name: 测试
  tabs:
    - title: 开发机
      color: '#03fccf'
      profile: 开发机
      commands:
        - ls  
        - cd ..
    - title: 瞎搞机
      color: '#fc036b'
      profile: 瞎搞机
      commands:
        - pwd
        - uname -r
```

### 安装 sublime text 4

```
1. 官网下载: https://www.sublimetext.com/download

2. 激活
2.1 浏览器打开: https://hexed.it/
2.2 点击 hexed.it 页面上的 打开文件按钮, 然后选择: /opt/sublime_text/sublime_text
2.3 在 hexed.it 上搜索: 80 78 05 00 0F 94 C1 并且启用替换, 然后将其替换为: C6 40 05 01 48 85 C9
2.4 点击 hexed.it 页面上的另存为按钮, 另存为: /opt/subline_text/sublime_text_new (运行 chrome 的用户 要有该目录的写权限)
2.5 替换二进制文件: cd /opt/sublime_text; mv sublime_text sublime_text_old ; mv sublime_text_new sublime_text

完成
```

### Obsidian 安装

#### 1 安装 `libfuse2`

```sh
apt install libfuse2
```

#### 2 下载 `Obsidian`

```
https://obsidian.md/download
```

#### 3 运行

```
＃ 运行时不能是 root 用户                       
chmod a+x Obsidian-1.5.3.AppImage
su - ls
./Obsidian-1.5.3.AppImage
```

#### 4 移动目录

```
mkdir -p /usr/local/obsidian-1.5.3
mv Obsidian-1.5.3.AppImage /usr/local/obsidian-1.5.3/Obsidian-1.5.3.AppImage
```

#### 5 提取 `desktop` 文件和 `png` 文件

```
cd /usr/local/obsidian-1.5.3/
./Obsidian-1.5.3.AppImage --appimage-extract 
cd squashfs-root/
cp obsidian.desktop /home/ls/.local/share/applications/
cp obsidian.png ../
cd ..
rm -rf squashfs-root
```

#### 6 修改 `desktop` 文件 

> `vim /home/ls/.local/share/applications/obsidian.desktop `

> 修改 `Exec` 值为启动 obsidian 程序, 修改 `Icon` 的值为图标文件 

```
[Desktop Entry]
Name=Obsidian
Exec=/usr/local/obsidian-1.5.3/Obsidian-1.5.3.AppImage --no-sandbox %U
Terminal=false
Type=Application
Icon=/usr/local/obsidian-1.5.3/obsidian.png
StartupWMClass=obsidian
X-AppImage-Version=1.5.3
Comment=Obsidian
MimeType=x-scheme-handler/obsidian;
Categories=Office;
```

#### 7 更新桌面文件数据库

```
chown ls:ls /home/ls/.local/share/applications/obsidian.desktop 
su - ls
update-desktop-database ~/.local/share/applications/
```

#### 8 安装插件

> 示例只是安装 tray 插件,  还要安装一个 git 插件

```
1. 在 github 搜索: obsidian tray
2. 进入仓库 releases 。下载 tar.gz 包 (看情况, 有可能源码是 ts 文件， 这时需要下载 js 文件)
3. 解压 tar.gz 到当前笔记目录下的 .obsidian/plugins 目录
  mkdir -p /home/ls/workspace/notes/.obsidian/plugins
  tar zxvf obsidian-tray-0.3.5.tar.gz -C /home/ls/workspace/notes/.obsidian/plugins/
4. 重启 obsidian 进程
```

### 安装 flameshot

```
# 安装
apt install flameshot

# 查看命令安装位置
which flameshot

# 添加操作系统快捷键
设置 - 键盘 - 查看及自定义快捷键 - 自定义快捷键
名称: flameshot
命令: /usr/bin/flameshot gui
快捷键: F1

# 设置屏幕捕获模式中的快捷键
托盘 - 火焰截图 - 配置 - 快捷键 - 在桌面上固定图像(F3)

# 使用步骤
1. 按 F1 
2. 在弹出的<截屏>对话框中, 选择右上角的<分享>按钮
3. 鼠标选定区域进行截图
4. 按 F3 将截图定在屏幕
```

### 安装 thunderbird 的 exchenage 插件

> 如果在 thunderbird 中搜索不出来, 可以在 firefox 浏览器中打开 `addons.thunderbird.net`, 将插件下载下来, 然后在 thunderbird 中选择从文件中安装

```
# 第一种插件
Provider for Exchange ActiveSync  ( TbSync 依赖这个插件 )
TbSync

# 第二种插件
Owl for Exchange

# 添加 exchange 帐号
附加组件管理 - Owl for Exchange - 设置 

email 地址: zhangsan@xxx.com
用户 名:    zhangsan@xxx.com
密码:       xxxxxx
Protocol:   Outlook Web access
登陆方式: Open login web page

然后点击创建账户
```

### Snipste 安装 (截图会黑屏, 暂无用)

#### 1 安装 `libfuse2`

```
apt install libfuse2
```

#### 2 下载 `Snipste`

```
略
```

#### 3 运行

```
chmod a+x Snipaste-2.8.9-Beta-x86_64.AppImage
su - ls
./Snipaste-2.8.9-Beta-x86_64.AppImage
```

#### 4 移动目录

```
mkdir -p /usr/local/oSnipaste-2.8.9-Beta
mv Snipaste-2.8.9-Beta-x86_64.AppImage /usr/local/oSnipaste-2.8.9-Beta／Snipaste-2.8.9-Beta-x86_64.AppImage
```

#### 5 设置开机自启动

```
vim ~/.bashrc
```

### 安装微信
```
# 这里下载, 然后直接安装
https://archive.ubuntukylin.com/software/pool/partner/weixin_2.1.2_amd64.deb
```

