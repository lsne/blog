# cargo 使用

#### cargo 命令行操作

```bash
    cargo new testcargo          # 创建项目
    cargo new testcargo --lib    # 创建一个库项目
    cd testcargo                 
    rustc main.rs                # 编译文件
    cargo check                  # 检查代码但不编译,比build快
    cargo build                  # 开发调试时编译项目到 target/debug/ ;  可以在 Cargo.toml文件的 [profile.dev] 下设置相关编译参数,如: opt-level
    cargo build --release        # 正式版本编译发布到 target/release/ ;  可以在 Cargo.toml文件的 [profile.release] 下设置相关编译参数,如: opt-level
    cargo run                    # 编译并运行项目
```

#### 项目配置文件

> release profile
 
```rust
vim Cargo.toml
[profile.dev]
opt-level = 0    // 这个参数表示多大程度优化代码, dev时无所谓, release时可以设置最大 3

[profile.release]
opt-level = 3
```
#### cargo 发布和构建

> 发布步骤

 - 在 crates.io 网站创建账号, 并且获得 api token
	 - 可以使用 github 账号进行登录
	 - 然后点: 用户头像 - Account Settings - 设置一个邮件地址(不然发布时会报错)
	 - 然后点: 用户头像 - `Account Settings - New Token - <token name> - Create`
    - `cargo login <token>` 这个命令会通知 cargo, 将 token 存储在本地 ~/.cargo/credentials
    - API token 可以在 https://crates.io/ 进行撤销

- 修改 `Cargo.toml - [package]`
    - `name = "myrustutils"` 名称必须在整个 crates.io 网站上唯一, 设置前需要提前到网站搜索查看
    - `description = "一两句话"` 会出现在 crate 搜索的结果里(不写这字段发布时会报错)
    - `license = ""` 需要提供许可证标识值(可到 http://spdx.org/licenses/ 查找)(不写这字段发布时会报错)
    - 还有 version, author 等等字段
- `cargo publish` 发布到 crates.io 网站
    - 发布时如果没有提交, 会提示 先调教代码, 如果不提交直接发布,可以使用`cargo publish --allow-dirty` 命令
- 项目已经发布就不可以在 crates.io 网站删除
- `cargo yank --vers 1.0.1` 从 crates.io 撤回版本。 不会删除任何代码
    - yank 撤回 可以防止新项目依赖于该版本 (即,新生成 Cargo.lock 文件时, 不会引用该版本)
    - yank 撤回 已经存在在项目中依赖的该版本可以继续将其作为依赖(并可下载) (即, 已经产生 Cargo.lock 文件的项目都会继续使用)
- `cargo yank --vers 1.0.1 --undo` 取消撤回

#### Workspaces 工作空间

- cargo 工作空间: 帮助管理多个相互关联且需要协同开发的crate
- cargo 工作空间: 是一套共享同一个 Cargo.lock 和输出文件夹的包

#### 创建工作空间(1 个二进制 crate, 2个库crate)

```bash
1. mkdir add && cd add
2. vim Cargo.toml
[workspace]

members = [
    "adder"
]

3. cargo new adder 
4. cargo build  // 这时会发现,  Cargo.lock 文件和 target 目录都在当前目录(add) 目录下, 而不会在(add/adder/) 目录下生成(即使 cd adder && cargo build 也不会在 adder 下生成)

5. cargo new add-one --lib  //创建新的子库
5.1 vim Cargo.toml 添加 members = ["adder", “add-one”]

6. vim adder/Cargo.toml //设置 adder 依赖于 add-one 库
[dependencies]

add-one = { path = "../add-one" }

7. 这时就可以编辑代码在 adder 里 use add-one 项目了
8. 运行 adder : cargo run -p adder

9. 运行测试:  cargo test -p add-one  // 不指定 -p 参数, 会测试所有子库的所有测试项目

10. 如果想要发布, 还是要每个子库单独发布
```

#### 从 crates.io 安装 二进制的 crate

```sh
cargo install
```

#### cargo 自定义扩展

```sh
# 如果 $PATH 中有以 cargo开头的命令, 如:  cargo-something
# 则可以这样执行
cargo something 
```

### Cargo运行测试
#### cargo test 默认行为

- 并行运行
    - 运行快
    - 确保测试之间 不会相互依赖
    - 确保测试之间 不依赖于某个共享状态(环境, 工作目录, 环境变量等等)
    - `--test-threads` 可以指定并行的线程数量, 如 `cargo test -- --test-threads=1` 指定使用一个线程进行测试
- 运行所有测试
- 捕获(不显示)所有输出, 使读取与测试结果相关的输出更容易。
    - 如果测试通过, 则不会打印代码中println!的输出内容
    - 如果测试失败, 会看到println!内容和失败信息
    - 测试成功也打印内容`cargo test -- --show-output`

#### cargo test 命令行参数:

- 针对 cargo test 的参数: 紧跟 cargo test 后
- 针对 测试可执行程序: 放在 -- 之后
    - `cargo test -- --help`  中间的 -- 并没有写错


#### 指定测试的函数名称

```sh
cargo test one_hundred  // 只运行 one_hundred 一个测试函数
cargo test add     // 所有测试函数名称是以add开头的函数都会运行
```

#### 标注: 忽略测试(`#[ignore]`)

- 可通过 `cargo test -- --ignored ` 单独运行包含 `#[ignore]` 标注的测试函数

