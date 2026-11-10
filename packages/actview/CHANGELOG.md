## 0.2.1

### Other Changes 🔧

- chore(actview): 跟随统一版本升级至 0.2.1；同步 8 项本包内部依赖范围。

## 0.2.0

### Other Changes 🔧

- chore(actview): 跟随统一版本升级至 0.2.0；同步 8 项本包内部依赖范围。

## 0.1.1

### Document 📖

- docs(actview): 更新本包 README，补充包导航和相关文档入口。

### Other Changes 🔧

- chore(actview): 同步 8 项本包内部依赖范围。

## 0.1.0

### New Features 🎉

- feat(actview): 首次发布。把 `@slux/core` 及 6 个范式包的状态接入 **ActView 4**（peer 为 `@actview/core ^1.5.1`）。读取绑定统一以**只读浅 Ref**（`Readonly<Ref<T>>`，用 `.value` 读取）暴露，写入始终走原实例，绑定不提供 setter 也不创建副本。绑定在组件挂载或原生 effect scope 内建立，组件卸载 / scope 释放时自动清理。因 `@actview/core` 只提供 ESM，本包也**只发布 ESM 入口**。
