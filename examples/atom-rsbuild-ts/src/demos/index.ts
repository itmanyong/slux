import type { ExampleDemo } from "@slux/shell-example";
import reproAtomSetUpdate from "./atom-set-update.repro.ts?raw";
import { create as createAtomSetUpdate } from "./atom-set-update";
import reproAtomFnValue from "./atom-fn-value.repro.ts?raw";
import { create as createAtomFnValue } from "./atom-fn-value";
import reproDerivedChain from "./derived-chain.repro.ts?raw";
import { create as createDerivedChain } from "./derived-chain";
import reproDerivedBranch from "./derived-branch.repro.ts?raw";
import { create as createDerivedBranch } from "./derived-branch";
import reproWritableTemperature from "./writable-temperature.repro.ts?raw";
import { create as createWritableTemperature } from "./writable-temperature";
import reproWritableAction from "./writable-action.repro.ts?raw";
import { create as createWritableAction } from "./writable-action";
import reproFamilyCounters from "./family-counters.repro.ts?raw";
import { create as createFamilyCounters } from "./family-counters";
import reproScopeIsolation from "./scope-isolation.repro.ts?raw";
import { create as createScopeIsolation } from "./scope-isolation";

const groups = [
  {
    id: "atom",
    name: "atom",
    title: "基础原子",
    summary: "atom(initialValue) 是最小的可写单元：set 整体替换，update 读改写。",
  },
  {
    id: "derived",
    name: "derived",
    title: "派生原子",
    summary: "derived(read) 惰性求值、动态收集依赖，依赖未变不重算。",
  },
  {
    id: "writable",
    name: "writable",
    title: "自定义写入",
    summary: "writableAtom 把读取与写入逻辑组合成一个原子，write 自动包进 batch。",
  },
  {
    id: "family",
    name: "family",
    title: "参数化工厂",
    summary: "atomFactory 按参数缓存同类 atom，remove 只删缓存、下次访问重建。",
  },
  {
    id: "scope",
    name: "scope",
    title: "独立作用域",
    summary: "createAtomScope 让同一 atom 在默认与请求作用域中取值互不影响。",
  },
] as const;

export const demos: ExampleDemo[] = [
  {
    id: "atom-set-update",
    group: "atom",
    title: "atom：整体替换与读改写",
    apiLabel: "atom(0)",
    summary: "set 直接替换新值，update 基于当前值计算后再替换。",
    repro: reproAtomSetUpdate,
    reproPath: "src/demos/atom-set-update.repro.ts",
    create: createAtomSetUpdate,
  },
  {
    id: "atom-fn-value",
    group: "atom",
    title: "atom：函数值原样保存",
    apiLabel: "atom<fn | undefined>",
    summary: "set 保存函数本身而不执行它，写入永远是整体替换。",
    repro: reproAtomFnValue,
    reproPath: "src/demos/atom-fn-value.repro.ts",
    create: createAtomFnValue,
  },
  {
    id: "derived-chain",
    group: "derived",
    title: "derived：链式派生",
    apiLabel: "derived((get) => …)",
    summary: "total 依赖 a 与 b，任一变化即重算并通知订阅者。",
    repro: reproDerivedChain,
    reproPath: "src/demos/derived-chain.repro.ts",
    create: createDerivedChain,
  },
  {
    id: "derived-branch",
    group: "derived",
    title: "derived：动态依赖分支",
    apiLabel: "derived(read)",
    summary: "分支切换后旧依赖被释放，只有实际读取的源触发重算。",
    repro: reproDerivedBranch,
    reproPath: "src/demos/derived-branch.repro.ts",
    create: createDerivedBranch,
  },
  {
    id: "writable-temperature",
    group: "writable",
    title: "writableAtom：读写换算",
    apiLabel: "writableAtom(read, write)",
    summary: "write 写摄氏、read 读华氏，写入过程自动包进 batch。",
    repro: reproWritableTemperature,
    reproPath: "src/demos/writable-temperature.repro.ts",
    create: createWritableTemperature,
  },
  {
    id: "writable-action",
    group: "writable",
    title: "writableAtom：只写 action",
    apiLabel: "writableAtom(null, write)",
    summary: "read 为 null 的只写原子，把 append / clear 收敛成动作。",
    repro: reproWritableAction,
    reproPath: "src/demos/writable-action.repro.ts",
    create: createWritableAction,
  },
  {
    id: "family-counters",
    group: "family",
    title: "atomFactory：按 id 缓存",
    apiLabel: "atomFactory(factory)",
    summary: "同参数复用同一 atom，remove 仅移除缓存、下次访问重建。",
    repro: reproFamilyCounters,
    reproPath: "src/demos/family-counters.repro.ts",
    create: createFamilyCounters,
  },
  {
    id: "scope-isolation",
    group: "scope",
    title: "createAtomScope：请求级隔离",
    apiLabel: "createAtomScope()",
    summary: "同一 atom 在默认与请求作用域中各自独立取值，派生互不干扰。",
    repro: reproScopeIsolation,
    reproPath: "src/demos/scope-isolation.repro.ts",
    create: createScopeIsolation,
  },
];

export { groups };
