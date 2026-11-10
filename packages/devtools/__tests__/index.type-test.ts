import type { Middleware } from "@slux/store";
import { devtools, logger, inspect, InspectEventType } from "../src/index.js";
import type {
  DevtoolsMiddleware,
  DevtoolsOptions,
  LoggerMiddleware,
  LoggerOptions,
  LoggerInterface,
  InspectEvent,
  InspectCallback,
  InspectEventTypeValue,
} from "../src/index.js";

export function checkTypes(): void {
  type State = { count: number };
  const devtoolsOptions: DevtoolsOptions = { name: "Counter", actionName: (partial) => String(partial["count"]) };
  const log: LoggerInterface = console;
  const loggerOptions: LoggerOptions = { logger: log, collapsed: false, diff: true, enabled: true };
  const dt: DevtoolsMiddleware<State> = devtools<State>(devtoolsOptions);
  const lg: LoggerMiddleware<State> = logger<State>(loggerOptions);
  const middlewares: Middleware<State>[] = [dt, lg];
  const callback: InspectCallback = (event: InspectEvent) => {
    const type: InspectEventTypeValue = event.type;
    const name: string = event.storeName;
    const action: string | undefined = event.action;
    const timestamp: number = event.timestamp;
    void [type, name, action, timestamp];
  };
  const unsubscribe: () => void = inspect(callback);
  const eventType: "set" = InspectEventType.SET;
  // @ts-expect-error enabled 只能为布尔值。
  devtools({ enabled: "yes" });
  // @ts-expect-error 自定义动作名必须返回字符串。
  logger({ actionName: () => 1 });
  // @ts-expect-error 中间件状态不能退化为 any。
  const wrong: Middleware<{ count: string }> = dt;
  void [middlewares, unsubscribe, eventType, wrong];
}
