import { describe, expect, it } from "rstack/test";
import { createExamplePage } from "@slux/shell-example";
import { demos, groups } from "../src/demos";

const tick = () => new Promise((resolve) => setTimeout(resolve, 60));
const supported = typeof BroadcastChannel === "function";

function setup(): { root: HTMLDivElement } {
  const root = document.createElement("div");
  document.body.append(root);
  createExamplePage(root, {
    branding: {
      pkg: "/tab-sync",
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

describe("tab-sync 示例页", () => {
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

  it("pair-sync 卡片：双实例本地写入生效，环境不支持时给出降级提示", async () => {
    const { root } = setup();
    await tick();
    const element = card(root, "pair-sync");
    const values = () => [...element.querySelectorAll<HTMLElement>(".readout-value")];

    action(element, "A + 1").click();
    await tick();
    expect(values()[0]!.textContent).toBe("1");
    expect(element.querySelectorAll(".log-entry").length).toBeGreaterThan(0);

    if (supported) {
      action(element, "A + 1").click();
      await tick();
      expect(values()[1]!.textContent).toBe("2");
    } else {
      expect(element.textContent).toContain("缺少 BroadcastChannel");
      expect(values()[1]!.textContent).toBe("0");
    }
  });

  it("日志与源码 tabs 互斥，再点同一个则收起", async () => {
    const { root } = setup();
    await tick();
    const element = card(root, "wire-inspector");
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

  it("channel-lifecycle 卡片：viewer 销毁后掉线，重建后恢复在线", async () => {
    const { root } = setup();
    await tick();
    const element = card(root, "channel-lifecycle");

    action(element, "销毁 viewer").click();
    await tick();
    expect(element.textContent).toContain("已掉线");
    expect([...element.querySelectorAll<HTMLElement>(".readout-value")][1]!.textContent).toBe("—");

    action(element, "重建 viewer").click();
    await tick();
    expect(element.textContent).toContain("在线");
  });

  it("conflict-resolver 卡片：keepHighest 拒绝较小值、接受较大值", async () => {
    const { root } = setup();
    await tick();
    const element = card(root, "conflict-resolver");
    const values = () => [...element.querySelectorAll<HTMLElement>(".readout-value")];
    expect(values()[1]!.textContent).toBe("10");

    action(element, "writer: + 1").click();
    await tick();
    expect(values()[0]!.textContent).toBe("1");
    if (supported) {
      expect(values()[1]!.textContent).toBe("10");
    }

    action(element, "writer: + 25").click();
    await tick();
    expect(values()[0]!.textContent).toBe("26");
    if (supported) {
      expect(values()[1]!.textContent).toBe("26");
    }
  });
});
