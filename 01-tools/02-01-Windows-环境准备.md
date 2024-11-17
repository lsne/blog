# windows 环境准备

### 磁盘划分

> 安装系统过程中, 在创建`C盘`时, 会从 指定的`C 盘大小` 分出 100M, 16M,独立分区。系统安装完成还会分出一个 768M 恢复区。 
> 所以安装系统时, 创建C盘分区要以实际想要划分的分区多分 ` 100M + 16M + ( 768 M 或 830M)`

| 磁盘大小 | C 盘    | D 盘    | 备注     |
| ---- | ------ | ------ | ------ |
| 256G | 80300  | 160.2G | 80300  |
| 512G | 154700 |        | 103500 |
| 1T   | 154700 |        |        |
| 2T   | 201G   |        |        |
| 3T   | 301G   |        |        |

### 系统配置
#### 1. 安装系统并修改使用本地用户

> win11 修改为本地账户

#### 2. 删除注册表(删除我的电脑中音乐, 图片等多余图标)

> 将以下信息保存为 reg文件(如: del.reg) 然后双击运行

```text
Windows Registry Editor Version 5.00
[-HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\MyComputer\NameSpace\{f86fa3ab-70d2-4fc7-9c99-fcbf05467f3a}]
[-HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\MyComputer\NameSpace\{d3162b92-9365-467a-956b-92703aca08af}]
[-HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\MyComputer\NameSpace\{B4BFCC3A-DB2C-424C-B029-7FE99A87C641}]
[-HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\MyComputer\NameSpace\{3dfdf296-dbec-4fb4-81d1-6a3438bcf4de}]
[-HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\MyComputer\NameSpace\{088e3905-0323-4b02-9826-5d99428e115f}]
[-HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\MyComputer\NameSpace\{24ad3ad4-a569-4530-98e1-ab02f9417aa8}]
[-HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\MyComputer\NameSpace\{0DB7E03F-FC29-4DC6-9020-FF41B59E513A}]
```

#### 3. 系统设置

```text
1. 打开文件资源管理器
    即打开任意一个文件夹出现的目录窗口

2. 文件夹选项设置面板
打开文件资源管理器(打开任意一个文件夹出现的窗口)  -- 点击<查看更多>(三个点) -- 点击选项 弹出

3. 在 - 常规 - 标签中 - 设置 - 打开文件资源管理器时打开: 此电脑

4. 在常规标签中的 - 隐私 - 部分:
    取消选中 - 在"快速访问"中显示最近使用的文件
    取消选中 - 在"快速访问"中显示常用文件夹
    点击 <清除> 按钮

5. 在 - 查看 - 标签中的 - 高级设置 - 取消选中 - 隐藏已知文件类型的扩展名

6. 设置 - 个性化 - 开始 - 在"开始"、"跳转列表"和"文件资源管理器"中显示 最近打开的项目   : 关闭

7. 控制面板 - 硬件和声音 - 电源选项 - 平衡 - 更改计划 - 更改高级电源选项 - 硬盘: 0

8. 控制面板 - 硬件和声音 - 电源选项 - {电源按钮, 关闭盖子, 关闭显示器, 睡眠时间}

9. 设置 - 网络和Inertnet - 高级网络设置 - 更多网络适配器选项 - 右击网卡 - 属性 - 配置 - 电源管理 - 允许计算机关闭此设备以节约电源   : 取消勾选

10. 设置时间格式: 短日期: MM-dd ddd

11. 右击开始按钮 - 设置 - 系统设置 - 多任务处理 - 贴靠窗口(关闭)

12. 关闭 Shift + 空格切全角: 
```


#### 4. 目录结构创建(忽略)

> 将以下信息保存为 bat文件(如: mkdir.bat) 然后双击运行

```sh
mkdir D:\Workspace\test
mkdir D:\Workspace\notes
mkdir D:\Workspace\Xshell\session
mkdir D:\Workspace\Xshell\logs
mkdir D:\01_Document
mkdir D:\02_Picture
mkdir D:\03_Music
mkdir D:\04_Video
mkdir D:\05_Games
mkdir D:\07_Other
mkdir D:\Downloads
```

#### 5. 安装软件

| 序号  | 名称                  | 备注                                          |
| --- | ------------------- | ------------------------------------------- |
| 0   | Edge                | 系统自带, 设置下载路径                                |
| 1   | 微软五笔                | 系统自带, 删除拼音键盘                                |
| 2   | Bandizip            | 设置关联文件                                      |
| 3   | Office 2016         | 微软账号下载                                      |
| 4   | 360极速浏览器            |                                             |
| 5   | Chrome              |                                             |
| 6   | QQ                  |                                             |
| 7   | 微信                  |                                             |
| 8   | Xodo                |                                             |
| 9   | mpv                 | 放到 C:\Program Files\ 然后执行 `mpv-install.bat` |
| 10  | notepad++           |                                             |
| 11  | Obsidian            | 需要提前安装  git 以及之后安装 obsidian 插件              |
| 12  | VSCode              | 安装插件, 详情看                                   |
| 13  | Xshell 7 破解版        | 放到 C:\Program Files\, 然后执行 `!)绿化处理.bat`     |
|     | windterm            | Linux 环境 Xshell 替代产品, 未用过                   |
|     | tabby               | Linux 环境 Xshell 替代产品, 用过, 不好用               |
| 14  | Snipste             | 截图工具, 应用商店安装。官网是压缩包不能开机自启                   |
| 15  | Quicker             | 快捷指令                                        |
| 16  | 有道云笔记               | 如果文档都转移到 obsidian 就没便哟了                     |
| 17  | Xsftp 7             |                                             |
| 18  | everything          | 搜索本地文件,用的不多。用到的时候再安装                        |
| 19  | 阿里云盘                | 设置下载路径到: D:\NetdiskDownload                 |
| 20  | 百度网盘                | 设置下载路径到: D:\NetdiskDownload                 |
| 21  | processlassosetup   | bitsum.com , 对进程限制CPU使用率                    |
| 22  | Foxmail             | work                                        |
| 23  | 蓝信                  | work                                        |
| 24  | Wireshark           | work                                        |
| 25  | workbench for mysql | work                                        |
| 26  | PDMan               | work                                        |
