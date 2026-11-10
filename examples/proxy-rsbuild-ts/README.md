# proxy 示例

`examples/proxy-rsbuild-ts` 用统一外壳（`@slux/shell-example`）演示 `@slux/proxy` 的公开 API。每张卡片通过声明式 `create` 契约（readouts / actions）驱动真实的 observable 运行时，「源码」面板展示对应的最小复现 `*.repro.ts`。

## 运行

```sh
pnpm install
pnpm --filter @slux/example-proxy-rsbuild-ts dev      # 开发
pnpm --filter @slux/example-proxy-rsbuild-ts build    # 构建
pnpm --filter @slux/example-proxy-rsbuild-ts test     # 交互回归测试（rstest + jsdom）
```

## 卡片

| 卡片                       | API                 | 分组       |
| -------------------------- | ------------------- | ---------- |
| observable：直接改深层属性 | `observable(obj)`   | observable |
| observable：数组操作       | `observable([...])` | observable |
| observe：只追读取的属性    | `observe(fn)`       | observe    |
| snapshot：冻结与结构共享   | `snapshot(proxy)`   | snapshot   |
| ref：原引用嵌入状态        | `ref(value)`        | ref        |

## 结构

- `src/demos/<demo-id>.ts` — 一个文件一个演示，基于外壳 `create` 契约自包含运行
- `src/demos/<demo-id>.repro.ts` — 源码面板展示的最小复现（构建期 `?raw` 导入）
- `src/demos/index.ts` — groups + demos 注册表
- `src/index.ts` — `createExamplePage(root, { … })` 装配
- `__tests__/page.test.tsx` — 渲染、交互、面板与 observe 追踪回归测试
