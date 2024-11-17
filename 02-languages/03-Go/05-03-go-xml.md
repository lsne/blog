```go
// Created by lsne on 2023-05-30 18:11:50

package main

import (
	"encoding/xml"
	"fmt"
	"io/ioutil"
)

type Clickhouse struct {
	XMLName       xml.Name      `xml:"clickhouse"`
	RemoteServers RemoteServers `xml:"remote_servers"`
}

// type RemoteServers struct {
// 	Cluster []Cluster
// }

type RemoteServers struct {
	Cluster []Cluster `xml:",any"` // TODO: 数组中每个元素名字都不同(如: <ck_2shard_2repl>, <ch_cluster_1>, <ch_cluster_2>), 所以用 xml:",any", 要不然将xml文件 Unmarshal 到结构体的时候, 数据映射不过来
}

type Cluster struct {
	XMLName xml.Name
	Shard   []Shard `xml:"shard"`
}

type Shard struct {
	XMLName xml.Name
	Replica []Replica `xml:"replica"`
}

type Replica struct {
	Host     string `xml:"host"`
	Port     int    `xml:"port"`
	User     string `xml:"user"`
	Password string `xml:"password"`
}

func main() {
	ch := Clickhouse{}

	b, _ := ioutil.ReadFile("/home/lsne/workspace/testgo/testxml/test.xml")
	fmt.Println(string(b))

	_ = xml.Unmarshal(b, &ch)

	fmt.Println(ch)
	ch.RemoteServers.Cluster[0].XMLName.Local = "My_Test_Cluster_Name123" // TODO: 这一步是关键, 修改 cluster 的名字
	fmt.Println(ch)

	c, _ := xml.MarshalIndent(ch, "", "\t")
	fmt.Println(string(c))
}

```