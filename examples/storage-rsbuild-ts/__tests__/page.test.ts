import { describe, expect, it } from "rstack/test";
import { createExamplePage } from "@slux/shell-example";
import { demos, groups } from "../src/demos";

const tick = () => new Promise((resolve) => setTimeout(resolve, 60));

function setup(): { root: HTMLDivElement } {
  const root = document.createElement("div");
  document.body.append(root);
  createExamplePage(root, {
    branding: {
      pkg: "/storage",
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

const labeledReadout = (element: HTMLElement, label: string) => {
  const readout = [...element.querySelectorAll<HTMLElement>(".readout")].find(
    (item) => item.querySelector(".readout-label")?.textContent === label,
  )!;
  return readout.querySelector<HTMLElement>(".readout-value, .readout-text")!;
};

describe("storage 示例页", () => {
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

  it("persist-basics 卡片：写入后状态与落盘 envelope 同步更新", async () => {
    const { root } = setup();
    await tick();
    const element = card(root, "persist-basics");

    actionButton(element, "改 theme").click();
    await tick();
    expect(labeledReadout(element, "getState()").textContent).toContain('"theme":"dark"');
    expect(labeledReadout(element, "落盘 envelope").textContent).toBe('{"state":{"theme":"dark","count":0},"version":0}');
    expect(element.querySelectorAll(".log-entry").length).toBeGreaterThan(0);
  });

  it("日志与源码 tabs 互斥，再点同一个则收起", async () => {
    const { root } = setup();
    await tick();
    const element = card(root, "memory-backend");
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

  it("memory-backend 卡片：setItem 后 getItem 读回，removeItem 后变 null", async () => {
    const { root } = setup();
    await tick();
    const element = card(root, "memory-backend");

    actionButton(element, "setItem(key, value)").click();
    actionButton(element, "getItem(key)").click();
    await tick();
    expect(labeledReadout(element, 'getItem("session:theme")').textContent).toBe('"dark"');

    actionButton(element, "removeItem(key)").click();
    actionButton(element, "getItem(key)").click();
    await tick();
    expect(labeledReadout(element, 'getItem("session:theme")').textContent).toBe("null");
  });

  it("skip-hydration 卡片：rehydrate 后 hasHydrated 与状态就位", async () => {
    const { root } = setup();
    await tick();
    const element = card(root, "skip-hydration");
    expect(labeledReadout(element, "hasHydrated()").textContent).toBe("false");
    expect(labeledReadout(element, "当前 theme").textContent).toBe("light");

    actionButton(element, "rehydrate()").click();
    await tick();
    expect(labeledReadout(element, "hasHydrated()").textContent).toBe("true");
    expect(labeledReadout(element, "当前 theme").textContent).toBe("dark");
    expect(element.textContent).toContain("水合完成");
  });
});
