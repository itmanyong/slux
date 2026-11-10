# Changesets

首次发布的版本和变更记录已由 Changesets 生成，使用 `v0.1.0` 标签作为后续变更基线。准备后续版本时，先对比上次发布标签与当前 `main` 的改动，撰写并核对 Changeset；`pnpm release` 不会自动创建 Changeset。
开发期间可用 `pnpm changeset` 创建记录，并在发布前将核对后的记录提交到 `main`。正文按真实改动使用 `### New Features`、`### Performance`、`### Bug Fixes`、`### Refactor`、`### Document`、`### Other Changes` 分类标题，只填写有内容的分类，保留具体行为和影响。

运行 `pnpm release` 后，`changeset version` 会同步 25 个发布包的版本和各包 CHANGELOG。发布脚本从 Changeset 详细正文和真实 Git 提交生成分类发行说明 `releases/vX.Y.Z.md`，并汇总根 `CHANGELOG.md`。这些文件由脚本生成，不直接编辑；历史重建与版本附件补齐见 [发布与文档部署](../docs/releasing.md)。
