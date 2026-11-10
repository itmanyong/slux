## 0.2.2

### Document 📖

- docs(proxy): 按本包范围重建历史更新日志，修正分类标题与条目前缀，并为 README 补充语义 Emoji；在介绍下添加 GITHUB、NPM 和在线文档按钮。

### Other Changes 🔧

- chore(proxy): 更新本包内部依赖：@slux/core（0.2.1 → 0.2.2）、@slux/shared（0.2.1 → 0.2.2）。

## 0.2.1

### Other Changes 🔧

- chore(proxy): 跟随统一版本升级至 0.2.1；更新本包内部依赖：@slux/core（0.2.0 → 0.2.1）、@slux/shared（0.2.0 → 0.2.1）。

## 0.2.0

### Other Changes 🔧

- chore(proxy): 跟随统一版本升级至 0.2.0；更新本包内部依赖：@slux/core（0.1.1 → 0.2.0）、@slux/shared（0.1.1 → 0.2.0）。

## 0.1.1

### Document 📖

- docs(proxy): 更新本包 README，补充包导航和相关文档入口。

### Other Changes 🔧

- chore(proxy): 更新本包内部依赖：@slux/core（0.1.0 → 0.1.1）、@slux/shared（0.1.0 → 0.1.1）。

## 0.1.0

### New Features 🎉

- feat(proxy): 首次发布。基于 `@slux/core` 的可变对象范式。`observable` 用 `Proxy` 包装普通对象 / 数组，属性赋值、删除与数组操作直接触发 core 的依赖通知；`observe` 按读取的属性自动追踪；`snapshot` 产出冻结、缓存、结构共享的只读快照；`ref` 用于把不想被代理的值按原引用嵌入状态。
