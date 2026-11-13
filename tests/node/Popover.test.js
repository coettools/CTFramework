import assert from "node:assert/strict";
import test from "node:test";
import { CT } from "../../src/CTFramework.js";
import { Popover, PopoverComponent } from "../../src/components/Popover.js";
import { PositionPopover } from "../../src/utils/PopoverPosition.js";
import { GetPopoverTrigger, PopoverTriggerAttributes } from "../../src/utils/PopoverTrigger.js";

const trigger = CT.Html`<button type="button">Preview</button>`;
const content = CT.Html`<article>Long details</article>`;
const viewport = { left: 0, top: 0, width: 390, height: 600 };
const panel = { width: 200, height: 100 };
const anchor = { left: 160, right: 200, top: 280, bottom: 320 };
const Wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test("factory keeps the key, validates options and includes rich content only while open", () => {
  const child = Popover({ Key: "preview", Trigger: trigger, Content: content, Width: "22rem" });
  assert.equal(child.key, "preview");
  assert.equal(child.tag, PopoverComponent);
  const control = new child.tag(child.props);
  assert.doesNotMatch(JSON.stringify(control.Render()), /Long details/);
  control.SetState({ Open: true });
  assert.match(JSON.stringify(control.Render()), /Long details/);
  assert.match(JSON.stringify(control.Render()), /Details/);
  for (const props of [{ Trigger: undefined }, { Trigger: [trigger, trigger] }, { Open: "other" }, { Label: " " }, { Placement: "auto" }, { Width: 24 }, { Width: "narrow" }, { Width: "20px; color:red" }, { OnOpenChange: true }]) {
    assert.throws(() => new PopoverComponent({ ...child.props, ...props }).Render(), TypeError);
  }
});

test("placement keeps the preferred side, flips on each edge and shifts within the visual viewport", () => {
  const expected = { top: [130, 210], right: [200, 265], bottom: [130, 320], left: [60, 265] };
  for (const [side, [left, top]] of Object.entries(expected)) {
    assert.deepEqual(PositionPopover(anchor, { width: 100, height: 70 }, viewport, side), { side, left, top });
  }

  for (const [preferred, side, change] of [
    ["top", "bottom", { top: 0, bottom: 40 }],
    ["right", "left", { left: 350, right: 390 }],
    ["bottom", "top", { top: 560, bottom: 600 }],
    ["left", "right", { left: 0, right: 40 }],
  ]) {
    assert.equal(PositionPopover({ ...anchor, ...change }, panel, viewport, preferred).side, side);
  }

  const result = PositionPopover({ left: -200, right: -180, top: -60, bottom: -20 }, panel, { ...viewport, left: 50, top: 25 }, "bottom");
  assert.deepEqual(result, { side: "bottom", left: 58, top: 33 });
});

test("strict root control detection rejects multiple, nested, inert and negative-tabindex triggers", () => {
  const control = { tabIndex: 0, matches: (selector) => selector.startsWith("button,"), querySelector: () => null, hasAttribute: () => false };
  const host = { firstElementChild: control, childElementCount: 1 };
  assert.equal(GetPopoverTrigger(host), control);
  assert.equal(GetPopoverTrigger({ ...host, childElementCount: 0 }), null);
  assert.equal(GetPopoverTrigger({ ...host, childElementCount: 2 }), null);
  for (const changes of [{ matches: () => false }, { querySelector: () => control }, { tabIndex: -1 }, { matches: () => true }]) {
    assert.equal(GetPopoverTrigger({ ...host, firstElementChild: { ...control, ...changes } }), null);
  }
});

test("trigger relationships preserve authored values, later replacements and absent attributes", () => {
  const values = new Map([
    ["aria-describedby", "hint  warning"],
    ["aria-haspopup", "menu"],
  ]);
  const target = { getAttribute: (name) => values.get(name) ?? null, setAttribute: (name, value) => values.set(name, value), removeAttribute: (name) => values.delete(name) };
  const attributes = new PopoverTriggerAttributes(target);
  attributes.Set("aria-describedby", "summary", true);
  attributes.Set("aria-describedby", "summary", true);
  assert.equal(values.get("aria-describedby"), "hint warning summary");
  attributes.Set("aria-haspopup", "dialog");
  attributes.Set("aria-expanded", "true");
  attributes.Set("aria-controls", "panel", true);
  values.set("aria-controls", "replaced");
  attributes.Set("aria-controls", "panel", true);
  assert.equal(values.get("aria-controls"), "replaced panel");
  values.set("aria-controls", "replaced panel added-by-app");
  attributes.Release();
  assert.deepEqual(
    [...values],
    [
      ["aria-describedby", "hint  warning"],
      ["aria-haspopup", "menu"],
      ["aria-controls", "replaced added-by-app"],
    ],
  );
});

test("hover delay ignores touch, cancels on leave or unmount and opens once after a pause", async () => {
  const control = new PopoverComponent({ Trigger: trigger });
  let opened = 0;
  control.Show = () => opened++;
  control._attributes = { Release() {} };
  control.PointerEnter({ pointerType: "touch" });
  assert.equal(control._timer, null);
  control.PointerEnter({ pointerType: "mouse" });
  control.PointerLeave({ pointerType: "mouse" });
  await Wait(180);
  assert.equal(opened, 0);
  control.PointerEnter({ pointerType: "mouse" });
  assert.equal(opened, 0);
  await Wait(180);
  assert.equal(opened, 1);
  control.PointerEnter({ pointerType: "pen" });
  control.ComponentOnUnmount();
  await Wait(180);
  assert.equal(opened, 1);
  assert.equal(control._timer, null);
});
