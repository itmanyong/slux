import { describe, expect, it } from "rstack/test";
import { createExamplePage } from "@slux/shell-example";
import { demos, groups } from "../src/demos";

const tick = () => new Promise((resolve) => setTimeout(resolve, 60));

function setup(): { root: HTMLDivElement } {
  const root = document.createElement("div");
  document.body.append(root);
  createExamplePage(root, {
    branding: {
      pkg: "/telemetry",
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

describe("telemetry 示例页", () => {
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

  it("onStateChange 卡片：点击按钮更新读数并产生上报日志", async () => {
    const { root } = setup();
    await tick();
    const element = card(root, "state-change");
    expect(element.querySelector(".readout-value")!.textContent).toBe("0");
    action(element, "+ 1").click();
    await tick();
    expect(element.querySelector(".readout-value")!.textContent).toBe("1");
    expect(element.querySelectorAll(".log-entry").length).toBeGreaterThan(0);
    expect(element.textContent).toContain("上报 #1");
  });

  it("日志与源码 tabs 互斥，再点同一个则收起", async () => {
    const { root } = setup();
    await tick();
    const element = card(root, "pause-resume");
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

  it("setEnabled 卡片：暂停后写入不再上报，恢复后读数连续", async () => {
    const { root } = setup();
    await tick();
    const element = card(root, "pause-resume");
    const metricValues = () => [...element.querySelectorAll<HTMLElement>(".readout-value, .readout-text")];

    action(element, "+ 1").click();
    await tick();
    expect(metricValues()[0]!.textContent).toBe("1");
    expect(element.textContent).toContain("启用中");

    action(element, "暂停 / 恢复上报").click();
    await tick();
    expect(element.textContent).toContain("已暂停");

    action(element, "+ 1").click();
    await tick();
    expect(metricValues()[0]!.textContent).toBe("2");
    expect(metricValues()[1]!.textContent).toBe("2");
    const reportCount = [...element.querySelectorAll(".log-entry")].filter((entry) => entry.textContent!.includes("上报 #")).length;
    expect(reportCount).toBe(1);

    action(element, "暂停 / 恢复上报").click();
    action(element, "+ 1").click();
    await tick();
    expect(metricValues()[0]!.textContent).toBe("3");
    expect([...element.querySelectorAll(".log-entry")].filter((entry) => entry.textContent!.includes("上报 #")).length).toBe(2);
  });

  it("filter 卡片：noise 写入被过滤，count 写入放行", async () => {
    const { root } = setup();
    await tick();
    const element = card(root, "field-filter");
    const values = () => [...element.querySelectorAll<HTMLElement>(".readout-value")];

    action(element, "noise + 1").click();
    await tick();
    expect(values()[1]!.textContent).toBe("1");
    expect(values()[2]!.textContent).toBe("0");
    expect(values()[3]!.textContent).toBe("1");

    action(element, "count + 1").click();
    await tick();
    expect(values()[0]!.textContent).toBe("1");
    expect(values()[2]!.textContent).toBe("1");
    expect(values()[3]!.textContent).toBe("1");
  });
});
