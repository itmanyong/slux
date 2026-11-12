/**
 * @file 外部源绑定核心：把「读取 / 订阅 / 相等比较」三个回调桥接为只读 Ref，并在组件或 effect scope 生命周期内托管订阅的建立与释放。
 */
import { getCurrentInstance, getCurrentScope, onMounted, onUnmounted, onScopeDispose, shallowRef } from "@actview/core";
import type { Ref } from "@actview/core";

/**
 * 把外部可变源桥接为 actview 的只读 Ref：以 get 读快照、以 subscribe 订阅变更、以 equals 判定是否刷新，订阅随组件或 effect scope 生命周期建立与释放。
 * 集中管理生命周期，使各适配 hook（store / proxy 等）只需提供回调，无需各自处理订阅注册、SSR 与注销。
 * @typeParam T 外部源的值类型，也是返回 Ref 的值类型
 * @param get 读取当前值的回调，初始取值与每次订阅通知时调用，应只做读取、不应有副作用
 * @param subscribe 注册变更通知的回调，接收注入的 notify 刷新回调，须返回一个注销函数
 * @param equals 比较新旧值的函数，返回 true 表示相等、跳过写回；默认 Object.is
 * @returns 只读 Ref<T>，值为 get() 的快照并随订阅刷新；SSR 场景下仅有初始快照、不会刷新
 * @throws 当既无活动组件实例、也无 effect scope 时抛出 Error，因为没有可挂载注销钩子的宿主
 * @remarks 组件实例路径把订阅延迟到 onMounted 建立、onUnmounted 释放；effect scope 路径立即建立订阅并交给 onScopeDispose 释放；start 内先 subscribe 后 update，防止订阅建立窗口内的变更被漏掉。
 * @see useStore、useSnapshot 等适配 hook 均以本函数为绑定入口
 */
export function bindExternal<T>(
  get: () => T,
  subscribe: (notify: () => void) => () => void,
  equals: (a: T, b: T) => boolean = Object.is,
): Readonly<Ref<T>> {
  // 组件实例与 effect scope 决定订阅挂在哪套生命周期钩子上；两者皆无时没有可挂载注销钩子的宿主，继续会泄漏订阅。
  const instance = getCurrentInstance();
  if (!instance && !getCurrentScope()) throw new Error("Slux bindings require an active ActView component or effect scope.");
  const value = shallowRef<T>(get());
  const update = () => {
    const next = get();
    if (!equals(value.value, next)) value.value = next;
  };
  const start = () => {
    const dispose = subscribe(update);
    update(); // 订阅建立后立即同步一次，覆盖注册期间可能错过的变更
    return dispose;
  };
  if (instance) {
    // SSR 没有 effect scope 且不执行 mounted，订阅须延迟到客户端挂载后建立，服务端渲染时 value 保持初始快照。
    let dispose: (() => void) | undefined;
    onMounted(() => {
      dispose = start();
    });
    onUnmounted(() => dispose?.());
  } else {
    onScopeDispose(start()); // onScopeDispose 接收的是 dispose 函数本身，而非回调
  }
  return value;
}
