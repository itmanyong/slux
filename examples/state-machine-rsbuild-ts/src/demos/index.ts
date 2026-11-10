import type { ExampleDemo, ExampleGroup } from "@slux/shell-example";
import reproTrafficLight from "./traffic-light.ts?raw";
import { createTrafficLight } from "./traffic-light";
import reproFetchFlow from "./fetch-flow.ts?raw";
import { createFetchFlow } from "./fetch-flow";
import reproPulseCounter from "./pulse-counter.ts?raw";
import { createPulseCounter } from "./pulse-counter";
import reproGuardedCounter from "./guarded-counter.ts?raw";
import { createGuardedCounter } from "./guarded-counter";
import reproPinLock from "./pin-lock.ts?raw";
import { createPinLock } from "./pin-lock";
import reproCart from "./cart.ts?raw";
import { createCart } from "./cart";

const groups = [
  {
    id: "flow",
    name: "flow",
    title: "事件流转",
    summary: "createMachine + send：字符串速记、异步流程与原地转换。",
  },
  {
    id: "guard",
    name: "guard",
    title: "守卫拦截",
    summary: "guard 拒绝越界事件，can() 随时查询可行性。",
  },
  {
    id: "context",
    name: "context",
    title: "上下文与动作",
    summary: "action 以不可变方式更新 context，承载业务数据。",
  },
] as const satisfies readonly ExampleGroup[];

export const demos: ExampleDemo[] = [
  {
    id: "traffic-light",
    group: "flow",
    title: "交通灯：字符串速记转换",
    apiLabel: "createMachine(config)",
    summary: "转换只写目标态名，NEXT 事件在红绿黄间循环推进。",
    repro: reproTrafficLight,
    reproPath: "src/demos/traffic-light.ts",
    create: createTrafficLight,
  },
  {
    id: "fetch-flow",
    group: "flow",
    title: "请求机：异步流程建模",
    apiLabel: "createMachine + send",
    summary: "idle → loading → success / error；非法事件被悄悄吞掉。",
    repro: reproFetchFlow,
    reproPath: "src/demos/fetch-flow.ts",
    create: createFetchFlow,
  },
  {
    id: "pulse-counter",
    group: "flow",
    title: "脉冲计数：原地转换",
    apiLabel: "transition 无 target",
    summary: "PULSE 缺省 target：只执行 action 更新 context，状态不动。",
    repro: reproPulseCounter,
    reproPath: "src/demos/pulse-counter.ts",
    create: createPulseCounter,
  },
  {
    id: "guarded-counter",
    group: "guard",
    title: "步进器：guard 拦截越界",
    apiLabel: "guard + can(event)",
    summary: "count 限定 0..3，INC/DEC 越界被拒绝，can() 实时反映。",
    repro: reproGuardedCounter,
    reproPath: "src/demos/guarded-counter.ts",
    create: createGuardedCounter,
  },
  {
    id: "pin-lock",
    group: "guard",
    title: "密码锁：候选转换链",
    apiLabel: "guard 候选数组",
    summary: "同一事件挂多条 guard，按序取第一条通过的；连错 3 次锁定。",
    repro: reproPinLock,
    reproPath: "src/demos/pin-lock.ts",
    create: createPinLock,
  },
  {
    id: "cart",
    group: "context",
    title: "购物车：action 更新 context",
    apiLabel: "actions(context, event)",
    summary: "ADD/REMOVE/CLEAR 返回新 context，items 整体不可变替换。",
    repro: reproCart,
    reproPath: "src/demos/cart.ts",
    create: createCart,
  },
];

export { groups };
