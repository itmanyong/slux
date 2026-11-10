# 依赖补丁

## limu 4.2.1：保留 Map 的假值键

`limu@4.2.1.patch` 修复 `getMayProxiedVal` 中的 `inputKey || ''`：Map 使用真实键，其他容器维持原有行为。原实现将 `0`、`false`、`null`、`undefined`、`NaN` 错当成空字符串键，导致提交时写错位置、覆盖空字符串键的值，或留下已撤销代理。补丁同时保留键的类型。

补丁通过 `pnpm-workspace.yaml` 的 `patchedDependencies` 固定到 limu 4.2.1，本仓库安装时自动应用。补丁不会随 `@slux/core` 传播；使用方若需保证 `Map` 假值键行为，应在自身项目应用本补丁。pnpm 项目可复制补丁文件，并在 `pnpm-workspace.yaml` 中配置相同的 `patchedDependencies` 条目。

### 重建补丁

使用 `pnpm patch limu@4.2.1 --edit-dir .rstack/limu-map-key-patch` 提取依赖，在 `src/core/helper.ts` 修改键处理。`lib/core/helper.js`、`dist/limu.mjs` 和 `dist/limu.js` 从源码重新生成，不直接编辑生成文件。

临时编译配置采用上游的 ES2015 目标与 ES2020 模块输出，设置 `types: []`、`lib: ["es2020", "dom"]`，隔离仓库中较新的 Node 类型。用 TypeScript 4.9.5 编译到 `lib`，再执行：

```sh
pnpm dlx --package rollup@2.79.2 rollup .rstack/limu-map-key-patch/lib/index.js --file .rstack/limu-map-key-patch/dist/limu.mjs --format es
pnpm dlx --package rollup@2.79.2 rollup .rstack/limu-map-key-patch/lib/index.js --file .rstack/limu-map-key-patch/dist/limu.js --format umd --name limu --indent "  "
pnpm patch-commit .rstack/limu-map-key-patch
```

提交补丁前移出临时编译配置，排除编译器版本引起的无关声明文件差异，只保留上述源码和三个生成文件的键处理变更。补丁文件由 pnpm 生成，不手动修改。

回归用例位于 `packages/core/__tests__/reactivity/signal.test.ts`，覆盖假值键与空字符串键共存、连续更新、通知、旧快照、不变项的结构共享及只读草稿。升级 limu 时先检查上游是否修复，再验证这些用例后决定是否移除补丁。
