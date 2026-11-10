# flux 示例

`examples/flux-rsbuild-ts` 用统一外壳（`@slux/shell-example`）演示 `@slux/flux` 的公开 API。每张卡片通过声明式 `create` 契约（readouts / actions）驱动真实的 FluxStore 运行时，「源码」面板展示对应的最小复现 `*.repro.ts`。

## 运行

```sh
pnpm install
pnpm --filter @slux/example-flux-rsbuild-ts dev      # 开发
pnpm --filter @slux/example-flux-rsbuild-ts build    # 构建
pnpm --filter @slux/example-flux-rsbuild-ts test     # 交互回归测试（rstest + jsdom）
```

## 卡片

| 卡片                            | API                                      | 分组       |
| ------------------------------- | ---------------------------------------- | ---------- |
| createFluxStore：reducer 计数器 | `createFluxStore(reducer, initialState)` | store      |
| createFluxStore：整状态替换     | `getState() / getInitialState()`         | store      |
| middleware：管道顺序            | `options.middleware`                     | middleware |
| middleware：改写与阻断          | `FluxMiddleware`                         | middleware |

## 结构

- `src/demos/<demo-id>.ts` — 一个文件一个演示，基于外壳 `create` 契约自包含运行
- `src/demos/<demo-id>.repro.ts` — 源码面板展示的最小复现（构建期 `?raw` 导入）
- `src/demos/index.ts` — groups + demos 注册表
- `src/index.ts` — `createExamplePage(root, { … })` 装配
- `__tests__/page.test.tsx` — 渲染、交互、面板与中间件流转回归测试
