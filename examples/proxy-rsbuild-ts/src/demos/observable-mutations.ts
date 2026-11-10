import type { ExampleDemo } from "@slux/shell-example";
import { observable, subscribe } from "@slux/proxy";

export const create: NonNullable<ExampleDemo["create"]> = (context) => {
  const state = observable({ count: 0, user: { name: "Alice" } });
  const listeners = new Set<() => void>();
  const stop = subscribe(state, () => {
    context.log("subscribe → 变更已发布（含任意后代）", "notify");
    for (const listener of listeners) listener();
  });

  return {
    readouts: [
      {
        kind: "metric",
        label: "count",
        emphasis: true,
        read: () => String(state.count),
      },
      {
        kind: "text",
        label: "user.name",
        read: () => state.user.name,
      },
    ],
    actions: [
      {
        id: "inc",
        label: "count + 1",
        run: () => {
          state.count++;
          context.log("state.count++ — 直接赋值即触发通知", "write");
        },
      },
      {
        id: "rename",
        label: "重命名 user.name",
        input: { kind: "text", placeholder: "新名字", value: "Bob" },
        run: (input) => {
          const name = input.trim();
          if (!name) {
            context.log("名字不能为空", "error");
            return;
          }
          state.user.name = name;
          context.log(`state.user.name = "${name}" — 深层属性直接改`, "write");
        },
      },
      {
        id: "add-key",
        label: "新增顶层属性",
        input: { kind: "text", placeholder: "属性名", value: "extra" },
        run: (input) => {
          const key = input.trim();
          if (!key) {
            context.log("属性名不能为空", "error");
            return;
          }
          Reflect.set(state, key, true);
          context.log(`state.${key} = true — 新增属性也改变对象结构`, "write");
        },
      },
    ],
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    dispose() {
      stop();
    },
  };
};
