/**
 * @file 把 @slux/core 的 Subscribable 桥接为 vitarx 侧的只读 ShallowRef，是各状态源适配 hook 的公共接入点。
 * 额外建立 effect 主动读取 source，以激活惰性 computed 的依赖追踪。
 */
import { effect } from "@slux/core";
import type { Subscribable } from "@slux/core";
import type { ShallowRef } from "vitarx";
import { bindExternal } from "./binding.js";

/**
 * 把 @slux/core 的 Subscribable 桥接为 vitarx 的只读 ShallowRef，是各状态源适配 hook 共用的读取与订阅入口。
 * @typeParam T 源承载的值类型，也是 ShallowRef 的值类型
 * @param source Subscribable<T> 实例，须提供 get() 读取与 subscribe(notify) 订阅，后者返回一个注销函数
 * @returns Readonly<ShallowRef<T>> 只读引用（定义见 vitarx），随作用域释放失效
 * @throws 继承 bindExternal 的上下文校验：SSR 下直接返回初始快照、不执行订阅，非 SSR 且无活动 effect scope 时抛错
 * @remarks @slux/core 的 computed 为惰性求值，仅订阅而不触发读取不会登记依赖，依赖变化便无法进入订阅链路；故在订阅回调内额外建立 effect 主动 get，补齐这条依赖追踪时序；订阅与 effect 的释放由 bindExternal 经 onScopeDispose 在作用域销毁时触发。
 * @see bindExternal 订阅与生命周期的实际托管方；useAtomValue、useFluxStore、useObservable、useMachine 等均经本函数接入 signal 链路
 */
export function useSignal<T>(source: Subscribable<T>): Readonly<ShallowRef<T>> {
  return bindExternal(
    () => source.get(),
    (notify) => {
      const unsubscribe = source.subscribe(notify);
      // core computed 惰性求值：主动读取使依赖被登记，依赖变化才能进入订阅链路。
      const dispose = effect(() => {
        source.get();
      });
      return () => {
        unsubscribe();
        dispose();
      };
    },
  );
}
