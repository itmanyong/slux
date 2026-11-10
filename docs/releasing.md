# 发布与文档部署

25 个 `@slux/*` 包由 Changesets 固定分组管理，始终使用同一个版本。首次 `v0.1.0` 已在本地手动发布。后续运行 `pnpm release` 准备版本并推送 `release/vX.Y.Z` 标签，GitHub Actions 使用 npm 授信发布将各包暂存。维护者在 npm 批准暂存版本后，包才会公开。

## 一次性准备

1. 将 `main` 和首次发布标签 `v0.1.0` 推送到 GitHub 仓库 `itmanyong/slux`。发布脚本要求工作区干净，而且本地 `main` 与 `origin/main` 指向同一个提交。
2. 25 个已发布的 `@slux/*` 包都要设置 GitHub Actions 授信发布：仓库 `itmanyong/slux`，工作流文件 `release.yml`，权限为 `stage-publish` 和 `dist-tag`，不授予直接 `publish`。当前 25 个包已按此配置，并已逐个读取 npm 返回值核验。以后添加新包时，在 npm 网站设置同样的两项权限；当前 npm CLI 的 `npm trust github` 命令没有单独的 `dist-tag` 权限选项。工作流暂存时使用 `--tag latest`。
3. 从 GitHub 仓库的 Actions secrets 删除旧的 `NPM_TOKEN`。新工作流使用 GitHub OIDC 的 `id-token: write` 权限，npm 配置必须与实际仓库和工作流文件完全一致。
4. 在 GitHub Pages 设置中将部署来源设为 **GitHub Actions**。文档站按 `/slux/` 路径构建，并部署 `apps/website/doc_build`。

## 撰写变更日志

改动代码后，由维护者自行选择 AI 工具撰写专业的变更说明，然后人工核对事实。使用 `pnpm changeset` 创建 Changeset，选择受影响的包和 `patch`、`minor` 或 `major` 级别，将核对后的说明写入生成的 `.changeset/*.md` 文件并提交。AI 工具的使用方式由维护者决定；发布脚本不会调用 AI 服务，也不需要 AI 密钥。

## 后续发布

在仓库根目录的 `main` 分支运行：

```sh
pnpm release
```

脚本先检查 Git 工作区和远端版本，再列出本次改动包及待发布 Changeset。确认变更日志已经写好后，脚本执行 `changeset status` 和 `changeset version`，更新锁文件，运行发布脚本测试、lint、类型检查、项目测试和构建。发行说明直接取自已核对的 Changeset 正文，保存在 `releases/vX.Y.Z.md`；各包 `CHANGELOG.md` 由 Changesets 生成。

最后一次确认后，脚本提交 `chore(release): vX.Y.Z`，创建 `release/vX.Y.Z` 标签，并原子推送 `main` 和标签。确认前取消或检查失败时，生成的版本文件留在工作区供检查。如果本地提交和标签已创建但推送失败，解决问题后运行 `git push --atomic origin main release/vX.Y.Z`，不要重新升版。

标签触发的工作流会构建并打包全部 25 个包，每个包独立执行 `npm stage publish --access public --tag latest --provenance`。所有包暂存成功后，工作流创建 GitHub Release 草稿。如果单个包暂存失败，在 GitHub Actions 使用 **Re-run failed jobs** 重跑失败作业。不要对已暂存的同一版本重新执行整条工作流，因为 npm 不允许重复暂存相同版本。

在 npm 网站或登录后的 npm CLI 查看待审核包：

```sh
npm stage list
npm stage view <stage-id>
npm stage approve <stage-id>
```

逐个检查并批准全部 25 个包。批准需要维护者的 2FA。确认 npm 上 25 个包都出现目标版本和预期 `latest` 标签后，在 GitHub 把对应 Release 草稿发布。

## 工作流

- `CI`：`main` 推送或拉取请求时运行发布脚本测试、lint、类型检查、项目测试和构建。
- `Publish packages`：`release/v*` 标签触发，构建、打包后用 OIDC 逐包暂存，最后创建 GitHub Release 草稿。首次 `v0.1.0` 标签不触发此工作流。
- `Deploy docs`：`main` 推送或手动触发时构建并部署 Rspress 文档站。
