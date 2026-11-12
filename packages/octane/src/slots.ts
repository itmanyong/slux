/**
 * @file octane 适配层的槽工厂：基于 createSubSlot 派生本包各 hook 使用的子槽标识。
 */

import { createSubSlot } from "octane";

/**
 * 槽派生函数：把「可选 slot 与用途字符串」组合成子槽标识。
 * 编译器为每个调用点分配 slot，各 hook 须派生自己的位置，避免相互覆盖。
 */
export const subSlot = createSubSlot({
  tagPrefix: ":slux:",
  slotlessPrefix: "@slux/octane:",
  global: false,
});
