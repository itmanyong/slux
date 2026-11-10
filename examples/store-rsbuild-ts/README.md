# store Playground

`examples/store-rsbuild-ts` 用卡片布局演示 `@slux/store` 的公开 API：createStore 通过 creator 定义初始状态，setState 以对象合并或函数 updater 写入，subscribe 提供状态流转通知，middleware 支持 onSet 链式拦截，destroy 管理生命周期。每张卡片都可独立重置、查看最小复现源码与运行日志。

## 运行

```sh
pnpm install
pnpm --filter @slux/example-store-rsbuild-ts dev      # 开发
pnpm --filter @slux/example-store-rsbuild-ts build    # 构建
pnpm --filter @slux/example-store-rsbuild-ts test     # 交互回归测试（jsdom + 真实运行时）
```

构建工具：Rsbuild（rstack 全家桶，示例为无框架纯 TS 页面）

## 卡片

| 卡片                          | API                           | 分类       |
| ----------------------------- | ----------------------------- | ---------- |
| createStore：创建仓库与读写   | `createStore(creator)`        | basic      |
| subscribe：监听状态流转       | `store.subscribe(listener)`   | subscribe  |
| Middleware：onSet 审计写入    | `middleware: [audit]`         | middleware |
| Middleware：链式与拦截        | `middleware: [logger, guard]` | middleware |
| destroy：销毁仓库             | `store.destroy()`             | lifecycle  |
| getInitialState：回到初始快照 | `store.getInitialState()`     | lifecycle  |

## 技术要点

示例是无框架的纯 TS 页面：卡片内容走外壳的声明式 `create` 契约（readouts / actions），由 `@slux/shell-example` 统一渲染，demo 文件只依赖 `@slux/store` 本身。

`src/demos/<demo-id>.repro.ts` 是最小复现片段（只含该包 API + `console.log` + `// → 预期输出` 注释），构建期经 `?raw` 导入，源码面板展示的内容与源文件逐字节一致。

## 结构

- `src/demos/` — 一个文件一个演示；`index.ts` 汇总 groups 与 demos 注册表
- `src/index.ts` — `createExamplePage` 装配，仅此一个职责
- `__tests__/page.test.ts` — 卡片渲染、交互读数、tabs 互斥与 guard 拦截的回归测试
