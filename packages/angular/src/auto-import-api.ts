import { generateBatchAutoImports } from "@slux/shared";

const allImportApis: string[] = [
  "SLUX_SCOPE",
  "fromObservable",
  "injectScope",
  "injectStore",
  "provideSluxScope",
  "toAngularSignal",
  "toObservable",
];

export const createAutoImportApis = (prefix: string = "") => {
  return generateBatchAutoImports([
    {
      prefix,
      fromName: "@slux/angular",
      imports: allImportApis,
    },
  ]);
};
