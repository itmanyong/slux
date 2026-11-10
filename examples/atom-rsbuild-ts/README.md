# atom 示例

`examples/atom-rsbuild-ts` 用统一外壳（`@slux/shell-example`）演示 `@slux/atom` 的公开 API。每张卡片通过声明式 `create` 契约（readouts / actions）驱动真实的 atom 运行时，「源码」面板展示对应的最小复现 `*.repro.ts`。

## 运行

```sh
pnpm install
pnpm --filter @slux/example-atom-rsbuild-ts dev      # 开发
pnpm --filter @slux/example-atom-rsbuild-ts build    # 构建
pnpm --filter @slux/example-atom-rsbuild-ts test     # 交互回归测试（rstest + jsdom）
```

## 卡片

| 卡片                        | API                         | 分组     |
| --------------------------- | --------------------------- | -------- |
| atom：整体替换与读改写      | `atom(0)`                   | atom     |
| atom：函数值原样保存        | `atom<fn \| undefined>`     | atom     |
| derived：链式派生           | `derived((get) => …)`       | derived  |
| derived：动态依赖分支       | `derived(read)`             | derived  |
| writableAtom：读写换算      | `writableAtom(read, write)` | writable |
| writableAtom：只写 action   | `writableAtom(null, write)` | writable |
| atomFamily：按 id 缓存      | `atomFamily(factory)`       | family   |
| createAtomScope：请求级隔离 | `createAtomScope()`         | scope    |

## 结构

- `src/demos/<demo-id>.ts` — 一个文件一个演示，基于外壳 `create` 契约自包含运行
- `src/demos/<demo-id>.repro.ts` — 源码面板展示的最小复现（构建期 `?raw` 导入）
- `src/demos/index.ts` — groups + demos 注册表
- `src/index.ts` — `createExamplePage(root, { … })` 装配
- `__tests__/page.test.tsx` — 渲染、交互、面板与作用域流转回归测试
