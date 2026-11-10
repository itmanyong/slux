# 发布与文档部署

本仓库的 25 个 `@slux/*` 发布包由 Changesets 固定分组管理，始终使用同一个版本。首次 `v0.1.0` 由维护者在本地手动发布；后续使用 `pnpm release` 准备版本和发行说明，推送 `release/vX.Y.Z` 标签后由 GitHub Actions 发布到 npm。`main` 的每次推送会重新构建并部署文档站。

## 首次发布：v0.1.0

仓库已经准备好 25 个包的 `0.1.0` 版本、各包 `CHANGELOG.md` 和 `releases/v0.1.0.md`。本地的 `v0.1.0` 标签用于标记首次发布基线；它不会触发只监听 `release/v*` 标签的 npm 工作流。

发布人先确认 npm 账号或组织可发布 `@slux` 作用域的公共包，并已登录 npm。首次执行前检查版本、构建产物和 npm 将打包的文件：

```sh
npm whoami
pnpm install --frozen-lockfile
pnpm test:release
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm docs:build
```

确认无误后在仓库根目录手动执行 `pnpm release:ci`。该命令调用 `changeset publish`，会依包间依赖顺序发布尚未发布的版本；如中途失败，排查原因后针对同一版本重试，避免再次升版。发布完成后，核对 25 个包在 npm 上的版本，再推送 `main` 和 `v0.1.0` 标签。当前仓库没有配置 Git 远端，推送前须先添加正确的 `origin`。可在标签推送后使用 `releases/v0.1.0.md` 创建首次 GitHub Release。

## 一次性准备

1. 首次手动发布完成后，将本地 `main` 和 `v0.1.0` 标签推送到 `origin`。后续发布脚本要求工作区没有未提交内容，而且本地与远端的 `main` 指向同一个提交。执行发布的账号还需要有直接推送 `main` 和发布标签的权限。
2. 为后续自动发布，在 GitHub 仓库的 Actions secrets 中设置有权发布全部 25 个 `@slux/*` 公共包的 `NPM_TOKEN`。令牌只供 `.github/workflows/release.yml` 使用，不要放在本地文件或提交中。
3. 在 GitHub 仓库的 Pages 设置中将部署来源改为 **GitHub Actions**。文档站已经配置 `/slux/` 路径，工作流上传 `apps/website/doc_build`。
4. 在本地设置 AI 服务环境变量。脚本使用 OpenAI 兼容的 `chat/completions` 接口，`RELEASE_AI_BASE_URL` 默认是 `https://api.openai.com/v1`。例如在 PowerShell 中：

   ```powershell
   $env:RELEASE_AI_API_KEY = "你的密钥"
   $env:RELEASE_AI_MODEL = "你的模型名"
   $env:RELEASE_AI_BASE_URL = "https://api.openai.com/v1"
   ```

   `OPENAI_API_KEY` 也可作为密钥变量。不要把密钥写进仓库。脚本会在请求前说明将发送的 Git 改动范围；提交信息、包代码差异及你输入的要点会发给所配置的 AI 服务。

## 后续发布

在仓库根目录的 `main` 分支运行：

```sh
pnpm release
```

脚本会先检查工作区和 Git 远端，再根据最新的 `vX.Y.Z` 或 `release/vX.Y.Z` 标签找出改动包。你需要选择 `patch`、`minor` 或 `major`，确认发送给 AI 的内容，然后预览并按需修改生成的摘要、变更亮点和升级提示。

接下来脚本会写入 Changeset，运行 `changeset status` 和 `changeset version`，更新锁文件，运行 lint、类型检查、测试和构建。它会列出待提交文件，得到最后一次确认后提交 `chore(release): vX.Y.Z`，创建同名发布标签，再原子推送 `main` 和标签。发行说明保存在 `releases/vX.Y.Z.md`，各包的 `CHANGELOG.md` 由 Changesets 生成。

如果在最后一次确认时取消，已经生成的版本文件会留在工作区，方便检查。检查或构建失败时同样不会推送；修正问题后先处理工作区改动，再重新运行。发布标签已经推送但 npm 工作流失败时，在 GitHub Actions 的 **Publish packages** 工作流中手动运行，输入同一个 `release/vX.Y.Z` 标签重试。不要重复创建新标签来重试同一版本。

如果本地提交和打标签已经成功，但推送失败，先解决远端分支冲突或网络问题，再运行 `git push --atomic origin main release/vX.Y.Z` 推送原标签；不要重新运行发布脚本生成另一个版本。

## 工作流

- `CI`：`main` 推送或拉取请求时运行发布脚本测试、lint、类型检查、项目测试和构建。
- `Publish packages`：`release/v*` 发布标签触发，重新检查和构建后运行 `changeset publish`，最后用版本发行说明创建或更新 GitHub Release。首次 `v0.1.0` 标签不触发此工作流。
- `Deploy docs`：`main` 推送或手动触发时运行 `pnpm docs:build`，将包含示例的 Rspress 产物部署到 GitHub Pages。

实际 npm 发布和 Pages 部署依赖 GitHub 仓库设置与凭据。本地测试不会向 npm 发布，也不会改动远端。
