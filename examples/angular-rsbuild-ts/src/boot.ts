import { createComponent, Injector, InjectionToken } from "@angular/core";
import type { ApplicationRef, Type } from "@angular/core";
import { createApplication } from "@angular/platform-browser";
import type { LogTone } from "@slux/shell-example";

/** 卡片把日志函数以依赖注入的方式交给组件，组件里用 inject(DEMO_LOG) 取用。 */
export const DEMO_LOG = new InjectionToken<(message: string, tone?: LogTone) => void>("DEMO_LOG");

let application: ApplicationRef | null = null;

function app(): ApplicationRef {
  if (!application) throw new Error("Angular 应用尚未启动，无法挂载组件。");
  return application;
}

/** 启动（或复用）Angular 应用实例，测试里也可以直接调用。 */
export async function startApplication(): Promise<ApplicationRef> {
  application ??= await createApplication({ providers: [] });
  return application;
}

/** 启动 Angular 应用，再加载操作 DOM 外壳的入口模块。 */
export async function bootstrap(): Promise<void> {
  await startApplication();
  await import("./index");
}

/** 在真实的 Angular 应用注入上下文里创建组件，并接入变更检测。 */
export function mountComponent(component: Type<unknown>, host: HTMLElement, log: (message: string, tone?: LogTone) => void): () => void {
  const elementInjector = Injector.create({
    providers: [{ provide: DEMO_LOG, useValue: log }],
    parent: app().injector,
  });
  const ref = createComponent(component, {
    environmentInjector: app().injector,
    elementInjector,
    hostElement: host,
  });
  app().attachView(ref.hostView);
  ref.changeDetectorRef.detectChanges();
  return () => {
    app().detachView(ref.hostView);
    ref.destroy();
  };
}
