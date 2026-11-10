import { beforeAll, describe, expect, it } from "vitest";
import { createExamplePage } from "@slux/shell-example";
import { startApplication } from "../src/boot";
import { demos, groups } from "../src/demos";

const tick = () => new Promise((resolve) => setTimeout(resolve, 60));

beforeAll(async () => {
  await startApplication();
});

function setup(): { root: HTMLDivElement } {
  const root = document.createElement("div");
  document.body.append(root);
  createExamplePage(root, {
    branding: {
      pkg: "/angular",
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

const byText = (root: HTMLElement, text: string) =>
  [...root.querySelectorAll<HTMLButtonElement>(".fd-btn")].find((button) => button.textContent?.trim() === text)!;

describe("angular 示例页", () => {
  it("渲染全部示例卡片并挂载真实 Angular 组件", async () => {
    const { root } = setup();
    await tick();
    expect(root.querySelectorAll(".card").length).toBe(demos.length);
    for (const demo of demos) {
      const element = card(root, demo.id);
      const mounted = element.querySelector(".demo-mount")!;
      expect(mounted.textContent!.trim().length).toBeGreaterThan(0);
    }
  });

  it("toAngularSignal 卡片：点击按钮更新读数并产生日志", async () => {
    const { root } = setup();
    await tick();
    const element = card(root, "signal");
    byText(element, "+ 1").click();
    await tick();
    expect(element.querySelector(".fd-value.is-strong")!.textContent).toBe("2");
    expect(element.querySelectorAll(".log-entry").length).toBeGreaterThan(0);
  });

  it("日志与源码 tabs 互斥，再点同一个则收起", async () => {
    const { root } = setup();
    await tick();
    const element = card(root, "flux");
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

  it("injectMachine 卡片：事件驱动状态流转", async () => {
    const { root } = setup();
    await tick();
    const element = card(root, "machine");
    expect(element.querySelector(".fd-value.is-strong")!.textContent).toBe("idle");
    byText(element, "START").click();
    await tick();
    expect(element.querySelector(".fd-value.is-strong")!.textContent).toBe("loading");
    byText(element, "RESOLVE").click();
    await tick();
    expect(element.querySelector(".fd-value.is-strong")!.textContent).toBe("success");
  });
});
