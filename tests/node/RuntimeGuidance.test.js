import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const Read = (name) => readFile(new URL(`../../docs/${name}`, import.meta.url), "utf8");

test("API and component guides distinguish package tooling and plain browser imports", async () => {
  for (const file of ["Api.md", "Component-Guide.md", "Guide.md"]) {
    const source = await Read(file);
    assert.match(source, /module tooling/);
    assert.match(source, /[Pp]lain browser/);
    assert.match(source, /Getting-Started\.md/);
  }
});

test("state documentation explains immediate state, shallow updates and cancellation", async () => {
  const source = await Read("Component-Guide.md");
  assert.match(source, /State changes immediately/);
  assert.match(source, /shallow copy/);
  assert.match(source, /Nested objects remain shared/);
  assert.match(source, /null.*undefined/);
  assert.match(source, /100/);
});

test("binding documentation covers drafts, mixed checkbox state and native form reset", async () => {
  const source = await Read("Html-And-Dom.md");
  assert.match(source, /unchanged `value` or `checked`/);
  assert.match(source, /indeterminate/);
  assert.match(source, /defaultSelected/);
  assert.match(source, /focus.*blur/);
  assert.match(source, /Unsupported event names are rejected/);
  const components = await Read("Components.md");
  assert.match(components, /Placeholder.*Select an option/);
});
