import { readFile, readdir } from "node:fs/promises";
import { relative, resolve } from "node:path";
import * as ts from "typescript";
import { curatedExample } from "./api-examples";

const repoRoot = resolve(import.meta.dirname, "../..");

function category(symbol: ts.Symbol, declaration: ts.Declaration, checker: ts.TypeChecker): string {
  if (symbol.flags & ts.SymbolFlags.Interface) return "接口";
  if (symbol.flags & ts.SymbolFlags.TypeAlias) return "类型别名";
  if (symbol.flags & ts.SymbolFlags.Class) return "类";
  if (symbol.flags & ts.SymbolFlags.Enum) return "枚举";
  if (symbol.flags & ts.SymbolFlags.Function) return "函数";
  if (checker.getSignaturesOfType(checker.getTypeOfSymbolAtLocation(symbol, declaration), ts.SignatureKind.Call).length) return "函数";
  return "常量或组件";
}

function signature(symbol: ts.Symbol, declaration: ts.Declaration, checker: ts.TypeChecker): string {
  if (symbol.flags & (ts.SymbolFlags.TypeAlias | ts.SymbolFlags.Interface | ts.SymbolFlags.Enum)) return declaration.getText();

  const type = checker.getTypeOfSymbolAtLocation(symbol, declaration);
  const signatures = checker.getSignaturesOfType(type, ts.SignatureKind.Call);
  if (signatures.length) {
    return signatures
      .map((item) => `declare function ${symbol.name}${checker.signatureToString(item, declaration, ts.TypeFormatFlags.NoTruncation)};`)
      .join("\n");
  }

  if (symbol.flags & ts.SymbolFlags.Class) {
    const members = checker.getDeclaredTypeOfSymbol(symbol).getProperties();
    return `declare class ${symbol.name} {\n${members.map((member) => `  ${member.name}: ${checker.typeToString(checker.getTypeOfSymbolAtLocation(member, declaration), declaration, ts.TypeFormatFlags.NoTruncation)};`).join("\n")}\n}`;
  }

  return `declare const ${symbol.name}: ${checker.typeToString(type, declaration, ts.TypeFormatFlags.NoTruncation)};`;
}

function readmeDescription(readme: string, name: string): string | undefined {
  if (name === "createAutoImportApis") return "生成供 unplugin-auto-import 使用的本包公开 API 映射。";

  let inCode = false;
  for (const line of readme.split(/\r?\n/)) {
    if (line.startsWith("```")) inCode = !inCode;
    if (inCode || !line.startsWith("|")) continue;
    const cells = line.split(/(?<!\\)\|/);
    const firstCell = /^`([^`]+)`$/.exec(cells[1]?.trim() ?? "")?.[1];
    if (firstCell?.split(/[<(]/)[0] === name) {
      const explanation = cells.at(-2)?.trim().replaceAll("\\|", "|");
      if (explanation && explanation.length > 8) return explanation;
    }
  }

  inCode = false;
  for (const line of readme.split(/\r?\n/)) {
    if (line.startsWith("```")) inCode = !inCode;
    if (inCode) continue;
    if (line.startsWith("#") || line.startsWith("|")) continue;
    const firstName = /`([^`]+)`/.exec(line)?.[1];
    if (line.length > 25 && line.length < 280 && firstName === name) return line.trim();
  }
}

function usageSnippet(readme: string, name: string, importPath: string): string | undefined {
  const blocks = [...readme.matchAll(/```(?:ts|tsx|js|jsx|typescript|javascript)\s*\n([\s\S]*?)\n```/g)].map((match) => match[1].trim());
  const matches = blocks.filter((block) => new RegExp(`\\b${name}\\b`).test(block));
  matches.sort((a, b) => Number(b.includes(importPath)) - Number(a.includes(importPath)) || a.length - b.length);
  return matches.find((block) => block.length <= 2400);
}

function fallbackDescription(packageName: string, subpath: string, apiName: string, kind: string): string {
  const bindingDescriptions: Record<string, string> = {
    "atom/useAtom": "在组件中读取可写 Atom，并取得当前值和写入函数。",
    "atom/useSetAtom": "取得 Atom 的写入函数，不订阅其值。",
    "flux/useFluxStore": "订阅 Flux Store 的状态变化，供当前框架组件读取。",
    "proxy/useSnapshot": "订阅 Proxy 对象的变化，并读取其只读快照。",
    "rxjs/useObservable": "订阅 Observable 状态源，供当前框架组件读取最新值。",
    "state-machine/useMachine": "订阅状态机，读取当前状态与上下文快照。",
    "store/useStore": "订阅 Store 状态；支持选择部分状态的绑定还可传入 selector 和比较函数。",
  };
  const binding = bindingDescriptions[`${subpath}/${apiName}`];
  if (binding) return binding;

  const descriptions: Record<string, string> = {
    "atom:createAtomScope": "创建独立的 Atom 作用域，用于隔离 Atom 的读取与写入。",
    "angular:injectFluxStore": "在 Angular 注入上下文中订阅 Flux Store，并返回只读 Signal。",
    "angular:injectObservable": "在 Angular 注入上下文中订阅 Observable 状态源，并返回只读 Signal。",
    "angular:injectMachine": "在 Angular 注入上下文中订阅状态机，并返回快照 Signal。",
    "core:ReadonlySignal": "可读取和订阅的响应式状态接口，不提供直接写入方法。",
    "core:SignalOptions": "配置 Signal 的值比较函数，以控制何时通知订阅者。",
    "devtools:DevtoolsMiddleware": "连接 Redux DevTools 并上报 Store 生命周期与更新的中间件类型。",
    "devtools:DevtoolsOptions": "配置 Redux DevTools 连接名、启用状态与动作名称生成方式。",
    "devtools:InspectCallback": "接收 Store 检查事件的回调函数类型。",
    "devtools:InspectEventTypeValue": "检查事件类型常量对应的字符串联合类型。",
    "devtools:LoggerMiddleware": "在 Store 状态更新时记录日志的中间件类型。",
    "devtools:LoggerOptions": "配置日志名称、折叠显示、差异输出与自定义日志器。",
    "flux:createFluxStore": "用 reducer 和初始状态创建 Flux Store，并通过 action 驱动状态更新。",
    "history:history": "创建 Store 历史中间件，为状态更新提供撤销和重做能力。",
    "inferno:AtomValueProps": "AtomValue 组件的属性，包含 Atom 状态源和接收当前值的渲染函数。",
    "inferno:FluxValue": "在 Inferno 中订阅 Flux Store，并通过 children 渲染当前状态。",
    "inferno:FluxValueProps": "FluxValue 组件的属性，包含 Flux Store 和接收当前状态的渲染函数。",
    "inferno:ProxyValueProps": "ProxyValue 组件的属性，包含 Proxy 对象和接收快照的渲染函数。",
    "inferno:ObservableValue": "在 Inferno 中订阅 Observable，并通过 children 渲染最新值。",
    "inferno:ObservableValueProps": "ObservableValue 组件的属性，包含状态源和接收最新值的渲染函数。",
    "inferno:MachineValue": "在 Inferno 中订阅状态机，并通过 children 渲染当前快照。",
    "inferno:StoreValueProps": "StoreValue 组件的属性，包含 Store、渲染函数及可选的状态比较函数。",
    "preact:ScopeProviderProps": "Preact ScopeProvider 组件的属性，指定作用域与子节点。",
    "react:useSignal": "在 React 组件中订阅可读取的响应式状态源，并返回当前值。",
    "solid:useStore": "将 Store 状态接入 Solid 组件，返回可读取当前值的 Accessor。",
    "state-machine:createMachine": "根据初始状态、上下文和状态转换配置创建状态机。",
    "storage:MemoryStorageAdapter": "带 clear 方法的内存存储后端类型。",
    "storage:persist": "创建 Store 持久化中间件，将状态写入存储后端并在初始化时恢复。",
    "storage:PersistEnvelope": "持久化数据的封装结构，保存状态与版本号。",
    "storage:PersistError": "持久化错误对象，包含错误码、描述及原始原因。",
    "storage:PersistErrorCode": "持久化读写、序列化和迁移错误码的联合类型。",
    "storage:PersistMiddleware": "持久化 Store 中间件及手动恢复、清理存储等控制方法的类型。",
    "storage:PersistMiddlewareAPI": "持久化中间件使用的 Store API 类型别名。",
    "storage:PersistOptions": "配置存储键、后端、字段裁剪、迁移、合并与错误处理。",
    "storage:PersistSetFn": "持久化中间件调用 Store 更新函数的类型别名。",
    "storage:StorageAdapter": "自定义存储后端契约，提供读取、写入和删除键的方法。",
    "store:Middleware": "Store 中间件契约，定义初始化、更新拦截与销毁钩子。",
    "store:MiddlewareAPI": "中间件可访问的 Store 方法，包括读取、更新与订阅状态。",
    "svelte:toAtom": "将可写 Atom 转成 Svelte Writable store。",
    "svelte:toFluxStore": "将 Flux Store 转成 Svelte Readable store。",
    "svelte:toSnapshot": "将 Proxy 对象转成提供只读快照的 Svelte Readable store。",
    "svelte:toMachine": "将状态机转成提供当前快照的 Svelte Readable store。",
    "tab-sync:broadcast": "创建 Store 广播中间件，在浏览器标签页之间传播状态更新。",
    "tab-sync:BroadcastMessage": "跨标签广播消息结构，包含发送者、时间戳和部分状态。",
    "tab-sync:BroadcastOptions": "配置广播频道、同步字段及冲突处理方式。",
    "tab-sync:ConflictResolution": "跨标签状态冲突处理策略，可选内置策略或自定义函数。",
    "telemetry:telemetry": "创建 Store 遥测中间件，向回调报告生命周期、更新与错误。",
    "telemetry:TelemetryMiddleware": "报告 Store 生命周期与状态变化的遥测中间件类型。",
    "telemetry:TelemetryOptions": "配置状态变化、初始化、订阅和错误事件的遥测回调。",
    "viewfly:SLUX_SCOPE": "Viewfly 依赖注入中用于读取 slux 作用域的标识。",
    "vue:useStore": "将 Store 状态接入 Vue 组件，返回响应式只读 Ref。",
  };
  return descriptions[`${packageName}:${apiName}`] ?? `公开${kind}，详见下方类型签名与源码。`;
}

// JSDoc 文本会原样写入 MDX 正文与表格：反引号代码段之外的 < 与 {} 会被当作 JSX 或表达式解析，须转义。
function escapeMdxText(text: string): string {
  return text
    .split(/(`[^`]*`)/)
    .map((part, index) =>
      index % 2 ? part : part.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll("{", "&#123;").replaceAll("}", "&#125;"),
    )
    .join("");
}

async function exampleSources(name: string) {
  const examplesRoot = resolve(repoRoot, "examples");
  const entry = (await readdir(examplesRoot, { withFileTypes: true })).find((item) => item.isDirectory() && item.name.startsWith(`${name}-`));
  if (!entry) return [];

  const files: { code: string; path: string; language: string }[] = [];
  async function visit(directory: string) {
    for (const item of await readdir(directory, { withFileTypes: true })) {
      const path = resolve(directory, item.name);
      if (item.isDirectory()) {
        await visit(path);
      } else if (/\.(?:ts|tsx|vue|svelte)$/.test(item.name) && !item.name.endsWith(".d.ts")) {
        const code = await readFile(path, "utf8");
        if (code.length <= 3200 && code.includes(`@slux/${name}`)) {
          files.push({ code: code.trim(), path: relative(repoRoot, path).replaceAll("\\", "/"), language: item.name.split(".").at(-1) ?? "ts" });
        }
      }
    }
  }

  await visit(resolve(examplesRoot, entry.name, "src"));
  return files;
}

export async function renderApiPages(packageNames: string[], packagesRoot: string) {
  const packages = await Promise.all(
    packageNames.map(async (name) => {
      const manifest = JSON.parse(await readFile(resolve(packagesRoot, name, "package.json"), "utf8")) as { exports: Record<string, unknown> };
      const entries = Object.keys(manifest.exports)
        .filter((key) => key !== "./package.json")
        .map((key) => ({
          subpath: key === "." ? "" : key.slice(2),
          file: resolve(packagesRoot, name, "src", `${key === "." ? "index" : key.slice(2)}.ts`),
        }));
      return { name, entries };
    }),
  );
  const program = ts.createProgram(
    packages.flatMap((item) => item.entries.map((entry) => entry.file)),
    {
      module: ts.ModuleKind.NodeNext,
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      noEmit: true,
      skipLibCheck: true,
    },
  );
  const checker = program.getTypeChecker();

  return (
    await Promise.all(
      packages.map(async ({ name, entries }) => {
        const readme = await readFile(resolve(packagesRoot, name, "README.md"), "utf8");
        const sourceExamples = await exampleSources(name);
        const exports = entries.flatMap(({ subpath, file }) => {
          const source = program.getSourceFile(file);
          const moduleSymbol = source && checker.getSymbolAtLocation(source);
          if (!moduleSymbol) throw new Error(`无法读取 @slux/${name}${subpath ? `/${subpath}` : ""} 的公开入口`);
          return checker
            .getExportsOfModule(moduleSymbol)
            .filter((symbol) => symbol.name !== "default")
            .map((symbol) => ({ exported: symbol, subpath }));
        });
        const records = exports.map(({ exported, subpath }) => {
          const symbol = exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported;
          const declaration = symbol.declarations?.[0];
          if (!declaration) throw new Error(`@slux/${name} 的 ${exported.name} 缺少声明`);

          const importPath = `@slux/${name}${subpath ? `/${subpath}` : ""}`;
          const kind = category(symbol, declaration, checker);
          const documentation = ts.displayPartsToString(symbol.getDocumentationComment(checker)).trim();
          const description = escapeMdxText(
            (documentation || readmeDescription(readme, exported.name) || fallbackDescription(name, subpath, exported.name, kind))
              .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
              .replaceAll(/\s+/g, " "),
          );
          const sourcePath = relative(repoRoot, declaration.getSourceFile().fileName).replaceAll("\\", "/");
          const source = sourcePath.startsWith("..") ? `packages/${name}/src/index.ts` : sourcePath;
          const typeOnly = !(symbol.flags & ts.SymbolFlags.Value);
          const readmeExample = usageSnippet(readme, exported.name, importPath);
          const sourceExample = sourceExamples
            .filter((item) => (item.code.match(new RegExp(`\\b${exported.name}\\b`, "g"))?.length ?? 0) >= 2 && item.code.includes(importPath))
            .sort((a, b) => a.code.length - b.code.length)[0];
          const curated = curatedExample(name, exported.name, subpath);
          const example = readmeExample ?? sourceExample?.code ?? curated?.code;

          return {
            name: exported.name,
            subpath,
            importPath,
            kind,
            description,
            signature: signature(symbol, declaration, checker),
            source,
            typeOnly,
            example,
            exampleSource: readmeExample ? undefined : sourceExample?.path,
            language: readmeExample ? "ts" : (sourceExample?.language ?? curated?.language ?? "ts"),
          };
        });

        records.sort((a, b) => a.subpath.localeCompare(b.subpath, "en") || a.name.localeCompare(b.name, "en"));

        return [
          { route: "api", title: "API 定义", label: "API", entries: records.filter((item) => !item.typeOnly) },
          { route: "types", title: "类型定义", label: "类型", entries: records.filter((item) => item.typeOnly) },
        ].map(({ route, title, label, entries }) => {
          const overview = entries
            .map(
              (item) =>
                `| \`${item.name}\` | ${item.subpath ? `\`/${item.subpath}\`` : "主入口"} | ${item.kind} | ${item.description.replaceAll("|", "\\|").replaceAll("\n", " ")} |`,
            )
            .join("\n");
          const sections = entries
            .map((item) => {
              const example =
                item.example ??
                (item.typeOnly
                  ? `import type { ${item.name} } from "${item.importPath}";`
                  : `import { ${item.name} } from "${item.importPath}";`);
              const caption = item.exampleSource ? "示例项目源码" : item.example ? "使用示例" : item.typeOnly ? "类型导入示例" : "入口导入示例";
              const exampleLink = item.exampleSource
                ? `\n\n[查看完整示例](https://github.com/itmanyong/slux/blob/main/${item.exampleSource})`
                : "";
              return `## ${item.subpath ? `/${item.subpath} · ` : ""}${item.name}\n\n${item.description}\n\n**导入路径：**\`${item.importPath}\` · **类型：**${item.kind}\n\n~~~ts\n${item.signature}\n~~~\n\n**${caption}**\n\n~~~${item.language}\n${example}\n~~~${exampleLink}\n\n[查看源码](https://github.com/itmanyong/slux/blob/main/${item.source})`;
            })
            .join("\n\n");

          return {
            routePath: `/packages/${name}/${route}`,
            content: `---\ntitle: "@slux/${name} · ${title}"\ndescription: "@slux/${name} 的公开${label}、类型签名与使用示例。"\n---\n\n# ${title}\n\n本页列出 \`@slux/${name}\` 主入口和已发布子路径中的 ${entries.length} 个${route === "api" ? "运行时 API" : "仅在 TypeScript 类型层导出的类型"}。签名直接读取当前源码；示例优先选自包 README。\n\n<div className="api-overview">\n\n| ${label} | 入口 | 分类 | 作用 |\n| --- | --- | --- | --- |\n${overview}\n\n</div>\n\n${sections}\n`,
          };
        });
      }),
    )
  ).flat();
}
