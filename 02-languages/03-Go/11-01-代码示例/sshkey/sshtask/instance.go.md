```go
// Created by lsne on 2022-02-09 15:31:33

package sshtask

import (
	"bufio"
	"fmt"
	"os"
	"path"
	"path/filepath"
	"strings"
	"tools/go/sshkey/sshutils"
)

type Instance struct {
	Host          string
	Port          int
	Username      string
	Password      string
	HomeDir       string
	RsaKeyFile    string
	RsaKeyPubFile string
	Conn          *sshutils.Connection
}

func NewInstance(host, username, password string, port int, timeout int64) (*Instance, error) {
	conn, err := sshutils.NewConnection(host, username, password, port, timeout)
	if err != nil {
		return nil, fmt.Errorf("在机器: %s 上, 建立ssh连接失败: %v", host, err)
	}
	ins := &Instance{Host: host, Port: port, Username: username, Password: password, RsaKeyFile: "id_rsa", RsaKeyPubFile: "id_rsa.pub", Conn: conn}
	ins.HomeDir = ins.GetHomeDir()
	return ins, nil
}

func (i *Instance) GetHomeDirFromGetentCmd() string {
	cmd := fmt.Sprintf("getent passwd %s", i.Username)

	stdout, stderr, err := i.Conn.Run(cmd)
	if err != nil {
		fmt.Printf("在机器: %s 上, 执行(%s)失败: %v, 错误输出:%s, 标准输出: %s\n", i.Host, cmd, err, stderr, stdout)
		return ""
	}

	line := strings.Split(string(stdout), ":")
	if len(line) < 6 {
		return ""
	}
	return line[5]
}

func (i *Instance) GetHomeDirFromPasswdFile() string {
	filename := "/etc/passwd"
	file, err := i.Conn.Open(filename)
	if err != nil {
		fmt.Printf("在机器: %s 上, 打开文件(%s)失败: %v\n", i.Host, filename, err)
		return ""
	}
	defer file.Close()
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		if strings.Contains(scanner.Text(), i.Username) {
			line := strings.Split(scanner.Text(), ":")
			if len(line) < 6 {
				return ""
			}
			return line[5]
		}
	}
	return ""
}

func (i *Instance) GetHomeDirFromEnv() string {
	cmd := "echo $HOME"
	stdout, stderr, err := i.Conn.Run(cmd)
	if err != nil {
		fmt.Printf("在机器: %s 上, 执行(%s)失败: %v, 错误输出:%s, 标准输出: %s\n", i.Host, cmd, err, stderr, stdout)
		return ""
	}
	return string(stdout)
}

func (i *Instance) GetHomeDir() string {
	i.GetHomeDirFromPasswdFile()
	homedir := ""
	homedir = i.GetHomeDirFromGetentCmd()
	if homedir == "" {
		homedir = i.GetHomeDirFromPasswdFile()
	}
	if homedir == "" {
		homedir = i.GetHomeDirFromEnv()
	}
	if homedir == "" {
		homedir = fmt.Sprintf("/home/%s", i.Username)
	}
	return homedir
}

func (i *Instance) GenerateKeyFile(force bool) error {
	fmt.Println(i.Host, " 机器检查或生成密钥文件")

	dir := filepath.ToSlash(path.Join(i.HomeDir, ".ssh"))
	privkey := filepath.ToSlash(path.Join(dir, i.RsaKeyFile))
	pubkey := filepath.ToSlash(path.Join(dir, i.RsaKeyPubFile))

	if i.Conn.IsExists(privkey) && i.Conn.IsExists(pubkey) {
		if err := i.Conn.Chmod(dir, 0700); err != nil {
			return err
		}

		if err := i.Conn.Chmod(privkey, 0600); err != nil {
			return err
		}

		if err := i.Conn.Chmod(pubkey, 0644); err != nil {
			return err
		}
		return nil
	}

	if i.Conn.IsExists(privkey) {
		if !force {
			var yes string
			fmt.Printf("在机器: %s 上, 存在私钥(%s)但未找到公钥(%s)是否重新生成并覆盖私钥(%s)[y|n]:", i.Host, i.RsaKeyFile, i.RsaKeyPubFile, i.RsaKeyFile)
			if _, err := fmt.Scanln(&yes); err != nil {
				return err
			}
			if strings.ToUpper(yes) != "Y" && strings.ToUpper(yes) != "YES" {
				os.Exit(0)
			}
		}
	}

	if i.Conn.IsExists(pubkey) {
		if !force {
			var yes string
			fmt.Printf("在机器: %s 上, 存在公钥(%s)但未找到私钥(%s)是否重新生成并覆盖公钥(%s)[y|n]:", i.Host, i.RsaKeyPubFile, i.RsaKeyFile, i.RsaKeyPubFile)
			if _, err := fmt.Scanln(&yes); err != nil {
				return err
			}
			if strings.ToUpper(yes) != "Y" && strings.ToUpper(yes) != "YES" {
				os.Exit(0)
			}
		}
	}

	if !i.Conn.IsExists(dir) {
		if err := i.Conn.MkdirAll(dir); err != nil {
			return err
		}

		if err := i.Conn.Chmod(dir, 0700); err != nil {
			return err
		}
	}

	cmd := fmt.Sprintf("ssh-keygen -q -o -t rsa -P '' -f '%s'", privkey)
	watcher := sshutils.Watcher{Pattern: "Overwrite (y/n)?", Response: "y"}

	if stdout, stderr, err := i.Conn.Run(cmd, sshutils.SessionConfig{Watchers: []sshutils.Watcher{watcher}}); err != nil {
		return fmt.Errorf("在机器: %s 上, 执行(%s)失败: %v, 错误输出:%s, 标准输出: %s", i.Host, cmd, err, stderr, stdout)
	}

	if err := i.Conn.Chmod(privkey, 0600); err != nil {
		return err
	}

	if err := i.Conn.Chmod(pubkey, 0644); err != nil {
		return err
	}

	return nil
}

func (i *Instance) SSHKeyscan(hostname string, port int) error {
	fmt.Println(i.Host, " 机器 ssh-keyscan 远程机器 ", hostname, " 的指纹到 known_hosts 文件")

	known_hosts := filepath.ToSlash(path.Join(i.HomeDir, ".ssh", "known_hosts"))
	cmd := fmt.Sprintf("ssh-keyscan -p %d %s 1>>%s 2>/dev/null", port, hostname, known_hosts)

	if stdout, stderr, err := i.Conn.Run(cmd); err != nil {
		return fmt.Errorf("在机器: %s 上, 执行(%s)失败: %v, 错误输出:%s, 标准输出: %s", i.Host, cmd, err, stderr, stdout)
	}
	return nil
}

func (i *Instance) SSHCopyID(hostname string, port int, username string, password string) error {
	fmt.Println(i.Host, " 机器 ssh-copy-id 到 ", hostname, " 机器")

	pubkey := filepath.ToSlash(path.Join(i.HomeDir, ".ssh", i.RsaKeyPubFile))

	cmd := fmt.Sprintf("ssh-copy-id -i '%s'  %s@%s -p %d -o StrictHostKeyChecking=no", pubkey, username, hostname, port)
	watcher := sshutils.Watcher{Pattern: "Password:", Response: password}

	if stdout, stderr, err := i.Conn.Run(cmd, sshutils.SessionConfig{Watchers: []sshutils.Watcher{watcher}}); err != nil {
		return fmt.Errorf("在机器: %s 上, 执行(%s)失败: %v, 错误输出:%s, 标准输出: %s", i.Host, cmd, err, stderr, stdout)
	}
	return nil
}

```