# rxjs 示例

🧪 `examples/rxjs-rsbuild-ts` 用统一外壳（`@slux/shell-example`）演示 `@slux/rxjs` 的 toObservable / fromObservable 双向桥接。所有卡片都是纯 TS 声明式示例（readouts / actions + subscribe 被动刷新），每张卡片都可独立重置、查看源码与运行记录。

## 运行

```sh
pnpm install
pnpm --filter @slux/example-rxjs-rsbuild-ts dev      # 开发
pnpm --filter @slux/example-rxjs-rsbuild-ts build    # 构建
pnpm --filter @slux/example-rxjs-rsbuild-ts test     # 交互回归测试（jsdom + 真实运行时）
```

🚀 构建工具：Rsbuild（`rstack`），无框架插件；rxjs 仅作为 devDependency 参与 bundled。

## 卡片

| 🧪 卡片                        | API                               | 分组           |
| ------------------------------ | --------------------------------- | -------------- |
| toObservable：信号变流         | `toObservable(signal)`            | toObservable   |
| toObservable：派生值接管道     | `toObservable(computed)`          | toObservable   |
| fromObservable：interval 落地  | `fromObservable(obs, init)`       | fromObservable |
| fromObservable：Subject 三通道 | `fromObservable(subject, init)`   | fromObservable |
| 往返桥接：signal ⇄ Observable  | `fromObservable(toObservable(s))` | bridge         |

## 结构

- 🗂️ `src/demos/` — 一个文件一个演示，自包含、最小化；`index.ts` 汇总 `groups` + `demos`
- `src/index.ts` — `createExamplePage(root, {...})`，仅此一个职责
- `__tests__/page.test.tsx` — 卡片渲染、发射读数、面板互斥与三通道完整流转的回归测试
