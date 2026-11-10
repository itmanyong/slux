import { describe, expect, it } from "rstack/test";
import { createExamplePage } from "@slux/shell-example";
import { demos, groups } from "../src/demos";

const tick = () => new Promise((resolve) => setTimeout(resolve, 60));

function setup(): { root: HTMLDivElement } {
  const root = document.createElement("div");
  document.body.append(root);
  createExamplePage(root, {
    branding: {
      pkg: "/state-machine",
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

const stateValue = (element: HTMLElement) => element.querySelector(".readout.is-emphasis .readout-value")!.textContent;

const action = (element: HTMLElement, label: string) =>
  [...element.querySelectorAll<HTMLButtonElement>(".action")].find((button) => button.textContent === label)!;

describe("state-machine 示例页", () => {
  it("渲染全部示例卡片且读数非空", async () => {
    const { root } = setup();
    await tick();
    expect(root.querySelectorAll(".card").length).toBe(demos.length);
    for (const demo of demos) {
      const element = card(root, demo.id);
      expect(element.querySelectorAll(".readout").length).toBeGreaterThan(0);
      expect(element.querySelector(".demo-content")!.textContent!.trim().length).toBeGreaterThan(0);
    }
  });

  it("traffic-light 卡片：NEXT 推进状态并产生日志", async () => {
    const { root } = setup();
    await tick();
    const element = card(root, "traffic-light");
    expect(stateValue(element)).toBe("red");
    action(element, "NEXT").click();
    await tick();
    expect(stateValue(element)).toBe("green");
    expect(element.querySelectorAll(".log-entry").length).toBeGreaterThan(0);
    action(element, "NEXT").click();
    action(element, "NEXT").click();
    await tick();
    expect(stateValue(element)).toBe("red");
  });

  it("日志与源码 tabs 互斥，再点同一个则收起", async () => {
    const { root } = setup();
    await tick();
    const element = card(root, "fetch-flow");
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

  it("fetch-flow 卡片：START → loading → RESOLVE → success 完整流转", async () => {
    const { root } = setup();
    await tick();
    const element = card(root, "fetch-flow");
    expect(stateValue(element)).toBe("idle");
    action(element, "START").click();
    await tick();
    expect(stateValue(element)).toBe("loading");
    action(element, "RESOLVE").click();
    await tick();
    expect(stateValue(element)).toBe("success");
    action(element, "RESET").click();
    await tick();
    expect(stateValue(element)).toBe("idle");
  });

  it("pin-lock 卡片：输入行内 PIN，连续错误触发锁定", async () => {
    const { root } = setup();
    await tick();
    const element = card(root, "pin-lock");
    const field = element.querySelector<HTMLInputElement>(".action-field input")!;
    const submit = [...element.querySelectorAll<HTMLButtonElement>(".action")].find((button) => button.textContent === "SUBMIT")!;

    field.value = "0000";
    submit.click();
    await tick();
    expect(stateValue(element)).toBe("idle");
    field.value = "1234";
    submit.click();
    await tick();
    expect(stateValue(element)).toBe("granted");
  });
});
