# 发布与文档部署

25 个 `@slux/*` 包由 Changesets 固定分组管理，始终使用同一个版本。首次 `v0.1.0` 已在本地手动发布。后续运行 `pnpm release` 准备版本并推送 `release/vX.Y.Z` 标签，GitHub Actions 使用 npm 授信发布各包，随后公开带分类说明和版本附件的 GitHub Release。

## 一次性准备

1. 将 `main` 和首次发布标签 `v0.1.0` 推送到 GitHub 仓库 `itmanyong/slux`。发布脚本要求工作区干净，而且本地 `main` 与 `origin/main` 指向同一个提交。
2. 为每个 `@slux/*` 包配置 GitHub Actions 授信发布：仓库 `itmanyong/slux`，工作流文件 `release.yml`，允许直接 `npm publish`。以后添加新包时设置同样的授信配置；如果 npm 页面要求首次验证，须在页面给出的期限前通过该工作流完成一次 OIDC 发布。
3. 从 GitHub 仓库的 Actions secrets 删除旧的 `NPM_TOKEN`。新工作流使用 GitHub OIDC 的 `id-token: write` 权限，npm 配置必须与实际仓库和工作流文件完全一致。
4. 在 GitHub Pages 设置中将部署来源设为 **GitHub Actions**。文档站按 `/slux/` 路径构建，并部署 `apps/website/doc_build`。

## 撰写变更日志

改动代码后，先对比上次发布标签与当前 `main`（例如 `git diff release/v0.1.1..HEAD`），由维护者自行选择 AI 工具根据实际差异撰写专业的变更说明，然后人工核对事实。使用 `pnpm changeset` 创建 Changeset，选择受影响的包和 `patch`、`minor` 或 `major` 级别，将核对后的说明写入生成的 `.changeset/*.md` 文件并提交。不要使用空 Changeset。发布脚本不会调用 AI 服务，也不需要 AI 密钥。

正文按实际改动使用以下三级标题，省略没有内容的分类：`### New Features`、`### Performance`、`### Bug Fixes`、`### Refactor`、`### Document`、`### Other Changes`。生成后的分类标题采用 Rspress 的名称和图标，依次为 New Features 🎉、Performance 🚀、Bug Fixes 🐞、Refactor 🔨、Document 📖、Other Changes。每一项说明具体行为及影响，不能把发布设施改进写成运行时 API 更新。

```md
### Bug Fixes

- 修正具体问题，说明触发条件及修复后的行为。

### Document

- 说明新增或更新的使用指南。
```

发行说明保留完整 Changeset 正文，并把实际提交按 Conventional Commits 的 `feat`、`perf`、`fix`、`refactor`、`docs` 分类；其他提交进入 Other Changes。存在详细正文的分类将提交链接折叠为“相关提交”，没有正文的分类直接显示提交条目。发布版本提交会被省略。旧 Changeset 没有分类标题时保留在 Other Changes，不根据版本升级级别猜测功能分类，也不凭空生成 PR 链接。

## 后续发布

在仓库根目录的 `main` 分支运行：

```sh
pnpm release
```

脚本先检查 Git 工作区和远端版本，再列出本次改动包及待发布 Changeset。确认变更日志已经写好后，脚本执行 `changeset status` 和 `changeset version`，更新锁文件，从 Changeset 和本次 Git 提交范围生成 `releases/vX.Y.Z.md`，并从全部版本说明汇总根 `CHANGELOG.md`。各包 `CHANGELOG.md` 由 Changesets 生成，包含版本变更和依赖升级明细。这三类文件均为生成结果，请修改 Changeset 源文件后重新生成，不直接编辑输出。

随后运行 `pnpm generate:apis` 同步各包自动导入 API 清单，再运行 `pnpm sync:package-navigation` 同步包导航，最后运行发布脚本测试、lint、完整构建、类型检查、项目测试及文档构建。发行说明会先于文档构建生成，确保新版本可进入文档站。

最后一次确认后，脚本提交 `chore(release): vX.Y.Z`，创建 `release/vX.Y.Z` 标签，并原子推送 `main` 和标签。确认前取消或检查失败时，生成的版本文件留在工作区供检查。如果本地提交和标签已创建但推送失败，解决问题后运行 `git push --atomic origin main release/vX.Y.Z`，不要重新升版。

标签触发的工作流会验证并准备全部 25 个包。尚未发布的版本由 `pnpm pack` 打包，每个包独立执行 `npm publish --access public --tag latest --provenance`。已发布版本从 npm 下载原始 tarball 并核对 registry 中的完整性摘要，发布作业再次确认字节一致后跳过重复发布。查询失败或摘要不一致会阻断发布，不会当作包不存在。

所有包发布成功后，工作流创建或更新 GitHub Release，上传 25 个 `.tgz`、`SHA256SUMS` 和 `release-manifest.json`，然后公开 Release。清单记录包名、版本、文件名、字节数、SHA-256 和 SHA-512 integrity；下载后可用 `sha256sum --check SHA256SUMS` 核验文件。GitHub 自带的 Source code 附件不替代 npm 包附件。

失败后可使用 **Re-run failed jobs**，也可手动运行 `Publish packages` 并指定同一个 `release/vX.Y.Z`。重复运行会复用已发布 npm 包并更新同名附件，不改写 Git 标签，也不重复升版。25 个包是独立的矩阵作业，其中一个失败时，其他包可能已经公开；GitHub Release 等所有发布作业成功才会公开。跳过已存在版本时不会修改 npm dist-tag。

## 历史版本补齐

可以从真实标签范围重新生成历史说明及根 CHANGELOG：

```sh
pnpm release:notes --version 0.1.0 --to v0.1.0
pnpm release:notes --version 0.1.1 --from v0.1.0 --to release/v0.1.1
```

脚本读取该范围内新增或消费的 Changeset，采用删除前最后一次修订正文；此前已经提交、这个版本才消费的 Changeset 也会纳入。没有保留 Changeset 的最初版本从对应标签下的各包 CHANGELOG 提取并去重。`--from` 默认选择目标提交可达的最新其他发布标签，`--to` 默认为 `HEAD`，`--tag` 可显式指定说明中的标签。首次发布标签 `v0.1.0` 与后续 `release/vX.Y.Z` 都可以识别。

历史版本附件必须复用 npm 已发布的原始包。以下命令不会修改工作区版本，也不会发布 npm：

```sh
node scripts/pack-release.mjs .artifacts/v0.1.0 --registry-only --version 0.1.0
node scripts/pack-release.mjs .artifacts/v0.1.1 --registry-only --version 0.1.1
```

每个版本使用独立产物目录；如果目录里有其他版本的 `.tgz`，脚本会拒绝继续。生成后由维护者用对应 `releases/vX.Y.Z.md` 更新历史 Release，并上传目录中的全部 27 个文件。公开旧版本时不要将它设为 Latest。旧标签对应的工作流源文件不会因 `main` 更新而变化，因此不要用旧版工作流补附件，也不要移动已有标签来运行新版工作流。

## 工作流

- `CI`：`main` 推送或拉取请求时检查自动导入 API 清单已同步提交，再运行发布脚本测试、lint、完整构建、类型检查和项目测试。
- `Publish packages`：`release/v*` 标签或手动触发，检查自动导入 API 清单并完成构建、类型检查、测试及文档构建，准备所有包的 tarball 后用 OIDC 逐包发布，最后公开 GitHub Release 并上传版本包和校验清单。首次 `v0.1.0` 标签不触发此工作流。
- `Deploy docs`：`main` 推送或手动触发时先完整构建仓库，再构建并部署 Rspress 文档站。
