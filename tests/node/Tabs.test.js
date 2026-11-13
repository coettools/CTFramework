import assert from "node:assert/strict";
import test from "node:test";
import { CT } from "../../src/CTFramework.js";
import { Component } from "../../src/components/Component.js";
import { Tabs } from "../../src/components/Tabs.js";

const items = [
  { Id: 0, Title: "Gear", Content: "Inventory" },
  { Id: "locked", Title: "Locked", Content: null, Disabled: true },
  { Id: "0", Title: "Tree", Content: "Nodes", Span: 2, Badge: 0 },
];
const Options = (props) => ({ Label: "Build", Items: items, ...props });
const Control = (props) => {
  const node = Tabs(Options(props));
  const control = new node.tag(node.props);
  control.Render();

  return control;
};

const Attr = (view, name) => view.props.values.find((value) => value?.name === name)?.value;
const Panels = (view) => view.props.values.find(Array.isArray);
const Key = (control, key) => {
  let prevented = false;
  control.Navigate({ key, preventDefault: () => (prevented = true) }, control._selected);

  return prevented;
};

test("Tabs accepts only its documented names, unique typed item IDs and valid options", () => {
  assert.equal(Tabs(Options({ Key: 0 })).key, 0);
  for (const invalid of [{ label: "Alias" }, { Active: 0 }, { Label: " " }, { Layout: "grid" }, { MinPanelWidth: 220 }, { HeadingLevel: 7 }, { Items: {} }, { OnChange: true }, { OnLayoutChange: 0 }, { Value: false }]) {
    assert.throws(() => Tabs(Options(invalid)));
  }

  for (const field of [{ id: 0 }, { Label: "Alias" }, { Id: "" }, { Id: NaN }, { Span: 0 }, { Span: 1.5 }, { Disabled: 1 }, { Title: " " }]) {
    assert.throws(() => Tabs(Options({ Items: [{ ...items[0], ...field }] })));
  }

  assert.throws(() => Tabs(Options({ Items: [items[0], items[0]] })), /Duplicate: 0/);
  assert.throws(() => Tabs(Options({ Items: [{ Id: 0, Title: "Gear" }] })), /Content/);
  assert.notEqual(Control()._ids.get(0), Control()._ids.get(0));
});

test("keyboard selection wraps, skips disabled items and keeps controlled Value authoritative", () => {
  const changes = [];
  const control = Control({ OnChange: (id) => changes.push(id) });
  const focused = [];
  control.FocusItem = (id) => focused.push(id);
  assert.equal(Key(control, "Tab"), false);
  for (const key of ["ArrowRight", "Home", "ArrowLeft", "ArrowRight", "End", "End"]) {
    assert.equal(Key(control, key), true);
    control.Render();
  }

  assert.deepEqual(changes, ["0", 0, "0", 0, "0"]);
  assert.deepEqual(focused, ["0", 0, "0", 0, "0", "0"]);
  control.Select("locked");
  control.props = Options({ Value: 0, OnChange: (id) => changes.push(id) });
  control.Render();
  Key(control, "End");
  assert.equal(changes.at(-1), "0");
  assert.equal(control._selected, 0);
  control.props = Options({ Value: "missing", Items: [items[1]] });
  control.Render();
  assert.equal(control._selected, null);
  assert.equal(Key(control, "Home"), false);
});

test("panels and managed contents retain keys and template slots across layout and item changes", () => {
  class Child extends Component {}
  const child = CT.View({ Component: Child, Key: "child" });
  const first = { ...items[0], Content: child };
  const control = Control({ Items: [first, items[2]] });
  const tabs = Panels(control.Render());
  const prefix = control._ids.get(0);
  const slot = tabs[0].props.values.findIndex((value) => value?.props?.Content === child);
  assert.ok(slot >= 0);
  assert.equal(Attr(tabs[0], "aria-labelledby"), `${prefix}-tab`);
  assert.equal(Attr(tabs[0], "hidden"), false);
  assert.equal(Attr(tabs[1], "hidden"), true);

  control.props = Options({ Layout: "columns", HeadingLevel: 4, Items: [items[2], first] });
  const columns = Panels(control.Render());
  assert.deepEqual(
    columns.map((panel) => panel.key),
    ["0", 0],
  );
  assert.equal(Attr(columns[1], "aria-labelledby"), `${prefix}-heading`);
  assert.equal(columns[1].props.values.find((value) => value?.tag === "h4").props.id, `${prefix}-heading`);
  assert.equal(columns[1].props.strings, tabs[0].props.strings);
  assert.equal(columns[1].props.values[slot].props.Content, child);
  const wrapper = columns[1].props.values[slot];
  assert.equal(new wrapper.tag(wrapper.props).ShouldComponentUpdate({ Content: child }), false);
});

test("auto observes its own content width and CSS ruler, handles hysteresis, and reports only committed transitions", (context) => {
  const modes = [];
  const control = Control({ OnLayoutChange: (mode) => modes.push(mode) });
  const view = control.Render();
  const threshold = view.props.values.find((value) => value?.name === "style").value.width;
  assert.equal(threshold, "calc(4 * (22rem) + 2 * var(--ct-tabs-gap, 1rem))");
  const ruler = {};
  const root = { ownerDocument: {}, querySelector: () => ruler };
  control.vnode = { dom: root };
  let resize;
  const observed = [];
  const disconnect = context.mock.fn();
  const original = globalThis.ResizeObserver;
  context.after(() => (original === undefined ? delete globalThis.ResizeObserver : (globalThis.ResizeObserver = original)));
  globalThis.ResizeObserver = class {
    constructor(callback) {
      resize = callback;
    }
    observe(target) {
      observed.push(target);
    }
    disconnect = disconnect;
  };
  control.ForceUpdate = () => {
    control.Render();
    control.ComponentOnUpdate();
  };

  control.ComponentOnMount();
  assert.deepEqual(observed, [root, ruler]);
  const Entry = (target, width) => ({ target, contentRect: { width } });
  resize([Entry(root, 432), Entry(ruler, 432)]);
  assert.equal(control._mode, "columns");
  assert.deepEqual(modes, []);
  for (const width of [431, 432, 435, 436, 435, 0]) resize([Entry(root, width)]);
  assert.deepEqual(modes, ["tabs", "columns"]);
  resize([Entry(ruler, 500)]);
  resize([Entry(root, 490)]);
  assert.deepEqual(modes, ["tabs", "columns", "tabs"]);

  control.props = Options({ Layout: "columns", OnLayoutChange: () => assert.fail("forced layout fired callback") });
  control.ForceUpdate();
  assert.equal(disconnect.mock.callCount(), 1);
  resize([Entry(root, 1)]);
  assert.equal(control._mode, "columns");
});

test("layout collapse retains focus in an enabled panel or repairs it to the controlled tab", () => {
  for (const value of [undefined, 0]) {
    const control = Control({ Layout: "columns", Value: value, OnChange: () => assert.fail("layout requested a selection") });
    const active = {};
    const doc = { activeElement: active, getElementById: (id) => ({ contains: () => id === `${control._ids.get("0")}-panel` }) };
    control.vnode = { dom: { contains: () => true, ownerDocument: doc } };
    const focused = [];
    control.FocusItem = (...args) => focused.push(args);
    control.props = { ...control.props, Layout: "tabs" };
    control.Render();
    control.ComponentOnUpdate();
    assert.equal(control._selected, value ?? "0");
    assert.deepEqual(focused, value === undefined ? [] : [[0, "tab"]]);
  }
});

test("Columns uses equal row tracks, clamps spans and measures one row instead of every item", () => {
  const records = [items[0], { ...items[1], Disabled: false }, { ...items[2], Span: "full" }, { Id: "wide", Title: "Wide", Content: "Details", Span: 8 }];
  const control = Control({ Layout: "columns", Columns: 2, Items: records, MinPanelWidth: "24rem" });
  const view = control.Render();
  assert.equal(view.props.values.find((value) => value?.name === "style").value.width, "calc(2 * (24rem) + 1 * var(--ct-tabs-gap, 1rem))");
  const grid = view.props.values.find((value) => value?.name === "style" && value.value?.gridTemplateColumns);
  assert.equal(grid.value.gridTemplateColumns, "repeat(2, minmax(0, 1fr))");
  const panels = Panels(view);
  assert.deepEqual(
    panels.map((panel) => Attr(panel, "style").gridColumn),
    ["span 1", "span 1", "1 / -1", "span 2"],
  );
  control.props = { ...control.props, Layout: "tabs" };
  const tabs = Panels(control.Render());
  assert.ok(tabs.every((panel) => Attr(panel, "style") === null));
  assert.deepEqual(
    tabs.map((panel) => panel.key),
    records.map((record) => record.Id),
  );
});

test("ShowHeadings false keeps named regions including zero badges and ignores HeadingLevel", () => {
  const control = Control({ Layout: "columns", ShowHeadings: false, HeadingLevel: 99 });
  const columns = Panels(control.Render());
  assert.ok(columns.every((panel) => !panel.props.values.some((value) => typeof value?.tag === "string" && /^h[1-6]$/.test(value.tag))));
  assert.deepEqual(
    columns.map((panel) => Attr(panel, "aria-label")),
    ["Gear", "Locked", "Tree 0"],
  );
  assert.ok(columns.every((panel) => Attr(panel, "role") === "region" && Attr(panel, "aria-labelledby") === null));
  control.props = { ...control.props, Layout: "tabs" };
  const tabs = Panels(control.Render());
  assert.ok(tabs.every((panel) => Attr(panel, "role") === "tabpanel" && Attr(panel, "aria-label") === null && Attr(panel, "aria-labelledby").endsWith("-tab")));
  const headingOn = Control({ Layout: "columns", HeadingLevel: 3 });
  assert.ok(Panels(headingOn.Render()).every((panel) => panel.props.values.some((value) => value?.tag === "h3")));
});

test("new layout options validate strictly and the optional weighted layout remains current", () => {
  for (const Columns of [0, -1, 1.5, "2", null, Infinity, Number.MAX_SAFE_INTEGER + 1]) assert.throws(() => Tabs(Options({ Columns })), /Columns/);
  for (const ShowHeadings of [0, "false", null]) assert.throws(() => Tabs(Options({ ShowHeadings })), /ShowHeadings/);
  assert.doesNotThrow(() => Tabs(Options({ ShowHeadings: false, HeadingLevel: "unused" })));
  const weighted = Control({ Layout: "columns" });
  const view = weighted.Render();
  assert.equal(view.props.values.find((value) => value?.name === "style").value.width, "calc(4 * (22rem) + 2 * var(--ct-tabs-gap, 1rem))");
  assert.ok(Panels(view).every((panel) => Attr(panel, "style") === null && Attr(panel, "aria-label") === null));
  const full = Control({ Layout: "columns", Items: [{ Id: "full", Title: "All", Span: "full", Content: "Full row" }] });
  assert.equal(Attr(Panels(full.Render())[0], "style").gridColumn, "1 / -1");
});
