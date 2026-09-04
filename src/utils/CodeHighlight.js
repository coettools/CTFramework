const Languages = new Set(["javascript", "csharp", "html", "css", "json"]);
const Keywords = new Set("async await break case catch class const continue debugger default delete do else export extends finally for from function if import in instanceof let new of return static super switch this throw try typeof var void while yield".split(" "));
const CSharpKeywords = new Set("abstract add alias and as ascending async await base bool break by byte case catch char checked class const continue decimal default delegate descending do double dynamic else enum equals event explicit extern field file finally fixed float for foreach from get global goto group if implicit in init int interface internal into is join let lock long managed nameof namespace new nint not notnull nuint object on operator or orderby out override params partial private protected public readonly record ref remove required return sbyte scoped sealed select set short sizeof stackalloc static string struct switch this throw try typeof uint ulong unchecked unmanaged unsafe ushort using value var virtual void volatile when where while with yield".split(" "));
const Literals = new Set(["true", "false", "null", "undefined"]);
const Strings = "\"(?:\\\\[\\s\\S]|[^\"\\\\])*\"|'(?:\\\\[\\s\\S]|[^'\\\\])*'";
const Comments = "/\\*[\\s\\S]*?(?:\\*/|(?![\\s\\S]))";
const CSharpStrings = /\$*"{3,}|(?:\$@|@\$|@)"(?:""|[^"])*(?:"|(?![\s\S]))|\$?"(?:\\[\s\S]|[^"\\])*(?:"|(?![\s\S]))|'(?:\\[\s\S]|[^'\\])*(?:'|(?![\s\S]))/;
const CSharpNumbers = /\b0[xX][\da-fA-F_]+[uUlL]*\b|\b0[bB][01_]+[uUlL]*\b|(?:\b\d[\d_]*(?:\.[\d_]+)?|\.\d[\d_]*)(?:[eE][+-]?[\d_]+)?[fFdDmMuUlL]*\b/;
const Patterns = {
  csharp: new RegExp(`${Comments}|//[^\\r\\n]*|${CSharpStrings.source}|^[\\t ]*#[a-zA-Z]+\\b|${CSharpNumbers.source}|@?[a-zA-Z_][\\w]*|\\$+`, "gm"),
  javascript: new RegExp(`${Comments}|//[^\\r\\n]*|${Strings}|\x60(?:\\\\[\\s\\S]|[^\x60\\\\])*\x60|\\b(?:0[xX][\\da-fA-F]+|\\d+(?:\\.\\d+)?)\\b|[a-zA-Z_$][\\w$]*`, "g"),
  html: new RegExp(`<!--[\\s\\S]*?(?:-->|$)|${Strings}|</?[a-zA-Z][\\w:-]*|/?>|[a-zA-Z_:][\\w:.-]*|&(?:#\\w+|\\w+);`, "g"),
  css: new RegExp(`${Comments}|${Strings}|--[\\w-]+|[a-zA-Z-]+|#[\\da-fA-F]{3,8}\\b|\\b\\d+(?:\\.\\d+)?(?:%|[a-z]+)?|@[\\w-]+`, "g"),
  json: new RegExp(`\"(?:\\\\[\\s\\S]|[^\"\\\\])*\"|\\b(?:true|false|null)\\b|-?\\b\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?\\b`, "g")
};

export const GetCodeLanguage = (language) => language === "c#" || language === "cs" ? "csharp" : Languages.has(language) ? language : "text";

const GetTokenType = (value, language, following) => {
  if (value.startsWith("/*") || value.startsWith("//") || value.startsWith("<!--")) return "comment";
  if (value[0] === '"' || value[0] === "'" || value[0] === "`") {
    return language === "json" && /^\s*:/.test(following) ? "property" : "string";
  }
  if (language === "csharp") {
    if (/^[\$@]+"/.test(value)) return "string";
    if (["true", "false", "null"].includes(value) || /^(?:\d|\.\d)/.test(value)) return "number";
    if (CSharpKeywords.has(value) || /^\s*#/.test(value)) return "keyword";
    if (/^\s*:/.test(following)) return "property";
    return /^\s*\(/.test(following) ? "function" : "plain";
  }
  if (language === "html") return value.startsWith("&") ? "number" : value.includes("<") || value.includes(">") ? "keyword" : /^\s*=/.test(following) ? "property" : "plain";
  if (language === "css") return value.startsWith("@") ? "keyword" : /^[#\d]/.test(value) ? "number" : value.startsWith("--") || /^\s*:/.test(following) ? "property" : "plain";
  if (Literals.has(value) || /^-?\d/.test(value)) return "number";
  if (Keywords.has(value)) return "keyword";
  if (/^\s*:/.test(following)) return "property";
  if (/^\s*\(/.test(following)) return "function";
  return "plain";
};

export const HighlightCode = (code, language) => {
  const resolvedLanguage = GetCodeLanguage(language);
  const pattern = Patterns[resolvedLanguage];
  if (!pattern || code.length > 100000) return [{ Text: code, Type: "plain" }];

  // Consume unmatched identifiers too, rather than retrying a searching regex
  // at every character of a long token.
  const matcher = new RegExp(pattern.source, pattern.flags.replace("g", "y"));
  const plain = /[\w$-]+|\s+|[\s\S]/y;
  const tokens = [];
  let position = 0;
  while (position < code.length) {
    matcher.lastIndex = position;
    const match = matcher.exec(code);
    if (!match) {
      plain.lastIndex = position;
      const value = plain.exec(code)[0];
      tokens.push({ Text: value, Type: "plain" });
      position = plain.lastIndex;
      continue;
    }
    let value = match[0];
    if (resolvedLanguage === "csharp" && /^\$*"{3,}$/.test(value)) {
      // Raw strings close with the opening quote count; do not scan their contents as code.
      const delimiter = value.slice(value.indexOf('"'));
      const end = code.indexOf(delimiter, matcher.lastIndex);
      matcher.lastIndex = end < 0 ? code.length : end + delimiter.length;
      value = code.slice(match.index, matcher.lastIndex);
    }
    position = matcher.lastIndex;
    tokens.push({ Text: value, Type: GetTokenType(value, resolvedLanguage, code.slice(position)) });
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
