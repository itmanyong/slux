import { memoryStorage } from "@slux/storage";
import type { ExampleDemo, LogTone } from "@slux/shell-example";

type DemoInstance = ReturnType<NonNullable<ExampleDemo["create"]>>;

type Log = (message: string, tone?: LogTone) => void;

/** memoryStorage：Map 语义的内存后端，实现 StorageAdapter 契约。 */
export function createMemoryBackendDemo(log: Log): DemoInstance {
  const storage = memoryStorage();
  const key = "session:theme";
  let lastRead: string | null = null;

  return {
    readouts: [
      {
        kind: "text",
        label: `getItem("${key}")`,
        read: () => (lastRead === null ? "null" : `"${lastRead}"`),
      },
      {
        kind: "text",
        label: "后端状态",
        read: () => (typeof storage.getItem(key) === "string" ? "键存在" : "键不存在"),
      },
    ],
    actions: [
      {
        id: "set",
        label: "setItem(key, value)",
        primary: true,
        input: { kind: "text", placeholder: "value", value: "dark" },
        run(input) {
          const value = input.trim();
          if (!value) {
            log("value 为空，未写入", "error");
            return;
          }
          storage.setItem(key, value);
          log(`setItem("${key}", "${value}")`, "write");
        },
      },
      {
        id: "get",
        label: "getItem(key)",
        run() {
          const raw = storage.getItem(key);
          lastRead = typeof raw === "string" ? raw : null;
          log(`getItem("${key}") → ${lastRead === null ? "null" : `"${lastRead}"`}`, "info");
        },
      },
      {
        id: "remove",
        label: "removeItem(key)",
        run() {
          storage.removeItem(key);
          log(`removeItem("${key}") → 键已删除`, "write");
        },
      },
      {
        id: "clear",
        label: "clear()",
        run() {
          storage.clear();
          lastRead = null;
          log("clear() → 内存后端已清空", "notify");
        },
      },
    ],
  };
}
