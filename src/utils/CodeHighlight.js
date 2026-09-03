const Languages = new Set(["javascript", "html", "css", "json"]);
const Keywords = new Set("async await break case catch class const continue debugger default delete do else export extends finally for from function if import in instanceof let new of return static super switch this throw try typeof var void while yield".split(" "));
const Literals = new Set(["true", "false", "null", "undefined"]);
const Strings = "\"(?:\\\\[\\s\\S]|[^\"\\\\])*\"|'(?:\\\\[\\s\\S]|[^'\\\\])*'";
const Comments = "/\\*[\\s\\S]*?(?:\\*/|$)";
const Patterns = {
  javascript: new RegExp(`${Comments}|//[^\\r\\n]*|${Strings}|\x60(?:\\\\[\\s\\S]|[^\x60\\\\])*\x60|\\b(?:0[xX][\\da-fA-F]+|\\d+(?:\\.\\d+)?)\\b|[a-zA-Z_$][\\w$]*`, "g"),
  html: new RegExp(`<!--[\\s\\S]*?(?:-->|$)|${Strings}|</?[a-zA-Z][\\w:-]*|/?>|[a-zA-Z_:][\\w:.-]*(?=\\s*=)|&(?:#\\w+|\\w+);`, "g"),
  css: new RegExp(`${Comments}|${Strings}|--[\\w-]+|[a-zA-Z-]+(?=\\s*:)|#[\\da-fA-F]{3,8}\\b|\\b\\d+(?:\\.\\d+)?(?:%|[a-z]+)?|@[\\w-]+`, "g"),
  json: new RegExp(`\"(?:\\\\[\\s\\S]|[^\"\\\\])*\"|\\b(?:true|false|null)\\b|-?\\b\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?\\b`, "g")
};

export const GetCodeLanguage = (language) => Languages.has(language) ? language : "text";

const GetTokenType = (value, language, following) => {
  if (value.startsWith("/*") || value.startsWith("//") || value.startsWith("<!--")) return "comment";
  if (value[0] === '"' || value[0] === "'" || value[0] === "`") {
    return language === "json" && /^\s*:/.test(following) ? "property" : "string";
  }
  if (language === "html") return value.startsWith("&") ? "number" : value.includes("<") || value.includes(">") ? "keyword" : "property";
  if (language === "css") return value.startsWith("@") ? "keyword" : /^[#\d]/.test(value) ? "number" : "property";
  if (Literals.has(value) || /^-?\d/.test(value)) return "number";
  if (Keywords.has(value)) return "keyword";
  if (/^\s*:/.test(following)) return "property";
  if (/^\s*\(/.test(following)) return "function";
  return "plain";
};

export const HighlightCode = (code, language) => {
  const pattern = Patterns[GetCodeLanguage(language)];
  if (!pattern || code.length > 100000) return [{ Text: code, Type: "plain" }];

  const tokens = [];
  let position = 0;
  for (const match of code.matchAll(pattern)) {
    if (match.index > position) tokens.push({ Text: code.slice(position, match.index), Type: "plain" });
    position = match.index + match[0].length;
    tokens.push({ Text: match[0], Type: GetTokenType(match[0], language, code.slice(position)) });
  }
  if (position < code.length) tokens.push({ Text: code.slice(position), Type: "plain" });
  return tokens;
};

export const GetCodeLines = (code, language) => {
  const lines = [[]];
  for (const token of HighlightCode(code.replace(/\r\n?/g, "\n"), language)) {
    token.Text.split("\n").forEach((text, index) => {
      if (index > 0) lines.push([]);
      if (text) lines[lines.length - 1].push({ Text: text, Type: token.Type });
    });
  }
  return lines;
};
