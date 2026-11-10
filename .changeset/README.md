# Changesets

首次发布的版本和变更记录已由 Changesets 生成，使用 `v0.1.0` 标签作为后续变更基线。准备后续版本时，先对比上次发布标签与当前 `main` 的改动，撰写并核对 Changeset；`pnpm release` 不会自动创建 Changeset。
开发期间可用 `pnpm changeset` 创建记录，并在发布前将核对后的记录提交到 `main`。每个细化条目必须写成 `type(scope): 描述`，例如 `fix(core): 修复订阅清理`。包 scope 必须出现在该 Changeset 的 frontmatter 中；共享改动可写 `fix(core,react): ...`，包内显示时归一为本包。发布设施和网站改动使用 `release`、`website` 等仓库 scope，不会复制进各包日志。

使用 `pnpm version:packages` 或 `pnpm release` 经过统一生成器：Changesets 负责固定组升版，专用脚本负责独立分类标题、各包专属变更和真实依赖联动，同时生成整体发行说明及根 CHANGELOG。默认 changelog-git 已关闭；不要直接调用 `changeset version` 绕过生成器。所有 CHANGELOG 均直接从版本记录开始。

升版时规范化正文归档到 `releases/sources/vX.Y.Z.md`。历史文案修订应改归档源，再运行 `pnpm changelog:generate`，不能手改生成输出或改写发布标签。编写示例、允许的 scope、版本跟随规则和附件补齐见 [发布与文档部署](../docs/releasing.md)。
