import { describe, expect, it } from "rstack/test";
import { runAll } from "../../src/utils/run-all.js";

describe("runAll", () => {
  it("单个错误原样抛出，后续任务仍执行", () => {
    const failure = new Error("task");
    let completed = false;
    expect(() =>
      runAll([
        () => {
          throw failure;
        },
        () => {
          completed = true;
        },
      ]),
    ).toThrow(failure);
    expect(completed).toBe(true);
  });

  it("多个错误汇总且保留非 Error 的抛出值", () => {
    let failure: unknown;
    try {
      runAll([
        () => {
          throw undefined;
        },
        () => {
          throw "second";
        },
      ]);
    } catch (error) {
      failure = error;
    }
    expect(failure).toBeInstanceOf(AggregateError);
    expect((failure as AggregateError).errors).toEqual([undefined, "second"]);
  });

  it("执行迭代期间追加的任务", () => {
    const values: number[] = [];
    const tasks = new Set<() => void>();
    tasks.add(() => {
      values.push(1);
      tasks.add(() => {
        values.push(2);
      });
    });
    runAll(tasks);
    expect(values).toEqual([1, 2]);
  });
});
