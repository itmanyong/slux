import { createScope, serializeScope, signal } from "@slux/core";
import { defineDemo } from "../../types.js";

export const scopeSerialize = defineDemo({
  id: "scope-serialize",
  api: "scope",
  apiLabel: "serializeScope / scope.serialize",
  title: "只导出自己的覆盖值",
  summary: "序列化输出普通对象，只包含本作用域显式赋值过的条目；同一个信号在多次序列化中键名保持稳定。",
  create({ log }) {
    const count = signal(0);
    const label = signal("main");
    const parent = createScope();
    parent.set(count, 10);
    const child = parent.fork();
    child.set(label, "child");

    const dump = (value: Record<string, unknown>) => JSON.stringify(value);

    return {
      readouts: [
        {
          kind: "text",
          label: "父作用域快照",
          read: () => dump(serializeScope(parent)),
        },
        {
          kind: "text",
          label: "子作用域快照",
          read: () => dump(serializeScope(child)),
        },
        {
          kind: "metric",
          label: "子作用域条目数",
          read: () => String(Object.keys(child.serialize()).length),
        },
      ],
      actions: [
        {
          id: "mutate-child",
          label: "修改子作用域 label",
          primary: true,
          run: () => {
            child.set(label, child.get(label) === "child" ? "editor" : "child");
            log(`子作用域快照：${dump(serializeScope(child))}`, "scope");
          },
        },
        {
          id: "mutate-parent",
          label: "父作用域覆盖 count",
          run: () => {
            parent.set(count, parent.get(count) + 1);
            log(`父作用域快照：${dump(serializeScope(parent))}`, "scope");
          },
        },
        {
          id: "stable",
          label: "连续序列化两次",
          run: () => {
            const first = Object.keys(serializeScope(child));
            const second = Object.keys(serializeScope(child));
            log(`键名稳定：${first.join(",")} / ${second.join(",")}`, "scope");
          },
        },
      ],
      note: "键名由 core 内部按信号分配，只保证同一进程内稳定，不保证跨进程一致。",
    };
  },
});
