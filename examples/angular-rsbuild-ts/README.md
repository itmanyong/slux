# angular Playground

🧪 `examples/angular-rsbuild-ts` 用统一外壳（`@slux/shell-example`）演示 `@slux/angular` 的 7 个子入口。绑定在注入上下文中把可订阅源转成只读 Angular Signal，`DestroyRef` 自动退订。每张卡片挂载真实 Angular 组件，可独立重置、查看源码与运行记录。

## 运行

```sh
pnpm install
pnpm --filter @slux/example-angular-rsbuild-ts dev      # 开发
pnpm --filter @slux/example-angular-rsbuild-ts build    # 构建
pnpm --filter @slux/example-angular-rsbuild-ts test     # 挂载回归测试（vitest + jsdom + 真实运行时）
```

🚀 构建工具：Rspack + `@nx/angular-rspack`（Angular 官方 rspack 构建管线，负责组件 AOT/JIT 编译）

## 卡片

| 🧪 卡片                       | API                            | 分组    |
| ----------------------------- | ------------------------------ | ------- |
| toAngularSignal：信号驱动     | `toAngularSignal(source)`      | signal  |
| toAngularSignal：派生值       | `toAngularSignal(computed)`    | signal  |
| injectAtomValue+injectSetAtom | `@slux/angular/atom`           | atom    |
| injectStore + selector        | `injectStore(store, selector)` | store   |
| injectSnapshot                | `injectSnapshot(proxy)`        | proxy   |
| injectFluxStore               | `injectFluxStore(store)`       | flux    |
| injectMachine                 | `injectMachine(machine)`       | machine |
| injectObservable              | `injectObservable(stream)`     | rxjs    |

## 技术要点

- 💡 `main.ts` 先 `createApplication()` 启动 Angular 应用，再动态加载页面装配模块（`src/index.ts`）；卡片通过 `boot.ts` 的 `mountComponent`（`createComponent` + `attachView`）在真实注入上下文挂载组件，卸载 = `detachView` + `destroy()`。
- 日志函数以 `DEMO_LOG` InjectionToken 注入组件；组件字段初始化器处于注入上下文，`toAngularSignal` / `inject*` 可直接调用。
- 组件状态保存在类字段里，重置卡片即重新挂载、获得全新状态。

## 结构

- 🗂️ `src/demos/` — 按能力分组的演示，`index.ts` 汇总为 `demos` 并内联 `?raw` 源码
- `src/boot.ts` — 应用启动与组件挂载适配
- `src/index.ts` — 调用 `createExamplePage` 装配页面外壳
- `__tests__/page.test.ts` — 挂载与交互回归测试

## 与统一规范的偏差

- ⚠️ 全局样式走 `rspack.config.ts` 的 `styles: ["./src/index.css"]`（Angular 管线不处理 TS 里的 CSS 导入）。
- `@nx/angular-rspack` 忽略 `?raw` 查询并按 TS 转译，`rspack.config.ts` 里对内置 swc 规则排除了 `?raw` 模块并补了 `asset/source` 规则，保证「源码」面板展示的是逐字节原文。
- 同文件补了 `resolve.extensionAlias`（`.js` → `.ts`），因为 `_shell` 源码包使用 NodeNext 风格的 `./xxx.js` 导入。
- 测试命令是 `vitest run`（vitest.config.ts 已把 `@slux/angular` 别名到源码，绕开 dist 中的 `~` chunk 加载问题）。
