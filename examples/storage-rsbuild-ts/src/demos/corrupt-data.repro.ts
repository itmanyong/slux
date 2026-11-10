import { createStore } from "@slux/store";
import { persist, memoryStorage } from "@slux/storage";

const storage = memoryStorage();
storage.setItem("persist:corrupt", "not-json{{{");

const persistMiddleware = persist<{ theme: string }>({
  key: "persist:corrupt",
  storage,
  onError: (error) => console.log("onError:", error.code),
});

const store = createStore<{ theme: string }>(() => ({ theme: "light" }), {
  middleware: [persistMiddleware],
});

// → onError: DeserializationFailed
console.log(store.getState().theme); // → light（坏数据不影响初始状态）
