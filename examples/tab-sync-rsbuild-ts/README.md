# tab-sync Playground

`examples/tab-sync-rsbuild-ts` 用卡片布局演示 `@slux/tab-sync` 的公开 API。它是一个 `@slux/store` 中间件：挂进 `createStore` 的 `middleware`，用 `BroadcastChannel` 把状态同步到同源的其他页签。每张卡片都可独立重置、查看源码与运行记录。

## 运行

```sh
pnpm install
pnpm --filter @slux/example-tab-sync-rsbuild-ts dev      # 开发
pnpm --filter @slux/example-tab-sync-rsbuild-ts build    # 构建
pnpm --filter @slux/example-tab-sync-rsbuild-ts test     # 挂载回归测试（jsdom + 真实运行时）
```

构建工具：Rsbuild

## 卡片

| 卡片                           | API                            | 分类         |
| ------------------------------ | ------------------------------ | ------------ |
| broadcast：同页双实例对发      | `broadcast({ channel })`       | 同步通道     |
| BroadcastMessage：线上消息结构 | `BroadcastMessage<T>`          | 同步通道     |
| filter：只广播部分字段         | `broadcast({ filter })`        | 同步通道     |
| conflictResolution：自定义合并 | `conflictResolution: resolver` | 冲突策略     |
| destroy：掉线与重新加入        | `store.destroy()`              | 通道生命周期 |

## 技术要点

`BroadcastChannel` 不会把消息投递给发送者自己，因此**同一页面上挂同一通道的两个实例就是一对真实的同步对端**——demo 用这个特性在单页内模拟两个页签。

环境缺少 `BroadcastChannel` 时（如 jsdom），中间件的 `init` 不建立连接，demo 会做能力检测并在卡片里提示降级；对应的测试对同步行为做条件断言，只对本地写入做强断言。

`src/demos/<id>.repro.ts` 是每个演示的最小复现片段（只含包 API 与 `console.log`），构建期以 `?raw` 导入并展示在「源码」面板。

## 结构

- `src/demos/` — 按能力分组的演示（`create` 契约）与 `index.ts` 注册表
- `src/index.ts` — `createExamplePage` 装配：报头、分组索引、瀑布流与统计
- `__tests__/page.test.tsx` — 卡片渲染、交互、面板切换与生命周期回归测试
