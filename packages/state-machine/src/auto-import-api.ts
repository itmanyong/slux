import { generateBatchAutoImports } from "@slux/shared";

const allImportApis: string[] = ["createMachine"];

export const createAutoImportApis = (prefix: string = "") => {
  return generateBatchAutoImports([
    {
      prefix,
      fromName: "@slux/state-machine",
      imports: allImportApis,
    },
  ]);
};
