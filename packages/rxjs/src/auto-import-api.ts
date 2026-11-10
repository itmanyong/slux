import { generateBatchAutoImports } from "@slux/shared";

const allImportApis: string[] = ["fromObservable", "toObservable"];

export const createAutoImportApis = (prefix: string = "") => {
  return generateBatchAutoImports([
    {
      prefix,
      fromName: "@slux/rxjs",
      imports: allImportApis,
    },
  ]);
};
