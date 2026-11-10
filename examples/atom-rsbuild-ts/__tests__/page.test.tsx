import { describe, expect, it } from "rstack/test";
import { createExamplePage } from "@slux/shell-example";
import { demos, groups } from "../src/demos";

const tick = () => new Promise((resolve) => setTimeout(resolve, 60));

function setup(): { root: HTMLDivElement } {
  const root = document.createElement("div");
  document.body.append(root);
  createExamplePage(root, {
    branding: {
      pkg: "/atom",
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

describe("atom 示例页", () => {
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

  it("atom-set-update 卡片：update / set 更新读数并产生日志", async () => {
    const { root } = setup();
    await tick();
    const element = card(root, "atom-set-update");
    expect(metricValues(element)).toEqual(["0"]);
    click(element, "update + 1");
    await tick();
    expect(metricValues(element)).toEqual(["1"]);
    click(element, "set 设值");
    await tick();
    expect(metricValues(element)).toEqual(["10"]);
    expect(element.querySelectorAll(".log-entry").length).toBeGreaterThan(0);
  });

  it("日志与源码 tabs 互斥，再点同一个则收起", async () => {
    const { root } = setup();
    await tick();
    const element = card(root, "derived-chain");
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

  it("scope-isolation 卡片：默认与请求作用域独立流转", async () => {
    const { root } = setup();
    await tick();
    const element = card(root, "scope-isolation");
    expect(metricValues(element)).toEqual(["0", "100", "200"]);
    click(element, "默认 + 1");
    await tick();
    expect(metricValues(element)).toEqual(["1", "100", "200"]);
    click(element, "请求 + 5");
    await tick();
    expect(metricValues(element)).toEqual(["1", "105", "210"]);
  });
});
