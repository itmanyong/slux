import { generateBatchAutoImports } from "@slux/shared";

const allImportApis: string[] = ["ScopeProvider", "SLUX_SCOPE", "useScope", "useSignal"];

export const createAutoImportApis = (prefix: string = "") => {
  return generateBatchAutoImports([
    {
      prefix,
      fromName: "@slux/viewfly",
      imports: allImportApis,
    },
  ]);
};
