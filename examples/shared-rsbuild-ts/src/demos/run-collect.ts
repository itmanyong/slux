import { runAll } from "@slux/shared";
import type { LogTone } from "@slux/shell-example";

type Log = (message: string, tone?: LogTone) => void;

interface TaskDef {
  name: string;
  fail?: string;
}

const TASKS: TaskDef[] = [
  { name: "校验配置" },
  { name: "清理缓存" },
  { name: "写入磁盘", fail: "磁盘已满" },
  { name: "刷新索引" },
  { name: "上传备份", fail: "网络不可达" },
];

/** runAll：一个任务失败不阻断其余任务，错误最终以 AggregateError 收拢。 */
export function createRunCollect({ log }: { log: Log }) {
  const results: string[] = [];
  const errors: string[] = [];

  return {
    readouts: [
      {
        kind: "metric" as const,
        label: "done",
        emphasis: true,
        read: () => `${results.length} / ${TASKS.length}`,
      },
      {
        kind: "metric" as const,
        label: "failed",
        read: () => String(errors.length),
      },
      { kind: "list" as const, label: "results", read: () => results },
      {
        kind: "text" as const,
        label: "首个错误",
        read: () => errors[0] ?? "—",
      },
    ],
    actions: [
      {
        id: "run",
        label: "RUN ALL",
        primary: true,
        run: () => {
          results.length = 0;
          errors.length = 0;
          log(`runAll([${TASKS.length} 个同步任务，2 个会失败])`, "info");
          try {
            runAll(
              TASKS.map(({ name, fail }) => () => {
                log(`任务「${name}」执行`, "effect");
                if (fail) throw new Error(fail);
                results.push(`${name} ✓`);
              }),
            );
          } catch (error) {
            if (error instanceof AggregateError) {
              for (const item of error.errors) {
                errors.push(item instanceof Error ? item.message : String(item));
              }
              log(`AggregateError：${error.errors.length} 个失败，其余任务照常完成`, "error");
            } else {
              throw error;
            }
          }
        },
      },
    ],
  };
}
