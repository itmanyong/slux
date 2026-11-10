# storage Playground

`examples/storage-rsbuild-ts` 用卡片布局演示 `@slux/storage` 的公开 API：persist 作为 `@slux/store` 的持久化中间件，写入即落盘、init 自动水合；partialize/merge 控制字段取舍，version/migrate 平滑升级旧数据，skipHydration/onError/onHydrate 管理水合生命周期。每张卡片都可独立重置、查看最小复现源码与运行日志。

## 运行

```sh
pnpm install
pnpm --filter @slux/example-storage-rsbuild-ts dev      # 开发
pnpm --filter @slux/example-storage-rsbuild-ts build    # 构建
pnpm --filter @slux/example-storage-rsbuild-ts test     # 交互回归测试（jsdom + 真实运行时）
```

构建工具：Rsbuild（rstack 全家桶，示例为无框架纯 TS 页面）

## 卡片

| 卡片                            | API                             | 分类      |
| ------------------------------- | ------------------------------- | --------- |
| memoryStorage：内存后端语义     | `memoryStorage()`               | backends  |
| persist：写入即落盘             | `persist({ key, storage })`     | persist   |
| partialize：选择性落盘          | `persist({ partialize })`       | persist   |
| version/migrate：数据升级       | `persist({ version, migrate })` | persist   |
| skipHydration：手动水合         | `persist({ skipHydration })`    | hydration |
| onError：坏数据处理             | `persist({ onError })`          | hydration |
| onHydrate/hasHydrated：水合回调 | `persist.onHydrate(cb)`         | hydration |

## 技术要点

示例是无框架的纯 TS 页面：卡片内容走外壳的声明式 `create` 契约（readouts / actions），由 `@slux/shell-example` 统一渲染，demo 文件只依赖 `@slux/storage` 与 `@slux/store`。

demo 的存储后端全部使用包内可注入的 `memoryStorage()`（同步内存实现，可在 node/jsdom 下运行）；真实 localStorage 的 try/catch 降级行为由 `localStorageBackend` 自身与包测试保证，不进 demo。落盘 envelope 通过把同一个 storage 实例读出来展示，源码面板与运行时一一对应。

`src/demos/<demo-id>.repro.ts` 是最小复现片段（只含该包 API + `console.log` + `// → 预期输出` 注释），构建期经 `?raw` 导入，源码面板展示的内容与源文件逐字节一致。

## 结构

- `src/demos/` — 一个文件一个演示；`index.ts` 汇总 groups 与 demos 注册表
- `src/index.ts` — `createExamplePage` 装配，仅此一个职责
- `__tests__/page.test.ts` — 卡片渲染、落盘同步、memory 后端语义与手动水合的回归测试
