# react Playground

🧪 `examples/react-rsbuild-ts` 用卡片布局演示 `@slux/react` 的公开 API。useSignal 通过 useSyncExternalStore 把信号接入 React 渲染。每张卡片都可独立重置、查看源码与运行记录。

## 运行

```sh
pnpm install
pnpm --filter @slux/example-react-rsbuild-ts dev      # 开发
pnpm --filter @slux/example-react-rsbuild-ts build    # 构建
pnpm --filter @slux/example-react-rsbuild-ts test     # 挂载回归测试（jsdom + 真实运行时）
```

🚀 构建工具：Rsbuild + `@rsbuild/plugin-react`（官方 React 插件，负责 TSX 编译与 Fast Refresh）

## 卡片

| 🧪 卡片                          | API                   | 分类    |
| -------------------------------- | --------------------- | ------- |
| useSignal：信号驱动的 React 组件 | `useSignal(signal)`   | hook    |
| 订阅 computed，依赖变化自动更新  | `useSignal(computed)` | derived |

## 技术要点

💡 每张卡片挂载的是真实 `.tsx` React 组件，由 `@rsbuild/plugin-react` 编译，不再手写 `createElement`。

卡片用 `createRoot(ctx.root)` 挂载、卸载时 `root.unmount()`；组件状态用 `useState(() => signal(0))` 保存，重置卡片即重新挂载。

## 结构

- `src/ui/card.ts` — 卡片契约（`Demo` / `DemoContext`）与渲染逻辑
- `src/demos/` — 按能力分组的演示，`index.ts` 汇总为 `demos`
- `src/index.ts` — 侧栏、搜索、主题切换与卡片装配
- `__tests__/mount.test.ts` — 每张卡片的挂载与交互回归测试
