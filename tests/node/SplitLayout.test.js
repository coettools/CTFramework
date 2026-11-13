import assert from "node:assert/strict";
import test from "node:test";
import { SplitLayout, SplitLayoutComponent } from "../../src/components/SplitLayout.js";
import { ReadSplitLayoutOptions } from "../../src/utils/SplitLayoutOptions.js";

test("SplitLayout defaults to a nonsticky start column with side-first reading order", () => {
  assert.equal(SplitLayout().tag, SplitLayoutComponent);
  assert.deepEqual(ReadSplitLayoutOptions({}), {
    SideWidth: { Min: "18rem", Max: "24rem" },
    SidePosition: "start",
    StackOrder: "side-first",
    Sticky: false,
    StackBelow: "64rem",
    Gap: null,
    Label: { Side: null, Main: null },
  });
});

test("SplitLayout validates layout options before rendering CSS", () => {
  for (const props of [
    { SidePosition: "left" },
    { StackOrder: "reverse" },
    { Sticky: 1 },
    { Label: null },
    { Label: { Main: " " } },
    { Label: { Side: false } },
    { Gap: "10px; color: red" },
    { StackBelow: "100%" },
    { StackBelow: "-1px" },
    { SideWidth: { Min: "12em" } },
    { SideWidth: { Min: "2rem", Max: "1rem" } },
  ]) {
    assert.throws(() => new SplitLayoutComponent(props).Render(), /SplitLayout/);
  }

  const options = ReadSplitLayoutOptions({ SideWidth: { Min: "0", Max: ".5in" }, Gap: ".75EM", Label: { Side: " Outline " } });
  assert.equal(options.Gap, ".75em");
  assert.equal(options.Label.Side, "Outline");
});

test("SplitLayout uses stable panel keys in the requested DOM order, independent of logical position", () => {
  const layout = new SplitLayoutComponent({ Label: { Side: "Outline", Main: "Editor" } });
  const panels = () => layout.Render().props.values.find(Array.isArray);
  const first = panels();
  assert.match(first[0].props.strings[0], /<aside/);
  assert.deepEqual(
    first.map((panel) => panel.key),
    ["side", "main"],
  );
  layout.props = { ...layout.props, StackOrder: "main-first", SidePosition: "end" };
  const second = panels();
  assert.deepEqual(
    second.map((panel) => panel.key),
    ["main", "side"],
  );
  assert.deepEqual(second[1].props.strings, first[0].props.strings);
});

test("SplitLayout switches scrollports, observes the active one, and releases the side at its own width threshold", (t) => {
  const documentElement = { overflowY: "visible", clientHeight: 800 };
  const body = { parentElement: documentElement, overflowY: "visible" };
  const content = { parentElement: body, overflowY: "auto", clientHeight: 480 };
  const styles = new Map();
  const flags = new Map();
  const observed = new Set();
  const attributes = new Map();
  const original = Object.getOwnPropertyDescriptor(globalThis, "getComputedStyle");
  globalThis.getComputedStyle = (node) => node;
  t.after(() => {
    if (original) Object.defineProperty(globalThis, "getComputedStyle", original);
    else delete globalThis.getComputedStyle;
  });

  const layout = new SplitLayoutComponent({ Sticky: true });
  layout.Render();
  layout._root = {
    ownerDocument: { documentElement, body },
    parentElement: content,
    boxSizing: "border-box",
    width: "520px",
    paddingLeft: "10px",
    paddingRight: "10px",
    borderLeftWidth: "0",
    borderRightWidth: "0",
    toggleAttribute: (key, value) => flags.set(key, value),
    style: { setProperty: (key, value) => styles.set(key, value), removeProperty: (key) => styles.delete(key) },
  };
  layout._probe = { width: "500px" };
  layout._side = {
    scrollHeight: 601,
    clientHeight: 480,
    setAttribute: (key, value) => attributes.set(key, value),
    removeAttribute: (key) => attributes.delete(key),
  };
  layout._observer = { observe: (node) => observed.add(node), unobserve: (node) => observed.delete(node) };
  layout.Measure();
  assert.deepEqual([...observed], [content]);
  assert.equal(flags.get("data-stacked"), false);
  assert.equal(styles.get("--_ct-split-scrollport-height"), "480px");
  assert.equal(attributes.get("aria-label"), "Side panel");
  assert.equal(attributes.get("tabindex"), "0");

  content.paddingTop = "16px";
  content.paddingBottom = "24px";
  layout.Measure();
  assert.equal(styles.get("--_ct-split-scrollport-height"), "440px");
  content.paddingTop = "0px";
  content.paddingBottom = "0px";

  content.clientHeight = 650;
  layout._side.clientHeight = 601;
  layout.Measure();
  assert.equal(styles.get("--_ct-split-scrollport-height"), "650px");
  assert.equal(attributes.size, 0);
  content.overflowY = "visible";
  layout.Measure();
  assert.deepEqual([...observed], [documentElement]);
  assert.equal(styles.get("--_ct-split-scrollport-height"), "800px");

  layout._root.width = "519.5px";
  layout.Measure();
  assert.equal(flags.get("data-stacked"), true);
  assert.equal(flags.get("data-sticky"), false);
  assert.equal(styles.size, 0);
  assert.equal(observed.size, 0);
});
