import { generateBatchAutoImports } from "@slux/shared";

const allImportApis: string[] = ["ScopeContext", "provideScope", "useScopeContext", "useSignal"];

export const createAutoImportApis = (prefix: string = "") => {
  return generateBatchAutoImports([
    {
      prefix,
      fromName: "@slux/ripple",
      imports: allImportApis,
    },
  ]);
};
