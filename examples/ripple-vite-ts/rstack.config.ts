import { define } from "rstack";

define.lint(({ js, ts }) => [js.configs.recommended, ts.configs.recommended]);
