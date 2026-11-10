import { createStore } from "@slux/store";
import { persist, memoryStorage } from "@slux/storage";

const storage = memoryStorage();
storage.setItem("persist:callback", JSON.stringify({ state: { theme: "dark" }, version: 0 }));

const persistMiddleware = persist<{ theme: string }>({
  key: "persist:callback",
  storage,
  skipHydration: true,
});
const store = createStore<{ theme: string }>(() => ({ theme: "light" }), {
  middleware: [persistMiddleware],
});

persistMiddleware.onHydrate((state) => console.log("hydrated:", state.theme));

void persistMiddleware.rehydrate().then(() => {
  console.log(store.getState().theme); // → dark
});
// → hydrated: dark（onHydrate 在水合完成时先于 promise 触发）
