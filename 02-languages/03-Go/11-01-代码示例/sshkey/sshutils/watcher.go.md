```go
// Created by lsne on 2022-02-09 10:22:56

package sshutils

import (
	"bufio"
	"io"
	"strings"
)

type Watcher struct {
	Pattern  string // 要捕获字符串
	Response string // 捕获到匹配的字符串出现后, 要输入的内容
	Sentinel string // TODO 应答后返回的信息与之匹配, 说明应答失败. 还未实现
}

func watchers(in io.WriteCloser, out io.Reader, output *[]byte, wts []Watcher) {
	var stream string
	var r = bufio.NewReader(out)
	for {
		b, err := r.ReadByte()
		if err != nil {
			break
		}

		*output = append(*output, b)

		if b == byte('\n') {
			stream = ""
			continue
		}

		stream += string(b)

		for _, wt := range wts {
			if strings.Contains(strings.ToUpper(stream), strings.ToUpper(wt.Pattern)) {
				_, err = in.Write([]byte(wt.Response + "\n"))
				if err != nil {
					break
				}
			}
		}
	}
}

```