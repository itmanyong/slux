## 0.2.3

### Other Changes 🔧

- chore(state-machine): 跟随统一版本升级至 0.2.3；更新本包内部依赖：@slux/core（0.2.2 → 0.2.3）、@slux/shared（0.2.2 → 0.2.3）。

## 0.2.2

### Document 📖

- docs(state-machine): 按本包范围重建历史更新日志，修正分类标题与条目前缀，并为 README 补充语义 Emoji；在介绍下添加 GITHUB、NPM 和在线文档按钮。

### Other Changes 🔧

- chore(state-machine): 更新本包内部依赖：@slux/core（0.2.1 → 0.2.2）、@slux/shared（0.2.1 → 0.2.2）。

## 0.2.1

### Other Changes 🔧

- chore(state-machine): 跟随统一版本升级至 0.2.1；更新本包内部依赖：@slux/core（0.2.0 → 0.2.1）、@slux/shared（0.2.0 → 0.2.1）。

## 0.2.0

### Other Changes 🔧

- chore(state-machine): 跟随统一版本升级至 0.2.0；更新本包内部依赖：@slux/core（0.1.1 → 0.2.0）、@slux/shared（0.1.1 → 0.2.0）。

## 0.1.1

### Document 📖

- docs(state-machine): 更新本包 README，补充包导航和相关文档入口。

### Other Changes 🔧

- chore(state-machine): 更新本包内部依赖：@slux/core（0.1.0 → 0.1.1）、@slux/shared（0.1.0 → 0.1.1）。

## 0.1.0

### New Features 🎉

- feat(state-machine): 首次发布。基于 `@slux/core` 的轻量**平面**有限状态机。内部用一个 core `Signal<MachineSnapshot>` 保存当前 `{ value, context }`：`send(event)` 选择通过 guard 的转换、顺序执行 action，在 core `batch` 内一次提交新快照。**这是平面状态机范式，不是 XState 兼容实现**；不提供层级状态、并行状态、计时器、actor、异步转换或 entry/exit action（逐项依据见「能力边界」）。
