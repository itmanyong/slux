# telemetry Playground

🧪 `examples/telemetry-rsbuild-ts` 用卡片布局演示 `@slux/telemetry` 的公开 API。它是一个 `@slux/store` 中间件：挂进 `createStore` 的 `middleware`，即可记录状态变化、订阅与初始化，支持字段过滤与运行时暂停。每张卡片都可独立重置、查看源码与运行记录。

## 运行

```sh
pnpm install
pnpm --filter @slux/example-telemetry-rsbuild-ts dev      # 开发
pnpm --filter @slux/example-telemetry-rsbuild-ts build    # 构建
pnpm --filter @slux/example-telemetry-rsbuild-ts test     # 挂载回归测试（jsdom + 真实运行时）
```

🚀 构建工具：Rsbuild

## 卡片

| 🧪 卡片                         | API                                  | 分类       |
| ------------------------------- | ------------------------------------ | ---------- |
| onStateChange：每次更新的元数据 | `telemetry({ onStateChange })`       | 事件采集   |
| onInit + onSubscribe            | `telemetry({ onInit, onSubscribe })` | 事件采集   |
| filter：只上报关心的字段        | `telemetry({ filter })`              | 过滤与控制 |
| setEnabled：暂停与恢复          | `setEnabled(false) · isEnabled()`    | 过滤与控制 |
| onError：回调异常隔离           | `telemetry({ onError })`             | 过滤与控制 |
| onDestroy：计数归零             | `store.destroy()`                    | 过滤与控制 |

## 技术要点

💡 每张卡片用外壳的声明式 `create` 契约渲染：demo 在 `create(ctx)` 里创建真实 Store 与遥测中间件，通过 readouts 暴露实时读数、actions 提供交互，`dispose` 里销毁 Store 释放订阅。重置卡片即销毁重建，状态回到初始值。

`src/demos/<id>.repro.ts` 是每个演示的最小复现片段（只含包 API 与 `console.log`），构建期以 `?raw` 导入并展示在「源码」面板。

## 结构

- `src/demos/` — 按能力分组的演示（`create` 契约）与 `index.ts` 注册表
- `src/index.ts` — `createExamplePage` 装配：报头、分组索引、瀑布流与统计
- `__tests__/page.test.tsx` — 卡片渲染、交互、面板切换与状态流转回归测试
