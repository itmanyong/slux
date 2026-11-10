// Map 与 Set 同样走草稿：signal.set(recipe) · Map / Set
import { signal } from "@slux/core";

const state = signal({
  counts: new Map<string | number, { value: number }>([
    [0, { value: 1 }],
    ["", { value: 100 }],
  ]),
  tags: new Set(["core"]),
});

const initial = state.get();

// Map 内部的数据也在草稿里修改
state.set((draft) => {
  const entry = draft.counts.get(0);
  if (entry) entry.value += 1;
});
console.log(state.get().counts.get(0)?.value); // 2
console.log(initial.counts.get(0)?.value); // 1（旧快照不受影响）

// 0 与空字符串是两个独立的键
state.set((draft) => {
  const entry = draft.counts.get("");
  if (entry) entry.value += 1;
});
console.log(state.get().counts.get("")?.value); // 101

// Set 自动去重，但重复添加仍会被视为一次草稿写入
state.set((draft) => {
  draft.tags.add("core");
});
console.log([...state.get().tags].join(",")); // core

state.set((draft) => {
  if (draft.tags.has("design")) draft.tags.delete("design");
  else draft.tags.add("design");
});
console.log([...state.get().tags].join(",")); // core,design
