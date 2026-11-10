# inferno Playground

🧪 `examples/inferno-rsbuild-ts` 用统一外壳（`@slux/shell-example`）演示 `@slux/inferno` 的 7 个子入口。绑定以 class 组件 + `children: (value) => InfernoNode` render prop 形式暴露，由内部 `Observer` 基类管理订阅生命周期。每张卡片挂载真实 Inferno 组件，可独立重置、查看源码与运行记录。

## 运行

```sh
pnpm install
pnpm --filter @slux/example-inferno-rsbuild-ts dev      # 开发
pnpm --filter @slux/example-inferno-rsbuild-ts build    # 构建
pnpm --filter @slux/example-inferno-rsbuild-ts test     # 挂载回归测试（jsdom + 真实运行时）
```

🚀 构建工具：Rsbuild + 官方 `swc-plugin-inferno`（经 `tools.swc` 的 `jsc.experimental.plugins` 注册）

## 卡片

| 卡片                        | API                               | 分组    |
| --------------------------- | --------------------------------- | ------- |
| SignalValue：信号驱动重渲染 | `SignalValue({ source })`         | signal  |
| SignalValue：订阅派生值     | `SignalValue({ source })`         | signal  |
| AtomValue + setAtom         | `@slux/inferno/atom`              | atom    |
| StoreValue + selector       | `StoreValue({ store, selector })` | store   |
| ProxyValue                  | `ProxyValue({ proxy })`           | proxy   |
| FluxValue                   | `FluxValue({ source })`           | flux    |
| MachineValue                | `MachineValue({ source })`        | machine |
| ObservableValue             | `ObservableValue({ source })`     | rxjs    |

## 技术要点

💡 每张卡片挂载的是真实 `.tsx` Inferno 类组件，JSX 由官方 `swc-plugin-inferno` 编译成 `newVNode`/`newComponentVNode` 调用，而不是运行时 `createElement`。

卡片用 `render(<Demo />, container)` 挂载、`render(null, container)` 卸载；组件状态保存在类字段里，重置卡片即重新挂载、获得全新状态。

## 结构

- `src/demos/` — 按能力分组的演示，`index.tsx` 汇总为 `demos` 并内联 `?raw` 源码
- `src/index.ts` — 调用 `createExamplePage` 装配页面外壳
- `__tests__/page.test.tsx` — 挂载与交互回归测试

## 备注

💡 `tsconfig.json` 不把 `rstack.config.ts` 纳入 `include`：rstack 的类型声明会经 `@rspress/core` → `react-router` 拉入 `@types/react` 的全局 JSX 命名空间，与 inferno 自带的全局 JSX 合并后会让 `class` 属性报错。配置文件本身由 `rs lint` 覆盖。
