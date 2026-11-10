---
"@slux/actview": minor
"@slux/angular": minor
"@slux/atom": minor
"@slux/core": minor
"@slux/devtools": minor
"@slux/flux": minor
"@slux/history": minor
"@slux/inferno": minor
"@slux/octane": minor
"@slux/preact": minor
"@slux/proxy": minor
"@slux/react": minor
"@slux/ripple": minor
"@slux/rxjs": minor
"@slux/shared": minor
"@slux/solid": minor
"@slux/state-machine": minor
"@slux/storage": minor
"@slux/store": minor
"@slux/svelte": minor
"@slux/tab-sync": minor
"@slux/telemetry": minor
"@slux/viewfly": minor
"@slux/vitarx": minor
"@slux/vue": minor
---

### New Features

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
