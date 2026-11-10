import { signal } from "@slux/core";
import type { SignalOptions } from "@slux/core";
import { defineDemo } from "../../types.js";

type User = { id: number; name: string };

export const signalCustomEquals = defineDemo({
  id: "signal-equals",
  api: "signal",
  apiLabel: "SignalOptions.equals",
  title: "由你定义什么算变化",
  summary: "默认用 Object.is 比较。传入自定义 equals 后，同 id 的新对象被视为相等：不提交、不通知，旧引用被保留。",
  create({ log }) {
    const options: SignalOptions<User> = {
      equals: (previous, next) => previous.id === next.id,
    };
    const user = signal<User>({ id: 1, name: "Ada" }, options);
    let notified = 0;
    let reused = "—";

    user.subscribe((value) => {
      notified += 1;
      log(`通知：${value.name} #${value.id}`, "notify");
    });

    const apply = (next: User, reason: string) => {
      const previous = user.get();
      user.set(next);
      reused = previous === user.get() ? "是 · 丢弃新对象" : "否 · 已替换";
      log(reason, "write");
    };

    return {
      readouts: [
        {
          kind: "metric",
          label: "当前值",
          emphasis: true,
          read: () => `${user.get().name} #${user.get().id}`,
        },
        { kind: "metric", label: "通知次数", read: () => String(notified) },
        { kind: "metric", label: "旧引用是否保留", read: () => reused },
      ],
      actions: [
        {
          id: "same-id",
          label: "同 id 换名字",
          primary: true,
          run: () => apply({ id: user.get().id, name: "Grace" }, "id 相同，新对象被丢弃"),
        },
        {
          id: "next-id",
          label: "id + 1",
          run: () => {
            const id = user.get().id + 1;
            apply({ id, name: id % 2 === 0 ? "Lin" : "Ada" }, "id 变化，新对象被提交");
          },
        },
        {
          id: "reset-id",
          label: "id 回到 1",
          run: () => apply({ id: 1, name: "Ada" }, "id 回到 1，重新提交"),
        },
      ],
    };
  },
});
