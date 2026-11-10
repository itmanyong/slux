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

### New Features 🎉

- feat(website): 为文档示例 iframe 增加适配明暗主题的半透明模糊加载层，支持 load 与 CONTENT_LOADED 消息两种完成方式。
- feat(examples): 总览内部 iframe 同样显示加载层，切换示例时重新加载状态，并向文档父页面通知总览自身已就绪。

### Bug Fixes 🐞

- fix(release): 替换将 hash 与 Markdown 分类标题嵌套进列表的默认输出，统一生成独立分类标题和 type(scope): 变更条目。
- fix(release): 包日志仅保留自身变更；固定组升版及内部依赖联动生成简短说明，移除 CHANGELOG 顶部包名与说明标题。
- fix(release): 汇总历史发行说明前统一 CRLF 换行，避免 Windows 检出文件后在根更新日志中残留重复标题和混合换行。
- fix(website): 示例地址切换时重建 iframe 加载状态，校验就绪消息的窗口、来源与包名，避免旧示例消息错误撤销加载层。
- fix(website): 更新日志菜单和上一页、下一页标签使用纯版本号，移除 Markdown 文件后缀。

### Document 📖

- docs(repo): 移除根 README 框架导航表的功能列，并同步各包共享导航。
- docs(repo): 为包文档、示例 README 和网站指南增加语义 Emoji，同时保留现有标题锚点、链接目标及代码示例。
- docs(release): 补充按 scope 编写 Changeset、重生成历史记录和统一升版的说明，并保留可审核的历史变更源。
- docs(actview): 按本包范围重建历史更新日志，修正分类标题与条目前缀，并为 README 补充语义 Emoji。
- docs(angular): 按本包范围重建历史更新日志，修正分类标题与条目前缀，并为 README 补充语义 Emoji。
- docs(atom): 按本包范围重建历史更新日志，修正分类标题与条目前缀，并为 README 补充语义 Emoji。
- docs(core): 按本包范围重建历史更新日志，修正分类标题与条目前缀，并为 README 补充语义 Emoji。
- docs(devtools): 按本包范围重建历史更新日志，修正分类标题与条目前缀，并为 README 补充语义 Emoji。
- docs(flux): 按本包范围重建历史更新日志，修正分类标题与条目前缀，并为 README 补充语义 Emoji。
- docs(history): 按本包范围重建历史更新日志，修正分类标题与条目前缀，并为 README 补充语义 Emoji。
- docs(inferno): 按本包范围重建历史更新日志，修正分类标题与条目前缀，并为 README 补充语义 Emoji。
- docs(octane): 按本包范围重建历史更新日志，修正分类标题与条目前缀，并为 README 补充语义 Emoji。
- docs(preact): 按本包范围重建历史更新日志，修正分类标题与条目前缀，并为 README 补充语义 Emoji。
- docs(proxy): 按本包范围重建历史更新日志，修正分类标题与条目前缀，并为 README 补充语义 Emoji。
- docs(react): 按本包范围重建历史更新日志，修正分类标题与条目前缀，并为 README 补充语义 Emoji。
- docs(ripple): 按本包范围重建历史更新日志，修正分类标题与条目前缀，并为 README 补充语义 Emoji。
- docs(rxjs): 按本包范围重建历史更新日志，修正分类标题与条目前缀，并为 README 补充语义 Emoji。
- docs(shared): 按本包范围重建历史更新日志，修正分类标题与条目前缀，并为 README 补充语义 Emoji。
- docs(solid): 按本包范围重建历史更新日志，修正分类标题与条目前缀，并为 README 补充语义 Emoji。
- docs(state-machine): 按本包范围重建历史更新日志，修正分类标题与条目前缀，并为 README 补充语义 Emoji。
- docs(storage): 按本包范围重建历史更新日志，修正分类标题与条目前缀，并为 README 补充语义 Emoji。
- docs(store): 按本包范围重建历史更新日志，修正分类标题与条目前缀，并为 README 补充语义 Emoji。
- docs(svelte): 按本包范围重建历史更新日志，修正分类标题与条目前缀，并为 README 补充语义 Emoji。
- docs(tab-sync): 按本包范围重建历史更新日志，修正分类标题与条目前缀，并为 README 补充语义 Emoji。
- docs(telemetry): 按本包范围重建历史更新日志，修正分类标题与条目前缀，并为 README 补充语义 Emoji。
- docs(viewfly): 按本包范围重建历史更新日志，修正分类标题与条目前缀，并为 README 补充语义 Emoji。
- docs(vitarx): 按本包范围重建历史更新日志，修正分类标题与条目前缀，并为 README 补充语义 Emoji。
- docs(vue): 按本包范围重建历史更新日志，修正分类标题与条目前缀，并为 README 补充语义 Emoji。

### Other Changes 🔧

- test(release): 覆盖真实 Changesets 升版、包作用域过滤、依赖联动记录与历史重生成幂等性。
- test(website): 覆盖 iframe 首次加载、消息校验、地址切换及主题切换，并将网站组件测试纳入仓库测试命令。
