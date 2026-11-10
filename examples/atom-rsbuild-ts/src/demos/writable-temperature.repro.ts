import { atom, writableAtom } from "@slux/atom";

const celsius = atom(0);
const fahrenheit = writableAtom(
  (get) => (get(celsius) * 9) / 5 + 32,
  (_get, set, next: number) => {
    set(celsius, ((next - 32) * 5) / 9);
  },
);

console.log(fahrenheit.get()); // → 预期输出: 32
fahrenheit.write(212);
console.log(celsius.get()); // → 预期输出: 100
fahrenheit.subscribe((value) => console.log("°F:", value)); // 不立即通知
celsius.update((value) => value + 10); // → 预期输出: °F: 122
