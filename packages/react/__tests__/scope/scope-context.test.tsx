import { act, useContext } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "rstack/test";
import { computed, createScope, signal } from "@slux/core";
import type { Scope, Subscribable } from "@slux/core";
import { ScopeContext, ScopeProvider, useScopeContext, useSignal } from "../../src/index.js";
import { render } from "../render.js";

function Value({ source }: { source: Subscribable<number> }) {
  return <span>{useSignal(source)}</span>;
}

describe("ScopeContext", () => {
  it("没有 Provider 时返回 null", () => {
    let observed: Scope | null | undefined;
    function Consumer() {
      observed = useScopeContext();
      return null;
    }
    render(<Consumer />);
    expect(observed).toBeNull();
  });

  it("嵌套 Provider 取最近的 scope，替换后同步更新", () => {
    const outer = createScope();
    const inner = outer.fork();
    let observed: Scope | null | undefined;
    let direct: Scope | null | undefined;
    function Consumer() {
      observed = useScopeContext();
      direct = useContext(ScopeContext);
      return null;
    }
    const view = render(
      <ScopeProvider scope={outer}>
        <ScopeProvider scope={inner}>
          <Consumer />
        </ScopeProvider>
      </ScopeProvider>,
    );
    expect(observed).toBe(inner);
    expect(direct).toBe(inner);
    view.rerender(
      <ScopeProvider scope={outer}>
        <Consumer />
      </ScopeProvider>,
    );
    expect(observed).toBe(outer);
  });

  it("客户端渲染仍订阅全局信号，scope.set 不推送变化", () => {
    const count = signal(1);
    const scope = createScope();
    scope.set(count, 10);
    const view = render(
      <ScopeProvider scope={scope}>
        <Value source={count} />
      </ScopeProvider>,
    );
    expect(view.container.textContent).toBe("1");
    act(() => scope.set(count, 20));
    expect(view.container.textContent).toBe("1");
    act(() => count.set(2));
    expect(view.container.textContent).toBe("2");
    expect(scope.get(count)).toBe(20);
  });
});

describe("SSR 与 hydration", () => {
  it("服务端读取请求 scope，两个请求互不影响", () => {
    const count = signal(1);
    const first = createScope();
    const second = createScope();
    first.set(count, 10);
    second.set(count, 20);
    expect(
      renderToString(
        <ScopeProvider scope={first}>
          <Value source={count} />
        </ScopeProvider>,
      ),
    ).toBe("<span>10</span>");
    expect(
      renderToString(
        <ScopeProvider scope={second}>
          <Value source={count} />
        </ScopeProvider>,
      ),
    ).toBe("<span>20</span>");
    expect(count.get()).toBe(1);
  });

  it("服务端沿父 scope 读取，缺少覆盖或 Provider 时回退到全局值", () => {
    const count = signal(1);
    const parent = createScope();
    parent.set(count, 10);
    expect(
      renderToString(
        <ScopeProvider scope={parent.fork()}>
          <Value source={count} />
        </ScopeProvider>,
      ),
    ).toBe("<span>10</span>");
    expect(
      renderToString(
        <ScopeProvider scope={createScope()}>
          <Value source={count} />
        </ScopeProvider>,
      ),
    ).toBe("<span>1</span>");
    expect(renderToString(<Value source={count} />)).toBe("<span>1</span>");
  });

  it("computed 保留全局依赖语义，不按 scope 的覆盖值重新派生", () => {
    const count = signal(1);
    const doubled = computed(() => count.get() * 2);
    const scope = createScope();
    scope.set(count, 10);
    expect(
      renderToString(
        <ScopeProvider scope={scope}>
          <Value source={count} />
          <Value source={doubled} />
        </ScopeProvider>,
      ),
    ).toBe("<span>10</span><span>2</span>");
  });

  it("服务端不建立订阅或 effect 追踪", () => {
    const count = signal(1);
    let evaluations = 0;
    const doubled = computed(() => {
      evaluations++;
      return count.get() * 2;
    });
    let subscriptions = 0;
    const source: Subscribable<number> = {
      get: () => doubled.get(),
      subscribe: (callback) => {
        subscriptions++;
        return doubled.subscribe(callback);
      },
    };
    expect(renderToString(<Value source={source} />)).toBe("<span>2</span>");
    expect(subscriptions).toBe(0);
    count.set(2);
    expect(evaluations).toBe(1);
  });

  it("hydration 先匹配服务端 scope，随后切换到全局值", async () => {
    const count = signal(1);
    const serverScope = createScope();
    serverScope.set(count, 10);
    const container = document.createElement("div");
    container.innerHTML = renderToString(
      <ScopeProvider scope={serverScope}>
        <Value source={count} />
      </ScopeProvider>,
    );
    document.body.append(container);
    const clientScope = createScope();
    clientScope.set(count, 10);
    const seen: number[] = [];
    const errors: unknown[] = [];
    function Client() {
      const value = useSignal(count);
      seen.push(value);
      return <span>{value}</span>;
    }
    let root: ReturnType<typeof hydrateRoot> | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(
          container,
          <ScopeProvider scope={clientScope}>
            <Client />
          </ScopeProvider>,
          {
            onRecoverableError: (error) => {
              errors.push(error);
            },
          },
        );
      });
      expect(errors).toEqual([]);
      expect(seen[0]).toBe(10);
      expect(container.textContent).toBe("1");
      act(() => count.set(2));
      expect(container.textContent).toBe("2");
    } finally {
      act(() => root?.unmount());
      container.remove();
    }
  });
});
