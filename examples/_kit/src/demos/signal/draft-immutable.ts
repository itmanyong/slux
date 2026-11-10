import { signal } from "@slux/core";
import { defineDemo } from "../../types.js";

export const signalDraft = defineDemo({
  id: "signal-draft",
  api: "signal",
  apiLabel: "signal.set(recipe)",
  title: "像修改一样书写，得到新快照",
  summary: "草稿里可以直接改对象、数组、Map、Set，提交后旧快照保持不变；未修改的分支沿用原引用。",
  create({ log }) {
    const user = signal({
      profile: { name: "Ada" },
      tags: ["reader"],
      preferences: { theme: "light" },
    });
    const before = user.get();
    let commits = 0;

    user.subscribe((value) => {
      commits += 1;
      log(`提交 #${commits}：${value.profile.name}`, "notify");
    });

    const snapshot = (value: typeof before) => `${value.profile.name} / [${value.tags.join(", ")}] / ${value.preferences.theme}`;

    return {
      readouts: [
        {
          kind: "text",
          label: "初始快照（保持不变）",
          read: () => snapshot(before),
        },
        { kind: "text", label: "当前快照", read: () => snapshot(user.get()) },
        {
          kind: "metric",
          label: "preferences 分支复用",
          read: () => (before.preferences === user.get().preferences ? "是" : "否"),
        },
        { kind: "metric", label: "提交次数", read: () => String(commits) },
      ],
      actions: [
        {
          id: "edit",
          label: "修改姓名与数组",
          primary: true,
          run: () => {
            user.set((draft) => {
              draft.profile.name = draft.profile.name === "Ada" ? "Lin" : "Ada";
              draft.tags.push(`tag-${draft.tags.length}`);
            });
            log("对象与数组已提交，初始快照未被改动", "write");
          },
        },
        {
          id: "theme",
          label: "修改 preferences",
          run: () => {
            user.set((draft) => {
              draft.preferences.theme = draft.preferences.theme === "light" ? "dark" : "light";
            });
            log("只改动 preferences 分支，其余分支保持原引用", "write");
          },
        },
        {
          id: "noop",
          label: "执行空草稿",
          run: () => {
            user.set(() => {});
            log("空草稿没有产生差异，因此不提交也不通知", "info");
          },
        },
        {
          id: "replace",
          label: "返回替换值",
          run: () => {
            user.set(() => ({
              profile: { name: "Grace" },
              tags: ["builder"],
              preferences: { theme: "dark" },
            }));
            log("回调返回新对象，整体替换信号值", "write");
          },
        },
      ],
    };
  },
});
