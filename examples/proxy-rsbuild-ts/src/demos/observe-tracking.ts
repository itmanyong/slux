import type { ExampleDemo } from "@slux/shell-example";
import { observable, observe } from "@slux/proxy";

export const create: NonNullable<ExampleDemo["create"]> = (context) => {
  const state = observable({ a: 0, b: 0 });
  let runs = 0;
  let lastSeenA = 0;

  // 不在 observe 回调内触发卡片渲染：渲染会同步读取其他属性，
  // 会把它们误收进本 effect 的依赖。读数由卡片在操作后自行刷新。
  const dispose = observe(() => {
    runs += 1;
    lastSeenA = state.a;
    context.log(`observe 重跑 #${runs} · 读取 state.a = ${state.a}`, "effect");
  });

  return {
    readouts: [
      { kind: "metric", label: "state.a", read: () => String(state.a) },
      { kind: "metric", label: "state.b", read: () => String(state.b) },
      {
        kind: "metric",
        label: "observe 重跑次数",
        emphasis: true,
        read: () => String(runs),
      },
      {
        kind: "text",
        label: "最近一次捕获的 a",
        read: () => String(lastSeenA),
      },
    ],
    actions: [
      {
        id: "inc-a",
        label: "a + 1（触发重跑）",
        run: () => {
          state.a++;
          context.log("state.a++ — observe 读取过该属性，同步重跑", "write");
        },
      },
      {
        id: "inc-b",
        label: "b + 1（不触发）",
        run: () => {
          state.b++;
          context.log("state.b++ — observe 没读取 b，不重跑", "write");
        },
      },
    ],
    dispose() {
      dispose();
    },
  };
};
