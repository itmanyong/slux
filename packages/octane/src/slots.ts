import { createSubSlot } from "octane";

// 编译器给每个调用点分配 slot；子 hook 必须派生自己的位置，避免相互覆盖。
export const subSlot = createSubSlot({
  tagPrefix: ":slux:",
  slotlessPrefix: "@slux/octane:",
  global: false,
});
