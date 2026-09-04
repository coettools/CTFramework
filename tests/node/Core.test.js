import assert from "node:assert/strict";
import test from "node:test";

import { CT, Guid, MaxLength, Required, Route } from "../../src/Index.js";

test("CT exposes the cleaned template API", () => {
  const handler = () => {};
  const vnode = CT.Html`<button ${CT.On("click", handler)}>${"Save"}</button>`;

  assert.equal(typeof CT, "function");
  assert.equal(vnode.tag, "ct-template");
  assert.equal(vnode.props.values[0].eventType, "click");
  assert.equal(vnode.props.values[1], "Save");
  assert.equal("el" in CT, false);
  assert.equal("element" in CT, false);
});

test("PascalCase utility exports stay predictable", () => {
  assert.equal(Required("value"), true);
  assert.equal(Required("   "), false);
  assert.equal(MaxLength("abc", 3), true);
  assert.equal(MaxLength("abcd", 3), false);
  assert.deepEqual(Route("/notes", "notes"), { path: "/notes", component: "notes" });
  assert.match(Guid(), /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});
