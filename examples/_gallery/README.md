# @slux/gallery-example · slux 示例总览

集中展示仓库全部示例站点的总览页。默认**收起**为右上角的下拉选择框（默认选中 `core`），展开后在下方出现按「核心层 / 范式层 / 中间件层 / 框架层」分组的列表。收起与展开是**同一个浮层、同一个下拉框**：展开时只在底部多出列表区域，下拉框**依旧可用**（不禁用），两种选法任选；右侧按钮用**上 / 下箭头**切换，不是关闭按钮。选中项在主区域以 iframe 全局渲染，顶栏显示当前示例名称与分组；独立开发时还显示端口，并提供「在新窗口打开」直达完整示例页。

## 交互要点

- **收起态**：右上角下拉框（距顶栏 16px、距右边缘 20px），切换即加载对应示例；下箭头展开底部列表；这一状态也能抓住标题栏拖动。
- **展开态**：下拉框与下方分组列表都能切换示例；仍可抓住标题栏拖动；拖回右上角自动收起；上箭头收起；支持搜索过滤。
- **位置**：切换展开 / 收起只做视口边界收敛，**不会把浮层重置回默认右上角**；拖拽后的 `left/top` 在两种状态间沿用。
- **主题**：`?theme=light/dark` 只决定首次加载的主题。切换时总览、文档站与内部示例通过 `{ type: "THEME_CHANGED", payload: { theme } }` 双向同步；接收方只在主题不同的情况下更新，不修改页面或 iframe 的 URL。新窗口链接会带上当前主题。示例加载后还会发 `slux-example-theme-request` 索取当前主题。iframe 内的示例带 `?embed=1`，**不显示自己的顶部操作栏**，由总览顶栏接管。
- **总览自身嵌入**：总览被嵌入文档站（`?embed=1` 或处于 iframe 中）时，同样在根节点打上 `data-embed="1"` 并把 `--app-bar` 归零，从而**隐藏自己的顶部栏**，由外层文档站接管。
- **新窗口打开**：`target="_blank"` 访问不带 `embed=1` 的完整示例页（保留当前主题）。
- **hash 直达**：如 `#vue-rsbuild-ts`；无 hash 时始终回到默认的 core。

## 运行

```bash
pnpm --filter @slux/gallery-example dev   # 单独启动总览（端口 9000）
pnpm examples:dev                           # 根命令：构建 → 一条 pnpm --filter 并发启动全部服务 → 全部就绪后打印访问链接（总览在最后一行）
```

> 构建与 dev 启动日志照常显示；等 26 个端口全部就绪（启动阶段结束）后停止转发后续日志，再统一打印链接清单并保持在终端末尾。dev 异常退出时完整日志写入系统临时文件，终端只留一行提示。

> 独立开发时，示例运行在各自的 dev 端口上（9001–9025），总览通过 iframe 加载它们。推荐用根目录的 `pnpm examples:dev` 一次性拉起全部服务。文档站构建会将总览与 25 个示例一起复制到 `docs/public/examples/`；访问 `/slux/examples/_gallery/` 时，iframe 与“在新窗口打开”均使用相邻的静态示例路径，不依赖开发端口。

## 端口与命名

唯一事实源是 [`src/manifest.json`](./src/manifest.json)：总览占 9000，示例按目录序占用 9001–9025。端口同时写死在各示例 `package.json` 的 `dev` 脚本里；根 `scripts/run-examples.mjs` 只读取清单打印链接，不再分配端口。

命名上，`@slux/example-*` 是全部可运行示例（一条 filter 全启动），`@slux/*-example` 是下划线目录里的基础设施包（shell / kit / gallery，启动前统一 build）。

## 结构

- `src/manifest.json` — 全部示例的目录 / 包名 / 分组 / 构建链（rsbuild・rspack・vite）/ 端口清单
- `src/gallery.ts` — `createGallery(root, manifest)`：统一浮层（标题栏 + 可展开列表）、收起/展开切换、拖拽定位、主题同步、选中渲染（可测试导出 `exampleUrl` / `embedUrl` / `externalUrl`）
- `src/index.ts` — 入口装配
- `__tests__/gallery.test.ts` — manifest 完整性 + 默认状态 / 选择 / 拖拽 / 主题 / 搜索行为测试

## 验证

```bash
pnpm --filter @slux/gallery-example typecheck  # tsc --noEmit
pnpm --filter @slux/gallery-example test       # rstest（jsdom）
pnpm --filter @slux/gallery-example build      # rs build
```
