// 像修改一样书写，得到新快照：signal.set(recipe)
import { signal } from "@slux/core";

const user = signal({
  profile: { name: "Ada" },
  tags: ["reader"],
  preferences: { theme: "light" },
});

const initial = user.get(); // 旧快照

user.subscribe((value) => {
  console.log("提交：", value.profile.name);
});

// 草稿里可以直接改对象与数组，提交后得到新快照
user.set((draft) => {
  draft.profile.name = "Lin";
  draft.tags.push("tag-1");
}); // → 提交： Lin

console.log(user.get().profile.name); // Lin
console.log(initial.profile.name); // Ada（旧快照保持不变）

// 未修改的分支沿用原引用
console.log(initial.preferences === user.get().preferences); // true

// 空草稿没有产生差异：不提交也不通知
user.set(() => {});

// 回调返回新对象时整体替换
user.set(() => ({
  profile: { name: "Grace" },
  tags: ["builder"],
  preferences: { theme: "dark" },
})); // → 提交： Grace
