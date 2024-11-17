# javascript 基础语法
## 概览

 > javascript 搜索查资料比较权威的网站: [mdn](https://developer.mozilla.org/zh-CN/)`

#### 位置

```html
1.  行内:  <button onclick="alert('aaaaa')">点击</button>

2.  内部:
<html>
  <body>
    <script>
      alert('你好, js~')
    <script>
  </body>
</html>

3.  外部:
<html>
  <body>
    <script src="my.js"><script>
  </body>
</html>

```

#### javascript 脚本的执行顺序

> 执行顺序: 从上到下依次执行, 但 `alert, prompt` 会先被执行

## 基础语法

#### 结束符(;) 可以省略

#### 注释

```js
// 单行注释

/* 多行注释 
   多行注释 
   多行注释 
*/
```

#### 输出

```html
<html>
  <body>
    <script>
      // body 内输出
      document.write('<h1>我是标题</h1>')
    
      // 页面弹告警框
      alert('你好, js~')
      
      // 控制台输出
      console.log('看看对不对')
      
      // 页面弹对话框
      let uname = prompt('请输入姓名:')
       document.write(uname)
    <script>
  </body>
</html>
```

#### 变量 && 常量

```js
// 常量: 声明时必须赋值, 不允许修改
const PI = 3.14

let num 
num = 20

// let num // 这一行会报错, let 不允许多次声明同一个变量

let uname = '张三'

let arr = ['a', 'b', 'c', 'd', 'e']
// 数组, 对象等 优先使用 const 定义变量.  只要地址不变.就可以用
console.log(arr[0])
console.log(arr.length)

//数组添加
arr.push('f','g')  // 在数组结尾添加, 返回长度
arr.unshift('h')   // 在数组开头添加,返回数组长度

// 数组删除
arr.pop()  // 删除最后一个, 返回元素的值, 一次只能删除一个. 没有参数
arr.shift() // 删除第一个元素
arr.splice(start, deleteCount) // 从哪个位置开始(0为第一个元素), 删除几个元素
```

#### 类型

> 类型不对导致计算错误会 NaN , 比如: `console.log('aa' - 2)`
> NaN 和任何类型运算也返回 NaN
> NaN 不等于 NaN

#### 模板字符串

```js
let age = 20
// 用反引号 `` 包裹. 里面用 ${} 引用变量名
document.write(`我今年${age}岁了`)
```

#### 布尔类型, null 和 undefined 

```js
// 只 let 声明变量,不赋值.则是 undefined ; 加1 为 NaN
let obj    

// 声明为 null 值; 加1 为 1;  这个null出现的不合理.不应该出现.最好别用
obj = null

// 声明为布尔型
obj = true

// 检测数据类型
console.log(typeof obj)
```

#### 隐式转换, 强制转换

```js
// 隐式转换
console.log( 2 + '2')  // 22 string 型
console.log( 2 - '2')  // 0  number 型
console.log( 2 - '2')  // 0  number 型

// 强制转换
let str = '123'
console.log(Number(str))  // 0  number 型
let num = +prompt('输入年薪')  //prompt 接收字符串,然后通过 + 转换为 number 类型赋值给 num 变量

console.log(parseInt('12px'))  // 12 ; 后面的 px 自动省略了
console.log(parseInt('abc12px'))  // NaN 
console.log(parseFloat('12.94px'))  // 12.94 ; 后面的 px 自动省略了
console.log(parseFloat('abc12.94px'))  // NaN
```

#### 比较运算符

```js
==  是否相等
!=  是否不等
===  是否类型和值都相等
!==  是否类型和值全不等
```

#### if, switch, 三元

```js
if (year % 4 ==== 0 && year % 100 !== 0 || year % 400 ==== 0) {
    
} else if ( score >= 70) {
    
} else {
    
}

// 三元
let num =  3 > 5 ? 3 : 5

// 数字, 0-9 之前补一个0. 保持为两位数
let num = prompt('请输入一个数字:')
num = num < 10 ? 0 + num : num

//switch
switch (1) {
    case 1:
        console.log('aaa')
        break
    case 2:
        console.log('bbb')
        break
    case 3:
        console.log('ccc')
        break
    default:
        console.log('ddd')
}
```

#### while, for

```js
let i = 1
while ( i <= 3) {
    //正常语句
    i++
}

for(let i = 1; i <= 3; i++) {
    
}

// 遍历数组
for(let i = 1; i <= arr.length - 1; i++) {
    
}

for(let i in arr) {
    // i 是数组的下标索引号, 字符串类型
}
```

#### 函数

> 常用的函数名前缀

```
can 判断是否可执行某个动作
has 判断是否含有某个值
is  判断是否为某个值
get
set
load  加载某些数据

```

> 定义函数
> 函数中使用变量. 先从当前函数作用域找,找不到会找上一层作用域. 不像其他语言只在当前函数中找

```js
// 声明
function sayHi(x, y) {
    return x + y
}

// 调用
sayHi(10, 20)

// 声明时给默认值
function sayHi(x = 0, y = 0) {
    
}

// 调用
sayHi()


// 匿名函数. 必须先 let 定义函数,再使用
let fn = function (x, y) {
    //xxxxx
}

fn(1, 2)

// 匿名函数立即执行
(function(x, y){})(1, 2);    // 要加分号结束.

或
(function(x, y){}(1, 2));    // 要加分号结束.
```

#### 对象

```js
let obj = {
    uname: '张三',
    age: 18
}

obj.uname = '李四'    // 修改元素
obj.test = '测试增加'  // 增加元素
delete obj.test       // 删除 test 元素
console.log(obj.uname)
console.log(obj.test)
console.log(obj['test-abc'])  // 使用这种可以避免直接点时候,元素有特殊字符报错




// 对象的方法

let obj = {
    uname: '刘刘刘',
    song: function (x, y) {
        console.log(x + y)
    }
}

obj.song(1, 2)


for(let key in obj) {
    // key 是对象中的属性名
    console.log(obj[key])
}
```

#### document 对象

> document 可以获取html页面中的对象.对其进行修改

#### 闭包的使用场景

```js
// 外部使用函数内部变量

functino outer() {
    let a = 100
    function fn() {
        console.log(a)
    }
    return fn
}

const fun = outer()   // outer 返回的是函数里的嵌套函数
fun()      // 这里执行的是 outer 里 fn 函数, 而 fn 是个闭包. 调用了 outer() 函数的 a 变量.  实现了外部访问 outer() 函数内部的变量
```

#### 动态参数

```js
function getSum() {
    // arguments 动态参数, 只存在于函数里面
    // 实际是一个伪数组.  所以传几个参数过来都可以接收. 但没有 push, pop 等函数. 建议多用剩余参数. 别用这个动态参数. 而且 箭头函数里没有动态参数
    console.log(arguments)
}

getSum(2)
getSum(2, 3)
getSum(2, 3, 4)

---

剩余参数  只取传过来的最后多余的参数. 前面的用 a 和 b 等参数接收
function getSum(a, b, ...arr) {
    console.log(Math.max(...arr))   // 展开数组, 和函数中剩余参数的写法一样
}

const arr = [...arr1, ...arr2]  // 用展开的语法合并数组
```

#### 箭头函数

> 箭头函数中没有this; 他只会在上一层的作用域中沿用this

```js
// 替代原本就用来写匿名函数的地方

// 原来的函数
const fn = functino () {
    console.log(123)
}

// 改为箭头函数
const fn = () => {
    console.log(123)
}

// 调用
fn()
```

#### 箭头函数传递参数

```js
const fn = (x) => {
    console.log(x)
}

// 只有一个形参的时候,小括号可以省略(没有参数,或者有多个参数不可以省略), 如:
const fn = x => {
    console.log(x)
}

// 只有一行代码,可以省略大括号, 如:
const fn = x => console.log(x)

// 如果一行代码, 并且与定义和=> 在一行上写. 可以省略 return . 自动将该行代码的结果返回给调用者
const fn = x => x + x
console.log(fn(1)) // 返回 2

const fn = (x, y) => x + y
console.log(fn(2, 3)) // 返回 5

// 可以直接返回一个对象, 但必须加小括号
const fn = (uname) => ({uname: uname})
fn('刘德华')
```

#### 数组解构

```js
const arr = [1, 2, 3]
const [a, b, c] = arr   // 将数组元素批量赋值给多个变量. 即数组解构
console.log(a)
console.log(b)
console.log(c)

// 典型应用,交换变量
const a = 1
const b = 2;   // 这里必须加个分号
[b, a] = [a, b]
```

#### 数组解构体特殊写法

```js
// 默认值
const [ a = 0, b = 0] = [1]

// 剩余变量
const [a, b, ...c] = [1, 2, 3, 4]

// 忽略第三个值
const [a, b, , d] = [1, 2, 3, 4]
```

#### 对象解构

```js
// 对象解构, 变量名必须要与属性名相同, 并且不要有冲突的变量
const {uname, age} = {uname: 'aaa', age: 18}

// 对象解构,改变量名
const {uname: username, age} = {uname: 'aaa', age: 18}

//数组对象解构
const pig = [
    {
        uname: ''aaa,
        age: 6
    }
]

const [{uname, age}] = pig


// 解构多级对象
const pig = {
    name: 'aa',
    family: {
        mother: 'bb',
        father: 'cc',
        sister: 'dd'
    }
    age: 6
}

const { name, family: {mother, father, sister } } = pig


// 解构时, 可以只获取对象中的某一个,或某几个属性
const msg = {
    errno: 0,
    msg: 'success',
    data: [
    {
        uname: 'aaa',
        age: 18
    },
    {
        uname: 'bbb',
        age: 20
    }
    ]
}

const { data } = msg

// 或者在函数中形参中直接解构

function render({ data }) {
    console.log(data)
}

// 或
function render({ data: myData }) {
    console.log(data)
}

render(msg)
```

#### forEach && map && join

```js
// index 不需要可以不写.  不需要返回
arr.forEach(function (item, index ) {
    
})


// map . 需要返回新数组元素
const newArr = arr.map(function (item, index ) {
    
})

// 以 - 为分割. 将数组中所有元素拼接成一个字符串. 默认为以逗号分割
arr.join('-') 
```

#### 创建对象

```js
// 三种方式
// 1.  字面量
const obj = {
    uname: '张三',
    age: 18
}

// 2. new Object()
const obj = new Object()
obj.uname = '张三'

// 3. 自定义构造函数
// 3.1  约定: 构造函数以大写字母开头
// 3.2  构造函数只能以 new 形式调用

function Pig(uname, age) {
    this.uname = uname
    this.age = age
}

const obj = new Pig('佩奇', 6)
console.log(new Pig('佩奇', 6))
```

#### 静态成员

```js
function Pig(uname, age) {
    this.uname = uname
    this.age = age
}

// 定义 Pig 的静态属性
Pig.eye = 2

// 定义 Pig 的静态方法
Pig.sayHi() = function () {
    console.log('aaaa')
}


const obj = Pig('佩奇', 6)

// 使用静态方法(不能用 obj.)
Pig.eye
Pig.sayHi()
```

#### Object 静态方法

```js
const obj = {
    uname: 'abc',
    age: 18
}

Object.keys(obj)  // 获取 obj 对象中的所有key, 返回一个数组
Object.values(obj) 

const obj1 = {}
Object.assign(obj1, obj)  //对obj进行拷贝
```

#### 数组方法

```js
// const trueArr = Array.from(falseArr)  从伪数组转换为真数组
// forEach
// filter 
// map
// find  返回符合条件的第一个元素
// every 检测是否都符合, 返回 true/ false
// some
// reduce 

// reduce 示例
const arr = [1, 5, 8]

// 将数组内值进行累加. 结果: 14
arr.reduce(function(prev, current) {
    return prev + current
})

// 装饰数组内值进行累加, 初始值为: 10  (即从 10 开始再累加数组内的所有值), 结果: 24
arr.reduce(function(prev, current) {
    return prev + current
}, 10)

// 或者简写为
const total = arr.reduce((prev, current) => prev + current, 10)
```

#### 对象数组使用 reduce

```js
const arr = [{
    name: '张三',
    salary: 10000
}, {
    name: '李四',
    salary: 10000
}, {
    name: '王五',
    salary: 10000
},
]

// 不写初始值, 会以第一个元素进行累加. 但第一个元素是个对象,不是number类型, 所以会报错. 所以这里一定要有初始值
const total = arr.reduce((prev, current) => prev + current.salary * 1.3, 0)
```

#### number 方法

```js
const price = 12.345

// 保留两位小数, 四舍五入
price.toFixed(2)
```

#### 给数组添加方法

```js
const arr = [1,2,3]
Array.prototype.max = function () {
    return Math.max(...this)
}

console.log(arr.max())
```

## watch 延迟执行

```js
// timeoutId 表示监视器的延迟执行句柄, 有新输入会取消延迟操作并重新设置延迟
let timeoutId = 0;
watch(
  () => form.port,
  newValue => {
    if (timeoutId !== 0) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      getInsInfoByPort(newValue);
    }, 1000);
  }
);
```