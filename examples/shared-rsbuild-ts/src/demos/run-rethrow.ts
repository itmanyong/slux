import { runAll } from "@slux/shared";
import type { LogTone } from "@slux/shell-example";

type Log = (message: string, tone?: LogTone) => void;

/** runAll：只有单个失败时原样重抛，不包 AggregateError。 */
export function createRunRethrow({ log }: { log: Log }) {
  let current: { name: string; message: string } | null = null;

  return {
    readouts: [
      {
        kind: "metric" as const,
        label: "error",
        emphasis: true,
        read: () => current?.name ?? "—",
      },
      {
        kind: "text" as const,
        label: "message",
        read: () => current?.message ?? "（尚未抛出）",
      },
    ],
    actions: [
      {
        id: "fail",
        label: "SINGLE FAIL",
        primary: true,
        run: () => {
          log("runAll([单个抛 TypeError 的任务])", "info");
          try {
            runAll([
              () => {
                throw new TypeError("参数必须是字符串");
              },
            ]);
          } catch (error) {
            current = error instanceof Error ? error : new Error(String(error));
            log(`抛出 ${current.name}（非 AggregateError 原样重抛）`, "error");
          }
        },
      },
      {
        id: "ok",
        label: "SINGLE OK",
        run: () => {
          log("runAll([单个成功任务])", "info");
          runAll([() => log("任务「读配置」执行", "effect")]);
          current = null;
          log("无异常，函数正常返回", "write");
        },
      },
    ],
  };
}
