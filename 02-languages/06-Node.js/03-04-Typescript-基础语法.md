## 安装 

#### 需要先安装  typescript 包

```
pnpm global add typescript
```

#### 创建一个 vite 环境的支持 ts 的 vue 项目

```
yarn create vite <项目名称> --template vue-ts
```

#### 运行项目

```
yarn dev
```

## ts 对 js 的扩展

1. 数据类型必须强制定义.
2. 增加了一些新的数据类型

#### 基本的 js 类型

```js
let username: string = '张三'
let b: boolean = true

// 数组
let arr: string[] = ['a', 'b']

// 组合类型
let num: number | string = 0
let arr: (number | string)[] = [1, 2, 'a', 'b', 3]

// 类型别名
type ArrType = (number | string)[]
let arr1: ArrType =  [1, 2, 'a', 'b', 3]
```

#### 字面量类型

```ts
// 把常量当作类型来用
type Direction = '上' | '下' | '左' | '右'
function changeDirection(directino: Direction) {
    
}
```

#### 枚举

```ts
enum Direction {
    Up = 100,          // 不写 = 100 默认从0开始
    Down = '下',       // 如果指定 string 类型值, 则枚举中所有元素都要指定
    Left,
    Right
}

function changeDirection(directino: Direction) {
    
}

changeDirection(Direction.Down)
```

#### 元组 或 tuple

```ts
let arr: [number, number] = [1, 2]
```

#### 函数类型

```ts
const fn = function(x: number, y: number): number {
    return x + y
}

// 箭头函数, 只有一个参数只, 不能省略() 了
const sub = (a: number): number => {
    return a
}


// 函数的类型别名(不会给函数声明使用,只能给箭头函数或函数表达式使用)
type FnType = (a: number, b: number) => number

const sub: FnType = (a, b) => {
    return a - b
}

// 在 ts 函数中写返回类型 :undefined 意思是必须返回一个 undefined
// 如果不指定返回值, 其实返回的是 void

// 在 ts 中参数必须指定. 如果想实现参数传不传都行的效果. 需要在参数名后加?
// 必选参数不能在可选参数后面  
const print = (name?: string, gender?: string): vuid => {
    console.log(name, gender)
}
```

#### 对象类型

```ts
type Person = {
    name: string,
    age: number,
    gender: string,
    hobby: string, 
    girlFriend: string?,  // ? 表示可选属性
    // sayHi: (content: string) => void
    sayHi: (content: string): void       // 两种方式效果一样
}

let obj1: Person = {
    name: '张三',
    age: 18,
    gender: '未知',
    hobby: 'sdffe',
    sayHi(content) {
        console.log("asdfasd" + content)
    }
}

obj1.girlFriend && obj1.girlFriend.concat()
```

#### 接口

```ts
// 推荐 I 开头
// interface 只能给对象使用, 而 type 可以给任意类型指定别名
// 能用 type 就用 type
interface IPerson {
    name: string,
    age: number,
    gender: string,
    sayHi: () => void
}

const p1: IPerson = {
    name: '张三',
    age: 18,
    gender: '未知',
    sayHi() {
        console.log('xxxxxxx')
    }
}

p1.sayHi()


// 继承
interface IStudent extends IPerson {
    score: number
    sleep: () => void
}

const s1: IStudent = {
    name: '张三',
    age: 18,
    score: 100
}

// type 实现类似继承的效果( 不是继承)

type IPerson {
    name: string,
    age: number,
    gender: string,
    sayHi: () => void
}

// 写成 & 则必须同时满足两个type
type IStudent {
    score: number
    sleep: () => void
} & Persion

// 还可以写成 或 | ; 表示满足任意一个 type 都行. 满足两个也行
type IStudent {
    score: number
    sleep: () => void
} | Persion
```

#### 类型断言

```ts
// 强行指定获取到的结果类型
const a = document.getElementByID('link') as HTMLAnchorElement
```

#### 泛型

```ts
function getId<T>(val: T) {
    return val
}

console.log(getId<number>(123))
console.log(getId<string>('abc'))

// 调用时可以简化
console.log(getId(123))
console.log(getId('abc'))

// 泛型约束
// 1. 指定更具体的类型,比如数组
function getId<T>(val: T[]) {
    return val
}

// 2. 使用接口约束
interface Ilength {
    length: number
}

function getId<T extends ILength>(val: T) {
    val.length
    return val
}


// K 必须是 O 的所有属性(extends keyof)
function getProp<O, K extends keyof O>(obj: O, key: K) {
    return obj[key]
}

// keyof 的使用
type Friend = {
    name: string,
    age: number,
    hobby: string
}
let num: keyof Friend = 'xxx'
```

#### 泛型接口

```ts
interface Student<T> {
    id: number
    name: T
    hobby: T[]
}

let s1: Student<string> = {
    id: 123,
    name: '张三',
    hobby: ['抽烟', '喝酒']
}
```

## TypeScript 类型声明文件 `.d.ts` 只包含类型的声明

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