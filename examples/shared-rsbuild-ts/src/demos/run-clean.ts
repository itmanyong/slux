import { runAll } from "@slux/shared";
import type { LogTone } from "@slux/shell-example";

type Log = (message: string, tone?: LogTone) => void;

const TASKS = ["校验配置", "预热缓存", "加载词典"];

/** runAll：全部成功时静默通过，逐个任务留下执行记录。 */
export function createRunClean({ log }: { log: Log }) {
  const results: string[] = [];

  return {
    readouts: [
      {
        kind: "metric" as const,
        label: "done",
        emphasis: true,
        read: () => `${results.length} / ${TASKS.length}`,
      },
      { kind: "list" as const, label: "results", read: () => results },
    ],
    actions: [
      {
        id: "run",
        label: "RUN ALL",
        primary: true,
        run: () => {
          results.length = 0;
          log(`runAll([${TASKS.length} 个同步任务])`, "info");
          runAll(
            TASKS.map((name) => () => {
              log(`任务「${name}」执行`, "effect");
              results.push(`${name} ✓`);
            }),
          );
          log("全部任务执行完毕，无异常", "write");
        },
      },
    ],
  };
}
