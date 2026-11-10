const MIN_COLUMN_WIDTH = 348;
const MAX_COLUMNS = 4;

/**
 * 多列瀑布流：按测量高度把卡片放进当前最短的列。
 *
 * 列数只由容器宽度决定；展开源码带来的高度变化不触发重排，
 * 因此正在阅读的列不会被重新打散。宽度变化引起的重排推迟到下一帧，
 * 避免在 ResizeObserver 回调里改 DOM 造成循环通知。
 */
export class Masonry {
  readonly #container: HTMLElement;
  #items: HTMLElement[] = [];
  #width = 0;
  #pending = 0;

  constructor(container: HTMLElement) {
    this.#container = container;
    // jsdom 等测试环境没有 ResizeObserver，只靠显式 render() 布局。
    if (typeof ResizeObserver === "undefined") return;
    new ResizeObserver((entries) => {
      const width = Math.round(entries[0]?.contentRect.width ?? 0);
      if (width === 0 || width === this.#width) return;
      this.#width = width;
      this.#schedule();
    }).observe(container);
  }

  render(items: HTMLElement[]): void {
    this.#items = items;
    this.layout();
  }

  #schedule(): void {
    if (this.#pending !== 0) return;
    this.#pending = requestAnimationFrame(() => {
      this.#pending = 0;
      this.layout();
    });
  }

  private layout(): void {
    const width = this.#container.clientWidth;
    if (width === 0) {
      // 无法测量容器宽度（如 jsdom），退化为单列，保证卡片仍进入文档。
      this.#container.replaceChildren(...this.#items);
      return;
    }
    this.#width = width;

    const count = Math.max(1, Math.min(MAX_COLUMNS, Math.floor(width / MIN_COLUMN_WIDTH)));
    const columns = Array.from({ length: count }, () => {
      const column = document.createElement("div");
      column.className = "masonry-column";
      return column;
    });

    // 先把空列放进容器，下面的高度测量才拿得到真实值。
    this.#container.replaceChildren(...columns);

    for (const item of this.#items) {
      let shortest = columns[0]!;
      for (const column of columns) {
        if (column.getBoundingClientRect().height < shortest.getBoundingClientRect().height) {
          shortest = column;
        }
      }
      shortest.append(item);
    }
  }
}
