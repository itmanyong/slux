import { act, StrictMode } from "react";
import { describe, expect, it } from "rstack/test";
import { batch, computed, signal } from "@slux/core";
import type { Subscribable } from "@slux/core";
import { useSignal } from "../../src/index.js";
import { render } from "../render.js";

function Value({ source }: { source: Subscribable<unknown> }) {
  return <span>{String(useSignal(source))}</span>;
}

describe("useSignal", () => {
  it("读取信号并响应 set 更新", () => {
    const count = signal(1);
    const view = render(<Value source={count} />);
    expect(view.container.textContent).toBe("1");
    act(() => count.set((value) => value + 1));
    expect(view.container.textContent).toBe("2");
  });

  it("对象 draft 更新保留旧快照并更新组件", () => {
    const user = signal({ name: "Alice", nested: { value: 1 } });
    const previous = user.get();
    function User() {
      return <span>{useSignal(user).name}</span>;
    }
    const view = render(<User />);
    act(() =>
      user.set((draft) => {
        draft.name = "Bob";
      }),
    );
    expect(view.container.textContent).toBe("Bob");
    expect(previous.name).toBe("Alice");
    expect(user.get().nested).toBe(previous.nested);
  });

  it("相同信号值不触发重新渲染", () => {
    const count = signal(1);
    let renders = 0;
    function Observed() {
      renders++;
      return <span>{useSignal(count)}</span>;
    }
    render(<Observed />);
    const before = renders;
    act(() => count.set(1));
    expect(renders).toBe(before);
  });

  it("主动刷新 computed 链，派生结果相等时不重渲染", () => {
    const count = signal(1);
    const parity = computed(() => count.get() % 2);
    const label = computed(() => `parity:${parity.get()}`);
    let renders = 0;
    function Derived() {
      renders++;
      return <span>{useSignal(label)}</span>;
    }
    const view = render(<Derived />);
    expect(view.container.textContent).toBe("parity:1");
    const before = renders;
    act(() => count.set(3));
    expect(renders).toBe(before);
    act(() => count.set(4));
    expect(view.container.textContent).toBe("parity:0");
  });

  it("动态 computed 依赖切换后只跟随新分支", () => {
    const left = signal(1);
    const right = signal(10);
    const selectLeft = signal(true);
    const selected = computed(() => (selectLeft.get() ? left.get() : right.get()));
    const view = render(<Value source={selected} />);
    act(() => selectLeft.set(false));
    expect(view.container.textContent).toBe("10");
    act(() => left.set(2));
    expect(view.container.textContent).toBe("10");
    act(() => right.set(20));
    expect(view.container.textContent).toBe("20");
  });

  it("批量更新读取最终一致的派生值", () => {
    const left = signal(1);
    const right = signal(2);
    const total = computed(() => left.get() + right.get());
    const view = render(<Value source={total} />);
    act(() =>
      batch(() => {
        left.set(10);
        right.set(20);
      }),
    );
    expect(view.container.textContent).toBe("30");
  });

  it("切换来源和卸载时释放 computed 的追踪", () => {
    const base = signal(1);
    let evaluations = 0;
    const derived = computed(() => {
      evaluations++;
      return base.get() * 2;
    });
    const other = signal(10);
    const view = render(<Value source={derived} />);
    view.rerender(<Value source={other} />);
    const before = evaluations;
    act(() => base.set(2));
    expect(evaluations).toBe(before);
    expect(view.container.textContent).toBe("10");
    view.rerender(<Value source={derived} />);
    expect(view.container.textContent).toBe("4");
    view.unmount();
    const after = evaluations;
    act(() => base.set(3));
    expect(evaluations).toBe(after);
  });

  it("支持依赖 this 的自定义来源，StrictMode 下订阅正确清理", () => {
    const listeners = new Set<(value: number) => void>();
    const custom = {
      value: 1,
      get() {
        return this.value;
      },
      subscribe(callback: (value: number) => void) {
        listeners.add(callback);
        return () => {
          listeners.delete(callback);
        };
      },
    };
    const view = render(
      <StrictMode>
        <Value source={custom} />
      </StrictMode>,
    );
    expect(listeners.size).toBe(1);
    view.rerender(
      <StrictMode>
        <Value source={custom} />
      </StrictMode>,
    );
    expect(listeners.size).toBe(1);
    act(() => {
      custom.value = 2;
      for (const notify of listeners) notify(2);
    });
    expect(view.container.textContent).toBe("2");
    view.unmount();
    expect(listeners.size).toBe(0);
  });
});
