import { describe, expect, it } from "rstack/test";
import { createExamplePage } from "@slux/shell-example";
import { demos, groups } from "../src/demos";

const tick = () => new Promise((resolve) => setTimeout(resolve, 60));

function setup(): { root: HTMLDivElement } {
  const root = document.createElement("div");
  document.body.append(root);
  createExamplePage(root, {
    branding: {
      pkg: "/proxy",
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

describe("proxy 示例页", () => {
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

  it("observable-mutations 卡片：直接赋值更新读数并产生日志", async () => {
    const { root } = setup();
    await tick();
    const element = card(root, "observable-mutations");
    expect(metricValues(element)).toEqual(["0"]);
    click(element, "count + 1");
    await tick();
    expect(metricValues(element)).toEqual(["1"]);
    expect(element.querySelectorAll(".log-entry").length).toBeGreaterThan(0);
  });

  it("日志与源码 tabs 互斥，再点同一个则收起", async () => {
    const { root } = setup();
    await tick();
    const element = card(root, "observable-mutations");
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

  it("observe-tracking 卡片：只重跑读取过属性的写入", async () => {
    const { root } = setup();
    await tick();
    const element = card(root, "observe-tracking");
    // 创建时 observe 立即执行一次
    expect(metricValues(element)).toEqual(["0", "0", "1"]);
    click(element, "a + 1（触发重跑）");
    await tick();
    expect(metricValues(element)).toEqual(["1", "0", "2"]);
    click(element, "b + 1（不触发）");
    await tick();
    expect(metricValues(element)).toEqual(["1", "1", "2"]);
  });
});
