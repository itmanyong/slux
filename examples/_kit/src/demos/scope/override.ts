import { createScope, runInScope, serializeScope, signal } from "@slux/core";
import { defineDemo } from "../../types.js";

export const scopeOverride = defineDemo({
  id: "scope-override",
  api: "scope",
  apiLabel: "createScope / runInScope",
  title: "同一份信号，两个读法",
  summary: "作用域只保存自己的覆盖值：scope.get 命中覆盖，signal.get 仍然返回全局值。runInScope 只切换同步上下文。",
  create({ log }) {
    const count = signal(0);
    let scope = createScope();

    return {
      readouts: [
        {
          kind: "metric",
          label: "count.get()（全局）",
          read: () => String(count.get()),
        },
        {
          kind: "metric",
          label: "scope.get(count)",
          emphasis: true,
          read: () => String(scope.get(count)),
        },
        {
          kind: "metric",
          label: "覆盖条目",
          read: () => String(Object.keys(serializeScope(scope)).length),
        },
      ],
      actions: [
        {
          id: "override",
          label: "作用域内覆盖为 10",
          primary: true,
          run: () => {
            runInScope(scope, () => {
              scope.set(count, 10);
              log(`作用域内 scope.get(count) = ${scope.get(count)}`, "scope");
              log(`同一时刻 count.get() = ${count.get()}，全局未被改写`, "scope");
            });
          },
        },
        {
          id: "global",
          label: "全局 count + 1",
          run: () => {
            count.set((current) => current + 1);
            log(`全局写入 ${count.get()}；作用域覆盖值仍是 ${scope.get(count)}`, "write");
          },
        },
        {
          id: "reset-scope",
          label: "换一个新作用域",
          run: () => {
            scope = createScope();
            log("新作用域没有任何覆盖值，读取回落到全局值", "scope");
          },
        },
      ],
    };
  },
});
