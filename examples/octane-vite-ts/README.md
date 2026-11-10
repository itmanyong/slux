# slux octane · 示例

`examples/octane-vite-ts` 演示 `@slux/octane` 的全部子入口：页面由共享外壳 `@slux/shell-example` 渲染（报头 + 分组索引 + 瀑布流卡片 + 统计），每张卡片挂载一个真实 Octane 组件，可独立重置、查看源码与运行日志。

## 运行

```sh
pnpm install
pnpm --filter @slux/example-octane-vite-ts dev      # 开发
pnpm --filter @slux/example-octane-vite-ts build    # 构建
pnpm --filter @slux/example-octane-vite-ts test     # 挂载回归测试（vitest + jsdom + 真实运行时）
```

构建工具：Vite + `octane/compiler/vite`（Octane 编译器插件，负责 TSX 编译与 hook 调用位分配）

## 示例

| 示例                      | API                         | 分组    |
| ------------------------- | --------------------------- | ------- |
| useSignal：信号驱动重渲染 | `useSignal(signal)`         | signal  |
| useSignal：订阅派生值     | `useSignal(computed)`       | signal  |
| useAtomValue + useSetAtom | `@slux/octane/atom`         | atom    |
| useStore + selector       | `useStore(store, selector)` | store   |
| useSnapshot               | `useSnapshot(proxy)`        | proxy   |
| useFluxStore              | `useFluxStore(store)`       | flux    |
| useMachine                | `useMachine(machine)`       | machine |
| useObservable             | `useObservable(stream)`     | rxjs    |

## 技术要点

- Octane 组件遵循 React 语义：函数体每次渲染重新执行，所以 slux 的信号、atom、store 都在挂载闭包里创建（组件之外），再作为 props 传入。
- 绑定层的 hook 经 Octane 编译器分配调用位（slot），每个调用点拿到独立订阅；卡片重置 = 卸载重挂 = 全新状态。
- 每个示例文件都是自包含最小复现，`?raw` 导入同文件作为「源码」面板内容。
