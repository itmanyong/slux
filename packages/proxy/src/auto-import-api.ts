import { generateBatchAutoImports } from "@slux/shared";

const allImportApis: string[] = ["observable", "observe", "ref", "snapshot", "subscribe"];

export const createAutoImportApis = (prefix: string = "") => {
  return generateBatchAutoImports([
    {
      prefix,
      fromName: "@slux/proxy",
      imports: allImportApis,
    },
  ]);
};
