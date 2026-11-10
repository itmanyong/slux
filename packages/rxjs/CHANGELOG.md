## 0.2.2

### Document 📖

- docs(rxjs): 按本包范围重建历史更新日志，修正分类标题与条目前缀，并为 README 补充语义 Emoji；在介绍下添加 GITHUB、NPM 和在线文档按钮。

### Other Changes 🔧

- chore(rxjs): 更新本包内部依赖：@slux/core（0.2.1 → 0.2.2）、@slux/shared（0.2.1 → 0.2.2）。

## 0.2.1

### Other Changes 🔧

- chore(rxjs): 跟随统一版本升级至 0.2.1；更新本包内部依赖：@slux/core（0.2.0 → 0.2.1）、@slux/shared（0.2.0 → 0.2.1）。

## 0.2.0

### Other Changes 🔧

- chore(rxjs): 跟随统一版本升级至 0.2.0；更新本包内部依赖：@slux/core（0.1.1 → 0.2.0）、@slux/shared（0.1.1 → 0.2.0）。

## 0.1.1

### Document 📖

- docs(rxjs): 更新本包 README，补充包导航和相关文档入口。

### Other Changes 🔧

- chore(rxjs): 更新本包内部依赖：@slux/core（0.1.0 → 0.1.1）、@slux/shared（0.1.0 → 0.1.1）。

## 0.1.0

### New Features 🎉

- feat(rxjs): 首次发布。RxJS `Observable` 与 `@slux/core` 的 `Subscribable` 之间的双向桥接：`toObservable` 把 core 状态源包成 `Observable`，`fromObservable` 把 `Observable` 转成带 `status` / `error` / `dispose` 生命周期的 `ObservableState`。实现直接写在 `src/index.ts`，组合 core 的 `signal` / `effect` / `batch` 与 rxjs 的 `Observable`，**不是对其他实现文件的重导出**。
