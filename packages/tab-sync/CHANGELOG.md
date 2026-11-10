## 0.2.4

### Document 📖

- docs(tab-sync): README 顶部按钮通过 color 查询参数统一使用绿色 GITHUB、橙色 NPM、蓝色在线文档背景。

### Other Changes 🔧

- chore(tab-sync): 更新本包内部依赖：@slux/store（0.2.3 → 0.2.4）、@slux/shared（0.2.3 → 0.2.4）。

## 0.2.3

### Other Changes 🔧

- chore(tab-sync): 跟随统一版本升级至 0.2.3；更新本包内部依赖：@slux/store（0.2.2 → 0.2.3）、@slux/shared（0.2.2 → 0.2.3）。

## 0.2.2

### Document 📖

- docs(tab-sync): 按本包范围重建历史更新日志，修正分类标题与条目前缀，并为 README 补充语义 Emoji；在介绍下添加 GITHUB、NPM 和在线文档按钮。

### Other Changes 🔧

- chore(tab-sync): 更新本包内部依赖：@slux/store（0.2.1 → 0.2.2）、@slux/shared（0.2.1 → 0.2.2）。

## 0.2.1

### Other Changes 🔧

- chore(tab-sync): 跟随统一版本升级至 0.2.1；更新本包内部依赖：@slux/store（0.2.0 → 0.2.1）、@slux/shared（0.2.0 → 0.2.1）。

## 0.2.0

### Other Changes 🔧

- chore(tab-sync): 跟随统一版本升级至 0.2.0；更新本包内部依赖：@slux/store（0.1.1 → 0.2.0）、@slux/shared（0.1.1 → 0.2.0）。

## 0.1.1

### Document 📖

- docs(tab-sync): 更新本包 README，补充包导航和相关文档入口。

### Other Changes 🔧

- chore(tab-sync): 更新本包内部依赖：@slux/store（0.1.0 → 0.1.1）、@slux/shared（0.1.0 → 0.1.1）。

## 0.1.0

### New Features 🎉

- feat(tab-sync): 首次发布。为 `@slux/store` 提供基于 `BroadcastChannel` 的跨标签页状态同步。`broadcast` 是一个标准 `Middleware<T>`：把本地后续变更广播到同名通道，并把收到的远端消息经完整中间件链应用。它作为 `@slux/store` 中间件接入，复用 Store 的公共契约，
