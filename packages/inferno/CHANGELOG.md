## 0.2.2

### Document 📖

- docs(inferno): 按本包范围重建历史更新日志，修正分类标题与条目前缀，并为 README 补充语义 Emoji；在介绍下添加 GITHUB、NPM 和在线文档按钮。

### Other Changes 🔧

- chore(inferno): 同步 8 项本包内部依赖范围。

## 0.2.1

### Other Changes 🔧

- chore(inferno): 跟随统一版本升级至 0.2.1；同步 8 项本包内部依赖范围。

## 0.2.0

### Other Changes 🔧

- chore(inferno): 跟随统一版本升级至 0.2.0；同步 8 项本包内部依赖范围。

## 0.1.1

### Document 📖

- docs(inferno): 更新本包 README，补充包导航和相关文档入口。

### Other Changes 🔧

- chore(inferno): 同步 8 项本包内部依赖范围。

## 0.1.0

### New Features 🎉

- feat(inferno): 首次发布。Inferno 10（`inferno@^10.0.0`）的 slux 绑定，基于 `@slux/core` 的 `Subscribable<T>` 订阅模型。原生绑定形式是 **原生 class 组件生命周期管理订阅 + render prop 输出值**：所有读取组件都接受 `children: (value) => InfernoNode`，由内部 `Observer` 基类在挂载、更新、卸载时管理订阅。所有写入仍走原实例，绑定只读。
