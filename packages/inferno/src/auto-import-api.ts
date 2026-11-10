import { generateBatchAutoImports } from "@slux/shared";

const allImportApis: string[] = ["ScopeProvider", "SignalValue", "getScope"];

export const createAutoImportApis = (prefix: string = "") => {
  return generateBatchAutoImports([
    {
      prefix,
      fromName: "@slux/inferno",
      imports: allImportApis,
    },
  ]);
};
