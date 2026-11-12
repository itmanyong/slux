## 0.3.0

### Other Changes 🔧

- chore(history): 跟随统一版本升级至 0.3.0；更新本包内部依赖：@slux/core（0.2.5 → 0.3.0）、@slux/store（0.2.5 → 0.3.0）、@slux/shared（0.2.5 → 0.3.0）。

## 0.2.5

### Other Changes 🔧

- chore(history): 完善发布元数据与包内许可证，并恢复 clean 清理包内依赖。
- chore(history): 更新本包内部依赖：@slux/core（0.2.4 → 0.2.5）、@slux/store（0.2.4 → 0.2.5）、@slux/shared（0.2.4 → 0.2.5）。

## 0.2.4

### Document 📖

- docs(history): README 顶部按钮通过 color 查询参数统一使用绿色 GITHUB、橙色 NPM、蓝色在线文档背景。

### Other Changes 🔧

- chore(history): 更新本包内部依赖：@slux/core（0.2.3 → 0.2.4）、@slux/store（0.2.3 → 0.2.4）、@slux/shared（0.2.3 → 0.2.4）。

## 0.2.3

### Other Changes 🔧

- chore(history): 跟随统一版本升级至 0.2.3；更新本包内部依赖：@slux/core（0.2.2 → 0.2.3）、@slux/store（0.2.2 → 0.2.3）、@slux/shared（0.2.2 → 0.2.3）。

## 0.2.2

### Document 📖

- docs(history): 按本包范围重建历史更新日志，修正分类标题与条目前缀，并为 README 补充语义 Emoji；在介绍下添加 GITHUB、NPM 和在线文档按钮。

### Other Changes 🔧

- chore(history): 更新本包内部依赖：@slux/core（0.2.1 → 0.2.2）、@slux/store（0.2.1 → 0.2.2）、@slux/shared（0.2.1 → 0.2.2）。

## 0.2.1

### Other Changes 🔧

- chore(history): 跟随统一版本升级至 0.2.1；更新本包内部依赖：@slux/core（0.2.0 → 0.2.1）、@slux/store（0.2.0 → 0.2.1）、@slux/shared（0.2.0 → 0.2.1）。

## 0.2.0

### Other Changes 🔧

- chore(history): 跟随统一版本升级至 0.2.0；更新本包内部依赖：@slux/core（0.1.1 → 0.2.0）、@slux/store（0.1.1 → 0.2.0）、@slux/shared（0.1.1 → 0.2.0）。

## 0.1.1

### Document 📖

- docs(history): 更新本包 README，补充包导航和相关文档入口。

### Other Changes 🔧

- chore(history): 更新本包内部依赖：@slux/core（0.1.0 → 0.1.1）、@slux/store（0.1.0 → 0.1.1）、@slux/shared（0.1.0 → 0.1.1）。

## 0.1.0

### New Features 🎉

- feat(history): 首次发布。为 `@slux/store` 提供基于状态快照的撤销与重做中间件 `history`。它在每次写入前把当前状态压入 `past` 栈，撤销/重做通过完整中间件链恢复，并额外暴露 `canUndo` / `canRedo` 两个只读响应式信号。它作为 `@slux/store` 中间件接入，复用 Store 的公共契约，
