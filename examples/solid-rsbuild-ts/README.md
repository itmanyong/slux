# solid Playground

🧪 `examples/solid-rsbuild-ts` 用卡片布局演示 `@slux/solid` 的公开 API。useSignal 把 slux 信号读成 Solid Accessor，细粒度响应系统直接接管重渲染。每张卡片都可独立重置、查看源码与运行记录。

## 运行

```sh
pnpm install
pnpm --filter @slux/example-solid-rsbuild-ts dev      # 开发
pnpm --filter @slux/example-solid-rsbuild-ts build    # 构建
pnpm --filter @slux/example-solid-rsbuild-ts test     # 挂载回归测试（jsdom + 真实运行时）
```

🚀 构建工具：Rsbuild + `@rsbuild/plugin-solid`（追加 babel-preset-solid）+ `@rsbuild/plugin-babel`（提供 JSX 编译 loader）

## 卡片

| 🧪 卡片                          | API                   | 分类    |
| -------------------------------- | --------------------- | ------- |
| useSignal：信号驱动的 Solid 组件 | `useSignal(signal)`   | hook    |
| 订阅 computed，依赖变化自动更新  | `useSignal(computed)` | derived |

## 技术要点

💡 每张卡片挂载的是真实 `.tsx` Solid 组件，由 babel-preset-solid 编译成无 VDOM 的细粒度更新。

卡片用 `render(() => <Component/>, ctx.container)` 挂载——`render` 返回的 dispose 函数即是清理钩子；组件状态在组件体内创建（如 `signal(0)`），重置卡片即重新挂载。

Solid 的 `useSignal` 依赖响应式 owner，`render` 会自动创建 root owner，因此组件可以直接调用。

## 结构

- `src/demos/` — 按能力分组的演示，`index.tsx` 汇总为 `demos`
- `src/index.ts` — 报头、分组索引、瀑布流卡片与统计装配
- `__tests__/page.test.tsx` — 每张卡片的挂载与交互回归测试
