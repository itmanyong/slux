import { createStore } from "@slux/store";
import { persist, memoryStorage } from "@slux/storage";

const storage = memoryStorage();
const persistMiddleware = persist<{ theme: string }>({
  key: "persist:basic",
  storage,
});
const store = createStore<{ theme: string }>(() => ({ theme: "light" }), {
  middleware: [persistMiddleware],
});

console.log(persistMiddleware.hasHydrated()); // → true（init 自动水合）

store.setState({ theme: "dark" });
console.log(storage.getItem("persist:basic"));
// → {"state":{"theme":"dark"},"version":0}
