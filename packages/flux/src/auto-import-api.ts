import { generateBatchAutoImports } from "@slux/shared";

const allImportApis: string[] = ["createFluxStore"];

export const createAutoImportApis = (prefix: string = "") => {
  return generateBatchAutoImports([
    {
      prefix,
      fromName: "@slux/flux",
      imports: allImportApis,
    },
  ]);
};
