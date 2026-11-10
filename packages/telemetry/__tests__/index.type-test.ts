import type { Middleware } from "@slux/store";
import { telemetry, type TelemetryMiddleware, type StateChangeMetadata } from "../src/index.js";

interface State {
  count: number;
}
const control: TelemetryMiddleware<State> = telemetry<State>({
  onStateChange(meta) {
    const count: number = meta.nextState.count;
    void count;
  },
});
const middleware: Middleware<State> = control;
const enabled: boolean = control.isEnabled();
void middleware;
void enabled;
// @ts-expect-error 控制器只接受布尔值。
control.setEnabled("yes");
declare const metadata: StateChangeMetadata<State>;
// @ts-expect-error 元数据为只读。
metadata.changeCount = 0;
// @ts-expect-error filter 必须返回布尔值。
telemetry<State>({ filter: () => "yes" });
