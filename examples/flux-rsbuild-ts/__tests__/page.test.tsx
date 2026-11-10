import { describe, expect, it } from "rstack/test";
import { createExamplePage } from "@slux/shell-example";
import { demos, groups } from "../src/demos";

const tick = () => new Promise((resolve) => setTimeout(resolve, 60));

function setup(): { root: HTMLDivElement } {
  const root = document.createElement("div");
  document.body.append(root);
  createExamplePage(root, {
    branding: {
      pkg: "/flux",
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

const click = (scope: HTMLElement, label: string) => {
  const button = [...scope.querySelectorAll<HTMLButtonElement>(".action")].find((item) => item.textContent === label);
  if (!button) throw new Error(`找不到按钮「${label}」`);
  button.click();
};

const metricValues = (scope: HTMLElement) => [...scope.querySelectorAll<HTMLElement>(".readout-value")].map((node) => node.textContent);

describe("flux 示例页", () => {
  it("渲染全部示例卡片且读数区域非空", async () => {
    const { root } = setup();
    await tick();
    expect(root.querySelectorAll(".card").length).toBe(demos.length);
    for (const demo of demos) {
      const element = card(root, demo.id);
      expect(element.querySelector(".readouts")!.textContent!.trim().length).toBeGreaterThan(0);
      expect(element.querySelector(".actions")!.children.length).toBeGreaterThan(0);
    }
  });

  it("flux-counter 卡片：dispatch 更新读数并产生日志", async () => {
    const { root } = setup();
    await tick();
    const element = card(root, "flux-counter");
    expect(metricValues(element)).toEqual(["0"]);
    click(element, "+ 1");
    await tick();
    expect(metricValues(element)).toEqual(["1"]);
    click(element, "RESET");
    await tick();
    expect(metricValues(element)).toEqual(["0"]);
    expect(element.querySelectorAll(".log-entry").length).toBeGreaterThan(0);
  });

  it("日志与源码 tabs 互斥，再点同一个则收起", async () => {
    const { root } = setup();
    await tick();
    const element = card(root, "flux-counter");
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

  it("flux-middleware-guard 卡片：改写与阻断的完整流转", async () => {
    const { root } = setup();
    await tick();
    const element = card(root, "flux-middleware-guard");
    expect(metricValues(element)).toEqual(["10"]);
    click(element, "dispatch（正数被翻倍）");
    await tick();
    expect(metricValues(element)).toEqual(["16"]);
    click(element, "dispatch −5（被阻断）");
    await tick();
    expect(metricValues(element)).toEqual(["16"]);
    expect(element.textContent).toContain("阻断");
  });
});
