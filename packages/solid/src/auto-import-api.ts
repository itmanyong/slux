import { generateBatchAutoImports } from "@slux/shared";

const allImportApis: string[] = ["ScopeContext", "ScopeProvider", "useScope", "useSignal", "useStore"];

export const createAutoImportApis = (prefix: string = "") => {
  return generateBatchAutoImports([
    {
      prefix,
      fromName: "@slux/solid",
      imports: allImportApis,
    },
  ]);
};
