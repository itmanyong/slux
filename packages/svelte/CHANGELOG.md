## 0.2.1

### Other Changes 🔧

- chore(svelte): 跟随统一版本升级至 0.2.1；同步 8 项本包内部依赖范围。

## 0.2.0

### Other Changes 🔧

- chore(svelte): 跟随统一版本升级至 0.2.0；同步 8 项本包内部依赖范围。

## 0.1.1

### Document 📖

- docs(svelte): 更新本包 README，补充包导航和相关文档入口。

### Other Changes 🔧

- chore(svelte): 同步 8 项本包内部依赖范围。

## 0.1.0

### New Features 🎉

- feat(svelte): 首次发布。把 `@slux/core` 的响应式状态转换成 Svelte 5 原生 `Readable` / `Writable` store（`svelte/store`），可用 `$store` 自动订阅。核心绑定是 `toReadable(source)` 与 `toWritable(signal)`：前者把任意 `Subscribable<T>` 桥接成 `Readable<T>`，后者额外提供 `set` / `update` 写回 core `Signal<T>`。主入口另提供 core `Scope` 的 context 封装与 `createAutoImportApis`。六个范式各通过独立子入口提供对应的 `Readable` / `Writable` 绑定。
