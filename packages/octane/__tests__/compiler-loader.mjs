import { compile } from "octane/compiler";

export default function loader(source) {
  const result = compile(source, this.resourcePath, {
    mode: this.getOptions().mode,
    dev: true,
  });
  return result.code;
}
