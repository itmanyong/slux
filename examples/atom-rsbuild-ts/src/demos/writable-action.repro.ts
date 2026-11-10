import { atom, writableAtom } from "@slux/atom";

const history = atom<string[]>([]);
const append = writableAtom(null, (get, set, item: string) => {
  set(history, [...get(history), item]);
  return get(history).length;
});
const clear = writableAtom(null, (_get, set) => {
  set(history, []);
});

console.log(append.write("first")); // → 预期输出: 1
append.write("second");
console.log(history.get()); // → 预期输出: [ 'first', 'second' ]
clear.write();
console.log(history.get()); // → 预期输出: []
