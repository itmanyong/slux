## 0.3.0

### Other Changes 🔧

- chore(actview): 跟随统一版本升级至 0.3.0；同步 8 项本包内部依赖范围。

## 0.2.5

### Other Changes 🔧

- chore(actview): 完善发布元数据与包内许可证，并恢复 clean 清理包内依赖。
- chore(actview): 同步 8 项本包内部依赖范围。

## 0.2.4

### Document 📖

- docs(actview): README 顶部按钮通过 color 查询参数统一使用绿色 GITHUB、橙色 NPM、蓝色在线文档背景。

### Other Changes 🔧

- chore(actview): 同步 8 项本包内部依赖范围。

## 0.2.3

### Other Changes 🔧

- chore(actview): 跟随统一版本升级至 0.2.3；同步 8 项本包内部依赖范围。

## 0.2.2

### Document 📖

- docs(actview): 按本包范围重建历史更新日志，修正分类标题与条目前缀，并为 README 补充语义 Emoji；在介绍下添加 GITHUB、NPM 和在线文档按钮。

### Other Changes 🔧

- chore(actview): 同步 8 项本包内部依赖范围。

## 0.2.1

### Other Changes 🔧

- chore(actview): 跟随统一版本升级至 0.2.1；同步 8 项本包内部依赖范围。

## 0.2.0

### Other Changes 🔧

- chore(actview): 跟随统一版本升级至 0.2.0；同步 8 项本包内部依赖范围。

## 0.1.1

### Document 📖

- docs(actview): 更新本包 README，补充包导航和相关文档入口。

### Other Changes 🔧

- chore(actview): 同步 8 项本包内部依赖范围。

## 0.1.0

### New Features 🎉

- feat(actview): 首次发布。把 `@slux/core` 及 6 个范式包的状态接入 **ActView 4**（peer 为 `@actview/core ^1.5.1`）。读取绑定统一以**只读浅 Ref**（`Readonly<Ref<T>>`，用 `.value` 读取）暴露，写入始终走原实例，绑定不提供 setter 也不创建副本。绑定在组件挂载或原生 effect scope 内建立，组件卸载 / scope 释放时自动清理。因 `@actview/core` 只提供 ESM，本包也**只发布 ESM 入口**。
