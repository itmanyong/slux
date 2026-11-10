import { compile } from "svelte/compiler";

export default function (source) {
  return compile(source, { filename: this.resourcePath, generate: "server" }).js.code;
}
