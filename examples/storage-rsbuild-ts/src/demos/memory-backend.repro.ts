import { memoryStorage } from "@slux/storage";

const storage = memoryStorage();

storage.setItem("theme", "dark");
console.log(storage.getItem("theme")); // → dark

storage.removeItem("theme");
console.log(storage.getItem("theme")); // → null
