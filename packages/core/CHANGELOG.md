# @slux/core

## 0.2.1

### Patch Changes

- 0953a0d: 修复首次运行新版发布流程时发现的执行目录和文档展示问题，保持运行时 API 不变。

  ### Bug Fixes
  - 将 npm 安装与授信发布步骤移至 GitHub runner 的临时目录，并通过绝对路径调用发布脚本和压缩包，避免仓库根目录的 pnpm `devEngines` 限制导致全部包发布时报 `EBADDEVENGINES`。
  - 文档站渲染远程更新日志时跳过 HTML 标签，避免将发行说明中的 `details`、`summary` 显示为字面文本，同时保留变更正文和真实提交链接。

  ### Document
  - 补充发布失败的恢复流程：在 `main` 上运行修复后的工作流并指定原发布标签，保留既有标签和版本包；说明旧运行的重跑不会读取新工作流。

- Updated dependencies [0953a0d]
  - @slux/shared@0.2.1

## 0.2.0

### Minor Changes

- 816ae21: ### New Features

  - 发布流程自动创建公开 GitHub Release，按功能、性能、修复、重构、文档和其他变更归类发行说明；各项保留核对后的 Changeset 细节，并关联本次发布范围内的真实 Git 提交。
  - 每个版本提供全部 25 个 npm 包的独立 `.tgz` 下载附件及 `SHA256SUMS` 校验清单，便于下载、离线安装和核验版本包。

  ### Bug Fixes
  - 修复发布压缩包的相对路径，确保 npm 将 `release-tarballs` 中的文件识别为本地包。
  - 发布任务重跑时识别 npm 已存在的版本，校验并复用已发布压缩包，避免部分包成功后重试整条流程因重复发布失败。

  ### Document
  - 发布准备流程从 Changeset 和 Git 历史生成版本发行说明及仓库总 CHANGELOG，同时保留 Changesets 为各包生成的版本更新记录和依赖升级明细。
  - 更新发布指南，说明分类变更的编写方式、公开 Release 与附件生成流程、历史版本说明生成和失败任务的重跑方式。

  ### Other Changes
  - 发布前增加文档构建验证，确保新版本发行说明可进入文档站；发布脚本测试覆盖分类、版本范围、包校验和重复执行行为。
  - 全部 25 个发布包统一升至 `0.2.0`；本次更新集中于发布设施和文档，未更改运行时 API。

### Patch Changes

- Updated dependencies [816ae21]
  - @slux/shared@0.2.0

## 0.1.1

### Patch Changes

- 207e315: 基于 `v0.1.0` 之后的改动，完善包文档、交互示例和发布流程。

  - 为 25 个包的 README 补充统一导航；文档站增加各包更新日志、版本发行说明和可在站内体验的示例入口。
  - 整理示例应用的共享外壳与主题交互，并将示例图标替换为透明背景的 SVG。
  - 修正自动导入 API 清单生成规则，排除需要显式调用的 `createAutoImportApis` 工厂函数，并统一 Viewfly 清单顺序。
  - 发布工作流改为 GitHub OIDC 授信发布：预先打包各包、独立执行发布任务，并在发布成功后创建 GitHub Release 草稿。

- Updated dependencies [207e315]
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
  - @slux/shared@0.1.0
