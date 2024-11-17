# windows 常用操作
#### windows 上设置环境变量

```
# 设置环境变量:
$Env:MYUSERNAME = "ls"

# 查看环境变量:
$Env:MYUSERNAME
```

#### windows vbs 脚本

```vbs
db01v.vbs

Dim WshShell
Set WshShell=WScript.CreateObject("WScript.Shell") 
WshShell.SendKeys " ssh lsne@es-ops@10.10.10.10@sys-lgy01.lsne.cn -p 2222"
WshShell.SendKeys "{ENTER}"
WScript.Sleep 1000
WshShell.SendKeys "lsne.password"
WshShell.SendKeys "{ENTER}"
```
