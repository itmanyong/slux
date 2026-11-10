import { generateBatchAutoImports } from "@slux/shared";

const allImportApis: string[] = [
  "PERSIST_ERROR_CODE",
  "cookieStorage",
  "indexedDBStorage",
  "localStorageBackend",
  "memoryStorage",
  "persist",
  "sessionStorageBackend",
];

export const createAutoImportApis = (prefix: string = "") => {
  return generateBatchAutoImports([
    {
      prefix,
      fromName: "@slux/storage",
      imports: allImportApis,
    },
  ]);
};
