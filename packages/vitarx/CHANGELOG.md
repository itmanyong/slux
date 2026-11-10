## 0.2.1

### Other Changes 🔧

- chore(vitarx): 跟随统一版本升级至 0.2.1；同步 8 项本包内部依赖范围。

## 0.2.0

### Other Changes 🔧

- chore(vitarx): 跟随统一版本升级至 0.2.0；同步 8 项本包内部依赖范围。

## 0.1.1

### Document 📖

- docs(vitarx): 更新本包 README，补充包导航和相关文档入口。

### Other Changes 🔧

- chore(vitarx): 同步 8 项本包内部依赖范围。

## 0.1.0

### New Features 🎉

- feat(vitarx): 首次发布。把 `@slux/core` 及 6 个范式包的状态接入 **Vitarx 4.1**（peer 为 `vitarx ^4.1.2`）。读取绑定统一以**只读浅 Ref**（`Readonly<ShallowRef<T>>`，用 `.value` 读取）暴露，写入始终走原实例，绑定不提供 setter 也不创建副本。与 ActView 版的关键差别在桥接实现：Vitarx 版在 `isSSR()` 为真时直接返回快照 Ref、不订阅；客户端要求存在 `getActiveScope()`，并**立即订阅**后交给 `onScopeDispose` 清理。本包提供 **ESM + CJS** 双入口。
