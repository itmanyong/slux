import { describe, expect, it } from "rstack/test";
import { createExamplePage } from "@slux/shell-example";
import { demos, groups } from "../src/demos";

const tick = () => new Promise((resolve) => setTimeout(resolve, 60));

function setup(): { root: HTMLDivElement } {
  const root = document.createElement("div");
  document.body.append(root);
  createExamplePage(root, {
    branding: {
      pkg: "/shared",
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

const emphasisValue = (element: HTMLElement) => element.querySelector(".readout.is-emphasis .readout-value")!.textContent;

const action = (element: HTMLElement, label: string) =>
  [...element.querySelectorAll<HTMLButtonElement>(".action")].find((button) => button.textContent === label)!;

describe("shared 示例页", () => {
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

  it("run-clean 卡片：RUN ALL 执行全部任务并产生日志", async () => {
    const { root } = setup();
    await tick();
    const element = card(root, "run-clean");
    expect(emphasisValue(element)).toBe("0 / 3");
    action(element, "RUN ALL").click();
    await tick();
    expect(emphasisValue(element)).toBe("3 / 3");
    expect(element.querySelectorAll(".log-entry").length).toBeGreaterThan(0);
    expect(element.querySelectorAll(".readout-tag").length).toBe(3);
  });

  it("日志与源码 tabs 互斥，再点同一个则收起", async () => {
    const { root } = setup();
    await tick();
    const element = card(root, "run-collect");
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

  it("run-collect 卡片：失败任务被收拢，其余任务照常完成", async () => {
    const { root } = setup();
    await tick();
    const element = card(root, "run-collect");
    action(element, "RUN ALL").click();
    await tick();
    expect(emphasisValue(element)).toBe("3 / 5");
    expect([...element.querySelectorAll(".readout-value")].some((node) => node.textContent === "2")).toBe(true);
    expect(element.querySelectorAll(".readout-tag").length).toBe(3);
    expect(element.querySelector(".readout-text")!.textContent).toBe("磁盘已满");
    expect([...element.querySelectorAll(".log-entry")].some((node) => node.textContent!.includes("AggregateError"))).toBe(true);
  });

  it("auto-imports 卡片：prefix 把 signal 映射为 useSignal", async () => {
    const { root } = setup();
    await tick();
    const element = card(root, "auto-imports");
    const input = element.querySelector<HTMLInputElement>(".action-field input")!;
    input.value = "use";
    action(element, "createAutoImports").click();
    await tick();
    expect(element.querySelector(".readout-text")!.textContent).toBe(
      JSON.stringify({
        "@slux/core": [
          ["signal", "useSignal"],
          ["computed", "useComputed"],
        ],
      }),
    );
  });
});
