/**
 * @file history 中间件实现：以 past/future 两个栈记录状态快照，提供撤销、重做、清空与可用性信号。
 */
import { batch, signal } from "@slux/core";
import type { MiddlewareAPI } from "@slux/store";
import type { HistoryMiddleware, HistoryOptions } from "./types.js";

/**
 * 创建一个 history 中间件，记录状态变更历史并暴露撤销/重做/清空能力与 canUndo/canRedo 信号。
 * @param options 可选配置，主要提供 maxDepth
 * @returns 实现 HistoryMiddleware<T> 的中间件对象
 * @remarks 撤销/重做经完整中间件链回写状态，回写期间以 traveling 标记抑制递归记录；
 *          新写入会使旧重做路径失效（清空 future），写入被后续中间件阻断时不消费历史。
 * @see HistoryMiddleware
 * @see HistoryOptions
 */
export function history<T>(options?: HistoryOptions): HistoryMiddleware<T> {
  const maxDepth = options?.maxDepth ?? 100;
  // 快照栈：索引越大越新，末尾为最近一次状态。
  const past: T[] = [];
  const future: T[] = [];
  const canUndo = signal(false);
  const canRedo = signal(false);
  // 由 init 注入、onDestroy 释放；撤销/重做转移状态时依赖它读写。
  let api: MiddlewareAPI<T> | undefined;
  // 撤销/重做进行中置真，防止回写状态被 onSet 再次记录进历史造成递归。
  let traveling = false;

  /**
   * 依据两个栈是否非空，用 batch 批量刷新 canUndo/canRedo 信号。
   */
  function updateSignals(): void {
    batch(() => {
      canUndo.set(past.length > 0);
      canRedo.set(future.length > 0);
    });
  }

  /**
   * 在 past/future 之间转移一次状态：从 from 取最近快照回写，并把转移前的当前状态推入 to。
   * @param from 源栈，末尾为要恢复的快照
   * @param to 目标栈，保存转移前的当前状态
   */
  function travel(from: T[], to: T[]): void {
    // 无 api、源栈空或已有转移进行中时不执行，防止重入。
    if (api === undefined || from.length === 0 || traveling) return;
    // 固定 api 引用，避免转移期间被 onDestroy 置空影响本次流程。
    const currentApi = api;
    const current = currentApi.getState();
    const previous = from[from.length - 1] as T;
    traveling = true;
    try {
      // 经完整中间件链回写，让持久化、调试等其它中间件也能感知撤销/重做。
      currentApi.setState(() => previous);
    } finally {
      // 状态未变说明写入被通知中的 clear/destroy 取消，此时不移动栈元素。
      if (api !== undefined && from.length > 0 && currentApi.getState() !== current) {
        from.pop();
        to.push(current);
      }
      traveling = false;
      updateSignals();
    }
  }

  /**
   * 清空撤销与重做栈并刷新信号。
   */
  function clear(): void {
    past.length = 0;
    future.length = 0;
    updateSignals();
  }

  return {
    /** 中间件名称，恒为 "history"。 */
    name: "history",
    /**
     * 初始化钩子：保存注入的中间件 API，供状态转移时读写状态。
     */
    init(middlewareApi) {
      api = middlewareApi;
    },
    /**
     * 写入钩子：写入前记录当前状态快照，写入被阻断时回滚该记录。
     */
    onSet(middlewareApi, next, partial) {
      // 撤销/重做回写期间不再记录历史，防止无限递归。
      if (traveling) return next(partial);
      const previous = middlewareApi.getState();
      const index = past.length;
      past.push(previous);
      try {
        next(partial);
      } finally {
        // 状态未变说明写入被后续中间件阻断，定点移除刚插入的快照；否则清空 future。
        if (middlewareApi.getState() === previous) past.splice(index, 1);
        else future.length = 0;
        // 超出上限时从栈底删除最旧快照。
        if (past.length > maxDepth) past.splice(0, past.length - maxDepth);
        updateSignals();
      }
    },
    /**
     * 销毁钩子：释放 api 引用并清空历史栈。
     */
    onDestroy() {
      api = undefined;
      clear();
    },
    /** 撤销：回写 past 的快照，当前状态存入 future。 */
    undo: () => travel(past, future),
    /** 重做：回写 future 的快照，当前状态存入 past。 */
    redo: () => travel(future, past),
    clear,
    canUndo,
    canRedo,
  };
}
