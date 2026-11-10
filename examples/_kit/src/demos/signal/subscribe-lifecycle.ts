import { signal } from "@slux/core";
import { defineDemo } from "../../types.js";

export const signalSubscribe = defineDemo({
  id: "signal-subscribe",
  api: "signal",
  apiLabel: "signal.subscribe",
  title: "订阅只在变化时回调",
  summary: "subscribe 不立即执行回调，只在写入产生变化后收到新值；返回的取消函数可以重复调用。退订后写入不再回调。",
  create({ log }) {
    const count = signal(0);
    let stop: (() => void) | undefined;
    let received = 0;

    const subscribe = () => {
      if (stop) {
        log("已经处于订阅状态", "info");
        return;
      }
      stop = count.subscribe((value) => {
        received += 1;
        log(`回调 #${received} 收到 ${value}`, "notify");
      });
      log("订阅已建立，此刻还没有回调", "info");
    };

    const unsubscribe = () => {
      if (!stop) {
        log("当前没有订阅", "info");
        return;
      }
      stop();
      stop = undefined;
      log("已退订；重复调用取消函数是安全的", "info");
    };

    return {
      readouts: [
        {
          kind: "metric",
          label: "订阅状态",
          emphasis: true,
          read: () => (stop ? "已订阅" : "未订阅"),
        },
        { kind: "metric", label: "count", read: () => String(count.get()) },
        { kind: "metric", label: "收到回调次数", read: () => String(received) },
      ],
      actions: [
        {
          id: "subscribe",
          label: "订阅",
          primary: true,
          run: subscribe,
        },
        { id: "unsubscribe", label: "退订", run: unsubscribe },
        {
          id: "write",
          label: "count + 1",
          run: () => {
            log(`set(${count.get() + 1})`, "write");
            count.set((current) => current + 1);
          },
        },
        {
          id: "write-same",
          label: "写入相同值",
          run: () => {
            count.set(count.get());
            log("值没有变化，订阅不会被调用", "info");
          },
        },
      ],
      dispose: () => stop?.(),
    };
  },
});
