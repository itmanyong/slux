import { describe, expect, it } from "rstack/test";
import { createExamplePage } from "@slux/shell-example";
import { demos, groups } from "../src/demos";

const tick = () => new Promise((resolve) => setTimeout(resolve, 60));

function setup(): { root: HTMLDivElement } {
  const root = document.createElement("div");
  document.body.append(root);
  createExamplePage(root, {
    branding: {
      pkg: "/devtools",
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

const action = (element: HTMLElement, label: string) =>
  [...element.querySelectorAll<HTMLButtonElement>(".action")].find((button) => button.textContent === label)!;

describe("devtools 示例页", () => {
  it("渲染全部示例卡片且读数非空", async () => {
    const { root } = setup();
    await tick();
    expect(root.querySelectorAll(".card").length).toBe(demos.length);
    for (const demo of demos) {
      const element = card(root, demo.id);
      expect(element.querySelector(".readouts")!.children.length).toBeGreaterThan(0);
      expect(element.querySelector(".readout")!.textContent!.trim().length).toBeGreaterThan(0);
    }
  });

  it("logger-basic 卡片：写入产生结构化日志输出", async () => {
    const { root } = setup();
    await tick();
    const element = card(root, "logger-basic");
    expect(element.querySelector(".readout-value")!.textContent).toBe("0");

    action(element, "+ 1").click();
    await tick();
    expect(element.querySelector(".readout-value")!.textContent).toBe("1");

    const listText = element.querySelector(".readout-list")!.textContent!;
    expect(listText).toContain("set:count");
    expect(listText).toContain("prev state");
    expect(listText).toContain("next state");
    expect(element.querySelectorAll(".log-entry").length).toBeGreaterThan(0);
  });

  it("日志与源码 tabs 互斥，再点同一个则收起", async () => {
    const { root } = setup();
    await tick();
    const element = card(root, "logger-diff");
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

  it("inspect-lifecycle 卡片：销毁发出 destroy 事件，重建发出新 init", async () => {
    const { root } = setup();
    await tick();
    const element = card(root, "inspect-lifecycle");
    const flow = () => element.querySelector(".readout-list")!.textContent!;

    action(element, "+ 1").click();
    await tick();
    expect(element.querySelector(".readout-value")!.textContent).toBe("1");
    expect(flow()).toContain("init");
    expect(flow()).toContain("set");

    action(element, "销毁 Store").click();
    await tick();
    expect(element.textContent).toContain("已销毁");
    expect(flow()).toContain("destroy");

    action(element, "重建 Store").click();
    action(element, "+ 1").click();
    await tick();
    expect(element.querySelector(".readout-value")!.textContent).toBe("1");
    expect(flow()).toContain("init");
  });

  it("inspect-multi 卡片：两个 Store 的事件都进入同一检查器", async () => {
    const { root } = setup();
    await tick();
    const element = card(root, "inspect-multi");

    action(element, "cart + 1 件").click();
    await tick();
    const values = [...element.querySelectorAll<HTMLElement>(".readout-value")];
    expect(values[0]!.textContent).toBe("1");
    expect(values[1]!.textContent).toBe("10");
    expect(element.querySelector(".readout-list")!.textContent).toContain("cart");

    const input = element.querySelector<HTMLInputElement>(".action-field input")!;
    input.value = "bob";
    action(element, "改名").click();
    await tick();
    expect(element.querySelector(".readout-text")!.textContent).toBe("bob");
    expect(element.querySelector(".readout-list")!.textContent).toContain("profile");
  });
});
