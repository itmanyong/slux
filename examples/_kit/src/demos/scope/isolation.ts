import { createScope, runInScope, signal } from "@slux/core";
import { defineDemo } from "../../types.js";

export const scopeIsolation = defineDemo({
  id: "scope-isolation",
  api: "scope",
  apiLabel: "scope.set · 不触发订阅",
  title: "作用域写入不惊动全局",
  summary: "scope.set 只改覆盖值，不产生信号通知：全局订阅与 effect 都不会因此运行；全局写入才照常广播。",
  create({ log }) {
    const count = signal(0);
    const scope = createScope();
    let notifications = 0;

    const unsubscribe = count.subscribe((value) => {
      notifications += 1;
      log(`全局订阅收到 ${value}`, "notify");
    });

    return {
      readouts: [
        {
          kind: "metric",
          label: "全局通知次数",
          emphasis: true,
          read: () => String(notifications),
        },
        {
          kind: "metric",
          label: "count.get()",
          read: () => String(count.get()),
        },
        {
          kind: "metric",
          label: "scope.get(count)",
          read: () => String(scope.get(count)),
        },
      ],
      actions: [
        {
          id: "scope-write",
          label: "作用域内写入 99",
          primary: true,
          run: () => {
            runInScope(scope, () => scope.set(count, 99));
            log("作用域覆盖值变为 99，全局订阅没有收到任何通知", "scope");
          },
        },
        {
          id: "global-write",
          label: "全局 count + 1",
          run: () => {
            count.set((current) => current + 1);
            log(`全局写入 ${count.get()}，订阅收到通知`, "write");
          },
        },
        {
          id: "check",
          label: "分别读取两个值",
          run: () => {
            log(`scope.get(count) = ${scope.get(count)}，count.get() = ${count.get()}`, "scope");
          },
        },
      ],
      dispose: unsubscribe,
    };
  },
});
