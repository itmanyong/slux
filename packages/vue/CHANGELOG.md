## 0.2.2

### Document 📖

- docs(vue): 按本包范围重建历史更新日志，修正分类标题与条目前缀，并为 README 补充语义 Emoji；在介绍下添加 GITHUB、NPM 和在线文档按钮。

### Other Changes 🔧

- chore(vue): 同步 8 项本包内部依赖范围。

## 0.2.1

### Other Changes 🔧

- chore(vue): 跟随统一版本升级至 0.2.1；同步 8 项本包内部依赖范围。

## 0.2.0

### Other Changes 🔧

- chore(vue): 跟随统一版本升级至 0.2.0；同步 8 项本包内部依赖范围。

## 0.1.1

### Document 📖

- docs(vue): 更新本包 README，补充包导航和相关文档入口。

### Other Changes 🔧

- chore(vue): 同步 8 项本包内部依赖范围。

## 0.1.0

### New Features 🎉

- feat(vue): 首次发布。把 `@slux/core` 的响应式状态接入 Vue 3.5 组合式 API。核心绑定 `useSignal` 返回一个**只读 Ref**（`Readonly<Ref<T>>`，内部为 `shallowRef` + `shallowReadonly`），在模板里可自动解包；主入口另提供 core `Scope` 的 provide / inject 封装与 `createAutoImportApis`。六个范式各通过独立子入口提供同样返回只读 Ref 的绑定。
