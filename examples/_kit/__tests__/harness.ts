import { afterEach } from "rstack/test";
import { demos } from "../src/demos/index.js";
import type { LogTone } from "../src/types.js";

const cleanups: (() => void)[] = [];
afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
});

export interface LogEntry {
  text: string;
  tone: LogTone;
}

/**
 * 以无 UI 的方式装配一个示例：操作直接调用 run，读数直接读 read，
 * 这样同一份示例逻辑可以在 node 环境里验证行为。
 */
export function mount(id: string) {
  const definition = demos.find((demo) => demo.id === id);
  if (!definition) throw new Error(`未知示例：${id}`);

  const logs: LogEntry[] = [];
  const instance = definition.create({
    log: (text, tone = "info") => logs.push({ text, tone }),
  });
  const dispose = instance.dispose;
  if (dispose) cleanups.push(dispose);

  const action = (actionId: string, input = "") => {
    const target = instance.actions.find((item) => item.id === actionId);
    if (!target) throw new Error(`${id} 没有操作 ${actionId}`);
    target.run(input);
  };

  const read = (label: string) => {
    const target = instance.readouts.find((item) => item.label === label);
    if (!target) throw new Error(`${id} 没有读数 ${label}`);
    return target.read();
  };

  return {
    definition,
    logs,
    action,
    read,
    toneCount: (tone: LogTone) => logs.filter((entry) => entry.tone === tone).length,
    messages: () => logs.map((entry) => entry.text),
  };
}
