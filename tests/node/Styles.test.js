import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const Read = (file) => readFile(new URL(file, import.meta.url), "utf8");
const ReadProperties = (css) => Object.fromEntries(
  [...css.matchAll(/(--ct-[a-z-]+)\s*:\s*([^;]+);/g)].map((match) => [match[1], match[2].trim()])
);
const Normalize = (css) => css.replace(/\s+/g, " ").replace(/\s*([{}:;,>])\s*/g, "$1").trim();

test("default styling uses documented, role-based properties without aliases", async () => {
  const css = await Read("../../src/styles/Default.css");
  const guide = await Read("../../docs/Styling.md");
  const properties = ReadProperties(css);
  const documented = [...guide.matchAll(/^\| `(--ct-[a-z-]+)` \|/gm)].map((match) => match[1]);
  assert.deepEqual(Object.keys(properties).sort(), documented.sort());
  assert.equal(properties["--ct-color-background"], "#101315");
  assert.equal(properties["--ct-color-surface"], "#081f2b");
  assert.equal(properties["--ct-color-accent"], "#2ab0b5");
  assert.equal(properties["--ct-color-success"], "#32cd32");
  assert.equal(properties["--ct-radius-panel"], ".375rem");
  for (const [name, value] of Object.entries(properties)) {
    assert.ok(!value.includes("var("), `${name} must have a concrete default, not a compatibility alias`);
  }
  for (const match of css.matchAll(/var\((--ct-[a-z-]+)/g)) {
    assert.ok(Object.hasOwn(properties, match[1]), `Missing default for ${match[1]}`);
  }
});

test("module output and both standalone bundles contain the current default CSS", async () => {
  const source = await Read("../../src/styles/Default.css");
  assert.equal(await Read("../../dist/styles/Default.css"), source);
  for (const name of ["ctframework.bundle.js", "ctframework.bundle.min.js"]) {
    const bundle = await Read(`../../dist/${name}`);
    const embedded = bundle.match(/data:text\/css;charset=utf-8,([^"\s]+)/);
    assert.ok(embedded, `${name} must embed the default stylesheet`);
    assert.equal(decodeURIComponent(embedded[1]), Normalize(source), `${name} has stale styles`);
  }
});

test("every visual component has default styling and an override reference", async () => {
  const css = await Read("../../src/styles/Default.css");
  const guide = await Read("../../docs/Styling.md");
  for (const name of ["application-layout", "side-navigation", "card", "code-block", "image-carousel", "accordion", "data-table", "dropdown", "badge", "alert", "dialog", "popup-window", "toast", "tooltip", "fallback"]) {
    assert.ok(css.includes(`.ct-${name} {`), `${name} needs default CSS`);
    assert.ok(guide.includes(`\`ct-${name}\``), `${name} needs styling documentation`);
  }
  assert.match(css, /^@layer ctframework/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /\.ct-dialog-backdrop\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/);
  assert.match(css, /\.ct-dialog\s*\{[^}]*min-width:\s*0/);
});
