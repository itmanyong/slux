# Changesets

首次发布的版本和变更记录已由 Changesets 生成，使用 `v0.1.0` 标签作为后续变更基线。准备后续版本时，先对比上次发布标签与当前 `main` 的改动，撰写并核对 Changeset；`pnpm release` 不会自动创建 Changeset。
开发期间可用 `pnpm changeset` 创建记录，并在发布前将核对后的记录提交到 `main`。运行 `pnpm release` 后，`changeset version` 会同步 25 个发布包的版本和各包 CHANGELOG，发布脚本会从 Changeset 正文生成 `releases/vX.Y.Z.md`。
