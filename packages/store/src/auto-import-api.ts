import { generateBatchAutoImports } from "@slux/shared";

const allImportApis: string[] = ["createStore"];

export const createAutoImportApis = (prefix: string = "") => {
  return generateBatchAutoImports([
    {
      prefix,
      fromName: "@slux/store",
      imports: allImportApis,
    },
  ]);
};
