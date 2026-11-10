import { generateBatchAutoImports } from "@slux/shared";

const allImportApis: string[] = ["InspectEventType", "clearInspectors", "devtools", "inspect", "logger"];

export const createAutoImportApis = (prefix: string = "") => {
  return generateBatchAutoImports([
    {
      prefix,
      fromName: "@slux/devtools",
      imports: allImportApis,
    },
  ]);
};
