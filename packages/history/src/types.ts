import type { ReadonlySignal } from "@slux/core";
import type { Middleware } from "@slux/store";

export type HistoryOptions = {
  /** 最多保存的撤销快照数，默认 100；0 表示不保存。 */
  readonly maxDepth?: number;
};

export type HistoryMiddleware<T> = Required<Pick<Middleware<T>, "name" | "init" | "onSet" | "onDestroy">> & {
  undo(): void;
  redo(): void;
  clear(): void;
  readonly canUndo: ReadonlySignal<boolean>;
  readonly canRedo: ReadonlySignal<boolean>;
};
