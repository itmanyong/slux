# devtools Playground

🧪 `examples/devtools-rsbuild-ts` 用卡片布局演示 `@slux/devtools` 的公开 API：`logger` 控制台中间件、`inspect` 全局检查器与 `devtools` Redux DevTools 桥接。每张卡片都可独立重置、查看源码与运行记录。

## 运行

```sh
pnpm install
pnpm --filter @slux/example-devtools-rsbuild-ts dev      # 开发
pnpm --filter @slux/example-devtools-rsbuild-ts build    # 构建
pnpm --filter @slux/example-devtools-rsbuild-ts test     # 挂载回归测试（jsdom + 真实运行时）
```

🚀 构建工具：Rsbuild

## 卡片

| 🧪 卡片                         | API                                  | 分类          |
| ------------------------------- | ------------------------------------ | ------------- |
| logger：拦截每次 setState       | `logger({ name, logger })`           | 日志中间件    |
| logger：diff 与自定义 action 名 | `logger({ diff, actionName })`       | 日志中间件    |
| inspect：订阅检查事件流         | `inspect(callback)`                  | 全局检查器    |
| inspect：destroy 事件与重建     | `store.destroy() · InspectEventType` | 全局检查器    |
| inspect：一个检查器看多个 Store | `devtools({ name })`                 | 全局检查器    |
| devtools：Redux 扩展检测与降级  | `devtools({ name })`                 | DevTools 桥接 |

## 技术要点

💡 logger 中间件的输出通过自定义 `LoggerInterface` 捕获到卡片里（jsdom 与无扩展环境同样可见），而不是只打进控制台。inspect 是模块级注册表：demo 在 `create` 里注册、`dispose` 里注销，事件由 `devtools` 中间件在 init / set / destroy 时发出。

`devtools-connect` 卡片演示扩展缺失时的降级路径：`getExtension()` 返回 `undefined`，连接静默跳过，Store 与 inspect 事件流不受影响。

`src/demos/<id>.repro.ts` 是每个演示的最小复现片段（只含包 API 与 `console.log`），构建期以 `?raw` 导入并展示在「源码」面板。

## 结构

- `src/demos/` — 按能力分组的演示（`create` 契约）与 `index.ts` 注册表
- `src/index.ts` — `createExamplePage` 装配：报头、分组索引、瀑布流与统计
- `__tests__/page.test.tsx` — 卡片渲染、交互、面板切换与事件流回归测试
