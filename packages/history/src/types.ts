/**
 * @file history 包的对外类型：撤销/重做配置项与 history 中间件接口。
 */
import type { ReadonlySignal } from "@slux/core";
import type { Middleware } from "@slux/store";

/**
 * 创建 history 中间件时的可选配置。
 */
export type HistoryOptions = {
  /** 最多保存的撤销快照数，默认 100；0 表示不保存。 */
  readonly maxDepth?: number;
};

/**
 * history 中间件接口：在 Middleware 的 name/init/onSet/onDestroy 生命周期钩子（强制必选）之上，
 * 补充撤销/重做/清空与 canUndo/canRedo 可用性信号。
 */
export type HistoryMiddleware<T> = Required<Pick<Middleware<T>, "name" | "init" | "onSet" | "onDestroy">> & {
  /** 撤销上一次状态变更；无可撤销项时的行为由实现决定。 */
  undo(): void;
  /** 重做上一次被撤销的变更；无可重做项时的行为由实现决定。 */
  redo(): void;
  /** 清空撤销与重做栈。 */
  clear(): void;
  /** 是否可撤销的只读信号。 */
  readonly canUndo: ReadonlySignal<boolean>;
  /** 是否可重做的只读信号。 */
  readonly canRedo: ReadonlySignal<boolean>;
};
