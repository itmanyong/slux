import { describe, expect, it } from "rstack/test";
import { createExamplePage } from "@slux/shell-example";
import { act } from "react";
import { demos, groups } from "../src/demos";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

async function setup(): Promise<{ root: HTMLDivElement }> {
  const root = document.createElement("div");
  document.body.append(root);
  await act(async () => {
    createExamplePage(root, {
      branding: {
        pkg: "/react",
        kicker: "test",
        titleHtml: "test",
        descriptionHtml: "test",
        colophon: "test",
      },
      groups,
      demos,
    });
  });
  return { root };
}

const card = (root: HTMLElement, id: string) => root.querySelector<HTMLElement>(`.card[data-demo="${id}"]`)!;

describe("react 示例页", () => {
  it("渲染全部示例卡片并挂载真实 React 组件", async () => {
    const { root } = await setup();
    expect(root.querySelectorAll(".card").length).toBe(demos.length);
    for (const demo of demos) {
      const element = card(root, demo.id);
      const mounted = element.querySelector(".demo-mount")!;
      expect(mounted.textContent!.trim().length).toBeGreaterThan(0);
    }
  });

  it("useSignal 卡片：点击按钮更新读数并产生日志", async () => {
    const { root } = await setup();
    const element = card(root, "use-signal");
    const plus = [...element.querySelectorAll<HTMLButtonElement>(".fd-btn")].find((button) => button.textContent === "+ 1")!;
    await act(async () => plus.click());
    expect(element.querySelector(".fd-value")!.textContent).toBe("1");
    expect(element.querySelectorAll(".log-entry").length).toBeGreaterThan(0);
  });

  it("日志与源码 tabs 互斥，再点同一个则收起", async () => {
    const { root } = await setup();
    const element = card(root, "use-flux");
    const logTab = element.querySelector<HTMLButtonElement>('[data-panel="log"]')!;
    const codeTab = element.querySelector<HTMLButtonElement>('[data-panel="code"]')!;

    logTab.click();
    expect(element.querySelector<HTMLElement>('[data-body="log"]')!.hidden).toBe(false);

    codeTab.click();
    expect(element.querySelector<HTMLElement>('[data-body="log"]')!.hidden).toBe(true);
    expect(element.querySelector<HTMLElement>('[data-body="code"]')!.hidden).toBe(false);
    expect(element.querySelector(".code-body code")!.textContent!.length).toBeGreaterThan(0);

    codeTab.click();
    expect(element.querySelector<HTMLElement>('[data-body="code"]')!.hidden).toBe(true);
    expect(element.querySelector<HTMLElement>('[data-body="log"]')!.hidden).toBe(true);
  });

  it("useMachine 卡片：事件驱动状态流转", async () => {
    const { root } = await setup();
    const element = card(root, "use-machine");
    expect(element.querySelector(".fd-value")!.textContent).toBe("idle");
    const start = [...element.querySelectorAll<HTMLButtonElement>(".fd-btn")].find((button) => button.textContent === "START")!;
    await act(async () => start.click());
    expect(element.querySelector(".fd-value")!.textContent).toBe("loading");
    const resolve = [...element.querySelectorAll<HTMLButtonElement>(".fd-btn")].find((button) => button.textContent === "RESOLVE")!;
    await act(async () => resolve.click());
    expect(element.querySelector(".fd-value")!.textContent).toBe("success");
  });
});
