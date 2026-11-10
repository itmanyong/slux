## 0.2.1

### Other Changes 🔧

- chore(octane): 跟随统一版本升级至 0.2.1；同步 8 项本包内部依赖范围。

## 0.2.0

### Other Changes 🔧

- chore(octane): 跟随统一版本升级至 0.2.0；同步 8 项本包内部依赖范围。

## 0.1.1

### Document 📖

- docs(octane): 更新本包 README，补充包导航和相关文档入口。

### Other Changes 🔧

- chore(octane): 同步 8 项本包内部依赖范围。

## 0.1.0

### New Features 🎉

- feat(octane): 首次发布。为独立的 Octane UI 框架（npm 包 `octane`，peer 为 `^0.16.7`）提供基于**编译器 slot hooks** 的原生绑定。读取绑定通过 `useSyncExternalStore` **直接返回值 `T`**（不是 ref、Accessor 或 `.value`），写入仍走原实例。与其余框架适配包最根本的不同：本包 `exports` 全部指向 **`./src/*.ts` TypeScript 源码**，不是预编译产物，且**不提供 CommonJS 入口**。
