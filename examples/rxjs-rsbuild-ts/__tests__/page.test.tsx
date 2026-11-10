import { describe, expect, it } from "rstack/test";
import { createExamplePage } from "@slux/shell-example";
import { demos, groups } from "../src/demos";

const tick = () => new Promise((resolve) => setTimeout(resolve, 60));

function setup(): { root: HTMLDivElement } {
  const root = document.createElement("div");
  document.body.append(root);
  createExamplePage(root, {
    branding: {
      pkg: "/rxjs",
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

describe("rxjs 示例页", () => {
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

  it("to-basic 卡片：SET 写入 source，Observable 同步发射", async () => {
    const { root } = setup();
    await tick();
    const element = card(root, "to-basic");
    const input = element.querySelector<HTMLInputElement>(".action-field input")!;
    input.value = "world";
    action(element, "SET").click();
    await tick();
    expect(emphasisValue(element)).toBe("world");
    expect(element.querySelectorAll(".log-entry").length).toBeGreaterThan(0);
    expect(element.querySelectorAll(".readout-tag").length).toBeGreaterThan(1);
  });

  it("日志与源码 tabs 互斥，再点同一个则收起", async () => {
    const { root } = setup();
    await tick();
    const element = card(root, "from-subject");
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

  it("from-subject 卡片：PUSH → value 更新，COMPLETE → status complete", async () => {
    const { root } = setup();
    await tick();
    const element = card(root, "from-subject");
    const input = element.querySelector<HTMLInputElement>(".action-field input")!;

    input.value = "ping";
    action(element, "PUSH").click();
    await tick();
    expect(emphasisValue(element)).toBe("ping");
    expect([...element.querySelectorAll(".readout-text")].some((node) => node.textContent === "active")).toBe(true);

    action(element, "COMPLETE").click();
    await tick();
    expect([...element.querySelectorAll(".readout-text")].some((node) => node.textContent === "complete")).toBe(true);
  });

  it("round-trip 卡片：写入 source，镜像信号同步跟随", async () => {
    const { root } = setup();
    await tick();
    const element = card(root, "round-trip");
    const input = element.querySelector<HTMLInputElement>(".action-field input")!;
    input.value = "sync";
    action(element, "SET").click();
    await tick();
    const values = [...element.querySelectorAll(".readout-value")].map((node) => node.textContent);
    expect(values).toContain("sync");
    expect(values).toContain("sync");
  });
});
