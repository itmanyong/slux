import { describe, expect, it } from "rstack/test";
import { runAll } from "../src/index.js";

describe("shared 公开入口", () => {
  it("按顺序执行全部任务", () => {
    const values: number[] = [];
    runAll([
      () => {
        values.push(1);
      },
      () => {
        values.push(2);
      },
    ]);
    expect(values).toEqual([1, 2]);
  });
});
