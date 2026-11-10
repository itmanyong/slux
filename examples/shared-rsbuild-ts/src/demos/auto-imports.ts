import { createAutoImports, generateBatchAutoImports } from "@slux/shared";
import type { LogTone } from "@slux/shell-example";

type Log = (message: string, tone?: LogTone) => void;

/** createAutoImports / generateBatchAutoImports：把公开 API 声明成自动导入表。 */
export function createAutoImportsDemo({ log }: { log: Log }) {
  let snapshot = "（尚未生成）";

  return {
    readouts: [
      {
        kind: "text" as const,
        label: "ImportsMap",
        read: () => snapshot,
      },
    ],
    actions: [
      {
        id: "single",
        label: "createAutoImports",
        primary: true,
        input: {
          kind: "text" as const,
          placeholder: "prefix（默认 use）",
          value: "use",
        },
        run: (input: string) => {
          const prefix = input.trim() || "use";
          const config = createAutoImports({
            prefix,
            imports: ["signal", "computed"],
            fromName: "@slux/core",
          });
          snapshot = JSON.stringify(config);
          log(`createAutoImports({ prefix: ${JSON.stringify(prefix)} }) → ${snapshot}`, "compute");
        },
      },
      {
        id: "batch",
        label: "generateBatchAutoImports",
        run: () => {
          const config = generateBatchAutoImports([
            {
              prefix: "map",
              imports: ["signal", "computed"],
              fromName: "@slux/core",
            },
            { imports: ["runAll"], fromName: "@slux/shared" },
          ]);
          snapshot = JSON.stringify(config);
          log(`generateBatchAutoImports(2 份配置) → ${snapshot}`, "compute");
        },
      },
    ],
  };
}
