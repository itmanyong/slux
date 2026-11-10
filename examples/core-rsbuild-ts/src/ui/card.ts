import type { DemoAction, DemoDefinition, DemoInstance, DemoReadout, LogTone } from "@slux/kit-example";
import { highlight } from "./highlight.js";
import type { DemoSource } from "./sources.js";

const ICON_RESET = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" aria-hidden="true"><path d="M13.2 8a5.2 5.2 0 1 1-1.6-3.73"/><path d="M13.2 2.4V5.6H10"/></svg>`;
const MAX_LOGS = 80;

export interface DemoCardOptions {
  index: number;
  source: DemoSource | undefined;
  /** 每次产生运行记录时通知外层统计。 */
  onLog: (tone: LogTone) => void;
}

const createReadout = (readout: DemoReadout) => {
  const element = document.createElement("div");
  element.className = "readout";
  if (readout.kind !== "metric") element.classList.add("is-wide");

  const label = document.createElement("span");
  label.className = "readout-label";
  label.textContent = readout.label;
  element.append(label);

  if (readout.kind === "metric") {
    if (readout.emphasis) element.classList.add("is-emphasis");
    const value = document.createElement("div");
    value.className = "readout-value";
    element.append(value);
    return {
      element,
      update: () => {
        value.textContent = readout.read();
      },
    };
  }

  if (readout.kind === "text") {
    const value = document.createElement("div");
    value.className = "readout-text";
    element.append(value);
    return {
      element,
      update: () => {
        value.textContent = readout.read();
      },
    };
  }

  if (readout.kind === "list") {
    const list = document.createElement("div");
    list.className = "readout-list";
    element.append(list);
    return {
      element,
      update: () => {
        list.replaceChildren(
          ...readout.read().map((item) => {
            const tag = document.createElement("span");
            tag.className = "readout-tag";
            tag.textContent = item;
            return tag;
          }),
        );
      },
    };
  }

  const flow = document.createElement("div");
  flow.className = "flow";
  element.append(flow);
  return {
    element,
    update: () => {
      const nodes: Node[] = [];
      readout.read().forEach((node, index) => {
        if (index > 0) {
          const arrow = document.createElement("span");
          arrow.className = "flow-arrow";
          arrow.textContent = "→";
          nodes.push(arrow);
        }
        const box = document.createElement("div");
        box.className = "flow-node";
        const boxLabel = document.createElement("div");
        boxLabel.className = "flow-node-label";
        boxLabel.textContent = node.label;
        const boxValue = document.createElement("div");
        boxValue.className = "flow-node-value";
        boxValue.textContent = node.value;
        box.append(boxLabel, boxValue);
        nodes.push(box);
      });
      flow.replaceChildren(...nodes);
    },
  };
};

/**
 * 一张示例卡片：header 放标题与控制，content 放读数与操作，footer 放日志与源码。
 * 卡片只负责 DOM，不包含任何示例逻辑；逻辑全部来自示例层。
 */
export class DemoCard {
  readonly element: HTMLElement;
  readonly #demo: DemoDefinition;
  readonly #options: DemoCardOptions;
  readonly #readouts: { update(): void }[] = [];
  readonly #logList: HTMLOListElement;
  readonly #logEmpty: HTMLElement;
  readonly #logScroll: HTMLElement;
  readonly #logCount: HTMLElement;
  readonly #logTab: HTMLButtonElement;
  readonly #logPanel: HTMLElement;
  readonly #codeTab: HTMLButtonElement;
  readonly #codePanel: HTMLElement;
  readonly #copyButton: HTMLButtonElement;

  #instance: DemoInstance | undefined;
  #unsubscribe: (() => void) | undefined;
  #logs = 0;
  #panel: "log" | "code" | null = null;

  constructor(demo: DemoDefinition, options: DemoCardOptions) {
    this.#demo = demo;
    this.#options = options;

    const element = document.createElement("article");
    element.className = "card";
    element.dataset["demo"] = demo.id;
    element.setAttribute("aria-labelledby", `demo-${demo.id}-title`);

    const head = document.createElement("header");
    head.className = "card-head";
    head.innerHTML = `
      <span class="card-index">${String(options.index + 1).padStart(2, "0")}</span>
      <div class="card-heading">
        <h3 class="card-title" id="demo-${demo.id}-title"></h3>
        <code class="card-api"></code>
      </div>
      <button class="card-reset" type="button" title="重置这张卡片" aria-label="重置「${demo.title}」">${ICON_RESET}</button>
    `;
    head.querySelector<HTMLElement>(".card-title")!.textContent = demo.title;
    head.querySelector<HTMLElement>(".card-api")!.textContent = demo.apiLabel;

    const body = document.createElement("div");
    body.className = "card-body";
    const summary = document.createElement("p");
    summary.className = "card-summary";
    summary.textContent = demo.summary;
    const readoutsBox = document.createElement("div");
    readoutsBox.className = "readouts";
    const actionsBox = document.createElement("div");
    actionsBox.className = "actions";
    body.append(summary, readoutsBox, actionsBox);
    if (demo.note) {
      const note = document.createElement("p");
      note.className = "card-note";
      note.textContent = demo.note;
      body.append(note);
    }

    const foot = document.createElement("footer");
    foot.className = "card-foot";
    foot.innerHTML = `
      <div class="foot-tabs">
        <button class="foot-tab" type="button" data-panel="log" aria-expanded="false" aria-controls="demo-${demo.id}-log">运行日志<span class="foot-tab-count">0</span></button>
        <button class="foot-tab" type="button" data-panel="code" aria-expanded="false" aria-controls="demo-${demo.id}-code">源码</button>
      </div>
      <div class="panel" data-body="log" id="demo-${demo.id}-log" hidden>
        <div class="panel-scroll">
          <p class="log-empty" data-log-empty>还没有运行记录。</p>
          <ol class="log" aria-label="运行日志"></ol>
        </div>
      </div>
      <div class="panel" data-body="code" id="demo-${demo.id}-code" hidden>
        <div class="code-head"><span class="code-path"></span><button class="copy-button" type="button">复制</button></div>
        <pre class="code-body"><code></code></pre>
      </div>
    `;

    element.append(head, body, foot);
    this.element = element;

    this.#logList = foot.querySelector<HTMLOListElement>(".log")!;
    this.#logEmpty = foot.querySelector<HTMLElement>("[data-log-empty]")!;
    this.#logScroll = foot.querySelector<HTMLElement>(".panel-scroll")!;
    this.#logCount = foot.querySelector<HTMLElement>(".foot-tab-count")!;
    this.#logTab = foot.querySelector<HTMLButtonElement>('[data-panel="log"]')!;
    this.#logPanel = foot.querySelector<HTMLElement>('[data-body="log"]')!;
    this.#codeTab = foot.querySelector<HTMLButtonElement>('[data-panel="code"]')!;
    this.#codePanel = foot.querySelector<HTMLElement>('[data-body="code"]')!;
    this.#copyButton = foot.querySelector<HTMLButtonElement>(".copy-button")!;

    head.querySelector<HTMLButtonElement>(".card-reset")!.addEventListener("click", () => {
      this.reset();
    });
    this.#logTab.addEventListener("click", () => this.#togglePanel("log"));
    this.#codeTab.addEventListener("click", () => this.#togglePanel("code"));

    this.#mountSource(options.source);
    this.#start(readoutsBox, actionsBox);
  }

  reset(): void {
    this.#teardown();
    this.#logs = 0;
    this.#logList.replaceChildren();
    this.#logEmpty.hidden = false;
    this.#logCount.textContent = "0";
    this.#logTab.classList.remove("has-new");

    const readoutsBox = this.element.querySelector<HTMLElement>(".readouts")!;
    const actionsBox = this.element.querySelector<HTMLElement>(".actions")!;
    readoutsBox.replaceChildren();
    actionsBox.replaceChildren();
    this.#readouts.length = 0;

    this.#start(readoutsBox, actionsBox);
  }

  setVisible(visible: boolean): void {
    this.element.hidden = !visible;
  }

  destroy(): void {
    this.#teardown();
    this.element.remove();
  }

  #start(readoutsBox: HTMLElement, actionsBox: HTMLElement): void {
    this.#instance = this.#demo.create({
      log: (text, tone = "info") => this.#appendLog(text, tone),
    });

    for (const readout of this.#instance.readouts) {
      const created = createReadout(readout);
      this.#readouts.push(created);
      readoutsBox.append(created.element);
    }

    for (const action of this.#instance.actions) {
      actionsBox.append(this.#createAction(action));
    }

    this.#unsubscribe = this.#instance.subscribe?.(() => this.render());
    this.render();
  }

  #teardown(): void {
    this.#unsubscribe?.();
    this.#unsubscribe = undefined;
    this.#instance?.dispose?.();
    this.#instance = undefined;
  }

  #createAction(action: DemoAction): HTMLElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = action.primary ? "action is-primary" : "action";
    button.textContent = action.label;
    if (action.title) button.title = action.title;

    if (!action.input) {
      button.addEventListener("click", () => this.#run(action, ""));
      return button;
    }

    const field = document.createElement("div");
    field.className = "action-field";
    const input = document.createElement("input");
    input.type = action.input.kind === "number" ? "number" : "text";
    input.placeholder = action.input.placeholder;
    input.value = action.input.value;
    input.setAttribute("aria-label", action.input.placeholder);
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") this.#run(action, input.value);
    });
    field.append(input, button);
    button.addEventListener("click", () => this.#run(action, input.value));
    return field;
  }

  #run(action: DemoAction, input: string): void {
    try {
      action.run(input);
    } catch (error) {
      // 示例通常自行捕获；这里是兜底，避免一次异常让整张卡片失去响应。
      this.#appendLog(error instanceof Error ? error.message : String(error), "error");
    }
    this.render();
  }

  render(): void {
    for (const readout of this.#readouts) readout.update();
  }

  #appendLog(text: string, tone: LogTone): void {
    const entry = document.createElement("li");
    entry.className = `log-entry tone-${tone}`;
    const dot = document.createElement("span");
    dot.className = "log-dot";
    dot.setAttribute("aria-hidden", "true");
    const message = document.createElement("span");
    message.className = "log-text";
    message.textContent = text;
    entry.append(dot, message);
    this.#logList.append(entry);

    this.#logs += 1;
    this.#logEmpty.hidden = true;
    while (this.#logList.childElementCount > MAX_LOGS) this.#logList.firstElementChild?.remove();
    this.#logCount.textContent = String(this.#logs);
    this.#options.onLog(tone);

    if (this.#panel === "log") {
      this.#logScroll.scrollTop = this.#logScroll.scrollHeight;
    } else {
      this.#logTab.classList.add("has-new");
    }
  }

  /** 日志与源码是互斥的两个面板：点一个就换掉另一个，再点同一个则收起。 */
  #togglePanel(next: "log" | "code"): void {
    const opened = this.#panel === next ? null : next;
    this.#panel = opened;

    const logOpen = opened === "log";
    const codeOpen = opened === "code";
    this.#logTab.setAttribute("aria-expanded", String(logOpen));
    this.#codeTab.setAttribute("aria-expanded", String(codeOpen));
    this.#logPanel.hidden = !logOpen;
    this.#codePanel.hidden = !codeOpen;

    if (logOpen) {
      this.#logTab.classList.remove("has-new");
      this.#logScroll.scrollTop = this.#logScroll.scrollHeight;
    }
  }

  #mountSource(source: DemoSource | undefined): void {
    const path = this.element.querySelector<HTMLElement>(".code-path")!;
    const code = this.element.querySelector<HTMLElement>(".code-body code")!;

    if (!source) {
      path.textContent = "未登记最小复现";
      code.parentElement?.classList.add("code-missing");
      code.textContent = "该示例还没有登记 .repro.ts 片段，源码面板不可用。";
      this.#copyButton.disabled = true;
      return;
    }

    path.textContent = source.path;
    path.title = source.path;
    code.innerHTML = highlight(source.code);

    this.#copyButton.addEventListener("click", () => {
      void navigator.clipboard.writeText(source.code).then(() => {
        this.#copyButton.textContent = "已复制";
        window.setTimeout(() => {
          this.#copyButton.textContent = "复制";
        }, 1200);
      });
    });
  }
}
