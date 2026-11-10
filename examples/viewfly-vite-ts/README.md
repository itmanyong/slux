# viewfly 示例页

🧪 `examples/viewfly-vite-ts` 用统一外壳（`@slux/shell-example`）演示 `@slux/viewfly` 的 7 个子入口。useSignal 返回只读 Accessor，订阅在 `onMounted` 的下一微任务建立，写入始终走原实例。每张卡片都可独立重置、查看源码与运行记录。

## 运行

```sh
pnpm install
pnpm --filter @slux/example-viewfly-vite-ts dev      # 开发
pnpm --filter @slux/example-viewfly-vite-ts build    # 构建
pnpm --filter @slux/example-viewfly-vite-ts test     # 挂载回归测试（jsdom + 真实运行时）
```

🚀 构建工具：Vite + `@viewfly/devtools/vite-viewfly-hmr-plugin`（viewfly 官方 Vite 插件），测试用 vitest（jsdom）。

## 卡片

| 🧪 卡片                   | API                         | 分类    |
| ------------------------- | --------------------------- | ------- |
| useSignal：信号驱动重渲染 | `useSignal(signal)`         | signal  |
| useSignal：订阅派生值     | `useSignal(computed)`       | signal  |
| useAtomValue + useSetAtom | `@slux/viewfly/atom`        | atom    |
| useStore + selector       | `useStore(store, selector)` | store   |
| useSnapshot               | `useSnapshot(proxy)`        | proxy   |
| useFluxStore              | `useFluxStore(store)`       | flux    |
| useMachine                | `useMachine(machine)`       | machine |
| useObservable             | `useObservable(stream)`     | rxjs    |

## 技术要点

💡 每张卡片挂载的是真实 `.tsx` Viewfly 组件（组件返回渲染函数，渲染函数里调用 `accessor()` 完成依赖追踪）。

卡片用 `createApp(jsx(Component, { log }))` 挂载、卸载时 `app.destroy()`；组件状态在初始化阶段创建（如 `signal(0)`），重置卡片即重新挂载、全新状态。注意绑定订阅在挂载后的下一微任务才建立，卸载早于微任务不会残留订阅。

## 结构

- `src/demos/` — 一个文件一个演示（最小复现），`index.ts` 汇总为 `demos` 并用 `?raw` 导入源码
- `src/index.ts` — `createExamplePage(root, {...})`，仅此一个职责
- `__tests__/page.test.tsx` — 外壳渲染、交互读数、日志/源码面板与状态机流转回归测试
