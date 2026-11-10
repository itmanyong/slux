## 0.2.4

### Document 📖

- docs(viewfly): README 顶部按钮通过 color 查询参数统一使用绿色 GITHUB、橙色 NPM、蓝色在线文档背景。

### Other Changes 🔧

- chore(viewfly): 同步 8 项本包内部依赖范围。

## 0.2.3

### Other Changes 🔧

- chore(viewfly): 跟随统一版本升级至 0.2.3；同步 8 项本包内部依赖范围。

## 0.2.2

### Document 📖

- docs(viewfly): 按本包范围重建历史更新日志，修正分类标题与条目前缀，并为 README 补充语义 Emoji；在介绍下添加 GITHUB、NPM 和在线文档按钮。

### Other Changes 🔧

- chore(viewfly): 同步 8 项本包内部依赖范围。

## 0.2.1

### Other Changes 🔧

- chore(viewfly): 跟随统一版本升级至 0.2.1；同步 8 项本包内部依赖范围。

## 0.2.0

### Other Changes 🔧

- chore(viewfly): 跟随统一版本升级至 0.2.0；同步 8 项本包内部依赖范围。

## 0.1.1

### Document 📖

- docs(viewfly): 更新本包 README，补充包导航和相关文档入口。

### Other Changes 🔧

- chore(viewfly): 统一自动导入 API 清单排序，导出的 API 名称保持不变。
- chore(viewfly): 同步 8 项本包内部依赖范围。

## 0.1.0

### New Features 🎉

- feat(viewfly): 首次发布。把 `@slux/core` 及 6 个范式包的状态接入 **Viewfly 3**（peer 为 `@viewfly/core ^3.0.6`）。读取绑定统一以 **Accessor**（`Accessor<T> = () => T`，**调用函数**读取）暴露，写入始终走原实例，绑定不提供 setter 也不创建副本。与其它同构适配包的关键差别：Viewfly 版基于 `@viewfly/core` 的 `createSignal`，在 `onMounted` 的**下一微任务**才建立订阅以避开挂载阶段重置更新标记，且不要求原生 effect scope。本包提供 **ESM + CJS** 双入口。
