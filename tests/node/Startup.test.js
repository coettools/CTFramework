import assert from "node:assert/strict";
import test from "node:test";
import { spawnSync } from "node:child_process";
import CT, { Component } from "../../src/Index.js";
import { CTFramework } from "../../src/CTFramework.js";
import BundleCT, { Component as BundleComponent } from "../../dist/ctframework.bundle.js";
import MinifiedCT, { Component as MinifiedComponent } from "../../dist/ctframework.bundle.min.js";

class App extends Component {
  Render() {
    return this.props;
  }
}

test("Startup and component helpers can be imported directly without initialization cycles", () => {
  for (const path of ["../../src/Startup.js", "../../src/components/ComponentFactory.js"]) {
    const url = new URL(path, import.meta.url).href;
    const result = spawnSync(process.execPath, ["--input-type=module", "-e", `await import(${JSON.stringify(url)});`], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
  }
});

const Prepare = (context) => {
  const host = { replaceChildren: context.mock.fn() };
  const fallback = { role: "alert" };
  context.mock.method(CTFramework, "Ready", (callback) => callback());
  context.mock.method(CTFramework, "ResolveElement", (target) => (target === "#missing" ? null : host));
  context.mock.method(CTFramework, "EnsureDefaultStyles", () => {});
  context.mock.method(CTFramework, "CreateErrorFallbackDom", () => fallback);
  context.mock.method(CT, "Unmount", () => {});
  context.mock.method(CT, "Mount", (type, _, props) => new type(props).Render());
  context.mock.method(console, "error", () => {});

  return { host, fallback };
};

test("Start waits for readiness before resolving the default target and passing props", async (context) => {
  const { host } = Prepare(context);
  let ready;
  CTFramework.Ready.mock.mockImplementation((callback) => {
    ready = callback;
  });
  const props = { Name: "Ada" };
  const result = CT.Start({ App, Props: props });

  assert.ok(result instanceof Promise);
  assert.equal(CTFramework.ResolveElement.mock.calls.length, 0);
  assert.equal(CT.Mount.mock.calls.length, 0);
  ready();

  assert.equal(await result, props);
  assert.deepEqual(CTFramework.ResolveElement.mock.calls[0].arguments, ["#app"]);
  assert.deepEqual(CT.Mount.mock.calls[0].arguments, [App, host, props]);
  assert.equal(console.error.mock.calls.length, 0);
});

test("Start accepts an element and supplies empty props", async (context) => {
  const { host } = Prepare(context);
  assert.deepEqual(await CT.Start({ App, Target: host }), {});
  assert.equal(CTFramework.ResolveElement.mock.calls[0].arguments[0], host);
});

test("Start displays the framework fallback for constructor failure and releases the old root", async (context) => {
  const { host, fallback } = Prepare(context);
  class Broken extends Component {
    constructor() {
      super();
      throw new Error("Constructor failed");
    }
  }

  assert.equal(await CT.Start({ App: Broken }), fallback);
  assert.deepEqual(CT.Unmount.mock.calls[0].arguments, [host]);
  assert.deepEqual(host.replaceChildren.mock.calls[0].arguments, [fallback]);
  assert.equal(CTFramework.EnsureDefaultStyles.mock.calls.length, 1);
  assert.match(CTFramework.CreateErrorFallbackDom.mock.calls[0].arguments[0].message, /Constructor failed/);
});

test("Start reports missing or invalid targets without overwriting another part of the page", async (context) => {
  const { host } = Prepare(context);
  assert.equal(await CT.Start({ App, Target: "#missing" }), null);
  CTFramework.ResolveElement.mock.mockImplementation(() => {
    throw new Error("Invalid selector");
  });
  assert.equal(await CT.Start({ App, Target: "[" }), null);
  assert.equal(CT.Mount.mock.calls.length, 0);
  assert.equal(host.replaceChildren.mock.calls.length, 0);
  assert.equal(console.error.mock.calls.length, 2);
});

test("Start validates its options and component contract", async (context) => {
  const { fallback } = Prepare(context);
  for (const options of [null, [], "App"]) assert.equal(await CT.Start(options), null);
  for (const type of [undefined, Component, new App(), () => "markup", "App"]) {
    assert.equal(await CT.Start({ App: type }), fallback);
  }

  for (const Props of [null, [], "props"]) assert.equal(await CT.Start({ App, Props }), fallback);
  assert.equal(CT.Mount.mock.calls.length, 0);
});

test("Start still shows a fallback if old-root cleanup throws and contains fallback failures", async (context) => {
  const { fallback } = Prepare(context);
  CT.Unmount.mock.mockImplementation(() => {
    throw new Error("Cleanup failed");
  });
  assert.equal(await CT.Start({ App: null }), fallback);
  CTFramework.CreateErrorFallbackDom.mock.mockImplementation(() => {
    throw new Error("Fallback failed");
  });
  assert.equal(await CT.Start({ App: null }), null);
});

for (const [name, entry, base] of [
  ["source", CT, Component],
  ["bundle", BundleCT, BundleComponent],
  ["minified bundle", MinifiedCT, MinifiedComponent],
]) {
  test(`${name} View describes a managed child without constructing or rendering it`, () => {
    let created = 0;
    class Child extends base {
      constructor(props) {
        super(props);
        created++;
      }
      Render() {
        throw new Error("View must not call Render");
      }
    }

    const props = { Name: "Ada" };
    const view = entry.View({ Component: Child, Props: props, Key: 0 });
    assert.equal(view.tag, Child);
    assert.equal(view.props, props);
    assert.equal(view.key, 0);
    assert.equal(view.dom, null);
    assert.equal(created, 0);
    assert.deepEqual(entry.View({ Component: Child }).props, {});
    assert.equal(entry.View({ Component: Child }).key, null);
    assert.equal(typeof entry.Start, "function");
    assert.throws(() => entry.View({ Component: base }), /Component class/);
    assert.throws(() => entry.View({ Component: () => "markup" }), /Component class/);
    assert.throws(() => entry.View({ Component: Child, Props: null }), /Props must be an object/);
  });
}
