import { generateBatchAutoImports } from "@slux/shared";

const allImportApis: string[] = ["ScopeContext", "ScopeProvider", "useScopeContext", "useSignal"];

export const createAutoImportApis = (prefix: string = "") => {
  return generateBatchAutoImports([
    {
      prefix,
      fromName: "@slux/react",
      imports: allImportApis,
    },
  ]);
};
