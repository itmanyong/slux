import { signal } from "@slux/core";
import { defineDemo } from "../../types.js";

export const signalSpecialValues = defineDemo({
  id: "signal-special-values",
  api: "signal",
  apiLabel: "set(() => fn) · Object.is",
  title: "函数值、undefined 与有符号零",
  summary: "函数参数一律当作更新回调，保存函数本身要再包一层；默认比较区分 +0 与 −0，但认为 NaN 等于 NaN。",
  create({ log }) {
    const callback = signal<() => string>(() => "hello");
    const optional = signal<string | undefined>("ready");
    const number = signal(NaN);
    let notified = 0;

    number.subscribe(() => {
      notified += 1;
    });

    return {
      readouts: [
        {
          kind: "metric",
          label: "callback() 调用结果",
          read: () => callback.get()(),
        },
        {
          kind: "metric",
          label: "optional",
          read: () => String(optional.get()),
        },
        {
          kind: "metric",
          label: "number",
          read: () => (Object.is(number.get(), -0) ? "−0" : String(number.get())),
        },
        {
          kind: "metric",
          label: "number 通知次数",
          read: () => String(notified),
        },
      ],
      actions: [
        {
          id: "function",
          label: "切换函数值",
          primary: true,
          run: () => {
            const next = callback.get()() === "hello" ? "world" : "hello";
            callback.set(() => () => next);
            log(`函数被保存为值，调用结果为 ${callback.get()()}`, "write");
          },
        },
        {
          id: "undefined",
          label: "切换 undefined",
          run: () => {
            const next = optional.get() === undefined ? "ready" : undefined;
            optional.set(next);
            log(`optional → ${String(next)}`, "write");
          },
        },
        {
          id: "nan",
          label: "写入 NaN",
          run: () => {
            number.set(NaN);
            log("NaN → NaN 视为相等，不产生通知", "info");
          },
        },
        {
          id: "zero",
          label: "切换 ±0",
          run: () => {
            number.set(Object.is(number.get(), 0) ? -0 : 0);
            log("0 与 −0 在 Object.is 下不相等，每次切换都会通知", "write");
          },
        },
      ],
    };
  },
});
