## 0.2.4

### Document 📖

- docs(angular): README 顶部按钮通过 color 查询参数统一使用绿色 GITHUB、橙色 NPM、蓝色在线文档背景。

### Other Changes 🔧

- chore(angular): 同步 8 项本包内部依赖范围。

## 0.2.3

### Document 📖

- docs(angular): 移除 README 安装命令中 Angular 和 RxJS 的指定版本，使用包名直接安装。

### Other Changes 🔧

- chore(angular): 同步 8 项本包内部依赖范围。

## 0.2.2

### Document 📖

- docs(angular): 按本包范围重建历史更新日志，修正分类标题与条目前缀，并为 README 补充语义 Emoji；在介绍下添加 GITHUB、NPM 和在线文档按钮。

### Other Changes 🔧

- chore(angular): 同步 8 项本包内部依赖范围。

## 0.2.1

### Other Changes 🔧

- chore(angular): 跟随统一版本升级至 0.2.1；同步 8 项本包内部依赖范围。

## 0.2.0

### Other Changes 🔧

- chore(angular): 跟随统一版本升级至 0.2.0；同步 8 项本包内部依赖范围。

## 0.1.1

### Document 📖

- docs(angular): 更新本包 README，补充包导航和相关文档入口。

### Other Changes 🔧

- chore(angular): 同步 8 项本包内部依赖范围。

## 0.1.0

### New Features 🎉

- feat(angular): 首次发布。Angular 22（`@angular/core@^22.0.0`、`rxjs@^7.8.0`）的 slux 绑定，基于 `@slux/core` 的 `Subscribable<T>` 订阅模型。原生绑定形式是 **只读 Angular `Signal<T>` 与 RxJS `Observable` 桥接**：在注入上下文中把可订阅源转成 `Signal<T>`，并通过 `DestroyRef` 自动清理订阅。所有写入仍走原实例，绑定只读。
