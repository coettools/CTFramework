import assert from "node:assert/strict";
import test from "node:test";
import { CT, CTFramework } from "../../src/CTFramework.js";
import { Component } from "../../src/components/Component.js";
import { NormalizeNode, NormalizeNodes } from "../../src/html/RenderNodes.js";

test("invalid component children point to managed views instead of undefined tags", () => {
  class Child extends Component {}

  for (const value of [new Child(), {}, () => {}, Symbol("child")]) {
    assert.throws(() => NormalizeNode(value), /CT.View/);
    assert.throws(() => NormalizeNodes([[value]]), /CT.View/);
  }

  assert.deepEqual(
    NormalizeNodes([null, false, ["text", 3]]).map((node) => node.props.nodeValue),
    ["text", "3"],
  );
});

test("template events validate unsupported names and retain focus aliases", () => {
  for (const name of ["scroll", "", null, 7]) {
    assert.throws(() => CT.On(name, () => {}), /Unsupported CT.On event.*Use one of/);
  }

  assert.equal(CT.On("focus", () => {}).eventType, "focusin");
  assert.equal(CT.On("blur", () => {}).eventType, "focusout");
  assert.equal(CT.On("CLICK", () => {}).eventType, "click");
  for (const name of ["pointerenter", "pointerleave", "pointerover", "pointerout", "mouseenter", "mouseleave"]) assert.equal(CT.On(name, () => {}).eventType, name);
});

test("unchanged value and checked slots are not reapplied; changed bindings still are", (context) => {
  const element = { attributes: [{ name: "data-ct-template-attribute-0" }] };
  const set = context.mock.method(CTFramework, "SetDomProperty", () => {});
  const remove = context.mock.method(CTFramework, "RemoveDomProperty", () => {});

  for (const [name, value, next] of [
    ["value", "Original", "Changed"],
    ["checked", false, true],
  ]) {
    const old = CT.Attr(name, value);
    CTFramework.UpdateTemplateBindings([element], [CT.Attr(name, value)], [old]);
    assert.equal(set.mock.calls.length, 0);
    CTFramework.UpdateTemplateBindings([element], [CT.Attr(name, next)], [old]);
    assert.equal(set.mock.calls.length, 1);
    set.mock.resetCalls();
    CTFramework.UpdateTemplateBindings([element], [CT.Attr(name, null)], [old]);
    assert.equal(remove.mock.calls.length, 1);
    remove.mock.resetCalls();
  }

  CTFramework.UpdateTemplateBindings([element], [CT.Attr("value", "Original")]);
  assert.equal(set.mock.calls.length, 1);
});

test("default error reporting retains the full error without requiring visible details", (context) => {
  const log = context.mock.method(console, "error", () => {});
  const failure = new Error("Private diagnostic");
  new Component().ComponentOnCatch(failure, { component: "Example" });
  assert.match(log.mock.calls[0].arguments[0], /Example/);
  assert.equal(log.mock.calls[0].arguments[1], failure);
});

const PrepareUpdates = (context) => {
  const frames = [];
  const original = globalThis.requestAnimationFrame;
  globalThis.requestAnimationFrame = (callback) => frames.push(callback);
  context.after(() => {
    if (original) globalThis.requestAnimationFrame = original;
    else delete globalThis.requestAnimationFrame;
    CTFramework.pendingUpdates.length = 0;
    CTFramework.queuedComponentUpdates.clear();
    CTFramework.componentUpdateCounts = null;
  });
  context.mock.method(CTFramework, "UpdateDom", (oldNode, newNode) => {
    newNode.dom = oldNode.dom;

    return oldNode.dom;
  });

  return frames;
};

test("runaway component updates stop without starving unrelated roots and can recover", (context) => {
  const frames = PrepareUpdates(context);
  const errors = [];
  context.mock.method(CTFramework, "RenderErrorFallback", (component, error) => {
    errors.push(error);
    component.ComponentOnCatch(error);
  });
  class Counter extends Component {
    constructor() {
      super();
      this.state = { Count: 0 };
      this.vnode = { tag: "p", dom: {} };
      this.Updates = 0;
      this.Loop = false;
    }

    Render() {
      return CT.Html`<p>${this.state.Count}</p>`;
    }

    ComponentOnUpdate() {
      this.Updates++;
      if (this.Loop) this.SetState({ Count: this.state.Count + 1 });
    }

    ComponentOnCatch() {
      this.SetState({ Count: 0 });
    }
  }

  const looping = new Counter();
  const healthy = new Counter();
  looping.Loop = true;
  looping.SetState({ Count: 1 });
  healthy.SetState({ Count: 1 });
  frames.shift()();
  assert.equal(looping.Updates, 100);
  assert.equal(healthy.Updates, 1);
  assert.equal(errors.length, 1);
  assert.match(errors[0].message, /Maximum update limit.*Counter.*ComponentOnUpdate/);
  assert.equal(CTFramework.queuedComponentUpdates.size, 0);
  assert.equal(frames.length, 0);

  looping.Loop = false;
  looping.SetState({ Count: 4 });
  frames.shift()();
  assert.equal(looping.Updates, 101);
  assert.equal(errors.length, 1);
  assert.equal(CTFramework.componentUpdateCounts, null);
});

test("large batches of independent components are not mistaken for one runaway loop", (context) => {
  const frames = PrepareUpdates(context);
  const fallback = context.mock.method(CTFramework, "RenderErrorFallback", () => {});
  class Item extends Component {
    Render() {
      return CT.Html`<p>${this.state.Count}</p>`;
    }
  }

  const items = Array.from({ length: 150 }, () => {
    const item = new Item();
    item.vnode = { tag: "p", dom: {} };
    item.SetState({ Count: 1 });

    return item;
  });
  frames.shift()();
  assert.equal(items.length, 150);
  assert.equal(fallback.mock.calls.length, 0);
  assert.equal(CTFramework.pendingUpdates.length, 0);
});
