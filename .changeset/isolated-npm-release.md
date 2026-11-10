---
"@slux/actview": patch
"@slux/angular": patch
"@slux/atom": patch
"@slux/core": patch
"@slux/devtools": patch
"@slux/flux": patch
"@slux/history": patch
"@slux/inferno": patch
"@slux/octane": patch
"@slux/preact": patch
"@slux/proxy": patch
"@slux/react": patch
"@slux/ripple": patch
"@slux/rxjs": patch
"@slux/shared": patch
"@slux/solid": patch
"@slux/state-machine": patch
"@slux/storage": patch
"@slux/store": patch
"@slux/svelte": patch
"@slux/tab-sync": patch
"@slux/telemetry": patch
"@slux/viewfly": patch
"@slux/vitarx": patch
"@slux/vue": patch
---

修复首次运行新版发布流程时发现的执行目录和文档展示问题，保持运行时 API 不变。

### Bug Fixes

- 将 npm 安装与授信发布步骤移至 GitHub runner 的临时目录，并通过绝对路径调用发布脚本和压缩包，避免仓库根目录的 pnpm `devEngines` 限制导致全部包发布时报 `EBADDEVENGINES`。
- 文档站渲染远程更新日志时跳过 HTML 标签，避免将发行说明中的 `details`、`summary` 显示为字面文本，同时保留变更正文和真实提交链接。

### Document

- 补充发布失败的恢复流程：在 `main` 上运行修复后的工作流并指定原发布标签，保留既有标签和版本包；说明旧运行的重跑不会读取新工作流。
