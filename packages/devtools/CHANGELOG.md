## 0.2.1

### Other Changes 🔧

- chore(devtools): 跟随统一版本升级至 0.2.1；更新本包内部依赖：@slux/store（0.2.0 → 0.2.1）、@slux/shared（0.2.0 → 0.2.1）。

## 0.2.0

### Other Changes 🔧

- chore(devtools): 跟随统一版本升级至 0.2.0；更新本包内部依赖：@slux/store（0.1.1 → 0.2.0）、@slux/shared（0.1.1 → 0.2.0）。

## 0.1.1

### Document 📖

- docs(devtools): 更新本包 README，补充包导航和相关文档入口。

### Other Changes 🔧

- chore(devtools): 更新本包内部依赖：@slux/store（0.1.0 → 0.1.1）、@slux/shared（0.1.0 → 0.1.1）。

## 0.1.0

### New Features 🎉

- feat(devtools): 首次发布。为 `@slux/store` 提供三组调试能力：`devtools` 连接 Redux DevTools 扩展、`logger` 输出控制台日志、`inspect` 注册模块级自定义检查器。前两者是 Store 中间件，第三者是全局回调注册器。中间件类型只在类型层复用 Store 的公共契约，本包运行时不导入 `@slux/store`。
