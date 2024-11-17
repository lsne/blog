# Casbin 使用

## ACL

### 一. 示例

#### 1. 模型

```
[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = r.sub == p.sub && r.obj == p.obj && r.act == p.act
```

#### 2. 策略

```
p, alice, data1, read
p, bob, data2, write
```

#### 3. 请求

```
alice, data1, read
```

#### 4. 如果想只要有一条拒绝, 就拒绝

```
some(where (p.eft == allow)) && !some(where (p.eft == deny))
```

### 二. 解释

#### 1. 策略行

```
[policy_definition]
p = sub, obj, act, eft

p   : 定义一条策略
sub : 访问的实体, 即谁要进行访问( sub 表示要进行访问的这个人)
obj : 访问的资源, 即要访问什么东西( obj 表示要访问的资源)
act : 访问的方式, 即以什么方式进行访问(act 表示 get set read update 之类的访问方式)
eft : 返回的结果, 值只能是: allow, deny. 一般为空, 为空时, 默认为: allow
```

#### 2. 请求行

```
[request_definition]
r = sub, obj, act

请求过来的数据，sub, obj, act 含义同 策略行
```

#### 3. 匹配规则

```
[matchers]
m = r.sub == p.sub && r.obj == p.obj && r.act == p.act

# 满足这个表达式的那一条策略的 eft 的值会被返回回来
```

#### 4. 影响行

```
[policy_effect]
e = some(where (p.eft == allow))

# 所有的 eft 返回结果会进入到 Effect 行
# 只允许以下5种格式的书写。 官方顶死的。不允许其他格式
```

| Policy Effect |	意义 |	示例 |
| --- | --- | --- |
some(where (p.eft == allow)) |	allow-override |	ACL, RBAC, etc.
!some(where (p.eft == deny)) |	deny-override |	拒绝改写
some(where (p.eft == allow)) && !some(where (p.eft == deny)) |	allow-and-deny |	同意与拒绝
priority(p.eft) \|\| deny	| priority |	优先级
subjectPriority(p.eft) |	priority based on role |	主题优先级

## RBAC

### 一. 示例

#### 1. 模型

```
[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act

[role_definition]
g = _, _

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = g(r.sub, p.sub) && r.obj == p.obj && r.act == p.act
```

#### 2. 策略

```
p, alice, data1, read
p, bob, data2, write
p, data2_admin, data2, read
p, data2_admin, data2, write

g, alice, data2_admin
```

#### 3. 请求

```
alice, data2, read
```

### 二. 解释

#### 1. 角色域

```
g = _,_ 表示以角色为基础
g = _,_,_ 表示以域为基础(多商户模式)


g = _,_

# 第一个 _ 表示用户
# 第二个 _ 表示角色
# 表示这个用户是哪个角色

# g = _,_,_ 
# 第一个 _ 表示用户
# 第二个 _ 表示角色
# 第三个 _ 表示商户
# 表示这个用户是哪个角色, 属于哪个商户
```

#### 2. 匹配

```
m = g(r.sub, p.sub) && r.obj == p.obj && r.act == p.act

# g(r.sub, p.sub) 表示 请求入参中的 alice, data2, read 中的 alice, 可以以自己的身份进行访问, 也可以以策略中 g, alice, data2_admin 这一行中的 data2_admin 的身份进行访问
```

#### 3. 多租户模型

```casbin
# model
[request_definition]
r = sub, dom, obj, act

[policy_definition]
p = sub, dom, obj, act

[role_definition]
g = _, _, _

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = g(r.sub, p.sub, r.dom) && r.dom == p.dom && r.obj == p.obj && r.act == p.act

# policy
p, admin, domain1, data1, read
p, admin, domain1, data1, write
p, admin, domain2, data2, read
p, admin, domain2, data2, write

g, alice, admin, domain1
g, bob, admin, domain2

# request
alice, domain1, data1, read
```

#### 4. 解读 3

```
根据 # request 行 alice, domain1, data1, read 中的 alice, domain1 两个字段能够在 # policy 中找到一行g开头的行:  g, alice, admin, domain1 , 从而确定可以使用 admin 角色对 p 开头的行策略进行匹配。
然后查看 # policy 的 p 策略中, 以 admin 角色并且访问 domain1 域, data1 资源的 read 权限。 可以找以第 1 行就是. 从而权限通过
```

## Go 代码示例

```go
/*
 * @Author: lsne
 * @Date: 2023-11-06 20:46:49
 */

package main

import (
	"fmt"

	"github.com/casbin/casbin/v2"
	gormadapter "github.com/casbin/gorm-adapter/v3"
	_ "github.com/go-sql-driver/mysql"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func main() {
	dsn := "gva:11652e5ba54ec05b@tcp(mysql11086w.idc-shjt2.yun.lsne.cn:11086)/gva?charset=utf8mb4&parseTime=True&loc=Local"
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		fmt.Println(err)
	}
	ins, err := db.DB()
	if err != nil {
		fmt.Println(err)
	}
	defer ins.Close()

	db.AutoMigrate(&User{})

	a, _ := gormadapter.NewAdapter("mysql", dsn, true) // 最后的 true 会自动创建库表
	e, _ := casbin.NewEnforcer("examples/rbac_model.conf", a)

	add, err := e.AddPolicy("alice", "data1", "read")
	fmt.Println(add)
	fmt.Println(err)

	e.LoadPolicy()

	// Check the permission.
	e.Enforce("alice", "data1", "read")

	// Modify the policy.
	// e.AddPolicy(...)
	// e.RemovePolicy(...)

	// Save the policy back to DB.
	e.SavePolicy()

	// 查询策略, 查询第2列的值为 data1 的
	filteredPolicy := e.GetFilteredPolicy(1, "data1")

	// 也可自定义函数匹配, 具体看官方文档
}

```