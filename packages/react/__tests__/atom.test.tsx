import { act, StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "rstack/test";
import { atom, derived, writableAtom } from "@slux/atom";
import type { Atom, AnyReadableAtom } from "@slux/atom";
import { createScope, signal } from "@slux/core";
import { ScopeProvider } from "../src/index.js";
import { useAtom, useAtomValue, useSetAtom } from "../src/atom.js";
import { render } from "./render.js";

describe("atom 绑定", () => {
  it("useAtom 读取、写入并保持 setter 引用稳定", () => {
    const count = atom(1);
    let setter: ((value: number) => void) | undefined;
    function Counter() {
      const [value, set] = useAtom(count);
      setter = set;
      return <button onClick={() => set(value + 1)}>{value}</button>;
    }
    const view = render(<Counter />);
    const initialSetter = setter;
    act(() => view.container.querySelector("button")!.click());
    expect(count.get()).toBe(2);
    expect(view.container.textContent).toBe("2");
    expect(setter).toBe(initialSetter);
    act(() => count.update((value) => value + 1));
    expect(view.container.textContent).toBe("3");
  });

  it("useAtomValue 主动响应派生值，结果相等时不重渲染", () => {
    const count = atom(1);
    const parity = derived((get) => get(count) % 2);
    let renders = 0;
    function Value() {
      renders++;
      return <span>{useAtomValue(parity)}</span>;
    }
    const view = render(<Value />);
    const before = renders;
    act(() => count.set(3));
    expect(renders).toBe(before);
    act(() => count.set(4));
    expect(view.container.textContent).toBe("0");
  });

  it("useAtomValue 可读 writableAtom 和 core signal", () => {
    const count = atom(1);
    const writable = writableAtom(
      (get) => get(count) * 2,
      (_get, set, value: number) => set(count, value),
    );
    const source = signal("before");
    function Value() {
      return (
        <span>
          {useAtomValue(writable)}:{useAtomValue(source)}
        </span>
      );
    }
    const view = render(<Value />);
    act(() => {
      writable.write(3);
      source.set("after");
    });
    expect(view.container.textContent).toBe("6:after");
  });

  it("useSetAtom 不订阅，切换 atom 后 setter 指向新来源", () => {
    const first = atom(1);
    const second = atom(10);
    let setter: ((value: number) => void) | undefined;
    let renders = 0;
    function Setter({ source }: { source: Atom<number> }) {
      renders++;
      setter = useSetAtom(source);
      return null;
    }
    const view = render(<Setter source={first} />);
    const firstSetter = setter;
    const before = renders;
    act(() => setter!(2));
    expect(first.get()).toBe(2);
    expect(renders).toBe(before);
    view.rerender(<Setter source={second} />);
    expect(setter).not.toBe(firstSetter);
    act(() => setter!(20));
    expect(second.get()).toBe(20);
    expect(first.get()).toBe(2);
  });

  it("函数值 setter 按 atom 的替换契约保存函数，不将它作为 updater 执行", () => {
    const initial = () => 1;
    const next = () => 2;
    const callback = atom(initial);
    let setter: ((value: () => number) => void) | undefined;
    function Value() {
      const [value, set] = useAtom(callback);
      setter = set;
      return <span>{value()}</span>;
    }
    const view = render(<Value />);
    act(() => setter!(next));
    expect(callback.get()).toBe(next);
    expect(view.container.textContent).toBe("2");
  });

  it("StrictMode、来源切换和卸载正确释放派生订阅", () => {
    const base = atom(1);
    let evaluations = 0;
    const value = derived((get) => {
      evaluations++;
      return get(base) * 2;
    });
    const other = atom(10);
    function Value({ source }: { source: AnyReadableAtom<number> }) {
      return <span>{useAtomValue(source)}</span>;
    }
    const view = render(
      <StrictMode>
        <Value source={value} />
      </StrictMode>,
    );
    act(() => base.set(2));
    expect(view.container.textContent).toBe("4");
    view.rerender(
      <StrictMode>
        <Value source={other} />
      </StrictMode>,
    );
    const before = evaluations;
    act(() => base.set(3));
    expect(evaluations).toBe(before);
    expect(view.container.textContent).toBe("10");
    view.rerender(
      <StrictMode>
        <Value source={value} />
      </StrictMode>,
    );
    expect(view.container.textContent).toBe("6");
    view.unmount();
    const after = evaluations;
    act(() => base.set(4));
    expect(evaluations).toBe(after);
  });

  it("SSR 读取 atom 自身当前值，不应用 core ScopeProvider", () => {
    const count = atom(1);
    const source = signal(2);
    const scope = createScope();
    scope.set(source, 20);
    count.set(3);
    function Value() {
      return <span>{`${useAtomValue(count)}:${useAtomValue(source)}`}</span>;
    }
    expect(
      renderToString(
        <ScopeProvider scope={scope}>
          <Value />
        </ScopeProvider>,
      ),
    ).toBe("<span>3:2</span>");
  });
});
