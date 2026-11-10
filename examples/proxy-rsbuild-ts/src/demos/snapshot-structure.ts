import type { ExampleDemo } from "@slux/shell-example";
import { observable, snapshot, type Snapshot } from "@slux/proxy";

type State = { count: number; user: { name: string } };

export const create: NonNullable<ExampleDemo["create"]> = (context) => {
  const state = observable<State>({ count: 0, user: { name: "Alice" } });
  let current: Snapshot<State> = snapshot(state);
  let topLevel = "初始快照";
  let userTree = "初始快照";
  const listeners = new Set<() => void>();
  const notify = () => {
    for (const listener of listeners) listener();
  };

  const refresh = (reason: string): void => {
    const next = snapshot(state);
    topLevel = next === current ? "复用缓存" : "新建引用";
    userTree = next.user === current.user ? "结构共享" : "新建引用";
    context.log(`snapshot(state) · ${reason} · 顶层${topLevel} · user 子树${userTree}`, "compute");
    current = next;
    notify();
  };

  return {
    readouts: [
      {
        kind: "text",
        label: "当前快照 JSON",
        read: () => JSON.stringify(current),
      },
      {
        kind: "text",
        label: "顶层引用",
        read: () => topLevel,
      },
      {
        kind: "text",
        label: "user 子树",
        read: () => userTree,
      },
    ],
    actions: [
      {
        id: "inc-count",
        label: "count + 1",
        primary: true,
        run: () => {
          state.count++;
          context.log("state.count++ — 祖先版本失效", "write");
          refresh("count 变化");
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
          context.log(`state.user.name = "${name}"`, "write");
          refresh("user.name 变化");
        },
      },
      {
        id: "read-only",
        label: "无写入再读一次",
        run: () => {
          refresh("版本未变");
        },
      },
    ],
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
};
