# slux ripple · 示例

`examples/ripple-vite-ts` 演示 `@slux/ripple` 的全部子入口：页面由共享外壳 `@slux/shell-example` 渲染（报头 + 分组索引 + 瀑布流卡片 + 统计），每张卡片挂载一个真实 Ripple 组件，可独立重置、查看源码与运行日志。

## 运行

```sh
pnpm install
pnpm --filter @slux/example-ripple-vite-ts dev      # 开发
pnpm --filter @slux/example-ripple-vite-ts build    # 构建
pnpm --filter @slux/example-ripple-vite-ts test     # 挂载回归测试（vitest + jsdom + 真实运行时）
```

构建工具：Vite + `@ripple-ts/vite-plugin`（Ripple 官方 Vite 插件，编译 `.tsrx` 组件）

## 示例

| 示例                      | API                         | 分组    |
| ------------------------- | --------------------------- | ------- |
| useSignal：信号驱动重渲染 | `useSignal(signal)`         | signal  |
| useSignal：订阅派生值     | `useSignal(computed)`       | signal  |
| useAtomValue + useSetAtom | `@slux/ripple/atom`         | atom    |
| useStore + selector       | `useStore(store, selector)` | store   |
| useSnapshot               | `useSnapshot(proxy)`        | proxy   |
| useFluxStore              | `useFluxStore(store)`       | flux    |
| useMachine                | `useMachine(machine)`       | machine |
| useObservable             | `useObservable(stream)`     | rxjs    |

## 技术要点

- Ripple 组件是 setup 语义：`@{ ... }` 函数体只执行一次，slux 的 signal/atom/store 可直接在组件体内创建，重置卡片 = 卸载重挂 = 全新状态。
- 绑定层 `useExternal` 用 `track({ value })` 包裹任意值（避免 track 把函数误当派生计算），由 effect 驱动刷新。
- 测试环境需把 `ripple` 与 `@slux/ripple/*` alias 到 client runtime / 源码（见 `vite.config.ts`）。
- `.tsrx` 文件由插件编译，tsc 通过 `allowArbitraryExtensions` 的伴生 `.d.tsrx.ts` 声明补全对外类型；每个示例文件都是自包含最小复现，`?raw` 导入同文件作为「源码」面板内容。
