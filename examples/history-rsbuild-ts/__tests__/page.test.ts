import { describe, expect, it } from "rstack/test";
import { createExamplePage } from "@slux/shell-example";
import { demos, groups } from "../src/demos";

const tick = () => new Promise((resolve) => setTimeout(resolve, 60));

function setup(): { root: HTMLDivElement } {
  const root = document.createElement("div");
  document.body.append(root);
  createExamplePage(root, {
    branding: {
      pkg: "/history",
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

const actionButton = (element: HTMLElement, label: string) =>
  [...element.querySelectorAll<HTMLButtonElement>(".action")].find((button) => button.textContent === label)!;

const metricValue = (element: HTMLElement, label: string) => {
  const readout = [...element.querySelectorAll<HTMLElement>(".readout")].find(
    (item) => item.querySelector(".readout-label")?.textContent === label,
  )!;
  return readout.querySelector<HTMLElement>(".readout-value")!;
};

describe("history 示例页", () => {
  it("渲染全部示例卡片且读数区非空", async () => {
    const { root } = setup();
    await tick();
    expect(root.querySelectorAll(".card").length).toBe(demos.length);
    for (const demo of demos) {
      const element = card(root, demo.id);
      const readouts = element.querySelectorAll(".readout");
      expect(readouts.length).toBeGreaterThan(0);
      for (const readout of readouts) {
        const body = readout.querySelector(".readout-value, .readout-text, .readout-list, .flow")!;
        expect(body.textContent!.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("undo-redo 卡片：写入 → undo → redo 完整流转", async () => {
    const { root } = setup();
    await tick();
    const element = card(root, "undo-redo");

    actionButton(element, "写入新文本").click();
    await tick();
    expect(element.querySelector(".readout-text")!.textContent).toBe("草稿 v1");

    actionButton(element, "undo()").click();
    await tick();
    expect(element.querySelector(".readout-text")!.textContent).toBe("草稿 v0");

    actionButton(element, "redo()").click();
    await tick();
    expect(element.querySelector(".readout-text")!.textContent).toBe("草稿 v1");
    expect(element.querySelectorAll(".log-entry").length).toBeGreaterThan(0);
  });

  it("日志与源码 tabs 互斥，再点同一个则收起", async () => {
    const { root } = setup();
    await tick();
    const element = card(root, "travel-notify");
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

  it("max-depth 卡片：超过上限后 undo 到达边界即失效", async () => {
    const { root } = setup();
    await tick();
    const element = card(root, "max-depth");
    const write = actionButton(element, "写入 +N");
    const undo = actionButton(element, "undo()");

    write.click();
    write.click();
    write.click();
    write.click();
    await tick();
    expect(metricValue(element, "value").textContent).toBe("4");

    undo.click();
    undo.click();
    undo.click();
    undo.click();
    await tick();
    expect(metricValue(element, "value").textContent).toBe("1");
    expect(element.textContent).toContain("历史边界");
  });
});
