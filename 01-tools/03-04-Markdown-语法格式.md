# Markdown 语法格式

### frontmatter

> 兼容: vitepress, obsidian

```
---
title: Blogging Like a Hacker
lang: en-US
outline: 'deep'   // vitepress 中设置本文档的大纲只展示到哪一级标题, 默认以 config.themeConfig.outline.level 的配置为准
---
```

### 目录

> 兼容: vitepress
> 不兼容: obsidian

vitepress 和 obsidian 都在右侧有文档大纲展示,  没必要在文档顶部生成目录

```
// vitepress 
[[toc]]

// 有道云笔记
[toc]
```

### 标题

```
这是一段普通的文本

# 这是一级标题
## 这是二级标题
### 这是三级标题
#### 这是四级标题
##### 这是五级标题
###### 这是六级标题
```

### 水平分割线

```
--- 
***
```

### 文本格式

#### 引用

```
>第一级引用1
>>第二级引用1
>>第二级引用2
>第一级引用2
```

#### 键盘文本

```
<kbd>Ctrl</kbd> + <kbd>X</kbd>
```
#### 文本高亮

> 兼容: obsidian
> 不兼容: vitepress

```
==这里是一段高亮文本==
```
#### 下划线

```
<u>这是一段加了下划线的文本</u>
```

#### 删除线

```
~~这是一段加了删除线的文本~~
```

#### 加粗

```
**这里是一段加粗文本**
__这也是一段加粗文本__
```
#### 斜体

```
*这里一段斜体文本*
_这也是一段斜体文件_
```

#### 斜体且加粗

```
这是一段普通文本

***粗斜体文本1***
___粗斜体文本2___
**_粗斜体文本3_**
*__粗斜体文本5__*
_**粗斜体文本6**_
```

### 列表

#### 有序列表

```
1. 测试第一行
2. 测试第二行
	1. 测试第二行包含的第一个元素
	2. 测试第二行包含的第二个元素
```

#### 无序列表

```
- 测试第一行
- 测试第二行
- 测试第三行
```

#### 任务列表

```
- [ ] 待办任务列表1
- [ ] 待办任务列表2
- [x] 已办任务列表1    <!-- 英文字母x -->
- [x] 已办任务列表2
```

### 锚点与链接
#### 本文档锚点

> 兼容: vitepress, obsidian
> warning: 要锚点的标题不能包含空格

```
[连接到上面主标题](#修复)
```

#### 本站跨文档锚点

> 兼容: vitepress, obsidian

```
[本站跨文档锚点](../dba/getting-started)
```

#### 链接

> 兼容: vitepress, obsidian

```
[链接到百度](https://www.baidu.com)
```

#### 链接图片

```
![图片](../public/vitepress-logo-large.webp)
```

### GitHub 风格的警报

> 兼容: vitepress, obsidian

```
> [!NOTE]
> 强调用户在快速浏览文档时也不应忽略的重要信息。

> [!TIP]
> 有助于用户更顺利达成目标的建议性信息。

> [!IMPORTANT]
> 对用户达成目标至关重要的信息。

> [!WARNING]
> 因为可能存在风险，所以需要用户立即关注的关键内容。

> [!CAUTION]
> 行为可能带来的负面影响。
```

### 代码块
####  各语言语法高亮

> 正常识别语言语法, 兼容: vitepress, obsidian

```js
//```js
export default { // Highlighted
  data () {
	return {
	  msg: `Highlighted!
	  This line isn't highlighted,
	  but this and the next 2 are.`,
	  motd: 'VitePress is awesome',
	  lorem: 'ipsum'
	}
  }
}
```

#### 指定行高亮

> 兼容: vitepress
> 不兼容: obsidian, 但不影响展示, 可以使用

```js{1,4,6-8}
//```js{1,4,6-8}
export default { // Highlighted
  data () {
	return {
	  msg: `Highlighted!
	  This line isn't highlighted,
	  but this and the next 2 are.`,
	  motd: 'VitePress is awesome',
	  lorem: 'ipsum'
	}
  }
}
```

#### 通过注释指定高亮

> 兼容: vitepress
> 不兼容: obsidian, 但不影响展示, 可以使用

```js
export default {
  data () {
    return {
      msg: 'Highlighted!' // [!code highlight]
    }
  }
}
```

#### 代码聚焦

> 兼容: vitepress
> 不兼容: obsidian, 但不影响展示, 可以使用

在某一行上添加 `// [!code focus]` 注释将聚焦它并模糊代码的其他部分。
此外，可以使用 `// [!code focus:<lines>]` 定义要聚焦的行数。

```js
export default {
  data () {
    return {
      msg: 'Focused!' // [!code focus]
    }
  }
}
```

#### 添加删除行颜色

> 兼容: vitepress
> 不兼容: obsidian, 但不影响展示, 可以使用

```js
export default {
  data () {
    return {
      msg: 'Removed' // [!code --]
      msg: 'Added' // [!code ++]
    }
  }
}
```

#### 错误和警告高亮

> 兼容: vitepress
> 不兼容: obsidian, 但不影响展示, 可以使用

```js
export default {
  data () {
    return {
      msg: 'Error', // [!code error]
      msg: 'Warning' // [!code warning]
    }
  }
}
```

#### 行号

> 兼容: vitepress
> 不兼容: obsidian, 但不影响展示, 可以使用

vitepress 需要在配置文件中启用行号支持

```js
export default {
  markdown: {
    lineNumbers: true // 开启后, 所有文档中的代码块都会显示行号
  }
}
```

启用行号
```ts {1}
// 默认禁用行号
const line2 = 'This is line 2'
const line3 = 'This is line 3'
```

```ts:line-numbers {1}
// 启用行号
const line2 = 'This is line 2'
const line3 = 'This is line 3'
```

```ts:line-numbers=2 {1}
// 行号已启用，并从 2 开始
const line3 = 'This is line 3'
const line4 = 'This is line 4'
```

### 代码块组

> 兼容: vitepress
> 不兼容: obsidian

```
::: code-group
//```linux [centos]
yum install pgsql
//```

//```linux [ubuntu]
apt install pgsql
//```
:::
```

### 数学函数

> 兼容: vitepress, obsidian

```ts
// vitepress 需要安装插件
npm add -D markdown-it-mathjax3

// 并且需要在 vitepress 配置文件中开启支持参数
// .vitepress/config.ts
export default {
  markdown: {
    math: true
  }
}
```

代码:

```
$$
\begin{vmatrix}a & b\\
c & d
\end{vmatrix}=ad-bc
$$

When $a \ne 0$, there are two solutions to $(ax^2 + bx + c = 0)$ and they are
$$ x = {-b \pm \sqrt{b^2-4ac} \over 2a} $$

**Maxwell's equations:**

| equation                                                                                                                                                                  | description                                                                            |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| $\nabla \cdot \vec{\mathbf{B}}  = 0$                                                                                                                                      | divergence of $\vec{\mathbf{B}}$ is zero                                               |
| $\nabla \times \vec{\mathbf{E}}\, +\, \frac1c\, \frac{\partial\vec{\mathbf{B}}}{\partial t}  = \vec{\mathbf{0}}$                                                          | curl of $\vec{\mathbf{E}}$ is proportional to the rate of change of $\vec{\mathbf{B}}$ |
| $\nabla \times \vec{\mathbf{B}} -\, \frac1c\, \frac{\partial\vec{\mathbf{E}}}{\partial t} = \frac{4\pi}{c}\vec{\mathbf{j}}    \nabla \cdot \vec{\mathbf{E}} = 4 \pi \rho$ | _wha?_          
```

效果如下:

$$
\begin{vmatrix}a & b\\
c & d
\end{vmatrix}=ad-bc
$$

When $a \ne 0$, there are two solutions to $(ax^2 + bx + c = 0)$ and they are
$$ x = {-b \pm \sqrt{b^2-4ac} \over 2a} $$

**Maxwell's equations:**

| equation                                                                                                                                                                  | description                                                                            |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| $\nabla \cdot \vec{\mathbf{B}}  = 0$                                                                                                                                      | divergence of $\vec{\mathbf{B}}$ is zero                                               |
| $\nabla \times \vec{\mathbf{E}}\, +\, \frac1c\, \frac{\partial\vec{\mathbf{B}}}{\partial t}  = \vec{\mathbf{0}}$                                                          | curl of $\vec{\mathbf{E}}$ is proportional to the rate of change of $\vec{\mathbf{B}}$ |
| $\nabla \times \vec{\mathbf{B}} -\, \frac1c\, \frac{\partial\vec{\mathbf{E}}}{\partial t} = \frac{4\pi}{c}\vec{\mathbf{j}}    \nabla \cdot \vec{\mathbf{E}} = 4 \pi \rho$ | _wha?_                                                                                 |
