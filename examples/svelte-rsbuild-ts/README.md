# svelte Playground

`examples/svelte-rsbuild-ts` 用卡片布局演示 `@slux/svelte` 的公开 API。toReadable / toWritable 把 slux 信号读成 Svelte store，`$` 前缀自动订阅与卸载。每张卡片都可独立重置、查看源码与运行记录。

## 运行

```sh
pnpm install
pnpm --filter @slux/example-svelte-rsbuild-ts dev      # 开发
pnpm --filter @slux/example-svelte-rsbuild-ts build    # 构建
pnpm --filter @slux/example-svelte-rsbuild-ts test     # 挂载回归测试（jsdom + 真实运行时）
```

构建工具：Rsbuild + `@rsbuild/plugin-svelte`（Svelte 5 编译）

## 卡片

| 卡片                               | API                  | 分类 |
| ---------------------------------- | -------------------- | ---- |
| toReadable：信号驱动的 Svelte 组件 | `toReadable(signal)` | hook |
| toWritable：可写信号接 store       | `toWritable(signal)` | hook |

## 技术要点

每张卡片挂载的是真实 `.svelte` 组件，由 Svelte 5 编译器编译；组件内部状态在实例 `<script>` 里创建（如 `signal(0)`），重置卡片即重新挂载，`$` 前缀 store 在组件卸载时自动退订。

卡片用 `mount(component, { target, props })` 挂载、卸载时 `unmount(app)`（Svelte 5 API）。

SFC 源码面板通过 `import source from "./demo.svelte" with { type: "text" }` 读取原文：plugin-svelte 对带 `type: "text"` 的请求直接返回原始文本，不再过 svelte-loader。

组件脚本使用纯 JS（不带 `lang="ts"`）：svelte-preprocess 的 typescript transformer 依赖旧版 `typescript` CJS API，与仓库当前的 typescript 7.1.0-beta 不兼容，纯 JS 可绕开该预处理层。

## 结构

- `src/demos/` — 按能力分组的 Svelte 演示，`index.ts` 汇总为 `demos`
- `src/index.ts` — 报头、分组索引、瀑布流卡片与统计装配
- `__tests__/page.test.ts` — 每张卡片的挂载与交互回归测试
