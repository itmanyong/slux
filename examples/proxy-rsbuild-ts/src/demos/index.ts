import type { ExampleDemo } from "@slux/shell-example";
import reproObservableMutations from "./observable-mutations.repro.ts?raw";
import { create as createObservableMutations } from "./observable-mutations";
import reproObservableArray from "./observable-array.repro.ts?raw";
import { create as createObservableArray } from "./observable-array";
import reproObserveTracking from "./observe-tracking.repro.ts?raw";
import { create as createObserveTracking } from "./observe-tracking";
import reproSnapshotStructure from "./snapshot-structure.repro.ts?raw";
import { create as createSnapshotStructure } from "./snapshot-structure";
import reproRefEmbedding from "./ref-embedding.repro.ts?raw";
import { create as createRefEmbedding } from "./ref-embedding";

const groups = [
  {
    id: "observable",
    name: "observable",
    title: "可观察代理",
    summary: "直接赋值、深层属性与数组操作都会经 Proxy 进入追踪。",
  },
  {
    id: "snapshot",
    name: "snapshot",
    title: "只读快照",
    summary: "snapshot 冻结、缓存、结构共享：未变子树保留引用。",
  },
  {
    id: "observe",
    name: "observe",
    title: "属性级追踪",
    summary: "observe 基于 core effect，只按实际读取的属性重跑。",
  },
  {
    id: "ref",
    name: "ref",
    title: "原引用嵌入",
    summary: "ref 把不想被代理的值按原引用嵌入，内部修改不通知。",
  },
] as const;

export const demos: ExampleDemo[] = [
  {
    id: "observable-mutations",
    group: "observable",
    title: "observable：直接改深层属性",
    apiLabel: "observable(obj)",
    summary: "赋值、重命名与新增属性都改变对象结构并发布通知。",
    repro: reproObservableMutations,
    reproPath: "src/demos/observable-mutations.repro.ts",
    create: createObservableMutations,
  },
  {
    id: "observable-array",
    group: "observable",
    title: "observable：数组操作",
    apiLabel: "observable([...])",
    summary: "push、元素写入与 length 截断都触发更新。",
    repro: reproObservableArray,
    reproPath: "src/demos/observable-array.repro.ts",
    create: createObservableArray,
  },
  {
    id: "observe-tracking",
    group: "observe",
    title: "observe：只追读取的属性",
    apiLabel: "observe(fn)",
    summary: "创建时立即执行一次，未读取的属性变化不重跑。",
    repro: reproObserveTracking,
    reproPath: "src/demos/observe-tracking.repro.ts",
    create: createObserveTracking,
  },
  {
    id: "snapshot-structure",
    group: "snapshot",
    title: "snapshot：冻结与结构共享",
    apiLabel: "snapshot(proxy)",
    summary: "顶层引用随版本新建，未变子树结构共享，版本未变复用缓存。",
    repro: reproSnapshotStructure,
    reproPath: "src/demos/snapshot-structure.repro.ts",
    create: createSnapshotStructure,
  },
  {
    id: "ref-embedding",
    group: "ref",
    title: "ref：原引用嵌入状态",
    apiLabel: "ref(value)",
    summary: "ref.current 内部修改不通知，替换 ref 属性才发布变更。",
    repro: reproRefEmbedding,
    reproPath: "src/demos/ref-embedding.repro.ts",
    create: createRefEmbedding,
  },
];

export { groups };
