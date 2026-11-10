import { generateBatchAutoImports } from "@slux/shared";

const allImportApis: string[] = ["SCOPE_KEY", "getScope", "setScope", "toReadable", "toWritable"];

export const createAutoImportApis = (prefix: string = "") => {
  return generateBatchAutoImports([
    {
      prefix,
      fromName: "@slux/svelte",
      imports: allImportApis,
    },
  ]);
};
