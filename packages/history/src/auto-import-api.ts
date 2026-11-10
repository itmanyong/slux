import { generateBatchAutoImports } from "@slux/shared";

const allImportApis: string[] = ["history"];

export const createAutoImportApis = (prefix: string = "") => {
  return generateBatchAutoImports([
    {
      prefix,
      fromName: "@slux/history",
      imports: allImportApis,
    },
  ]);
};
