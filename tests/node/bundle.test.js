import test from "node:test";
import assert from "node:assert/strict";
import CT, * as CTFrameworkBundle from "../../dist/ctframework.bundle.js";
import MinifiedCT, * as MinifiedCTFrameworkBundle from "../../dist/ctframework.bundle.min.js";

test("standalone bundle exports the complete public API", () => {
  const publicExports = [
    "Accordion", "Alert", "Badge", "Card", "Component", "CT", "DataTable", "Dialog", "Dropdown",
    "FallbackView", "GetFormValues", "Guid", "HttpClient", "MaxLength", "PopupWindow", "Required",
    "Route", "Router", "SideNavigation", "Store", "Toast"
  ];

  assert.equal(CT, CTFrameworkBundle.CT);
  publicExports.forEach((name) => assert.equal(typeof CTFrameworkBundle[name], "function"));
});

test("minified standalone bundle exports the complete public API", () => {
  assert.equal(MinifiedCT, MinifiedCTFrameworkBundle.CT);
  assert.equal(typeof MinifiedCTFrameworkBundle.Component, "function");
  assert.equal(typeof MinifiedCTFrameworkBundle.DataTable, "function");
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
