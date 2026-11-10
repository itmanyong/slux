import { batch, effect, signal } from "@slux/core";
import { defineDemo } from "../../types.js";

export const batchNested = defineDemo({
  id: "batch-nested",
  api: "batch",
  apiLabel: "batch · 嵌套 / 返回值",
  title: "嵌套的批处理只有一个结束点",
  summary: "只有最外层 batch 结束时才刷新；内层结束后仍然不通知。batch 同时把回调的返回值原样带出来。",
  create({ log }) {
    const count = signal(0);
    let runs = 0;
    let returned = "—";

    const stop = effect(() => {
      runs += 1;
      log(`effect #${runs}：${count.get()}`, "effect");
    });

    return {
      readouts: [
        { kind: "metric", label: "count", read: () => String(count.get()) },
        {
          kind: "metric",
          label: "effect 次数",
          emphasis: true,
          read: () => String(runs),
        },
        { kind: "text", label: "batch 返回值", read: () => returned },
      ],
      actions: [
        {
          id: "nested",
          label: "执行嵌套批处理",
          primary: true,
          run: () => {
            returned = String(
              batch(() => {
                batch(() => {
                  count.set(1);
                  log("内层写入 1，内层结束时没有刷新", "write");
                });
                count.set(count.get() + 10);
                log(`外层继续写入，此刻读到 ${count.get()}`, "info");
                return count.get() * 2;
              }),
            );
            log(`batch 返回 ${returned}`, "info");
          },
        },
        {
          id: "plain",
          label: "批外 + 1",
          run: () => {
            count.set(count.get() + 1);
            log("批外写入立即刷新", "write");
          },
        },
      ],
      dispose: stop,
    };
  },
});
