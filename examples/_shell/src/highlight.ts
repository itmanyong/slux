const KEYWORDS = new Set([
  "import",
  "from",
  "export",
  "const",
  "let",
  "var",
  "type",
  "interface",
  "return",
  "if",
  "else",
  "for",
  "of",
  "in",
  "new",
  "function",
  "try",
  "catch",
  "finally",
  "throw",
  "while",
  "do",
  "switch",
  "case",
  "break",
  "continue",
  "await",
  "async",
  "as",
  "instanceof",
  "typeof",
  "void",
  "this",
  "extends",
  "implements",
  "class",
  "readonly",
  "null",
  "undefined",
  "true",
  "false",
]);

const TOKEN = /(\/\/[^\n]*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|\b(\d[\d_]*(?:\.\d+)?)\b|\b([A-Za-z_$][\w$]*)\b/g;

const escapeHtml = (value: string) =>
  value.replace(/[&<>]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[character] ?? character);

const isCall = (source: string, from: number) => {
  let index = from;
  while (index < source.length && (source[index] === " " || source[index] === "\t")) index += 1;
  return source[index] === "(";
};

const wrap = (className: string, text: string) => `<span class="${className}">${escapeHtml(text)}</span>`;

/**
 * 只做最小着色：注释、字符串、数字、关键字、调用与类型名。
 * 原文逐字符保留，任何未被识别的片段都原样输出，因此不会改变代码内容。
 */
export function highlight(source: string): string {
  let html = "";
  let cursor = 0;

  for (const match of source.matchAll(TOKEN)) {
    const start = match.index ?? 0;
    html += escapeHtml(source.slice(cursor, start));

    const [text, comment, string, number, word] = match;
    if (comment !== undefined) {
      html += wrap("tok-comment", comment);
    } else if (string !== undefined) {
      html += wrap("tok-string", string);
    } else if (number !== undefined) {
      html += wrap("tok-number", number);
    } else if (word !== undefined) {
      if (KEYWORDS.has(word)) html += wrap("tok-keyword", word);
      else if (isCall(source, start + word.length)) html += wrap("tok-call", word);
      else if (/^[A-Z]/.test(word)) html += wrap("tok-type", word);
      else html += escapeHtml(word);
    }

    cursor = start + text.length;
  }

  return html + escapeHtml(source.slice(cursor));
}
