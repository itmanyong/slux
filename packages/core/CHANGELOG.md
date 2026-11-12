## 0.3.0

### Refactor 🔨

- refactor(core): 扁平化源码目录，`reactivity/*`、`runtime/*`、`scope/scope.ts`、`types/index.ts` 合并为 `src` 顶层文件，测试目录同步扁平化。

### Other Changes 🔧

- chore(core): 放宽 `limu` peer 依赖范围为 `>=4.2.1`。
- chore(core): 更新本包内部依赖：@slux/shared（0.2.5 → 0.3.0）。

## 0.2.5

### Other Changes 🔧

- chore(core): 完善发布元数据与包内许可证，并恢复 clean 清理包内依赖。
- chore(core): 更新本包内部依赖：@slux/shared（0.2.4 → 0.2.5）。

## 0.2.4

### Document 📖

- docs(core): README 顶部按钮通过 color 查询参数统一使用绿色 GITHUB、橙色 NPM、蓝色在线文档背景。

### Other Changes 🔧

- chore(core): 更新本包内部依赖：@slux/shared（0.2.3 → 0.2.4）。

## 0.2.3

### Other Changes 🔧

- chore(core): 跟随统一版本升级至 0.2.3；更新本包内部依赖：@slux/shared（0.2.2 → 0.2.3）。

## 0.2.2

### Document 📖

- docs(core): 按本包范围重建历史更新日志，修正分类标题与条目前缀，并为 README 补充语义 Emoji；在介绍下添加 GITHUB、NPM 和在线文档按钮。

### Other Changes 🔧

- chore(core): 更新本包内部依赖：@slux/shared（0.2.1 → 0.2.2）。

## 0.2.1

### Other Changes 🔧

- chore(core): 跟随统一版本升级至 0.2.1；更新本包内部依赖：@slux/shared（0.2.0 → 0.2.1）。

## 0.2.0

### Other Changes 🔧

- chore(core): 跟随统一版本升级至 0.2.0；更新本包内部依赖：@slux/shared（0.1.1 → 0.2.0）。

## 0.1.1

### Document 📖

- docs(core): 更新本包 README，补充包导航和相关文档入口。

### Other Changes 🔧

- chore(core): 更新本包内部依赖：@slux/shared（0.1.0 → 0.1.1）。

## 0.1.0

### New Features 🎉

- feat(core): 首次发布。框架无关的响应式核心库，构建于 [limu](https://github.com/tnfe/limu) 的不可变状态容器之上。所有信号写入统一通过 `set`，提供惰性计算、同步副作用、批处理合并与可隔离的作用域。
