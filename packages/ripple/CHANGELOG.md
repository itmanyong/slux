## 0.2.1

### Other Changes 🔧

- chore(ripple): 跟随统一版本升级至 0.2.1；同步 8 项本包内部依赖范围。

## 0.2.0

### Other Changes 🔧

- chore(ripple): 跟随统一版本升级至 0.2.0；同步 8 项本包内部依赖范围。

## 0.1.1

### Document 📖

- docs(ripple): 更新本包 README，补充包导航和相关文档入口。

### Other Changes 🔧

- chore(ripple): 同步 8 项本包内部依赖范围。

## 0.1.0

### New Features 🎉

- feat(ripple): 首次发布。Ripple（`ripple@^0.6.1`）的 slux 绑定，基于 `@slux/core` 的 `Subscribable<T>` 订阅模型。原生绑定形式是 **Ripple 原生 `track` / `effect`**：所有绑定返回 `Derived<T>`，以 **`.value` 读取**。`.` 入口按 `browser` / `default` 条件分流到客户端与服务端实现。所有写入仍走原实例，绑定只读。
