/**
 * @file state-machine 包的公共导出桶文件，仅汇总对外符号，不含实现逻辑。
 */
export { createMachine } from "./create-machine.js";
export type {
  MachineSnapshot,
  MachineGuard,
  MachineAction,
  MachineTransition,
  MachineTransitionConfig,
  MachineStateConfig,
  MachineConfig,
  StateMachine,
} from "./types.js";
export { createAutoImportApis } from "./auto-import-api.js";
