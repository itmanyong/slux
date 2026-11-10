import { generateBatchAutoImports } from "@slux/shared";

const allImportApis: string[] = ["SCOPE_KEY", "provideScope", "useScope", "useSignal"];

export const createAutoImportApis = (prefix: string = "") => {
  return generateBatchAutoImports([
    {
      prefix,
      fromName: "@slux/actview",
      imports: allImportApis,
    },
  ]);
};
