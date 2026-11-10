# vue Playground

`examples/vue-rsbuild-ts` 用卡片布局演示 `@slux/vue` 的公开 API。useSignal 在 setup 中把 slux 信号读成只读 Ref，值变化即驱动 Vue 重渲染。每张卡片都可独立重置、查看源码与运行记录。

## 运行

```sh
pnpm install
pnpm --filter @slux/example-vue-rsbuild-ts dev      # 开发
pnpm --filter @slux/example-vue-rsbuild-ts build    # 构建
pnpm --filter @slux/example-vue-rsbuild-ts test     # 挂载回归测试（jsdom + 真实运行时）
```

构建工具：Rsbuild + `@rsbuild/plugin-vue`（负责 SFC 编译与 Fast Refresh）

## 卡片

| 卡片                            | API                   | 分类    |
| ------------------------------- | --------------------- | ------- |
| useSignal：信号驱动的 Vue 组件  | `useSignal(signal)`   | hook    |
| 订阅 computed，依赖变化自动更新 | `useSignal(computed)` | derived |

## 技术要点

每张卡片挂载的是真实 `.vue` 单文件组件，由 `@rsbuild/plugin-vue` 编译。

卡片用 `createApp(component, props)` 挂载、卸载时 `app.unmount()`；组件状态在 `setup` 里创建（如 `signal(0)`），重置卡片即重新挂载。

SFC 源码面板通过 `import source from "./demo.vue" with { type: "text" }` 读取原文：plugin-vue 对带 `type: "text"` 的请求直接返回原始文本，不再过 vue-loader。

## 结构

- `src/demos/` — 按能力分组的 SFC 演示，`index.ts` 汇总为 `demos`
- `src/index.ts` — 报头、分组索引、瀑布流卡片与统计装配
- `__tests__/page.test.ts` — 每张卡片的挂载与交互回归测试
