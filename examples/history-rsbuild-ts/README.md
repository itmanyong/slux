# history Playground

🧪 `examples/history-rsbuild-ts` 用卡片布局演示 `@slux/history` 作为 `@slux/store` 中间件提供的撤销重做能力：undo/redo 在 past 与 future 之间移动，maxDepth 限制快照上限，clear 一次性清空历史，canUndo/canRedo 是可直接订阅的 signal。每张卡片都可独立重置、查看最小复现源码与运行日志。

## 运行

```sh
pnpm install
pnpm --filter @slux/example-history-rsbuild-ts dev      # 开发
pnpm --filter @slux/example-history-rsbuild-ts build    # 构建
pnpm --filter @slux/example-history-rsbuild-ts test     # 交互回归测试（jsdom + 真实运行时）
```

🚀 构建工具：Rsbuild（rstack 全家桶，示例为无框架纯 TS 页面）

## 卡片

| 🧪 卡片                     | API                         | 分类   |
| --------------------------- | --------------------------- | ------ |
| undo/redo：文本时间旅行     | `history() + undo()/redo()` | travel |
| undo/redo：订阅者同步可见   | `history + store.subscribe` | travel |
| maxDepth：快照上限          | `history({ maxDepth: 3 })`  | limit  |
| clear：清空历史             | `history.clear()`           | reset  |
| canUndo/canRedo：信号标志位 | `history.canUndo / canRedo` | flags  |

## 技术要点

💡 示例是无框架的纯 TS 页面：卡片内容走外壳的声明式 `create` 契约（readouts / actions），由 `@slux/shell-example` 统一渲染，demo 文件只依赖 `@slux/history` 与 `@slux/store`。

demo 的存储介质全部来自包内注入面（状态由 `createStore` 持有），不依赖真实浏览器 history API；`canUndo/canRedo` 通过 signal 的 `get()/subscribe()` 读取与订阅，无需直接导入 `@slux/core`。

`src/demos/<demo-id>.repro.ts` 是最小复现片段（只含该包 API + `console.log` + `// → 预期输出` 注释），构建期经 `?raw` 导入，源码面板展示的内容与源文件逐字节一致。

## 结构

- `src/demos/` — 一个文件一个演示；`index.ts` 汇总 groups 与 demos 注册表
- `src/index.ts` — `createExamplePage` 装配，仅此一个职责
- `__tests__/page.test.ts` — 卡片渲染、undo/redo 流转、tabs 互斥与 maxDepth 边界的回归测试
