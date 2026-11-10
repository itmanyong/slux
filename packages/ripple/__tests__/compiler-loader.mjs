import { compile } from "ripple/compiler";

export default function loader(source) {
  return compile(source, this.resourcePath, { mode: this.getOptions().mode }).code;
}
