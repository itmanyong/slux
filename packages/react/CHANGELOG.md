## 0.2.1

### Other Changes 🔧

- chore(react): 跟随统一版本升级至 0.2.1；同步 8 项本包内部依赖范围。

## 0.2.0

### Other Changes 🔧

- chore(react): 跟随统一版本升级至 0.2.0；同步 8 项本包内部依赖范围。

## 0.1.1

### Document 📖

- docs(react): 更新本包 README，补充包导航和相关文档入口。

### Other Changes 🔧

- chore(react): 同步 8 项本包内部依赖范围。

## 0.1.0

### New Features 🎉

- feat(react): 首次发布。把 `@slux/core` 的响应式状态接入 React 18 / 19。核心绑定 `useSignal` 是基于 `useSyncExternalStore` 的 hook，读取任意 `Subscribable<T>` 并返回 `T`；主入口另提供 core `Scope` 的 Context 组件与 `createAutoImportApis`。六个范式各通过独立子入口提供只读 hook，写入仍走原实例。
