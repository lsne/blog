```go
// Created by lsne on 2022-02-09 10:39:07

package sshtask

import (
	"strconv"
	"strings"
)

type SSHKeyTask struct {
	Username string
	Password string
	Timeout  int64
	Hosts    []string
	HostIns  []*Instance
}

func (t *SSHKeyTask) Connect() error {
	for _, host := range t.Hosts {
		var ins *Instance
		var err error
		port := 22

		hp := strings.Split(host, ":")
		if len(hp) > 1 {
			if port, err = strconv.Atoi(hp[1]); err != nil {
				return err
			}
		}

		if ins, err = NewInstance(hp[0], t.Username, t.Password, port, t.Timeout); err != nil {
			return err
		}
		t.HostIns = append(t.HostIns, ins)
	}
	return nil
}

func (t *SSHKeyTask) GenerateKeyFiles(force bool) error {
	for _, ins := range t.HostIns {
		if err := ins.GenerateKeyFile(force); err != nil {
			return err
		}
	}

	return nil
}

func (t *SSHKeyTask) SSHKeyscan() error {
	for _, local := range t.HostIns {
		for _, remote := range t.HostIns {
			if err := local.SSHKeyscan(remote.Host, remote.Port); err != nil {
				return err
			}
		}
	}
	return nil
}

func (t *SSHKeyTask) SSHCopyID() error {
	for _, local := range t.HostIns {
		for _, remote := range t.HostIns {
			if err := local.SSHCopyID(remote.Host, remote.Port, remote.Username, remote.Password); err != nil {
				return err
			}
		}
	}
	return nil
}

```