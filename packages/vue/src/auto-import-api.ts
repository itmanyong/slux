import { generateBatchAutoImports } from "@slux/shared";

const allImportApis: string[] = ["ScopeProvider", "provideScope", "sluxPlugin", "useScope", "useSignal", "useStore"];

export const createAutoImportApis = (prefix: string = "") => {
  return generateBatchAutoImports([
    {
      prefix,
      fromName: "@slux/vue",
      imports: allImportApis,
    },
  ]);
};
