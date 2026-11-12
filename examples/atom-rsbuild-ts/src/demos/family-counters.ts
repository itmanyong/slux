import type { ExampleDemo } from "@slux/shell-example";
import { atom, atomFactory } from "@slux/atom";

export const create: NonNullable<ExampleDemo["create"]> = (context) => {
  const counts = atomFactory((_id: string) => atom(0));
  const ids: string[] = [];
  const stops = new Map<string, () => void>();
  const listeners = new Set<() => void>();
  const notify = () => {
    for (const listener of listeners) listener();
  };
  let current = "a";

  const attach = (id: string): void => {
    if (!ids.includes(id)) {
      ids.push(id);
      stops.set(
        id,
        counts(id).subscribe((value) => {
          context.log(`${id} → ${value}`, "notify");
          notify();
        }),
      );
      context.log(`counts("${id}") → 新建 atom 并缓存`, "info");
    } else {
      context.log(`counts("${id}") → 缓存命中，同一实例`, "info");
    }
    current = id;
  };

  attach("a");
  attach("b");

  return {
    readouts: [
      {
        kind: "text",
        label: "当前 id",
        read: () => (current ? current : "—"),
      },
      {
        kind: "metric",
        label: "当前值",
        emphasis: true,
        read: () => (current ? String(counts(current).get()) : "—"),
      },
      {
        kind: "list",
        label: "已缓存 id",
        read: () => [...ids],
      },
    ],
    actions: [
      {
        id: "select",
        label: "创建 / 选中",
        input: { kind: "text", placeholder: "id，例如 c", value: "c" },
        run: (input) => {
          const id = input.trim();
          if (!id) {
            context.log("id 不能为空", "error");
            return;
          }
          attach(id);
        },
      },
      {
        id: "inc",
        label: "当前 + 1",
        run: () => {
          if (!ids.includes(current)) {
            context.log("当前没有选中缓存的 id", "info");
            return;
          }
          counts(current).update((value) => value + 1);
          context.log(`counts("${current}").update(v + 1)`, "write");
        },
      },
      {
        id: "remove",
        label: "remove 当前 id",
        run: () => {
          if (!ids.includes(current)) {
            context.log("当前没有选中缓存的 id", "info");
            return;
          }
          const removed = counts.remove(current);
          stops.get(current)?.();
          stops.delete(current);
          ids.splice(ids.indexOf(current), 1);
          context.log(`counts.remove("${current}") → ${removed}（仅移除缓存，不销毁旧实例）`, "scope");
          current = ids[0] ?? "";
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
      for (const stop of stops.values()) stop();
      stops.clear();
    },
  };
};
