## 0.2.2

### Document 📖

- docs(solid): 按本包范围重建历史更新日志，修正分类标题与条目前缀，并为 README 补充语义 Emoji；在介绍下添加 GITHUB、NPM 和在线文档按钮。

### Other Changes 🔧

- chore(solid): 同步 8 项本包内部依赖范围。

## 0.2.1

### Other Changes 🔧

- chore(solid): 跟随统一版本升级至 0.2.1；同步 8 项本包内部依赖范围。

## 0.2.0

### Other Changes 🔧

- chore(solid): 跟随统一版本升级至 0.2.0；同步 8 项本包内部依赖范围。

## 0.1.1

### Document 📖

- docs(solid): 更新本包 README，补充包导航和相关文档入口。

### Other Changes 🔧

- chore(solid): 同步 8 项本包内部依赖范围。

## 0.1.0

### New Features 🎉

- feat(solid): 首次发布。把 `@slux/core` 的响应式状态接入 Solid 1.9 的细粒度响应式系统。核心绑定 `useSignal` 返回 Solid 原生 `Accessor<T>`（内部由 `createSignal` 提供），在 JSX 或响应式计算里调用 `value()` 读取；主入口另提供 core `Scope` 的 Context 封装与 `createAutoImportApis`。六个范式各通过独立子入口提供同样返回 `Accessor` 的绑定。
