## 0.2.2

### Document 📖

- docs(flux): 按本包范围重建历史更新日志，修正分类标题与条目前缀，并为 README 补充语义 Emoji；在介绍下添加 GITHUB、NPM 和在线文档按钮。

### Other Changes 🔧

- chore(flux): 更新本包内部依赖：@slux/core（0.2.1 → 0.2.2）、@slux/shared（0.2.1 → 0.2.2）。

## 0.2.1

### Other Changes 🔧

- chore(flux): 跟随统一版本升级至 0.2.1；更新本包内部依赖：@slux/core（0.2.0 → 0.2.1）、@slux/shared（0.2.0 → 0.2.1）。

## 0.2.0

### Other Changes 🔧

- chore(flux): 跟随统一版本升级至 0.2.0；更新本包内部依赖：@slux/core（0.1.1 → 0.2.0）、@slux/shared（0.1.1 → 0.2.0）。

## 0.1.1

### Document 📖

- docs(flux): 更新本包 README，补充包导航和相关文档入口。

### Other Changes 🔧

- chore(flux): 更新本包内部依赖：@slux/core（0.1.0 → 0.1.1）、@slux/shared（0.1.0 → 0.1.1）。

## 0.1.0

### New Features 🎉

- feat(flux): 首次发布。基于 `@slux/core` 的 reducer + dispatch 状态范式层。内部只持有一个 core `Signal<State>` 作为状态与通知源：`dispatch(action)` 同步经过中间件链与 reducer，把 reducer 返回的完整新状态写入该 signal；依赖追踪、批处理与相等性判定全部复用 core。**不依赖 Redux，也不是 Redux 的兼容实现**。
