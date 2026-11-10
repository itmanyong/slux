import { createStore } from "@slux/store";
import { persist, memoryStorage } from "@slux/storage";

const storage = memoryStorage();
storage.setItem("persist:defer", JSON.stringify({ state: { theme: "dark" }, version: 0 }));

const persistMiddleware = persist<{ theme: string }>({
  key: "persist:defer",
  storage,
  skipHydration: true,
});
const store = createStore<{ theme: string }>(() => ({ theme: "light" }), {
  middleware: [persistMiddleware],
});

console.log(store.getState().theme); // → light（跳过自动水合）
console.log(persistMiddleware.hasHydrated()); // → false

void persistMiddleware.rehydrate().then(() => {
  console.log(store.getState().theme); // → dark
});
