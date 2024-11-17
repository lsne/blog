# express web 开发框架的使用

## 特点

#### 1.  实现了路由功能
#### 2.  中间件功能
#### 3.  对req 和 res 对象的扩展
#### 4.  可以集成其他模板引擎

## 安装

#### 1.  创建项目目录

```text
mkdir ~/myapp
```

#### 2.  创建配置文件

```text
npm init -y
```

#### 3.  安装

```text
npm install express --save
```

#### 4.  编辑index.js文件开始使用

```text
vim index.js
```

## 始用

#### 1.  加载express模块

```javascript
var express = require('express');
```

#### 2.  创建一个app对象

```javascript
var app = express();
```

#### 3.  通过中间件监听指定的路由的请求

```javascript
app.get('/index',function(req,res) {
	//body...
	// res.send 是express对res的扩展
	// 可以是buffer, String, object, Array.
	// 可以自动发送响应报文头
	res.send('hello world!');  
})
```

#### 4.  启动服务

```javascript
app.listen(9092,function() {
	console.log('http://localhost:9092')
})
```

## 注册路由

#### 1.  路径绝对匹配，区分get 和 post

```javascript
app.get('/index',function(req,res) {
	//body...
	res.send('Index');
})

app.post('/index',function(req,res) {
	//body...
	res.send('Index');
})
```

#### 2.  路由前缀匹配,不区分get 和 post

```javascript
//以下方法，匹配时，可以匹配 /index/a/b ,但是不能匹配 /indexab/
app.use('/index',function(req,res) {
	//body...
	res.send('Index');
})
```

#### 3.  路径绝对匹配，不区分get 和 post

```javascript
app.all('/index',function(req,res) {
	//body...
	res.send('Index');
})
```

#### 4.  get 和 post 通过正则实现模糊匹配

```javascript
app.get(/^\/index(\/.+)*$/i,function(req,res) {
	//body...
	res.send('Index');
})
```

#### 5.  get 路由获取路径作为参数: req.params

```javascript
app.get('/news/:year/:month/:day',function(req,res) {
	//body...
	res.send(req.params);
})
```

#### 6.  处理静态资源函数

```javascript
var fn = express.static(path.join(__dirname,'public'));
app.use('/abc',fn);

//如果访问 /abc/index.html
//则会在path.join(__dirname,'public')路径下去找index.html

可以直接这样写:
app.use('/abc',express.static(path.join(__dirname,'public')));

    ```

## res 常见方法

#### 1.  res.json(\[body]) 和直接用send发送json效果一样

```javascript
res.json({'user':'tobi'})
```

#### 2.  res.redirect(\[status,] path)  向浏览器发送重定向

```javascript
res.json({'user':'tobi'})
```

#### 3.  res.sendFile()  向浏览器发送文件

```javascript
res.sendFile()
```

#### 4.  res.status(code).end() 向浏览器发送状态码

```javascript
res.status(404).end('文件不存在')
```

## express 封装路由

#### 1.  不建议把app传入到route.js里直接使用
#### 2.  更好的方法: 将route.js 里的所有路由封装成一个对象,传给app

```javascript
var express = require('express');
var router = express.Route();

router.get('/index',function(req,res) {
	//body...
	res.send('Index');
})

router.post('/index',function(req,res) {
	//body...
	res.send('Index');
})

module.exports = router;


在index.js里写:
var router = require('./router.js');
app.use('/',router)
或
app.use(router)  //不写路径，默认是根路径
```

## 模板引擎 ejs
