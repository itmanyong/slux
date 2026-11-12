## 0.3.0

### Refactor 🔨

- refactor(react): 将 `hooks/use-signal.ts`、`scope/scope-context.ts`、`types/index.ts` 扁平化为 `src` 顶层文件。

### Other Changes 🔧

- chore(react): 同步 8 项本包内部依赖范围。

## 0.2.5

### Other Changes 🔧

- chore(react): 完善发布元数据与包内许可证，并恢复 clean 清理包内依赖。
- chore(react): 同步 8 项本包内部依赖范围。

## 0.2.4

### Document 📖

- docs(react): README 顶部按钮通过 color 查询参数统一使用绿色 GITHUB、橙色 NPM、蓝色在线文档背景。

### Other Changes 🔧

- chore(react): 同步 8 项本包内部依赖范围。

## 0.2.3

### Other Changes 🔧

- chore(react): 跟随统一版本升级至 0.2.3；同步 8 项本包内部依赖范围。

## 0.2.2

### Document 📖

- docs(react): 按本包范围重建历史更新日志，修正分类标题与条目前缀，并为 README 补充语义 Emoji；在介绍下添加 GITHUB、NPM 和在线文档按钮。

### Other Changes 🔧

- chore(react): 同步 8 项本包内部依赖范围。

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
