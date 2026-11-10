# slux 文档站

🧭 本站位于 `apps/website`，由仓库现有的 Rstack `rs doc` 命令运行 Rspress。文档面向使用 slux 的第三方开发者。

## 本地命令

🚀 在仓库根目录执行：

```sh
pnpm install
pnpm docs:dev
pnpm docs:build
pnpm docs:preview
```

也可运行 `pnpm --filter @slux/website docs:build`。该命令先按依赖顺序构建 25 个独立示例与 `_gallery` 总览，再构建文档站。`pnpm --filter @slux/website docs:examples` 只重建并嵌入示例资源。

站点默认使用 `/slux/` 路径前缀，对应仓库 README 中现有的 GitHub Pages 文档地址。部署到其他路径时，应同步修改 `rstack.config.ts` 的 `base`；文档线路切换和首页内部链接使用 Rspress 的 `Link`，会自动处理路径前缀。

GitHub Pages 由仓库根目录的 `.github/workflows/docs.yml` 在 `main` 推送后构建和部署。首次启用时要将仓库 Pages 的来源设为 **GitHub Actions**；完整发布流程见[发布与文档部署](../../docs/releasing.md)。

## 导航与外观

🧭 首页范式区在宽屏采用左侧说明与右侧两列卡片；窄屏改为纵向排列。框架卡片保留标志，并用一句话说明对应绑定的使用方式。顶部四张能力卡片使用位置各异的柔和光晕。站点全局滚动条使用透明轨道与细滑块，并随昼夜模式切换颜色。

顶部导航包含搜索、指南、架构（核心、范式、中间件、框架、插件）、示例、更新日志、GitHub 与昼夜模式。“架构”下的分类入口指向各组的“总览”页，`docs/_nav.json` 中的 `activeMatch` 负责对应页面的高亮。指南左侧分为“开始”和“进阶”两组；插件入口与其他包分类共用包文档侧栏，自动导入说明位于 `docs/packages/auto-import.mdx`。示例入口使用独立的分层侧栏。普通文档页标题右侧依次显示阅读时间和复制 Markdown 操作，复制按钮靠最右侧；窄屏时两者移到标题下方。

`docs/packages/_meta.json` 在五个分组下各设“总览”默认入口，并将每个包作为单独链接列在左侧，不显示折叠组或线路子项。`docs/examples/_meta.json` 按五层架构组织 25 个真实示例，每层都设有“总览”页面；插件层总览说明当前没有独立示例。示例首页的“总览”还嵌入 `_gallery`，可以在一处切换全部 25 个项目。生态指南使用 Mermaid 展示全部已发布包的主要关系。首页与文档页沿用同一套橙色强调色；首页使用深色展示，文档页跟随昼夜模式。首页标志下展示“signal(信号) + limu(结构共享) + luxury(精致统一)”主题色渐变文案，并提供 GitHub 与独立打开的全部示例按钮、带 SVG 图标的能力卡片、12 个框架适配卡片，以及四列底部导航。

## 文档线路

📚 五个包分组的“总览”页不显示包文档线路。包内切换到 API、类型、README 或演示线路后，左侧仍保持该包选中。线路滚动到顶部导航下方时会固定显示，宽度由内容决定，窄屏下换行以避免横向滚动条。

`docs/packages/<包名>/index.mdx` 是面向使用者的短指南；`/packages/<包名>/readme` 由 `rstack.config.ts` 中的 Rspress `addPages` 钩子直接读取 `packages/<包名>/README.md`，不在源码目录复制或生成 Markdown 文件。`theme/index.tsx` 在包页面提供“使用指南 / API 定义 / 类型定义 / README 原文 / 演示示例 / 更新日志”切换。页面滚到线路位置时，同一组入口固定在顶部导航下方。包级“更新日志”在浏览器中加载 GitHub `main` 分支对应包的 `CHANGELOG.md`。

`/packages/<包名>/api` 只列出包的 `package.json` 所声明的主入口和子路径入口中的运行时 API；`/packages/<包名>/types` 列出仅在 TypeScript 类型层导出的类型。两条线路均提供用途、签名、示例及源码链接。作用说明优先使用源码 JSDoc 和包 README；两者未覆盖的导出在 `api-reference.ts` 中按实际用途补充说明。用法片段依次取自 README、对应示例项目源码和 `api-examples.ts` 中依据源码补写的主入口或子路径简例。生成逻辑使用 TypeScript 6 编译器 API；签名以本地源码为准。

`/packages/<包名>/demo` 与独立的 `/examples/<包名>` 页面用 iframe 嵌入 `examples/<包名>-*` 的真实构建产物。iframe 首次加载的 `theme=light/dark` 参数取自文档站当前主题；之后文档站、`_gallery` 和示例通过 `{ type: "THEME_CHANGED", payload: { theme } }` 消息双向同步，主题相同时不重复更新，也不改写 iframe 地址。共享的 `ExampleFrame` 在 iframe 上方渲染“在Github中打开”和“在新标签页打开”两个操作；后者始终带当前主题的 `theme` 查询参数。示例总览的 `_gallery` 嵌入区也使用这一组件。`scripts/copy-examples.mjs` 将 25 个项目及 `_gallery` 的 `dist` 复制到 `docs/public/examples/`，并将构建产物中的根路径资源改为站点 `/slux/examples/` 路径；Angular 项目使用 `dist/browser`。`_gallery` 发布于 `/slux/examples/_gallery/`，其内部示例链接会指向同级静态目录；独立开发时仍使用清单中的 9001–9025 端口。复制后，脚本按文件内容合并重复的字体、图标和可安全共享的 CSS，统一放在 `docs/public/examples/_shared/`，同时更新 HTML、CSS 和 JS 中的资源引用。CSS 只有在资源 URL 为绝对路径且不含 `@import` 时才合并；各示例特有的样式和脚本仍独立存放。`docs:examples` 会检查 26 个页面的资源引用和重复文件。复制目录已加入 `.gitignore`，不手改其内容。调整站点 `base` 时也要同步更新脚本及资源检查中的路径前缀。独立项目仍需先构建，不能直接把其源码交给 Rspress 的 Preview 插件运行。

README 原文页读取当前工作区文件，因此本地未提交的 README 修改也会反映在本地文档构建中；CI 构建则使用检出版本。渲染时会去掉包导航同步用的 HTML 标记，并将 README 中指向仓库其他文件的相对链接解析为 GitHub 源文件链接，以免 Rspress 将其误判为站内文档。新包加入后，需另写使用指南与对应示例项目，并将包加入 `docs/packages/_meta.json`、`docs/examples/_meta.json`、`docs/_nav.json` 对应分类的 `activeMatch` 与包索引。

README 介绍下的 Shields 按钮独占一行，窄屏允许换行；按钮隐藏外链箭头，普通外链保留箭头。按钮图片不参与文档图片放大，点击后只打开对应链接。

站点已注册阅读时间、Mermaid、Preview 和 Playground 插件。[交互式示例](docs/guide/interactive.mdx) 使用 Preview 和 Playground；[状态范式选择](docs/guide/choose.mdx) 使用 Mermaid。阅读时间显示在普通文档页顶部。

### iframe 加载状态

⏳ 文档演示页和总览内部的 iframe 在首次打开、切换示例时显示半透明模糊加载层，颜色跟随明暗主题。`ExampleFrame` 的 `packageName` 传短包名，例如 `core`；总览页面传 `gallery-example`。

📨 当前 iframe 的 `load` 事件，或来自该 iframe 的 `{ type: "CONTENT_LOADED", payload: { package: "@slux/core" } }` 消息，都能撤销加载层。消息会核对窗口、来源地址和当前包名，也兼容共享外壳使用的 `/core` 格式。切换后的旧 iframe 消息不会结束新页面的加载；主题切换只同步颜色，不重新加载。

🧪 `pnpm --filter @slux/website test` 和总览测试覆盖加载完成、消息校验与示例切换。生成的页面和侧栏应通过 `pnpm docs:build` 更新。

## 远程更新日志

📚 顶部“更新日志”入口显示仓库 `releases/` 下的版本文件。构建时扫描文件名，以去掉 `.md` 后缀的版本号生成 `docs/releases/_meta.json` 侧栏标签和页面路由；原始 Markdown 正文不纳入站点构建，页面打开后由浏览器从 GitHub `main` 分支获取。生成的侧栏文件已加入 `.gitignore`。新增版本文件后重新构建站点即可更新菜单；GitHub 上对应文件尚未推送或请求失败时，页面会显示原文链接。
