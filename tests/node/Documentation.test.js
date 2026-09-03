import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import * as CTFramework from "../../src/Index.js";

const Read = (file) => readFile(new URL(file, import.meta.url), "utf8");
const publicExports = Object.keys(CTFramework).filter((name) => name !== "default").sort();

const ReadSection = (document, heading) => {
  const section = document.split(`\n## ${heading}\n`)[1];
  assert.ok(section, `Missing documentation section: ${heading}`);
  return section.split("\n## ")[0];
};

const ReadDocument = async (file) => (await Read(`../../docs/${file}`)).replace(/\r\n/g, "\n");

const ReadComponentExports = async () => {
  const source = await Read("../../src/Index.js");
  const names = [...source.matchAll(/import\s*\{([^}]+)\}\s*from\s*"\.\/components\/[^"]+"/g)]
    .flatMap((match) => match[1].split(",").map((name) => name.trim()))
    .filter((name) => name !== "Component" && publicExports.includes(name));
  assert.ok(names.length > 0, "The public entry module must expose UI components");
  return names.sort();
};

for (const file of ["Api.md", "Guide.md"]) {
  test(`${file} complete import matches the public exports`, async () => {
    const document = await ReadDocument(file);
    const declaration = document.match(/import CT,\s*\{([^}]+)\}\s*from "@coettools\/ctframework"/);
    assert.ok(declaration, `${file} needs a complete public import example`);
    const names = ["CT", ...declaration[1].split(",").map((name) => name.trim()).filter(Boolean)];
    assert.deepEqual(names.sort(), publicExports, `${file} has missing, duplicate, or stale imports`);
  });
}

test("the CT method index matches the public CT helpers", async () => {
  const section = ReadSection(await ReadDocument("Api.md"), "CT");
  const documented = [...section.matchAll(/^\| `CT\.([A-Za-z]+)(?:\(|`)/gm)].map((match) => match[1]);
  assert.deepEqual(documented.sort(), Object.keys(CTFramework.CT).sort());
});

test("every UI component has an API entry and an individual usage example", async () => {
  const names = await ReadComponentExports();
  const index = ReadSection(await ReadDocument("Api.md"), "Components");
  const indexed = [...index.matchAll(/`([A-Za-z]+)`/g)].map((match) => match[1]);
  assert.deepEqual(indexed.sort(), names, "The component API index has missing or stale entries");

  const document = await ReadDocument("Components.md");
  const headings = [...document.matchAll(/^## ([A-Za-z]+)$/gm)].map((match) => match[1]);
  assert.deepEqual(headings.sort(), names, "The component guide has missing or stale sections");
  for (const name of names) {
    const section = ReadSection(document, name);
    const examples = [...section.matchAll(/```js\n([\s\S]*?)```/g)].map((match) => match[1]);
    assert.ok(examples.some((example) => example.includes(`${name}({`)), `${name} needs its own usage example`);
  }
});

test("every UI component has a documented default CSS selector", async () => {
  const names = await ReadComponentExports();
  const section = ReadSection(await ReadDocument("Styling.md"), "Component Reference");
  const rows = [...section.matchAll(/^\| `([A-Za-z]+)` \| `(ct-[a-z-]+)` \|/gm)];
  assert.deepEqual(rows.map((match) => match[1]).sort(), names, "The styling reference has missing or stale components");

  const css = await Read("../../src/styles/Default.css");
  for (const [, name, className] of rows) {
    assert.ok(css.includes(`.${className} {`), `${name} needs default CSS for its documented selector`);
  }
});
