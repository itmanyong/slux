/**
 * @file React 适配层的公共类型定义：ScopeProvider 组件的属性形状。
 */

import type { Scope } from "@slux/core";
import type { ReactNode } from "react";

/**
 * ScopeProvider 的属性类型：把一个 Scope 实例通过 React context 下发给子树。
 * @see ScopeProvider
 */
export type ScopeProviderProps = {
  /** 要下发给子树的 Scope 实例，生命周期由调用方持有。 */
  readonly scope: Scope;
  /** provider 包裹的子树（ReactNode）。 */
  readonly children: ReactNode;
};
