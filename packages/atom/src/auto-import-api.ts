import { generateBatchAutoImports } from "@slux/shared";

const allImportApis: string[] = ["atom", "atomFamily", "createAtomScope", "derived", "writableAtom"];

export const createAutoImportApis = (prefix: string = "") => {
  return generateBatchAutoImports([
    {
      prefix,
      fromName: "@slux/atom",
      imports: allImportApis,
    },
  ]);
};
