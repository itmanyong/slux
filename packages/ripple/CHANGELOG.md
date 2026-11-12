## 0.3.0

### Other Changes 🔧

- chore(ripple): 跟随统一版本升级至 0.3.0；同步 8 项本包内部依赖范围。

## 0.2.5

### Bug Fixes 🐞

- fix(ripple): 统一浏览器和服务端根入口的导出集合，补齐合并类型入口，避免类型声明与实际导出不一致。

### Other Changes 🔧

- chore(ripple): 完善发布元数据与包内许可证，并恢复 clean 清理包内依赖。
- chore(ripple): 同步 8 项本包内部依赖范围。

## 0.2.4

### Document 📖

- docs(ripple): README 顶部按钮通过 color 查询参数统一使用绿色 GITHUB、橙色 NPM、蓝色在线文档背景。

### Other Changes 🔧

- chore(ripple): 同步 8 项本包内部依赖范围。

## 0.2.3

### Document 📖

- docs(ripple): 移除 README 安装命令中 Ripple 的指定版本，使用包名直接安装。

### Other Changes 🔧

- chore(ripple): 同步 8 项本包内部依赖范围。

## 0.2.2

### Document 📖

- docs(ripple): 按本包范围重建历史更新日志，修正分类标题与条目前缀，并为 README 补充语义 Emoji；在介绍下添加 GITHUB、NPM 和在线文档按钮。

### Other Changes 🔧

- chore(ripple): 同步 8 项本包内部依赖范围。

## 0.2.1

### Other Changes 🔧

- chore(ripple): 跟随统一版本升级至 0.2.1；同步 8 项本包内部依赖范围。

## 0.2.0

### Other Changes 🔧

- chore(ripple): 跟随统一版本升级至 0.2.0；同步 8 项本包内部依赖范围。

## 0.1.1

### Document 📖

- docs(ripple): 更新本包 README，补充包导航和相关文档入口。

### Other Changes 🔧

- chore(ripple): 同步 8 项本包内部依赖范围。

## 0.1.0

### New Features 🎉

- feat(ripple): 首次发布。Ripple（`ripple@^0.6.1`）的 slux 绑定，基于 `@slux/core` 的 `Subscribable<T>` 订阅模型。原生绑定形式是 **Ripple 原生 `track` / `effect`**：所有绑定返回 `Derived<T>`，以 **`.value` 读取**。`.` 入口按 `browser` / `default` 条件分流到客户端与服务端实现。所有写入仍走原实例，绑定只读。
