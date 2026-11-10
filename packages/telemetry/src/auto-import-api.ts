import { generateBatchAutoImports } from "@slux/shared";

const allImportApis: string[] = ["telemetry"];

export const createAutoImportApis = (prefix: string = "") => {
  return generateBatchAutoImports([
    {
      prefix,
      fromName: "@slux/telemetry",
      imports: allImportApis,
    },
  ]);
};
