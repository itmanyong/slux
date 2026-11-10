# vitarx 示例页

🧪 `examples/vitarx-vite-ts` 用统一外壳（`@slux/shell-example`）演示 `@slux/vitarx` 的 7 个子入口。useSignal 返回只读浅 Ref（`.value` 读取），客户端订阅立即建立、由 vitarx effect scope（`onScopeDispose`）统一释放。每张卡片都可独立重置、查看源码与运行记录。

## 运行

```sh
pnpm install
pnpm --filter @slux/example-vitarx-vite-ts dev      # 开发
pnpm --filter @slux/example-vitarx-vite-ts build    # 构建
pnpm --filter @slux/example-vitarx-vite-ts test     # 挂载回归测试（jsdom + 真实运行时）
```

🚀 构建工具：Vite + `@vitarx/plugin-vite`（vitarx 官方 Vite 插件，负责 JSX 编译），测试用 vitest（jsdom）。

## 卡片

| 🧪 卡片                   | API                         | 分类    |
| ------------------------- | --------------------------- | ------- |
| useSignal：信号驱动重渲染 | `useSignal(signal)`         | signal  |
| useSignal：订阅派生值     | `useSignal(computed)`       | signal  |
| useAtomValue + useSetAtom | `@slux/vitarx/atom`         | atom    |
| useStore + selector       | `useStore(store, selector)` | store   |
| useSnapshot               | `useSnapshot(proxy)`        | proxy   |
| useFluxStore              | `useFluxStore(store)`       | flux    |
| useMachine                | `useMachine(machine)`       | machine |
| useObservable             | `useObservable(stream)`     | rxjs    |

## 技术要点

💡 每张卡片挂载的是真实 `.tsx` Vitarx 组件。动态内容统一用 vitarx 原生 `computed` 包裹（如 `computed(() => String(ref.value))`），读数随 ShallowRef 写回自动更新；状态机卡片的操作按钮由返回 JSX 的 computed 按状态切换。

卡片用 `createApp(() => <Component log={ctx.log} />)` 挂载、卸载时 `app.unmount()`（销毁组件的 effect scope，绑定订阅随之释放）；组件状态在初始化阶段创建，重置卡片即重新挂载、全新状态。注意 vitarx 的 JSX 属性用 `class`（不是 `className`），且文本节点不裁剪空白。

## 结构

- `src/demos/` — 一个文件一个演示（最小复现），`index.tsx` 汇总为 `demos` 并用 `?raw` 导入源码
- `src/index.ts` — `createExamplePage(root, {...})`，仅此一个职责
- `__tests__/page.test.tsx` — 外壳渲染、交互读数、日志/源码面板与状态机流转回归测试
