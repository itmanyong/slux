# 发布与文档部署

25 个 `@slux/*` 包由 Changesets 固定分组管理，始终使用同一个版本。首次 `v0.1.0` 已在本地手动发布。后续运行 `pnpm release` 准备版本并推送 `release/vX.Y.Z` 标签，GitHub Actions 使用 npm 授信发布各包，随后公开带分类说明和版本附件的 GitHub Release。

## 一次性准备

1. 将 `main` 和首次发布标签 `v0.1.0` 推送到 GitHub 仓库 `itmanyong/slux`。发布脚本要求工作区干净，而且本地 `main` 与 `origin/main` 指向同一个提交。
2. 为每个 `@slux/*` 包配置 GitHub Actions 授信发布：仓库 `itmanyong/slux`，工作流文件 `release.yml`，允许直接 `npm publish`。以后添加新包时设置同样的授信配置；如果 npm 页面要求首次验证，须在页面给出的期限前通过该工作流完成一次 OIDC 发布。
3. 从 GitHub 仓库的 Actions secrets 删除旧的 `NPM_TOKEN`。新工作流使用 GitHub OIDC 的 `id-token: write` 权限，npm 配置必须与实际仓库和工作流文件完全一致。
4. 在 GitHub Pages 设置中将部署来源设为 **GitHub Actions**。文档站按 `/slux/` 路径构建，并部署 `apps/website/doc_build`。

## 撰写变更日志

改动代码后，先对比上次发布标签与当前 `main`（例如 `git diff release/v0.1.1..HEAD`），由维护者自行选择 AI 工具根据实际差异撰写专业的变更说明，然后人工核对事实。使用 `pnpm changeset` 创建 Changeset，选择受影响的包和 `patch`、`minor` 或 `major` 级别，将核对后的说明写入生成的 `.changeset/*.md` 文件并提交。不要使用空 Changeset。发布脚本不会调用 AI 服务，也不需要 AI 密钥。

每条变更必须写成 `type(scope): 描述`，例如 `fix(core): 释放已取消的订阅`。支持 `feat`、`fix`、`docs`、`perf`、`refactor`、`chore`、`test`、`ci`、`build`、`style`、`revert`，缺少 scope 的条目会在升级版本前报错。可以使用三级分类标题；输出始终按条目类型生成独立标题：New Features 🎉、Performance 🚀、Bug Fixes 🐞、Refactor 🔨、Document 📖、Other Changes 🔧，只显示非空分类。

scope 决定包归属。使用 `core`、`react` 等包目录名时，该包必须出现在当前 Changeset 的 frontmatter 中；共享变更可以写 `fix(core,react): ...`，生成每个包的日志时会归一为本包 scope。`release`、`website`、`repo`、`ci`、`docs`、`examples`、`build`、`deps`、`test` 是仓库级 scope，只进入整体发行说明。全库发布设施改进不能写成每个包的功能变更；可以选择一个包申请固定组升级，并将正文写为 `ci(release): ...`。

```md
---
"@slux/core": patch
---

### Bug Fixes 🐞

- fix(core): 释放已取消的订阅，避免后续写入继续通知它。

### Document 📖

- docs(core): 补充订阅清理示例和作用域生命周期说明。
```

整体发行说明保留全部经过核对的细化条目，并关联真实 Git 提交。存在详细正文的分类将提交链接折叠为“相关提交”，没有正文的分类直接显示提交条目。没有 scope 的旧提交补为 `type(repo): ...`，非 Conventional Commit 标题补为 `chore(repo): ...`；原始描述和提交链接保留，不猜测 PR。

各包 CHANGELOG 只收录属于本包的条目。固定组跟随升版且没有独立变更时仅记一条 `chore(包名): 跟随统一版本升级至 X.Y.Z`。生成器对比前后包清单，将 `workspace:*`、`workspace:^` 和 `workspace:~` 解析为对应发布范围，只记录实际改变的运行时、可选和 peer 内部依赖；超过三项时用变更项数汇总，并与跟随升版合成一条。版本没有变化的包不会重写日志。

## 后续发布

在仓库根目录的 `main` 分支运行：

```sh
pnpm release
```

脚本先检查 Git 工作区和远端版本，再列出本次改动包及待发布 Changeset。确认后执行 `changeset status` 和统一的 `pnpm version:packages`。后者在升版前保存 Changeset 与包清单、校验条目归属，再调用 Changesets 更新版本，最后生成各包 CHANGELOG、`releases/vX.Y.Z.md` 及根 `CHANGELOG.md`，并把规范化正文归档到 `releases/sources/vX.Y.Z.md`。Changesets 的默认 changelog 已关闭，避免将 Markdown 分类标题包进提交列表项；直接调用 `changeset version` 不会生成日志，应始终用 `pnpm version:packages`。没有有效 Changeset 时命令报错，不改版本或日志。

根和各包 CHANGELOG 都直接以版本记录开头，不再添加包名、项目标题或生成说明。随后发布命令更新锁文件，继续执行其余检查。尚未升版时修改 `.changeset/*.md`；修订已经发布的历史文案时修改 `releases/sources/vX.Y.Z.md` 后重生成，不直接修改生成输出。

随后运行 `pnpm generate:apis` 同步各包自动导入 API 清单，再运行 `pnpm sync:package-navigation` 同步包导航与各包 README 版本号，最后运行发布脚本测试、lint、完整构建、类型检查、项目测试及文档构建。发行说明会先于文档构建生成，确保新版本可进入文档站。

最后一次确认后，脚本提交 `chore(release): vX.Y.Z`，创建 `release/vX.Y.Z` 标签，并原子推送 `main` 和标签。确认前取消或检查失败时，生成的版本文件留在工作区供检查。如果本地提交和标签已创建但推送失败，解决问题后运行 `git push --atomic origin main release/vX.Y.Z`，不要重新升版。

标签触发的工作流会验证并准备全部 25 个包。尚未发布的版本由 `pnpm pack` 打包，每个包独立执行 `npm publish --access public --tag latest --provenance`。已发布版本从 npm 下载原始 tarball 并核对 registry 中的完整性摘要，发布作业再次确认字节一致后跳过重复发布。查询失败或摘要不一致会阻断发布，不会当作包不存在。

npm 安装和发布步骤从仓库外的 `${{ runner.temp }}` 运行，产物也下载到这个临时目录下；脚本通过 `$GITHUB_WORKSPACE` 的绝对路径调用。仓库根目录的 `devEngines.packageManager` 要求 pnpm，在根目录执行 `npm publish` 即使传入 tarball 绝对路径也会触发 `EBADDEVENGINES`。本地排查可先打包，再在独立临时目录执行 `npm publish <tarball绝对路径> --dry-run`，确认命令可运行后再由工作流实际发布。

所有包发布成功后，工作流创建或更新 GitHub Release，上传 25 个 `.tgz`、`SHA256SUMS` 和 `release-manifest.json`，然后公开 Release。清单记录包名、版本、文件名、字节数、SHA-256 和 SHA-512 integrity；下载后可用 `sha256sum --check SHA256SUMS` 核验文件。GitHub 自带的 Source code 附件不替代 npm 包附件。

失败后可使用 **Re-run failed jobs**，也可手动运行 `Publish packages` 并指定同一个 `release/vX.Y.Z`。重复运行会复用已发布 npm 包并更新同名附件，不改写 Git 标签，也不重复升版。25 个包是独立的矩阵作业，其中一个失败时，其他包可能已经公开；GitHub Release 等所有发布作业成功才会公开。跳过已存在版本时不会修改 npm dist-tag。

如果失败来自工作流本身，需要先把修复提交到 `main`。然后在 Actions 的 **Run workflow** 中选择 `main`，将 `tag` 输入设为原发布标签，例如 `release/v0.2.0`；也可运行 `gh workflow run release.yml --ref main -f tag=release/v0.2.0`。这会使用 `main` 上的新工作流，但继续检出原标签的源码和版本。直接重跑原失败记录仍会使用旧工作流，不能获得修复。不得为了重试而移动、删除或重建已经推送的标签；如果需要修改包源码，则应准备新版本。

## 历史版本补齐

按 Git 发布标签和已核对的历史源记录重生成全部发行说明、根和各包 CHANGELOG：

```sh
pnpm changelog:generate
```

命令读取 `releases/sources/vX.Y.Z.md`，并按真实标签读取当时各包的清单、比较依赖范围和关联提交；不升级版本、不发布、不移动标签。初始四个版本的源记录均标明史料：`0.1.0` 来自当时各包 README 和公开入口，`0.1.1` 来自包 README、Viewfly 清单差异及原 Changeset，`0.2.0` 和 `0.2.1` 来自原 Changeset 与 Git 差异。后两个版本只有发布设施或网站变更，包日志只记录统一升版和真实依赖联动。

如只需要重生成单个版本的整体说明，可运行：

```sh
pnpm release:notes --version 0.1.0 --to v0.1.0
pnpm release:notes --version 0.1.1 --from v0.1.0 --to release/v0.1.1
```

该命令优先读取归档源；尚未归档时读取该 Git 范围内新增或消费的 Changeset，采用删除前最后一次修订正文，并执行同样的条目格式校验。`--from` 默认选择目标提交可达的最新其他发布标签，`--to` 默认为 `HEAD`，`--tag` 可显式指定说明中的标签。首次发布标签 `v0.1.0` 与后续 `release/vX.Y.Z` 都可以识别。

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
