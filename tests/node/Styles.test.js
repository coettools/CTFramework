import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { transform as Transform } from "esbuild";

const Read = (file) => readFile(new URL(file, import.meta.url), "utf8");
const ReadProperties = (css) => Object.fromEntries([...css.matchAll(/(--ct-[a-z0-9-]+)\s*:\s*([^;]+);/g)].map((match) => [match[1], match[2].trim()]));

test("default styling uses documented, role-based properties without aliases", async () => {
  const css = await Read("../../src/styles/Default.css");
  const guide = await Read("../../docs/Styling.md");
  const properties = ReadProperties(css);
  const documented = [...guide.matchAll(/^\| `(--ct-[a-z0-9-]+)` \|/gm)].map((match) => match[1]);
  assert.deepEqual(Object.keys(properties).sort(), documented.sort());
  assert.equal(properties["--ct-color-background"], "#101315");
  assert.equal(properties["--ct-color-surface"], "#081f2b");
  assert.equal(properties["--ct-color-accent"], "#2ab0b5");
  assert.equal(properties["--ct-color-success"], "#32cd32");
  assert.match(properties["--ct-radius-panel"], /^0?\.375rem$/);
  for (const [name, value] of Object.entries(properties)) {
    assert.ok(!value.includes("var("), `${name} must have a concrete default, not a compatibility alias`);
  }

  for (const match of css.matchAll(/var\((--ct-[a-z0-9-]+)/g)) {
    assert.ok(Object.hasOwn(properties, match[1]), `Missing default for ${match[1]}`);
  }
});

test("module output and both standalone bundles contain the current default CSS", async () => {
  const source = await Read("../../src/styles/Default.css");
  const minified = (await Transform(source, { loader: "css", minify: true, target: "es2022" })).code.trim();
  assert.equal(await Read("../../dist/styles/Default.css"), source);
  for (const name of ["ctframework.bundle.js", "ctframework.bundle.min.js"]) {
    const bundle = await Read(`../../dist/${name}`);
    const embedded = bundle.match(/data:text\/css;charset=utf-8,([^"\s]+)/);
    assert.ok(embedded, `${name} must embed the default stylesheet`);
    assert.equal(decodeURIComponent(embedded[1]), minified, `${name} has stale styles`);
  }
});

test("every visual component has default styling and an override reference", async () => {
  const css = await Read("../../src/styles/Default.css");
  const guide = await Read("../../docs/Styling.md");
  for (const name of [
    "application-layout",
    "side-navigation",
    "card",
    "chart",
    "code-block",
    "combobox",
    "pan-zoom-view",
    "image-carousel",
    "accordion",
    "data-table",
    "dropdown",
    "badge",
    "alert",
    "dialog",
    "popup-window",
    "toast",
    "tooltip",
    "fallback",
  ]) {
    assert.ok(css.includes(`.ct-${name} {`), `${name} needs default CSS`);
    assert.ok(guide.includes(`\`ct-${name}\``), `${name} needs styling documentation`);
  }

  assert.match(css, /^@layer ctframework/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /\.ct-dialog-backdrop\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/);
  assert.match(css, /\.ct-dialog\s*\{[^}]*min-width:\s*0/);
});

test("the eight chart color pairs exceed 3:1 against the documented dark and light surfaces", async () => {
  const properties = ReadProperties(await Read("../../src/styles/Default.css"));
  const Luminance = (hex) => {
    const channels = [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255).map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));

    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };

  for (let index = 1; index <= 8; index++) {
    const pair = properties[`--ct-chart-${index}`].match(/^light-dark\((#[0-9a-f]{6}),\s*(#[0-9a-f]{6})\)$/);
    assert.ok(pair, "Each chart token needs a real light and dark value");
    for (const [color, surface] of [
      [pair[1], "#f8fafa"],
      [pair[2], "#081f2b"],
    ]) {
      const colors = [Luminance(color), Luminance(surface)].sort((first, second) => first - second);
      assert.ok((colors[1] + 0.05) / (colors[0] + 0.05) >= 3, `${index}: ${color} versus ${surface}`);
    }
  }
});
