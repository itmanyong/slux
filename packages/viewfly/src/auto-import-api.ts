import { generateBatchAutoImports } from "@slux/shared";

const allImportApis: string[] = ["SLUX_SCOPE", "ScopeProvider", "useScope", "useSignal"];

export const createAutoImportApis = (prefix: string = "") => {
  return generateBatchAutoImports([
    {
      prefix,
      fromName: "@slux/viewfly",
      imports: allImportApis,
    },
  ]);
};
