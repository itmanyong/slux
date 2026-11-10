import { observable, ref, subscribe } from "@slux/proxy";

const state = observable({ connection: ref(new Map([["latency", 42]])) });
let notified = 0;
subscribe(state, () => {
  notified += 1;
});

state.connection.current.set("latency", 99); // ref 内部修改不通知
console.log(state.connection.current.get("latency")); // → 预期输出: 99
console.log(notified); // → 预期输出: 0

state.connection = ref(new Map([["latency", 7]])); // 替换属性，通知
console.log(notified); // → 预期输出: 1
