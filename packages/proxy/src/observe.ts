/**
 * @file observe：把无返回值的用户函数接入 core 的 effect，使其读取的响应式值变化时自动重跑。
 */
import { effect } from "@slux/core";

/**
 * 创建一个观察器：fn 在其读取的响应式值变化时自动重新执行。
 * @param fn 要被观察的函数，其执行期间的响应式读取会被追踪。
 * @returns 停止观察并释放依赖的销毁句柄。
 * @remarks 包装回调恒返回 undefined，避免 fn 的返回值被 effect 误当作清理函数。
 * @see effect
 */
export function observe(fn: () => void): () => void {
  return effect(() => {
    fn();
  });
}
