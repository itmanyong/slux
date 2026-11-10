# shared 示例

🧪 `examples/shared-rsbuild-ts` 用统一外壳（`@slux/shell-example`）演示 `@slux/shared` 的公开工具：runAll 批量执行与 createAutoImports / generateBatchAutoImports 自动导入配置生成。`@slux/shared` 的公开 API 面较薄，示例按 4 张卡片组织。每张卡片都可独立重置、查看源码与运行记录。

## 运行

```sh
pnpm install
pnpm --filter @slux/example-shared-rsbuild-ts dev      # 开发
pnpm --filter @slux/example-shared-rsbuild-ts build    # 构建
pnpm --filter @slux/example-shared-rsbuild-ts test     # 交互回归测试（jsdom + 真实运行时）
```

🚀 构建工具：Rsbuild（`rstack`），无框架插件。

## 卡片

| 🧪 卡片                   | API                         | 分组         |
| ------------------------- | --------------------------- | ------------ |
| runAll：全部成功          | `runAll(tasks)`             | run-all      |
| runAll：失败收拢          | `runAll(tasks)`             | run-all      |
| runAll：单失败原样重抛    | `runAll(tasks)`             | run-all      |
| 自动导入：生成 ImportsMap | `createAutoImports(config)` | auto-imports |

## 结构

- 🗂️ `src/demos/` — 一个文件一个演示，自包含、最小化；`index.ts` 汇总 `groups` + `demos`
- `src/index.ts` — `createExamplePage(root, {...})`，仅此一个职责
- `__tests__/page.test.tsx` — 卡片渲染、批量执行读数、面板互斥与 ImportsMap 生成的回归测试
