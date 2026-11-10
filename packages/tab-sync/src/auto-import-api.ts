import { generateBatchAutoImports } from "@slux/shared";

const allImportApis: string[] = ["broadcast"];

export const createAutoImportApis = (prefix: string = "") => {
  return generateBatchAutoImports([
    {
      prefix,
      fromName: "@slux/tab-sync",
      imports: allImportApis,
    },
  ]);
};
