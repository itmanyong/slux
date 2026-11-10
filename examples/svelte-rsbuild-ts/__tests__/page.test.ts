import { describe, expect, it } from "rstack/test";
import { createExamplePage } from "@slux/shell-example";
import { demos, groups } from "../src/demos";

const tick = () => new Promise((resolve) => setTimeout(resolve, 60));

function setup(): { root: HTMLDivElement } {
  const root = document.createElement("div");
  document.body.append(root);
  createExamplePage(root, {
    branding: {
      pkg: "/svelte",
      kicker: "test",
      titleHtml: "test",
      descriptionHtml: "test",
      colophon: "test",
    },
    groups,
    demos,
  });
  return { root };
}

const card = (root: HTMLElement, id: string) => root.querySelector<HTMLElement>(`.card[data-demo="${id}"]`)!;

describe("svelte 示例页", () => {
  it("渲染全部示例卡片并挂载真实 Svelte 组件", async () => {
    const { root } = setup();
    await tick();
    expect(root.querySelectorAll(".card").length).toBe(demos.length);
    for (const demo of demos) {
      const element = card(root, demo.id);
      const mounted = element.querySelector(".demo-mount")!;
      expect(mounted.textContent!.trim().length).toBeGreaterThan(0);
    }
  });

  it("toReadable 卡片：点击按钮更新读数并产生日志", async () => {
    const { root } = setup();
    await tick();
    const element = card(root, "to-readable");
    const plus = [...element.querySelectorAll<HTMLButtonElement>(".fd-btn")].find((button) => button.textContent!.trim() === "+ 1")!;
    plus.click();
    await tick();
    expect(element.querySelector(".fd-value")!.textContent).toBe("1");
    expect(element.querySelectorAll(".log-entry").length).toBeGreaterThan(0);
  });

  it("日志与源码 tabs 互斥，再点同一个则收起", async () => {
    const { root } = setup();
    await tick();
    const element = card(root, "to-flux");
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

  it("toMachine 卡片：事件驱动状态流转", async () => {
    const { root } = setup();
    await tick();
    const element = card(root, "to-machine");
    expect(element.querySelector(".fd-value")!.textContent).toBe("idle");
    const findButton = (text: string) =>
      [...element.querySelectorAll<HTMLButtonElement>(".fd-btn")].find((button) => button.textContent!.trim() === text)!;
    findButton("START").click();
    await tick();
    expect(element.querySelector(".fd-value")!.textContent).toBe("loading");
    findButton("RESOLVE").click();
    await tick();
    expect(element.querySelector(".fd-value")!.textContent).toBe("success");
  });
});
