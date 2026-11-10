import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { API, ModuleKind, ModuleResolutionKind, formatDiagnostics } from "typescript/sync";
import {
  ScriptTarget,
  SyntaxKind,
  isBindingElement,
  isExportDeclaration,
  isIdentifier,
  isNamedExports,
  isVariableStatement,
} from "typescript/ast";

const packagesPath = resolve(import.meta.dirname, "../packages");
const packages = readdirSync(packagesPath, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(join(packagesPath, entry.name, "package.json")))
  .map((entry) => {
    const directory = join(packagesPath, entry.name);
    return {
      name: JSON.parse(readFileSync(join(directory, "package.json"), "utf8")).name,
      entry: join(directory, "src/index.ts"),
      target: join(directory, "src/auto-import-api.ts"),
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

function collectBindingNames(binding, names) {
  if (isIdentifier(binding)) {
    names.add(binding.text);
    return;
  }
  for (const element of binding.elements) {
    if (isBindingElement(element)) collectBindingNames(element.name, names);
  }
}

function collectRuntimeExports(api, program, fileName, visited = new Set()) {
  const source = program.getSourceFile(fileName);
  if (!source) throw new Error(`无法读取导出入口：${fileName}`);
  if (visited.has(source.fileName)) return [];
  visited.add(source.fileName);

  const diagnostics = program.getSyntacticDiagnostics(source.fileName);
  if (diagnostics.length) throw new Error(formatDiagnostics(diagnostics, program));

  // 先在内存中移除类型声明，避免把 export type 或接口重导出当成运行时 API。
  const emitted = program.getJavaScriptEmit([source.fileName]);
  if (emitted.diagnostics.length) throw new Error(formatDiagnostics(emitted.diagnostics, program));
  const output = [...emitted.outputFiles.values()][0];
  if (!output) throw new Error(`入口没有 JavaScript 产物：${source.fileName}`);
  const parsed = api.createSourceFile(`${source.fileName}.js`, output.text);
  const names = new Set();
  try {
    for (const statement of parsed.sourceFile.statements) {
      if (isExportDeclaration(statement)) {
        if (statement.exportClause) {
          if (isNamedExports(statement.exportClause)) {
            for (const element of statement.exportClause.elements) names.add(element.name.text);
          } else {
            names.add(statement.exportClause.name.text);
          }
        } else {
          const original = source.statements.find(
            (node) => isExportDeclaration(node) && node.moduleSpecifier?.text === statement.moduleSpecifier.text && !node.isTypeOnly,
          );
          const dependency = program.getResolvedModuleFromModuleSpecifier(original.moduleSpecifier, source.fileName);
          if (!dependency) throw new Error(`无法解析 ${source.fileName} 的重导出：${statement.moduleSpecifier.text}`);
          for (const name of collectRuntimeExports(api, program, dependency.resolvedFileName, visited)) names.add(name);
        }
      } else if (statement.modifiers?.some((modifier) => modifier.kind === SyntaxKind.ExportKeyword)) {
        if (statement.modifiers.some((modifier) => modifier.kind === SyntaxKind.DefaultKeyword)) continue;
        if (isVariableStatement(statement)) {
          for (const declaration of statement.declarationList.declarations) collectBindingNames(declaration.name, names);
        } else if (statement.name) {
          names.add(statement.name.text);
        }
      }
    }
  } finally {
    parsed.dispose();
  }
  // 默认导出没有可用于命名自动导入的名称。
  names.delete("default");
  // 生成清单的工厂函数需要由使用者显式导入，不能登记为自动导入 API。
  names.delete("createAutoImportApis");
  return [...names].sort();
}

function updateArray(api, fileName, names) {
  const source = existsSync(fileName)
    ? `${readFileSync(fileName, "utf8").replace(/\r\n/g, "\n").trimEnd()}\n`
    : "// 此数组由 scripts/generate-import-apis.mjs 生成。\nexport const allImportApis: string[] = [];\n";
  const parsed = api.createSourceFile(fileName, source);
  try {
    const declarations = parsed.sourceFile.statements
      .filter(isVariableStatement)
      .flatMap((statement) => [...statement.declarationList.declarations])
      .filter((declaration) => isIdentifier(declaration.name) && declaration.name.text === "allImportApis");
    if (declarations.length !== 1 || !declarations[0].initializer) {
      throw new Error(`${fileName} 必须包含一个已初始化的顶层 allImportApis 变量`);
    }
    const initializer = declarations[0].initializer;
    const start = initializer.getStart(parsed.sourceFile);
    const values = names.map((name) => JSON.stringify(name));
    const inline = `[${values.join(", ")}]`;
    const column = start - source.lastIndexOf("\n", start) - 1;
    const array = column + inline.length + 1 <= 145 ? inline : `[\n${values.map((name) => `  ${name},`).join("\n")}\n]`;
    return source.slice(0, start) + array + source.slice(initializer.end);
  } finally {
    parsed.dispose();
  }
}

const api = new API();
try {
  const program = api.createProgram(
    packages.map((pkg) => pkg.entry),
    {
      module: ModuleKind.ESNext,
      moduleResolution: ModuleResolutionKind.Bundler,
      target: ScriptTarget.ESNext,
      skipLibCheck: true,
      paths: Object.fromEntries(packages.map((pkg) => [pkg.name, [pkg.entry]])),
    },
  );
  const updates = packages.map((pkg) => {
    const names = collectRuntimeExports(api, program, pkg.entry);
    return { ...pkg, count: names.length, content: updateArray(api, pkg.target, names) };
  });
  for (const update of updates) {
    const unchanged = existsSync(update.target) && readFileSync(update.target, "utf8") === update.content;
    if (!unchanged) writeFileSync(update.target, update.content);
    console.log(`${update.name}: ${update.count} 个 API，${unchanged ? "无需更新" : "已更新"}`);
  }
} finally {
  api.close();
}
