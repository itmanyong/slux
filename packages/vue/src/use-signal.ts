/**
 * @file Vue 适配层的核心 signal hook：把 @slux/core 的 Subscribable 桥接为 Vue 的只读 shallowRef，
 * 供 atom / flux / rxjs / state-machine / proxy / store 等适配层复用。
 * 订阅延迟到组件 mounted 时启动，SSR 阶段不建立订阅。
 */

import { getCurrentInstance, getCurrentScope, onMounted, onScopeDispose, shallowReadonly, shallowRef } from "vue";
import type { Ref } from "vue";
import { effect } from "@slux/core";
import type { Subscribable } from "@slux/core";

/**
 * 把任意 Subscribable 桥接为 Vue 的只读 shallowRef；读取其 .value 取得当前值。
 * 用 shallowRef 保存外部值、由 source.subscribe 把变更写入 value.value；订阅经 onMounted
 * 延迟到客户端挂载后启动，使不执行 mounted 的 SSR 渲染不建立订阅；清理统一交给 onScopeDispose。
 * @typeParam T source 承载的值类型，也是 Ref 的值类型
 * @param source 可读且可订阅的数据源，调用时即被读取一次作为初始值
 * @returns 只读浅层 Ref<T>
 * @throws 不在 setup 或 effectScope 内（无 effectScope）时抛出 Error
 * @remarks 组件实例内订阅延迟到 onMounted 启动，非组件 scope 立即启动；订阅建立时
 *          按先订阅、再建 effect、后同步当前值的顺序执行，清理按逆序执行。
 * @see onScopeDispose
 * @see onMounted
 */
export function useSignal<T>(source: Subscribable<T>): Readonly<Ref<T>> {
  if (!getCurrentScope()) throw new Error("useSignal 必须在 Vue setup 或 effectScope 中调用"); // 无 scope 时无法注册 onScopeDispose
  const value = shallowRef<T>(source.get());

  const start = () => {
    const unsubscribe = source.subscribe((next) => {
      value.value = next;
    });
    // computed 需要主动求值；真正的通知仍走 subscribe，兼容外部 Subscribable。
    const dispose = effect(() => {
      source.get();
    });
    // 订阅与 effect 建立后重读当前值，避免建立窗口内的变更丢失。
    value.value = source.get();
    return () => {
      unsubscribe();
      dispose();
    };
  };

  let stop: (() => void) | undefined;
  if (getCurrentInstance()) {
    onMounted(() => {
      stop = start();
    });
  } else {
    stop = start();
  }

  onScopeDispose(() => stop?.()); // stop 未生成（如 SSR 未挂载）时跳过清理
  return shallowReadonly(value);
}
