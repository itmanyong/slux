/**
 * @file 把 @slux/store 的 StoreApi 注入为 Angular 的 Signal，支持可选的 selector 派生。
 */

import type { Signal } from "@angular/core";
import type { StoreApi } from "@slux/store";
import { toAngularSignal } from "./bridge.js";
import type { ToAngularSignalOptions } from "./bridge.js";

/**
 * store 注入的可选转换配置类型，等价于 `ToAngularSignalOptions<T>`。
 * 单独命名是为了让 injectStore 的签名表达「这是本适配层的选项」而非直接暴露 bridge 的类型。
 * @typeParam T 转换后 Signal 的值类型；无 selector 时为 State，有 selector 时为 Selection
 * @see ToAngularSignalOptions 底层的选项类型
 */
export type InjectStoreOptions<T> = ToAngularSignalOptions<T>;
/**
 * 无 selector 的注入重载：把 store 的完整状态转换为 Signal<State>。
 * @typeParam State store 的状态类型，约束为 object
 * @param store 待转换的 StoreApi 实例
 * @param options 可选的转换配置
 * @returns 只读 Signal<State>，订阅清理约束同 toAngularSignal
 * @see injectStore 带 selector 的重载
 */
export function injectStore<State extends object>(store: StoreApi<State>, options?: InjectStoreOptions<State>): Signal<State>;
/**
 * 带 selector 的注入重载：把 store 状态经 selector 投影后转换为 Signal<Selection>。
 * @typeParam State store 的状态类型，约束为 object
 * @typeParam Selection selector 返回值类型，也是结果 Signal 的值类型
 * @param store 待转换的 StoreApi 实例
 * @param selector 投影函数，接收完整状态并返回派生值
 * @param options 可选的转换配置，值类型对应 Selection
 * @returns 只读 Signal<Selection>，订阅清理约束同 toAngularSignal
 */
export function injectStore<State extends object, Selection>(
  store: StoreApi<State>,
  selector: (state: State) => Selection,
  options?: InjectStoreOptions<Selection>,
): Signal<Selection>;
/**
 * 上述重载的实现：第二参数为函数时视为 selector，否则（含 undefined）视为 options，
 * 让两种重载共用一份实现。
 * @typeParam State store 的状态类型，约束为 object
 * @typeParam Selection selector 返回值类型，默认与 State 一致（无 selector 场景）
 * @param store 待转换的 StoreApi 实例
 * @param selectorOrOptions 为函数时是 selector，否则是 options
 * @param options 仅 selector 分支使用的转换配置
 * @returns 只读 Signal，值类型为 State 或 Selection 取决于是否提供 selector
 */
export function injectStore<State extends object, Selection = State>(
  store: StoreApi<State>,
  selectorOrOptions?: ((state: State) => Selection) | InjectStoreOptions<State>,
  options?: InjectStoreOptions<Selection>,
): Signal<State | Selection> {
  if (typeof selectorOrOptions !== "function") return toAngularSignal(store, selectorOrOptions);
  const selector = selectorOrOptions;
  return toAngularSignal(
    {
      /** 读取当前值：取 store 的完整状态后经 selector 投影。 */
      get: () => selector(store.getState()),
      /**
       * 订阅变化：把 store 订阅包装为原子订阅形态。
       * @param notify 状态变化时以投影后的值调用的回调
       * @returns 取消订阅句柄
       */
      subscribe: (notify) => store.subscribe((state) => notify(selector(state))),
    },
    options,
  );
}
