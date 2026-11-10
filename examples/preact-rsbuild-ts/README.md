# preact Playground

`examples/preact-rsbuild-ts` 用统一外壳（`@slux/shell-example`）演示 `@slux/preact` 的 7 个子入口。绑定基于 `preact/compat` 的 `useSyncExternalStore`，把任意 `Subscribable` 读成组件里的一个值。每张卡片挂载真实 Preact 组件，可独立重置、查看源码与运行记录。

## 运行

```sh
pnpm install
pnpm --filter @slux/example-preact-rsbuild-ts dev      # 开发
pnpm --filter @slux/example-preact-rsbuild-ts build    # 构建
pnpm --filter @slux/example-preact-rsbuild-ts test     # 挂载回归测试（jsdom + 真实运行时）
```

构建工具：Rsbuild + `@rsbuild/plugin-preact`（官方 Preact 插件，负责 JSX 编译与 Fast Refresh）

## 卡片

| 卡片                      | API                         | 分组    |
| ------------------------- | --------------------------- | ------- |
| useSignal：信号驱动重渲染 | `useSignal(signal)`         | signal  |
| useSignal：订阅派生值     | `useSignal(computed)`       | signal  |
| useAtomValue + useSetAtom | `@slux/preact/atom`         | atom    |
| useStore + selector       | `useStore(store, selector)` | store   |
| useSnapshot               | `useSnapshot(proxy)`        | proxy   |
| useFluxStore              | `useFluxStore(store)`       | flux    |
| useMachine                | `useMachine(machine)`       | machine |
| useObservable             | `useObservable(stream)`     | rxjs    |

## 技术要点

每张卡片挂载的是真实 `.tsx` Preact 组件，由 `@rsbuild/plugin-preact` 编译。

卡片用 `render(<Demo />, container)` 挂载，返回值即卸载函数；组件状态用 `useState(() => signal(0))` 保存，重置卡片即重新挂载、获得全新状态。

## 结构

- `src/demos/` — 按能力分组的演示，`index.tsx` 汇总为 `demos` 并内联 `?raw` 源码
- `src/index.ts` — 调用 `createExamplePage` 装配页面外壳
- `__tests__/page.test.tsx` — 挂载与交互回归测试
