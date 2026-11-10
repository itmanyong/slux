## v0.2.1

### Bug Fixes 🐞

- fix(release): 将 npm 安装和授信发布移到 runner 临时目录，用绝对路径调用脚本及压缩包，避免根目录 pnpm devEngines 限制造成 EBADDEVENGINES。
- fix(website): 渲染远程更新日志时跳过 HTML 标签，避免将 details、summary 显示为字面文本，同时保留正文与真实提交链接。

<details>
<summary>相关提交（1）</summary>

- fix(release): isolate npm publishing from workspace constraints ([0953a0d](https://github.com/itmanyong/slux/commit/0953a0d13788407a4d8f5080af13790c9ee905e1))

</details>

### Document 📖

- docs(release): 说明从 main 运行修复后的工作流并指定原发布标签的恢复方式；原运行重试不会加载新工作流，已有标签和版本包必须保留。

**Full Changelog**: [release/v0.2.0...release/v0.2.1](https://github.com/itmanyong/slux/compare/release/v0.2.0...release/v0.2.1)

## v0.2.0

### New Features 🎉

- feat(release): 自动创建公开 GitHub Release，按功能、性能、修复、重构、文档和其他变更归类说明，保留 Changeset 细节及真实提交链接。
- feat(release): 每个版本提供全部 25 个 npm 包的独立 tgz 下载附件、SHA256SUMS 与 release-manifest.json 校验清单。

<details>
<summary>相关提交（1）</summary>

- feat(release): publish classified notes and verified package assets ([816ae21](https://github.com/itmanyong/slux/commit/816ae21074b7c7596cc84f216516579498b68346))

</details>

### Bug Fixes 🐞

- fix(release): 修正发布压缩包的相对路径，确保 npm 将 release-tarballs 中的文件识别为本地包。
- fix(release): 发布重跑时识别 npm 已存在的版本，校验并复用已发布压缩包，避免重复发布失败。

<details>
<summary>相关提交（1）</summary>

- fix(release): publish local tarball paths ([08344c7](https://github.com/itmanyong/slux/commit/08344c7feb479a3b431a77c257ebef33f884ee90))

</details>

### Document 📖

- docs(release): 从 Changeset 和 Git 历史生成发行说明及根 CHANGELOG，并保留各包版本和依赖升级记录。
- docs(release): 补充分类变更编写、公开 Release 与附件生成、历史说明生成及失败任务重跑指南。

### Other Changes 🔧

- test(release): 增加分类、版本范围、包校验和重复执行测试，发布前验证文档构建。
- chore(release): 25 个发布包统一升级到 0.2.0，运行时 API 保持不变。

**Full Changelog**: [release/v0.1.1...release/v0.2.0](https://github.com/itmanyong/slux/compare/release/v0.1.1...release/v0.2.0)

## v0.1.1

### New Features 🎉

- feat(repo): polish docs and interactive examples for first push ([207e315](https://github.com/itmanyong/slux/commit/207e3154aa4b333eb809b31778b6e850f32b35c5))

### Bug Fixes 🐞

- fix(release): 生成自动导入 API 清单时排除需要显式调用的 createAutoImportApis 工厂函数。
- fix(examples): 修正 Vue 与 Svelte 模块声明，React 示例测试使用 act 等待渲染完成。

<details>
<summary>相关提交（4）</summary>

- fix(release): generate auto-import APIs before validation ([b40101e](https://github.com/itmanyong/slux/commit/b40101e68a81726f43c5b5d0eb39886a55f12902))
- fix(ci): preserve example build dependencies ([9ee688d](https://github.com/itmanyong/slux/commit/9ee688d67bd45b0ede432df6ac2904322fc0651b))
- fix(ci): build workspace before verification ([6e4463b](https://github.com/itmanyong/slux/commit/6e4463b4b432c3fb409cd7134ca0d2ad57def7fb))
- fix(examples): track Vue and Svelte module declarations ([fe41531](https://github.com/itmanyong/slux/commit/fe41531499d4f617ce98a89ee646e59a6c911734))

</details>

### Document 📖

- docs(actview): 更新本包 README，补充包导航和相关文档入口。
- docs(angular): 更新本包 README，补充包导航和相关文档入口。
- docs(atom): 更新本包 README，补充包导航和相关文档入口。
- docs(core): 更新本包 README，补充包导航和相关文档入口。
- docs(devtools): 更新本包 README，补充包导航和相关文档入口。
- docs(flux): 更新本包 README，补充包导航和相关文档入口。
- docs(history): 更新本包 README，补充包导航和相关文档入口。
- docs(inferno): 更新本包 README，补充包导航和相关文档入口。
- docs(octane): 更新本包 README，补充包导航和相关文档入口。
- docs(preact): 更新本包 README，补充包导航和相关文档入口。
- docs(proxy): 更新本包 README，补充包导航和相关文档入口。
- docs(react): 更新本包 README，补充包导航和相关文档入口。
- docs(ripple): 更新本包 README，补充包导航和相关文档入口。
- docs(rxjs): 更新本包 README，补充包导航和相关文档入口。
- docs(shared): 更新本包 README，补充包导航和相关文档入口。
- docs(solid): 更新本包 README，补充包导航和相关文档入口。
- docs(state-machine): 更新本包 README，补充包导航和相关文档入口。
- docs(storage): 更新本包 README，补充包导航和相关文档入口。
- docs(store): 更新本包 README，补充包导航和相关文档入口。
- docs(svelte): 更新本包 README，补充包导航和相关文档入口。
- docs(tab-sync): 更新本包 README，补充包导航和相关文档入口。
- docs(telemetry): 更新本包 README，补充包导航和相关文档入口。
- docs(viewfly): 更新本包 README，补充包导航和相关文档入口。
- docs(vitarx): 更新本包 README，补充包导航和相关文档入口。
- docs(vue): 更新本包 README，补充包导航和相关文档入口。
- docs(website): 增加各包更新日志、版本发行说明和站内交互示例入口。

<details>
<summary>相关提交（3）</summary>

- docs(repo): show npm and npmx versions in package tables ([286afcf](https://github.com/itmanyong/slux/commit/286afcfbcb3dde416b3f12eaf8bb35099b0e0fec))
- docs(repo): sync package navigation during release ([f6bc2d1](https://github.com/itmanyong/slux/commit/f6bc2d1a3013652a76cc225cd582e0d3aaf5bd2a))
- docs(release): prepare v0.1.1 changeset from v0.1.0 ([a9738c4](https://github.com/itmanyong/slux/commit/a9738c44e80fdd8a9677e79049e32a7223b0401a))

</details>

### Other Changes 🔧

- chore(viewfly): 统一自动导入 API 清单排序，导出的 API 名称保持不变。
- chore(examples): 整理示例共享外壳和主题交互，将示例图标替换为透明背景 SVG。
- build(examples): 让示例共享层与页面外壳产出 dist，供验证和文档构建使用。
- ci(release): 在 CI、发布和文档部署流程中先完成工作区构建，再执行后续检查。
- ci(release): 使用 GitHub OIDC 授信逐包发布 npm，预先打包各包并在成功后创建 GitHub Release 草稿。

<details>
<summary>相关提交（5）</summary>

- chore(release): switch to trusted staged publishing ([1496b38](https://github.com/itmanyong/slux/commit/1496b383ed4d6150fb96192ef321a94ae66aaa3c))
- chore(release): allow direct trusted publishing ([ab5261e](https://github.com/itmanyong/slux/commit/ab5261e5c99b04df6f50cc4848fd08d8ee9318fd))
- chore(repo): add update logs ([957d677](https://github.com/itmanyong/slux/commit/957d677ebb5ed067abafdc0b5ec20add01fcb1da))
- build(examples): emit shared package artifacts ([db2a4b6](https://github.com/itmanyong/slux/commit/db2a4b6af6593a6cea08cf8bd5636dc9cd2faab2))
- test(react): flush example renders with act ([a024225](https://github.com/itmanyong/slux/commit/a0242255268e7a311188d892a54ca20fc8a43db0))

</details>

**Full Changelog**: [v0.1.0...release/v0.1.1](https://github.com/itmanyong/slux/compare/v0.1.0...release/v0.1.1)

## v0.1.0

### New Features 🎉

- feat(actview): 首次发布。把 `@slux/core` 及 6 个范式包的状态接入 **ActView 4**（peer 为 `@actview/core ^1.5.1`）。读取绑定统一以**只读浅 Ref**（`Readonly<Ref<T>>`，用 `.value` 读取）暴露，写入始终走原实例，绑定不提供 setter 也不创建副本。绑定在组件挂载或原生 effect scope 内建立，组件卸载 / scope 释放时自动清理。因 `@actview/core` 只提供 ESM，本包也**只发布 ESM 入口**。
- feat(angular): 首次发布。Angular 22（`@angular/core@^22.0.0`、`rxjs@^7.8.0`）的 slux 绑定，基于 `@slux/core` 的 `Subscribable<T>` 订阅模型。原生绑定形式是 **只读 Angular `Signal<T>` 与 RxJS `Observable` 桥接**：在注入上下文中把可订阅源转成 `Signal<T>`，并通过 `DestroyRef` 自动清理订阅。所有写入仍走原实例，绑定只读。
- feat(atom): 首次发布。基于 `@slux/core` 的原子状态范式：用小型 atom 组合状态、`derived` 表达派生、`writableAtom` 自定义写入、`atomFamily` 参数化缓存、`createAtomScope` 隔离取值。
- feat(core): 首次发布。框架无关的响应式核心库，构建于 [limu](https://github.com/tnfe/limu) 的不可变状态容器之上。所有信号写入统一通过 `set`，提供惰性计算、同步副作用、批处理合并与可隔离的作用域。
- feat(devtools): 首次发布。为 `@slux/store` 提供三组调试能力：`devtools` 连接 Redux DevTools 扩展、`logger` 输出控制台日志、`inspect` 注册模块级自定义检查器。前两者是 Store 中间件，第三者是全局回调注册器。中间件类型只在类型层复用 Store 的公共契约，本包运行时不导入 `@slux/store`。
- feat(flux): 首次发布。基于 `@slux/core` 的 reducer + dispatch 状态范式层。内部只持有一个 core `Signal<State>` 作为状态与通知源：`dispatch(action)` 同步经过中间件链与 reducer，把 reducer 返回的完整新状态写入该 signal；依赖追踪、批处理与相等性判定全部复用 core。**不依赖 Redux，也不是 Redux 的兼容实现**。
- feat(history): 首次发布。为 `@slux/store` 提供基于状态快照的撤销与重做中间件 `history`。它在每次写入前把当前状态压入 `past` 栈，撤销/重做通过完整中间件链恢复，并额外暴露 `canUndo` / `canRedo` 两个只读响应式信号。它作为 `@slux/store` 中间件接入，复用 Store 的公共契约，
- feat(inferno): 首次发布。Inferno 10（`inferno@^10.0.0`）的 slux 绑定，基于 `@slux/core` 的 `Subscribable<T>` 订阅模型。原生绑定形式是 **原生 class 组件生命周期管理订阅 + render prop 输出值**：所有读取组件都接受 `children: (value) => InfernoNode`，由内部 `Observer` 基类在挂载、更新、卸载时管理订阅。所有写入仍走原实例，绑定只读。
- feat(octane): 首次发布。为独立的 Octane UI 框架（npm 包 `octane`，peer 为 `^0.16.7`）提供基于**编译器 slot hooks** 的原生绑定。读取绑定通过 `useSyncExternalStore` **直接返回值 `T`**（不是 ref、Accessor 或 `.value`），写入仍走原实例。与其余框架适配包最根本的不同：本包 `exports` 全部指向 **`./src/*.ts` TypeScript 源码**，不是预编译产物，且**不提供 CommonJS 入口**。
- feat(preact): 首次发布。Preact 11（`preact@^11.0.0`）的 slux 绑定，基于 `@slux/core` 的 `Subscribable<T>` 订阅模型。原生绑定形式是 **Preact 原生 hooks + `preact/compat` 的 `useSyncExternalStore`**：把任意可订阅源读成组件里的一个值，**不依赖 React**。所有写入仍走原实例，绑定只读。
- feat(proxy): 首次发布。基于 `@slux/core` 的可变对象范式。`observable` 用 `Proxy` 包装普通对象 / 数组，属性赋值、删除与数组操作直接触发 core 的依赖通知；`observe` 按读取的属性自动追踪；`snapshot` 产出冻结、缓存、结构共享的只读快照；`ref` 用于把不想被代理的值按原引用嵌入状态。
- feat(react): 首次发布。把 `@slux/core` 的响应式状态接入 React 18 / 19。核心绑定 `useSignal` 是基于 `useSyncExternalStore` 的 hook，读取任意 `Subscribable<T>` 并返回 `T`；主入口另提供 core `Scope` 的 Context 组件与 `createAutoImportApis`。六个范式各通过独立子入口提供只读 hook，写入仍走原实例。
- feat(ripple): 首次发布。Ripple（`ripple@^0.6.1`）的 slux 绑定，基于 `@slux/core` 的 `Subscribable<T>` 订阅模型。原生绑定形式是 **Ripple 原生 `track` / `effect`**：所有绑定返回 `Derived<T>`，以 **`.value` 读取**。`.` 入口按 `browser` / `default` 条件分流到客户端与服务端实现。所有写入仍走原实例，绑定只读。
- feat(rxjs): 首次发布。RxJS `Observable` 与 `@slux/core` 的 `Subscribable` 之间的双向桥接：`toObservable` 把 core 状态源包成 `Observable`，`fromObservable` 把 `Observable` 转成带 `status` / `error` / `dispose` 生命周期的 `ObservableState`。实现直接写在 `src/index.ts`，组合 core 的 `signal` / `effect` / `batch` 与 rxjs 的 `Observable`，**不是对其他实现文件的重导出**。
- feat(shared): 首次发布。全仓库复用的纯工具库，运行时**零依赖**，只做两件事：按迭代顺序执行全部同步任务并汇总错误（`runAll`），以及生成 `unplugin-auto-import` 的自动导入配置（`createAutoImports` / `generateBatchAutoImports`）。
- feat(solid): 首次发布。把 `@slux/core` 的响应式状态接入 Solid 1.9 的细粒度响应式系统。核心绑定 `useSignal` 返回 Solid 原生 `Accessor<T>`（内部由 `createSignal` 提供），在 JSX 或响应式计算里调用 `value()` 读取；主入口另提供 core `Scope` 的 Context 封装与 `createAutoImportApis`。六个范式各通过独立子入口提供同样返回 `Accessor` 的绑定。
- feat(state-machine): 首次发布。基于 `@slux/core` 的轻量**平面**有限状态机。内部用一个 core `Signal<MachineSnapshot>` 保存当前 `{ value, context }`：`send(event)` 选择通过 guard 的转换、顺序执行 action，在 core `batch` 内一次提交新快照。**这是平面状态机范式，不是 XState 兼容实现**；不提供层级状态、并行状态、计时器、actor、异步转换或 entry/exit action（逐项依据见「能力边界」）。
- feat(storage): 首次发布。为 `@slux/store` 提供持久化中间件 `persist`：把状态写入可插拔后端，并在创建 Store 时恢复。同步与异步后端统一处理，支持字段裁剪、版本迁移、合并策略与错误观察。它作为 `@slux/store` 中间件接入，复用 Store 的公共契约，
- feat(store): 首次发布。把**关联状态与 action 放在同一个对象**里管理。读写、批处理与派生依赖复用 `@slux/core` 的响应式运行时，本包只提供 Store 范式层：一个 `createStore`、一组类型、一条可选中间件链。
- feat(svelte): 首次发布。把 `@slux/core` 的响应式状态转换成 Svelte 5 原生 `Readable` / `Writable` store（`svelte/store`），可用 `$store` 自动订阅。核心绑定是 `toReadable(source)` 与 `toWritable(signal)`：前者把任意 `Subscribable<T>` 桥接成 `Readable<T>`，后者额外提供 `set` / `update` 写回 core `Signal<T>`。主入口另提供 core `Scope` 的 context 封装与 `createAutoImportApis`。六个范式各通过独立子入口提供对应的 `Readable` / `Writable` 绑定。
- feat(tab-sync): 首次发布。为 `@slux/store` 提供基于 `BroadcastChannel` 的跨标签页状态同步。`broadcast` 是一个标准 `Middleware<T>`：把本地后续变更广播到同名通道，并把收到的远端消息经完整中间件链应用。它作为 `@slux/store` 中间件接入，复用 Store 的公共契约，
- feat(telemetry): 首次发布。为 `@slux/store` 记录初始化、状态变化、订阅三类事件的遥测中间件 `telemetry`。它把元数据交给调用方提供的回调，支持按字段过滤与运行时暂停；不发送网络请求、不克隆状态快照。它作为 `@slux/store` 中间件接入，复用 Store 的公共契约，
- feat(viewfly): 首次发布。把 `@slux/core` 及 6 个范式包的状态接入 **Viewfly 3**（peer 为 `@viewfly/core ^3.0.6`）。读取绑定统一以 **Accessor**（`Accessor<T> = () => T`，**调用函数**读取）暴露，写入始终走原实例，绑定不提供 setter 也不创建副本。与其它同构适配包的关键差别：Viewfly 版基于 `@viewfly/core` 的 `createSignal`，在 `onMounted` 的**下一微任务**才建立订阅以避开挂载阶段重置更新标记，且不要求原生 effect scope。本包提供 **ESM + CJS** 双入口。
- feat(vitarx): 首次发布。把 `@slux/core` 及 6 个范式包的状态接入 **Vitarx 4.1**（peer 为 `vitarx ^4.1.2`）。读取绑定统一以**只读浅 Ref**（`Readonly<ShallowRef<T>>`，用 `.value` 读取）暴露，写入始终走原实例，绑定不提供 setter 也不创建副本。与 ActView 版的关键差别在桥接实现：Vitarx 版在 `isSSR()` 为真时直接返回快照 Ref、不订阅；客户端要求存在 `getActiveScope()`，并**立即订阅**后交给 `onScopeDispose` 清理。本包提供 **ESM + CJS** 双入口。
- feat(vue): 首次发布。把 `@slux/core` 的响应式状态接入 Vue 3.5 组合式 API。核心绑定 `useSignal` 返回一个**只读 Ref**（`Readonly<Ref<T>>`，内部为 `shallowRef` + `shallowReadonly`），在模板里可自动解包；主入口另提供 core `Scope` 的 provide / inject 封装与 `createAutoImportApis`。六个范式各通过独立子入口提供同样返回只读 Ref 的绑定。

### Document 📖

- docs(repo): 提供各包 README、框架与范式示例，以及仓库开发和发布说明。

### Other Changes 🔧

- chore(repo): Initial commit ([1a6093e](https://github.com/itmanyong/slux/commit/1a6093e21f9301d65eb69285e015780442c80543))
- chore(release): prepare v0.1.0 initial publication ([d9bbd2d](https://github.com/itmanyong/slux/commit/d9bbd2d948210aef5000cc901b59a4f9bc497ef9))
- chore(docs): format MDX before release ([ce33de2](https://github.com/itmanyong/slux/commit/ce33de24b91aa8600986538d3e1c1ec6e812f42c))

**Full Changelog**: [v0.1.0](https://github.com/itmanyong/slux/commits/v0.1.0)
