# state-machine 示例

`examples/state-machine-rsbuild-ts` 用统一外壳（`@slux/shell-example`）演示 `@slux/state-machine` 的事件流转、guard 守卫与 context 动作。所有卡片都是纯 TS 声明式示例（readouts / actions），每张卡片都可独立重置、查看源码与运行记录。

## 运行

```sh
pnpm install
pnpm --filter @slux/example-state-machine-rsbuild-ts dev      # 开发
pnpm --filter @slux/example-state-machine-rsbuild-ts build    # 构建
pnpm --filter @slux/example-state-machine-rsbuild-ts test     # 交互回归测试（jsdom + 真实运行时）
```

构建工具：Rsbuild（`rstack`），无框架插件。

## 卡片

| 卡片                        | API                       | 分组    |
| --------------------------- | ------------------------- | ------- |
| 交通灯：字符串速记转换      | `createMachine(config)`   | flow    |
| 请求机：异步流程建模        | `createMachine + send`    | flow    |
| 脉冲计数：原地转换          | transition 无 target      | flow    |
| 步进器：guard 拦截越界      | `guard + can(event)`      | guard   |
| 密码锁：候选转换链          | guard 候选数组            | guard   |
| 购物车：action 更新 context | `actions(context, event)` | context |

## 结构

- `src/demos/` — 一个文件一个演示，自包含、最小化；`index.ts` 汇总 `groups` + `demos`
- `src/index.ts` — `createExamplePage(root, {...})`，仅此一个职责
- `__tests__/page.test.tsx` — 卡片渲染、交互读数、面板互斥与状态机完整流转的回归测试
