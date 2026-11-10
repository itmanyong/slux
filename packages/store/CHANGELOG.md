# @slux/store

## 0.1.1

### Patch Changes

- 207e315: 基于 `v0.1.0` 之后的改动，完善包文档、交互示例和发布流程。

  - 为 25 个包的 README 补充统一导航；文档站增加各包更新日志、版本发行说明和可在站内体验的示例入口。
  - 整理示例应用的共享外壳与主题交互，并将示例图标替换为透明背景的 SVG。
  - 修正自动导入 API 清单生成规则，排除需要显式调用的 `createAutoImportApis` 工厂函数，并统一 Viewfly 清单顺序。
  - 发布工作流改为 GitHub OIDC 授信发布：预先打包各包、独立执行发布任务，并在发布成功后创建 GitHub Release 草稿。

- Updated dependencies [207e315]
  - @slux/core@0.1.1
  - @slux/shared@0.1.1

## 0.1.0

### Minor Changes

- 首次公开发布 slux 的 25 个包，统一版本为 0.1.0。

  - 提供框架无关的响应式核心与共享工具，以及 Store、Atom、Proxy、Flux、状态机和 RxJS 六种状态组织方式。
  - 提供持久化、历史记录、跨标签页同步、遥测和开发工具五类 Store 扩展。
  - 提供 React、Vue、Solid、Svelte、Angular、Preact、Ripple、Inferno、Octane、Vitarx、ActView 和 Viewfly 绑定。
  - 提供各包文档与对应示例，并接入发布检查和文档部署工作流。

### Patch Changes

- Updated dependencies
  - @slux/core@0.1.0
  - @slux/shared@0.1.0
