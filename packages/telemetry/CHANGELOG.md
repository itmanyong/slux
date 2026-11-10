## 0.2.2

### Document 📖

- docs(telemetry): 按本包范围重建历史更新日志，修正分类标题与条目前缀，并为 README 补充语义 Emoji；在介绍下添加 GITHUB、NPM 和在线文档按钮。

### Other Changes 🔧

- chore(telemetry): 更新本包内部依赖：@slux/store（0.2.1 → 0.2.2）、@slux/shared（0.2.1 → 0.2.2）。

## 0.2.1

### Other Changes 🔧

- chore(telemetry): 跟随统一版本升级至 0.2.1；更新本包内部依赖：@slux/store（0.2.0 → 0.2.1）、@slux/shared（0.2.0 → 0.2.1）。

## 0.2.0

### Other Changes 🔧

- chore(telemetry): 跟随统一版本升级至 0.2.0；更新本包内部依赖：@slux/store（0.1.1 → 0.2.0）、@slux/shared（0.1.1 → 0.2.0）。

## 0.1.1

### Document 📖

- docs(telemetry): 更新本包 README，补充包导航和相关文档入口。

### Other Changes 🔧

- chore(telemetry): 更新本包内部依赖：@slux/store（0.1.0 → 0.1.1）、@slux/shared（0.1.0 → 0.1.1）。

## 0.1.0

### New Features 🎉

- feat(telemetry): 首次发布。为 `@slux/store` 记录初始化、状态变化、订阅三类事件的遥测中间件 `telemetry`。它把元数据交给调用方提供的回调，支持按字段过滤与运行时暂停；不发送网络请求、不克隆状态快照。它作为 `@slux/store` 中间件接入，复用 Store 的公共契约，
