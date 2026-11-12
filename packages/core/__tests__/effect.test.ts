import { describe, expect, it } from "rstack/test";
import { signal } from "../src/signal.js";
import { effect } from "../src/effect.js";

describe("reactivity/effect", () => {
  it("首次和普通写入同步执行，释放幂等且执行清理", () => {
    const source = signal(0);
    const events: string[] = [];
    const stop = effect(() => {
      const value = source.get();
      events.push(`run:${value}`);
      return () => {
        events.push(`clean:${value}`);
      };
    });
    source.set(1);
    expect(events).toEqual(["run:0", "clean:0", "run:1"]);
    stop();
    stop();
    source.set(2);
    expect(events).toEqual(["run:0", "clean:0", "run:1", "clean:1"]);
  });

  it("清理函数的读取不会成为外层或当前 effect 的依赖", () => {
    const source = signal(0);
    const unrelated = signal(0);
    let runs = 0;
    const stop = effect(() => {
      source.get();
      runs++;
      return () => {
        unrelated.get();
      };
    });
    source.set(1);
    unrelated.set(1);
    expect(runs).toBe(2);
    stop();
  });

  it("effect 异常不会阻塞同批其他 effect 或之后更新", () => {
    const source = signal(0);
    const stopBad = effect(() => {
      if (source.get() === 1) throw new Error("effect");
    });
    const values: number[] = [];
    const stop = effect(() => {
      values.push(source.get());
    });
    expect(() => source.set(1)).toThrow("effect");
    expect(values).toEqual([0, 1]);
    source.set(2);
    expect(values).toEqual([0, 1, 2]);
    stopBad();
    stop();
  });

  it("首次 effect 失败会断开已经收集的依赖", () => {
    const source = signal(0);
    let runs = 0;
    expect(() =>
      effect(() => {
        source.get();
        runs++;
        throw new Error("initial");
      }),
    ).toThrow("initial");
    source.set(1);
    expect(runs).toBe(1);
  });

  it("effect 根据分支切换依赖且忽略旧分支变化", () => {
    const condition = signal(true);
    const a = signal("a");
    const b = signal("b");
    const values: string[] = [];
    const stop = effect(() => {
      values.push(condition.get() ? a.get() : b.get());
    });
    b.set("B");
    condition.set(false);
    a.set("A");
    b.set("BB");
    expect(values).toEqual(["a", "B", "BB"]);
    stop();
  });

  it("effect 运行中释放会清理本轮结果并停止追踪", () => {
    const source = signal(0);
    let cleanups = 0;
    const stop = effect(() => {
      if (source.get() > 0) stop();
      source.get();
      return () => {
        cleanups++;
      };
    });
    source.set(1);
    source.set(2);
    expect(cleanups).toBe(2);
  });

  it("释放时即使清理函数抛错也已断开依赖", () => {
    const source = signal(0);
    let runs = 0;
    const stop = effect(() => {
      source.get();
      runs++;
      return () => {
        throw new Error("cleanup");
      };
    });
    expect(stop).toThrow("cleanup");
    stop();
    source.set(1);
    expect(runs).toBe(1);
  });
});
