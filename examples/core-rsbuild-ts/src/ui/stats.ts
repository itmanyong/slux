import type { LogTone } from "@slux/kit-example";

/** 会话级统计：只统计本次页面打开后产生的运行记录。 */
export class SessionStats {
  #total = 0;
  #byTone = new Map<LogTone, number>();

  record(tone: LogTone): void {
    this.#total += 1;
    this.#byTone.set(tone, (this.#byTone.get(tone) ?? 0) + 1);
  }

  get total(): number {
    return this.#total;
  }

  count(tone: LogTone): number {
    return this.#byTone.get(tone) ?? 0;
  }
}
