import test from "node:test";
import assert from "node:assert/strict";
import CT, * as CTFrameworkBundle from "../../dist/ctframework.bundle.js";
import MinifiedCT, * as MinifiedCTFrameworkBundle from "../../dist/ctframework.bundle.min.js";
import * as CTFramework from "../../src/Index.js";

const publicExports = Object.keys(CTFramework)
  .filter((name) => name !== "default")
  .sort();

test("standalone bundle exports the complete public API", () => {
  assert.equal(CT, CTFrameworkBundle.CT);
  assert.deepEqual(Object.keys(CTFrameworkBundle).filter((name) => name !== "default").sort(), publicExports);
  publicExports.forEach((name) => assert.equal(typeof CTFrameworkBundle[name], typeof CTFramework[name]));
});

test("minified standalone bundle exports the complete public API", () => {
  assert.equal(MinifiedCT, MinifiedCTFrameworkBundle.CT);
  assert.deepEqual(Object.keys(MinifiedCTFrameworkBundle).filter((name) => name !== "default").sort(), publicExports);
  publicExports.forEach((name) => assert.equal(typeof MinifiedCTFrameworkBundle[name], typeof CTFramework[name]));
});

test("bundled Component preserves a derived component constructor", () => {
  class BundleApp extends MinifiedCTFrameworkBundle.Component {
    Render() {
      return "Bundle app rendered";
    }
  }

  const app = new BundleApp();

  assert.equal(app instanceof MinifiedCTFrameworkBundle.Component, true);
  assert.equal(app.constructor, BundleApp);
  assert.equal(app.Render(), "Bundle app rendered");
});
