import { createStore } from "@slux/store";
import { persist, memoryStorage } from "@slux/storage";

const storage = memoryStorage();
const persistMiddleware = persist<{ secret: string; theme: string }>({
  key: "persist:partialize",
  storage,
  partialize: (state) => ({ theme: state.theme }),
});
const store = createStore<{ secret: string; theme: string }>(() => ({ secret: "token-123", theme: "light" }), {
  middleware: [persistMiddleware],
});

store.setState({ theme: "dark" });
console.log(storage.getItem("persist:partialize"));
// → {"state":{"theme":"dark"},"version":0}（secret 没有落盘）

store.setState({ secret: "token-456" });
console.log(store.getState().secret); // → token-456（内存中可见，envelope 不变）
