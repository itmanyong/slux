type Example = { code: string; language?: string };

const atomBinding = (name: string, api: string): Example => ({
  code: `import { atom } from "@slux/atom";
import { ${api} } from "@slux/${name}/atom";

const count = atom(0);
// 在 ${name} 组件中调用
const result = ${api}(count);`,
});

const machineBinding = (name: string): Example => ({
  code: `import { createMachine } from "@slux/state-machine";
import { useMachine } from "@slux/${name}/state-machine";

const machine = createMachine<{}, { type: "GO" }, "idle">({
  initial: "idle", context: {}, states: { idle: {} },
});
// 在 ${name} 组件中调用
const current = useMachine(machine);`,
});

const examples: Record<string, Record<string, Example>> = {
  actview: {
    "/atom/useAtom": atomBinding("actview", "useAtom"),
    "/state-machine/useMachine": machineBinding("actview"),
    provideScope: {
      code: `import { createScope } from "@slux/core";
import { provideScope } from "@slux/actview";

// 在组件初始化期间提供作用域
provideScope(createScope());`,
    },
    SCOPE_KEY: {
      code: `import { useInjects } from "@actview/core";
import { SCOPE_KEY } from "@slux/actview";

const scope = useInjects(SCOPE_KEY);`,
    },
    useScope: {
      code: `import { useScope } from "@slux/actview";

// 在后代组件的初始化期间读取最近的作用域
const scope = useScope();`,
    },
  },
  angular: {
    "/atom/injectAtom": {
      code: `import { atom } from "@slux/atom";
import { injectAtom } from "@slux/angular/atom";

const count = atom(0);
// 在 Angular 注入上下文中调用
const [value, setValue] = injectAtom(count);
setValue(value() + 1);`,
    },
    provideSluxScope: {
      code: `import { createScope } from "@slux/core";
import { provideSluxScope } from "@slux/angular";

const providers = [provideSluxScope(createScope())];
// 将 providers 传给 Angular 应用的启动配置`,
    },
    toObservable: {
      code: `import { signal } from "@slux/core";
import { toObservable } from "@slux/angular";

const count = signal(0);
const subscription = toObservable(count).subscribe((value) => console.log(value));
count.set(1);
subscription.unsubscribe();`,
    },
  },
  devtools: {
    clearInspectors: {
      code: `import { clearInspectors, inspect } from "@slux/devtools";

inspect((event) => console.log(event));
clearInspectors(); // 移除全部已注册的检查器`,
    },
  },
  inferno: {
    "/state-machine/MachineValue": {
      code: `import { createElement as h } from "inferno-create-element";
import { createMachine } from "@slux/state-machine";
import { MachineValue } from "@slux/inferno/state-machine";

const machine = createMachine<{}, { type: "GO" }, "idle">({
  initial: "idle", context: {}, states: { idle: {} },
});
const node = h(MachineValue, { source: machine, children: (value) => h("span", null, value.value) });`,
    },
  },
  octane: {
    "/state-machine/useMachine": machineBinding("octane"),
    ScopeContext: {
      code: `import { useContext } from "octane";
import { ScopeContext } from "@slux/octane";

// 在 Octane 组件中读取作用域上下文
const scope = useContext(ScopeContext);`,
    },
    ScopeProvider: {
      code: `import { createElement } from "octane";
import { createScope } from "@slux/core";
import { ScopeProvider } from "@slux/octane";

const tree = createElement(ScopeProvider, { scope: createScope(), children: "内容" });`,
    },
    useScopeContext: {
      code: `import { useScopeContext } from "@slux/octane";

// 在 Octane 组件中读取最近的 ScopeProvider
const scope = useScopeContext();`,
    },
  },
  preact: {
    "/state-machine/useMachine": machineBinding("preact"),
    ScopeContext: {
      code: `import { useContext } from "preact/hooks";
import { ScopeContext } from "@slux/preact";

function Reader() {
  const scope = useContext(ScopeContext);
  return <span>{scope ? "作用域已提供" : "使用全局状态"}</span>;
}`,
      language: "tsx",
    },
  },
  react: {
    ScopeContext: {
      code: `import { useContext } from "react";
import { ScopeContext } from "@slux/react";

function Reader() {
  const scope = useContext(ScopeContext);
  return <span>{scope ? "作用域已提供" : "使用全局状态"}</span>;
}`,
      language: "tsx",
    },
    ScopeProvider: {
      code: `import { createScope } from "@slux/core";
import { ScopeProvider } from "@slux/react";

const scope = createScope();
const tree = <ScopeProvider scope={scope}><main>内容</main></ScopeProvider>;`,
      language: "tsx",
    },
    useScopeContext: {
      code: `import { useScopeContext } from "@slux/react";

function Reader() {
  const scope = useScopeContext();
  return <span>{scope ? "作用域已提供" : "使用全局状态"}</span>;
}`,
      language: "tsx",
    },
  },
  ripple: {
    "/atom/useAtom": atomBinding("ripple", "useAtom"),
    "/atom/useAtomValue": atomBinding("ripple", "useAtomValue"),
    "/atom/useSetAtom": atomBinding("ripple", "useSetAtom"),
    "/flux/useFluxStore": {
      code: `import { createFluxStore } from "@slux/flux";
import { useFluxStore } from "@slux/ripple/flux";

const store = createFluxStore((state: number, action: { type: "increment" }) => state + 1, 0);
// 在 Ripple 组件中调用
const current = useFluxStore(store);`,
    },
    "/proxy/useSnapshot": {
      code: `import { observable } from "@slux/proxy";
import { useSnapshot } from "@slux/ripple/proxy";

const state = observable({ count: 0 });
// 在 Ripple 组件中调用
const current = useSnapshot(state);`,
    },
    "/rxjs/useObservable": {
      code: `import { BehaviorSubject } from "rxjs";
import { fromObservable } from "@slux/rxjs";
import { useObservable } from "@slux/ripple/rxjs";

const source = fromObservable(new BehaviorSubject(0), 0);
// 在 Ripple 组件中调用；组件销毁后由创建者释放 source
const current = useObservable(source);`,
    },
    "/server/ScopeContext": {
      code: `import { createScope } from "@slux/core";
import { ScopeContext } from "@slux/ripple/server";

// 在 Ripple 服务端组件初始化中设置
ScopeContext.set(createScope());`,
    },
    "/server/useScopeContext": {
      code: `import { useScopeContext } from "@slux/ripple/server";

// 在 Ripple 服务端组件初始化中读取
const scope = useScopeContext();`,
    },
    "/state-machine/useMachine": machineBinding("ripple"),
    ScopeContext: {
      code: `import { createScope } from "@slux/core";
import { ScopeContext } from "@slux/ripple";

// 在 Ripple 组件上下文中设置作用域
ScopeContext.set(createScope());`,
    },
    useScopeContext: {
      code: `import { useScopeContext } from "@slux/ripple";

// 在 Ripple 后代组件中读取最近的作用域
const scope = useScopeContext();`,
    },
  },
  solid: {
    ScopeContext: {
      code: `import { useContext } from "solid-js";
import { ScopeContext } from "@slux/solid";

const scope = useContext(ScopeContext);`,
    },
    ScopeProvider: {
      code: `import { createScope } from "@slux/core";
import { ScopeProvider } from "@slux/solid";

const tree = <ScopeProvider scope={createScope()}><main>内容</main></ScopeProvider>;`,
      language: "tsx",
    },
    useScope: {
      code: `import { useScope } from "@slux/solid";

// 在 Solid 组件中读取最近的作用域
const scope = useScope();`,
    },
  },
  storage: {
    cookieStorage: {
      code: `import { cookieStorage } from "@slux/storage";

const storage = cookieStorage({ path: "/", sameSite: "lax" });
await storage.setItem("count", "1");`,
    },
    indexedDBStorage: {
      code: `import { indexedDBStorage } from "@slux/storage";

const storage = indexedDBStorage({ dbName: "app", storeName: "state" });
await storage.setItem("count", "1");`,
    },
    PERSIST_ERROR_CODE: {
      code: `import { PERSIST_ERROR_CODE } from "@slux/storage";

const code = PERSIST_ERROR_CODE.StorageReadFailed;`,
    },
    sessionStorageBackend: {
      code: `import { sessionStorageBackend } from "@slux/storage";

const storage = sessionStorageBackend();
await storage.setItem("count", "1");`,
    },
  },
  viewfly: {
    "/atom/useAtom": atomBinding("viewfly", "useAtom"),
    "/state-machine/useMachine": machineBinding("viewfly"),
  },
  svelte: {
    getScope: {
      code: `<script lang="ts">
  import { getScope } from "@slux/svelte";
  const scope = getScope(); // 组件初始化期间读取
</script>`,
      language: "svelte",
    },
    SCOPE_KEY: {
      code: `<script lang="ts">
  import { setContext } from "svelte";
  import { createScope } from "@slux/core";
  import { SCOPE_KEY } from "@slux/svelte";
  setContext(SCOPE_KEY, createScope());
</script>`,
      language: "svelte",
    },
    setScope: {
      code: `<script lang="ts">
  import { createScope } from "@slux/core";
  import { setScope } from "@slux/svelte";
  setScope(createScope()); // 组件初始化期间提供
</script>`,
      language: "svelte",
    },
  },
  vitarx: {
    "/atom/useAtom": atomBinding("vitarx", "useAtom"),
    "/state-machine/useMachine": machineBinding("vitarx"),
    provideScope: {
      code: `import { createScope } from "@slux/core";
import { provideScope } from "@slux/vitarx";

// 在组件初始化期间提供作用域
provideScope(createScope());`,
    },
    SCOPE_KEY: {
      code: `import { inject } from "vitarx";
import { SCOPE_KEY } from "@slux/vitarx";

const scope = inject(SCOPE_KEY);`,
    },
    useScope: {
      code: `import { useScope } from "@slux/vitarx";

// 在后代组件的初始化期间读取最近的作用域
const scope = useScope();`,
    },
  },
  vue: {
    provideScope: {
      code: `import { createScope } from "@slux/core";
import { provideScope } from "@slux/vue";

// 在 Vue setup 中调用
provideScope(createScope());`,
    },
    ScopeProvider: {
      code: `import { h } from "vue";
import { createScope } from "@slux/core";
import { ScopeProvider } from "@slux/vue";

const vnode = h(ScopeProvider, { scope: createScope() }, { default: () => "内容" });`,
    },
    sluxPlugin: {
      code: `import { createApp } from "vue";
import { createScope } from "@slux/core";
import { sluxPlugin } from "@slux/vue";

const app = createApp({ template: "<div>slux</div>" });
app.use(sluxPlugin, { scope: createScope() });`,
    },
    useScope: {
      code: `import { useScope } from "@slux/vue";

// 在 Vue setup 中读取最近的作用域
const scope = useScope();`,
    },
  },
};

export function curatedExample(packageName: string, apiName: string, subpath = ""): Example | undefined {
  return examples[packageName]?.[subpath ? `/${subpath}/${apiName}` : apiName];
}
