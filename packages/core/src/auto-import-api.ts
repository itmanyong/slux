import { generateBatchAutoImports } from "@slux/shared";

const allImportApis: string[] = ["batch", "computed", "createScope", "effect", "runInScope", "serializeScope", "signal"];

export const createAutoImportApis = (prefix: string = "") => {
  return generateBatchAutoImports([
    {
      prefix,
      fromName: "@slux/core",
      imports: allImportApis,
    },
  ]);
};
