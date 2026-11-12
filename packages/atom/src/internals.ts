/**
 * @file atom 包的内部元数据定义：原子配置类型与全局配置登记表，供原子工厂与作用域共享。
 */

import type { AtomGetter } from "./types.js";

/**
 * 内部 configs 表中每个原子句柄对应的配置，以 readonly kind 为判别字段的联合类型。
 * 采用判别联合使「基础」与「派生」两类配置互斥，读取方可由 kind 收窄字段集合。
 */
type AtomConfig =
  { readonly kind: "base"; readonly initialValue: unknown } | { readonly kind: "derived"; readonly read: (get: AtomGetter) => unknown };

/**
 * 全局配置登记表：以原子句柄为键保存其 AtomConfig，配置的登记由原子工厂完成。
 * @see atom 基础原子工厂，向本表写入 "base" 配置
 * @see derived 派生原子工厂，向本表写入 "derived" 配置
 */
export const configs = new WeakMap<object, AtomConfig>(); // 弱引用键：句柄不再被持有时，其配置可随之释放
