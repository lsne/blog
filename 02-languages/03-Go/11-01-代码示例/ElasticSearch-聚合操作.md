
#### 两层聚合

```go
/*
@Author : lsne
@Date : 2020-07-09 15:40
*/

package main

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/olivere/elastic/v7"
)

type Stat struct {
	Count float64 `json:"count"`
	Min   float64 `json:"min"`
	Max   float64 `json:"max"`
	Avg   float64 `json:"avg"`
	Sum   float64 `json:"sum"`
}

type Bucktes struct {
	Key      string `json:"key"`
	DocCount int64  `json:"doc_count"`
	TestStat Stat   `json:"teststat"`
}

func main() {
	var b []Bucktes
	var client *elastic.Client
	var host = "http://kibana7002w.lsne.cn:7002/"
	var user = "elastic"
	var password = "123456"
	var err error
	client, err = elastic.NewClient(
		elastic.SetURL(host),
		elastic.SetBasicAuth(user, password))

	if err != nil {
		fmt.Println(err)
	}

	q := elastic.NewMatchQuery("server.port", 11028)
	m := elastic.NewBoolQuery()
	m = m.Must(q)

	stat := elastic.NewStatsAggregation().Field("event.duration")
	term := elastic.NewTermsAggregation().Field("query.keyword").SubAggregation("teststat", stat).Size(200).Order("teststat.avg", false)

	r, e := client.Search().
		Index("packetbeat-mysql-7.6.3-2020.07.18").
		Query(m).
		Aggregation("testgroup", term).
		Do(context.Background())
	if e != nil {
		fmt.Println(e)
	}

	t, _ := r.Aggregations.Terms("testgroup")
	bs, _ := t.Aggregations["buckets"].MarshalJSON()
	err = json.Unmarshal(bs, &b)

	for _, l := range b {
		fmt.Println(l.Key)
		fmt.Println(l.DocCount)
		fmt.Println("count:", l.TestStat.Count)
		fmt.Println("min  :", l.TestStat.Min)
		fmt.Println("max  :", l.TestStat.Max)
		fmt.Println("avg  :", l.TestStat.Avg)
		fmt.Println("sum  :", l.TestStat.Sum)
	}
}

```

#### 三层聚合

```go
/*
@Author : lsne
@Date : 2020-07-09 15:40
*/

package main

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/olivere/elastic/v7"
)

type Stat struct {
	Count float64 `json:"count"`
	Min   float64 `json:"min"`
	Max   float64 `json:"max"`
	Avg   float64 `json:"avg"`
	Sum   float64 `json:"sum"`
}

type Bucktes struct {
	Key      string `json:"key"`
	DocCount int64  `json:"doc_count"`
	TestStat Stat   `json:"teststat"`
}

func main() {
	var client *elastic.Client
	var host = "http://kibana7002w.lsne.cn:7002/"
	var user = "elastic"
	var password = "123456"
	var err error
	client, err = elastic.NewClient(
		elastic.SetURL(host),
		elastic.SetBasicAuth(user, password))

	if err != nil {
		fmt.Println(err)
	}

	q := elastic.NewMatchQuery("server.port", 11028)
	m := elastic.NewBoolQuery()
	m = m.Must(q)

	stat := elastic.NewStatsAggregation().Field("event.duration")
	term := elastic.NewTermsAggregation().Field("query.keyword").SubAggregation("teststat", stat).Size(200).Order("teststat.avg", false)
	dAgg := elastic.NewDateHistogramAggregation().
		Field("@timestamp").
		FixedInterval("1d").
		MinDocCount(0).
		SubAggregation("testgroup", term)

	r, e := client.Search().
		Index("packetbeat-mysql-7.6.3-2020.07.18").
		Query(m).
		Aggregation("abc", dAgg).
		Do(context.Background())
	if e != nil {
		fmt.Println(e)
	}

	n, _ := r.Aggregations.Terms("abc")
	for _, item := range n.Buckets {
		t, _ := item.Terms("testgroup")
		var b []Bucktes
		bs, _ := t.Aggregations["buckets"].MarshalJSON()
		err = json.Unmarshal(bs, &b)

		for _, l := range b {
			fmt.Println(l.Key)
			fmt.Println(l.DocCount)
			fmt.Println("count:", l.TestStat.Count)
			fmt.Println("min  :", l.TestStat.Min)
			fmt.Println("max  :", l.TestStat.Max)
			fmt.Println("avg  :", l.TestStat.Avg)
			fmt.Println("sum  :", l.TestStat.Sum)
		}
	}
}

```