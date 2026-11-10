import type { ExampleDemo, ExampleGroup } from "@slux/shell-example";
import reproToBasic from "./to-basic.ts?raw";
import { createToBasic } from "./to-basic";
import reproToComputed from "./to-computed.ts?raw";
import { createToComputed } from "./to-computed";
import reproFromInterval from "./from-interval.ts?raw";
import { createFromInterval } from "./from-interval";
import reproFromSubject from "./from-subject.ts?raw";
import { createFromSubject } from "./from-subject";
import reproRoundTrip from "./round-trip.ts?raw";
import { createRoundTrip } from "./round-trip";

const groups = [
  {
    id: "to-observable",
    name: "toObservable",
    title: "Signal → Observable",
    summary: "信号源变成 Observable：值变化即发射，还能接 rxjs 管道。",
  },
  {
    id: "from-observable",
    name: "fromObservable",
    title: "Observable → 信号",
    summary: "RxJS 流读进 ObservableState：值、status、error 全部信号化。",
  },
  {
    id: "bridge",
    name: "bridge",
    title: "双向桥接",
    summary: "toObservable 与 fromObservable 首尾相接，验证互通。",
  },
] as const satisfies readonly ExampleGroup[];

export const demos: ExampleDemo[] = [
  {
    id: "to-basic",
    group: "to-observable",
    title: "toObservable：信号变流",
    apiLabel: "toObservable(signal)",
    summary: "source.set 之后 Observable 立即收到 next 发射。",
    repro: reproToBasic,
    reproPath: "src/demos/to-basic.ts",
    create: createToBasic,
  },
  {
    id: "to-computed",
    group: "to-observable",
    title: "toObservable：派生值接管道",
    apiLabel: "toObservable(computed)",
    summary: "computed → toObservable → map/filter，rxjs 算子照常工作。",
    repro: reproToComputed,
    reproPath: "src/demos/to-computed.ts",
    create: createToComputed,
  },
  {
    id: "from-interval",
    group: "from-observable",
    title: "fromObservable：interval 落地",
    apiLabel: "fromObservable(obs, init)",
    summary: "interval 每秒发射一次，读数被动刷新；dispose 随时叫停。",
    repro: reproFromInterval,
    reproPath: "src/demos/from-interval.ts",
    create: createFromInterval,
  },
  {
    id: "from-subject",
    group: "from-observable",
    title: "fromObservable：Subject 三通道",
    apiLabel: "fromObservable(subject, init)",
    summary: "next / error / complete 分别落地为 value、status、error。",
    repro: reproFromSubject,
    reproPath: "src/demos/from-subject.ts",
    create: createFromSubject,
  },
  {
    id: "round-trip",
    group: "bridge",
    title: "往返桥接：signal ⇄ Observable",
    apiLabel: "fromObservable(toObservable(s))",
    summary: "写入 source，镜像信号同步跟随，首尾互通零损耗。",
    repro: reproRoundTrip,
    reproPath: "src/demos/round-trip.ts",
    create: createRoundTrip,
  },
];

export { groups };
