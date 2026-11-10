import { describe, expect, it } from "rstack/test";
import { createExamplePage } from "@slux/shell-example";
import { demos, groups } from "../src/demos";

const tick = () => new Promise((resolve) => setTimeout(resolve, 60));

function setup(): { root: HTMLDivElement } {
  const root = document.createElement("div");
  document.body.append(root);
  createExamplePage(root, {
    branding: {
      pkg: "/store",
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

describe("store 示例页", () => {
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

  it("store-create 卡片：两种 setState 写入均更新读数并产生日志", async () => {
    const { root } = setup();
    await tick();
    const element = card(root, "store-create");
    expect(metricValue(element, "count").textContent).toBe("0");

    actionButton(element, "updater +N").click();
    await tick();
    expect(metricValue(element, "count").textContent).toBe("1");

    actionButton(element, "对象合并 set(42)").click();
    await tick();
    expect(metricValue(element, "count").textContent).toBe("42");
    expect(element.querySelectorAll(".log-entry").length).toBeGreaterThan(0);
  });

  it("日志与源码 tabs 互斥，再点同一个则收起", async () => {
    const { root } = setup();
    await tick();
    const element = card(root, "store-subscribe");
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

  it("middleware-guard 卡片：guard 拦截负数写入，放行合法写入", async () => {
    const { root } = setup();
    await tick();
    const element = card(root, "middleware-guard");
    expect(metricValue(element, "count").textContent).toBe("0");
    expect(metricValue(element, "拦截次数").textContent).toBe("0");

    const input = element.querySelector<HTMLInputElement>(".action-field input")!;
    const write = actionButton(element, "updater +N（可为负）");

    write.click();
    await tick();
    expect(metricValue(element, "count").textContent).toBe("1");

    input.value = "-5";
    write.click();
    await tick();
    expect(metricValue(element, "count").textContent).toBe("1");
    expect(metricValue(element, "拦截次数").textContent).toBe("1");

    input.value = "2";
    write.click();
    await tick();
    expect(metricValue(element, "count").textContent).toBe("3");
    expect(metricValue(element, "拦截次数").textContent).toBe("1");
  });
});
