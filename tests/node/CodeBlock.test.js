import assert from "node:assert/strict";
import test from "node:test";
import { CodeBlock } from "../../src/Index.js";
import { CodeBlockComponent } from "../../src/components/CodeBlock.js";
import { GetCodeLanguage, GetCodeLines, HighlightCode } from "../../src/utils/CodeHighlight.js";

const ReadText = (tokens) => tokens.map((token) => token.Text).join("");
const CreateControl = (props = {}) => {
  const control = new CodeBlockComponent(props);
  control.SetState = (update) => {
    control.state = { ...control.state, ...(typeof update === "function" ? update(control.state) : update) };
  };
  return control;
};

test("code highlighting preserves every character in all supported languages", () => {
  const examples = {
    javascript: '// Example\nconst Save = async () => {\n  return { Count: 42, Text: "a\\\"b", Ready: true };\n};\n',
    html: '<!-- Example -->\n<button title="a > b" disabled>Save &amp; close</button>',
    css: '/* Example */\n.card {\n  --accent: #2ab0b5;\n  padding: 1.5rem;\n}',
    json: '{ "Count": -1.25e+2, "Ready": true, "Items": [null, "hello"] }'
  };
  for (const [language, code] of Object.entries(examples)) {
    const tokens = HighlightCode(code, language);
    assert.equal(ReadText(tokens), code);
    assert.ok(tokens.some((token) => token.Type !== "plain"));
    assert.deepEqual(HighlightCode(code, language), tokens, "Repeated calls must not retain regex state");
  }
  assert.equal(HighlightCode('"Count": 1', "json")[0].Type, "property");
  assert.equal(HighlightCode("const", "javascript")[0].Type, "keyword");
});

test("blank lines, indentation, templates, and unknown languages remain readable", () => {
  const code = '\tconst view = html`<p>\r\n  ${name}\r\n</p>`;\r\n\r\n';
  assert.equal(GetCodeLines(code, "javascript").map(ReadText).join("\n"), code.replaceAll("\r\n", "\n"));
  assert.deepEqual(GetCodeLines("", "text"), [[]]);
  for (const language of ["text", "python", "constructor", "__proto__", undefined]) {
    assert.equal(GetCodeLanguage(language), "text");
    assert.deepEqual(HighlightCode(code, language), [{ Text: code, Type: "plain" }]);
  }
  const longCode = "x".repeat(100001);
  assert.deepEqual(HighlightCode(longCode, "javascript"), [{ Text: longCode, Type: "plain" }]);
});

test("CodeBlock is public and recomputes tokens only when code or language changes", () => {
  assert.equal(CodeBlock().tag, CodeBlockComponent);
  const control = CreateControl({ Code: "const count = 2;" });
  control.Render();
  const lines = control._lines;
  control.ToggleWrap();
  control.Render();
  assert.equal(control.state.Wrap, true);
  assert.equal(control._lines, lines);
  control.props = { Code: "const count = 2;", Language: "text", LineNumbers: false, Copy: false };
  assert.doesNotMatch(JSON.stringify(control.Render()), /has-line-numbers|Copy code|ct-code-token-keyword/);
  control.props = { Code: "updated" };
  control.Render();
  assert.equal(control._lines.map(ReadText).join("\n"), "updated");
});

test("Copy writes the original source, handles denial, and ignores completion after unmount", async (context) => {
  const code = "\tconst count = 2;\r\n\r\n";
  let copied = null;
  let write = async (value) => { copied = value; };
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: { clipboard: { writeText: (value) => write(value) } } });
  context.after(() => descriptor ? Object.defineProperty(globalThis, "navigator", descriptor) : delete globalThis.navigator);
  const control = CreateControl({ Code: code });
  await control.CopyCode();
  assert.equal(copied, code);
  assert.equal(control.state.CopiedCode, code);
  control.props = { Code: "new code" };
  assert.doesNotMatch(JSON.stringify(control.Render()), /"Copied"/);
  write = async () => { throw new Error("Permission denied"); };
  await control.CopyCode();
  assert.equal(control.state.CopyErrorCode, "new code");
  assert.equal(control.state.IsCopying, false);

  globalThis.navigator.clipboard = null;
  control.props = { Code: "Clipboard unavailable" };
  await control.CopyCode();
  assert.equal(control.state.CopyErrorCode, "Clipboard unavailable");
  globalThis.navigator.clipboard = { writeText: (value) => write(value) };

  let finish;
  write = () => new Promise((resolve) => { finish = resolve; });
  const pending = control.CopyCode();
  control.ComponentOnUnmount();
  const state = control.state;
  finish();
  await pending;
  assert.equal(control.state, state);
});

test("readable and minified distributions produce the same code view as source", async () => {
  for (const file of ["ctframework.bundle.js", "ctframework.bundle.min.js"]) {
    const bundle = await import(`../../dist/${file}`);
    for (const language of ["javascript", "html", "css", "json", "text"]) {
      const options = { Code: '// comment\nconst view = html`<p>${value}</p>`;\n"name": 42; /* note */', Language: language };
      const bundled = new (bundle.CodeBlock(options).tag)(options);
      assert.deepEqual(JSON.parse(JSON.stringify(bundled.Render())), JSON.parse(JSON.stringify(new CodeBlockComponent(options).Render())), `${file}: ${language}`);
    }
  }
});
