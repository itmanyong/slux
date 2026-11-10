import { signal } from "@slux/core";
import { defineDemo } from "../../types.js";

export const signalCollections = defineDemo({
  id: "signal-collections",
  api: "signal",
  apiLabel: "signal.set(recipe) · Map / Set",
  title: "Map 与 Set 同样走草稿",
  summary: "集合内部的数据也通过草稿提交。0 与空字符串是两个独立的键；Set 会自动去重，但重复添加仍会被视为一次草稿写入。",
  create({ log }) {
    const state = signal({
      counts: new Map<string | number, { value: number }>([
        [0, { value: 1 }],
        ["", { value: 100 }],
      ]),
      tags: new Set(["core"]),
    });
    const initial = state.get();

    return {
      readouts: [
        {
          kind: "metric",
          label: "counts.get(0)",
          emphasis: true,
          read: () => String(state.get().counts.get(0)?.value),
        },
        {
          kind: "metric",
          label: 'counts.get("")',
          read: () => String(state.get().counts.get("")?.value),
        },
        { kind: "list", label: "tags", read: () => [...state.get().tags] },
        {
          kind: "metric",
          label: "初始快照的 0 键",
          read: () => String(initial.counts.get(0)?.value),
        },
      ],
      actions: [
        {
          id: "zero",
          label: "0 键 + 1",
          primary: true,
          run: () => {
            state.set((draft) => {
              const entry = draft.counts.get(0);
              if (entry) entry.value += 1;
            });
            log(`0 键已更新；旧快照仍是 ${initial.counts.get(0)?.value}`, "write");
          },
        },
        {
          id: "empty",
          label: '"" 键 + 1',
          run: () => {
            state.set((draft) => {
              const entry = draft.counts.get("");
              if (entry) entry.value += 1;
            });
            log("空字符串键独立递增，与 0 键互不影响", "write");
          },
        },
        {
          id: "toggle",
          label: "切换 design 标签",
          run: () => {
            state.set((draft) => {
              if (draft.tags.has("design")) draft.tags.delete("design");
              else draft.tags.add("design");
            });
            log(`tags：${[...state.get().tags].join(" · ")}`, "write");
          },
        },
        {
          id: "duplicate",
          label: "重复添加 core",
          run: () => {
            const previous = state.get();
            const before = [...previous.tags].join(",");
            state.set((draft) => {
              draft.tags.add("core");
            });
            const after = [...state.get().tags].join(",");
            log(`内容不变：${before === after}；快照引用相同：${previous === state.get()}`, "write");
          },
        },
      ],
    };
  },
});
