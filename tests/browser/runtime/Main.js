const source = new URLSearchParams(location.search).has("source");
const { default: CT, Component, Dropdown, Dialog, Toast, GetFormValues } = await import(source
  ? "../../../src/Index.js" : "../../../dist/ctframework.bundle.min.js");
const html = CT.Html;
const Assert = (condition, message) => { if (!condition) throw new Error(message); };
const Frame = async () => { await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame); };
const Update = async (app, state) => { app.SetState(state); await Frame(); };
// Internal vnode construction is confined to runtime tests, not application examples.
const Child = (type, props = {}) => ({ tag: type, props, key: props.Key ?? null, children: [], dom: null });
const Keyed = (key, vnode) => ({ ...vnode, key });
const mount = document.querySelector("#app");
let passed = 0;

const Check = async (name, run) => {
  CT.Unmount(mount);
  mount.textContent = "";
  await run();
  const item = document.createElement("li");
  item.textContent = `${name}: passed`;
  document.querySelector("#checks").append(item);
  passed++;
};

class Item extends Component {
  constructor(props) {
    super(props);
    this.state = { Text: props.Name };
    props.Instances?.set(props.Name, this);
  }
  ComponentOnMount() { this.props.Counts.Mounts++; }
  ComponentOnUnmount() { this.props.Counts.Unmounts++; }
  Render() {
    return html`<label>${this.props.Name}<input ${CT.Attr("value", this.state.Text)} ${CT.On("input", (event) => this.SetState({ Text: event.target.value }))}></label>`;
  }
}

class List extends Component {
  constructor(props) {
    super(props);
    this.state = { Names: ["A", "B"] };
    this.Instances = new Map();
    this.Counts = { Mounts: 0, Unmounts: 0 };
  }
  Render() {
    return html`<section><b>Before</b>${this.state.Names.map((name) => {
      const child = Child(Item, { Key: this.props.Wrapped ? null : name, Name: name, Instances: this.Instances, Counts: this.Counts });
      return this.props.Wrapped ? Keyed(name, html`<article>${child}</article>`) : child;
    })}<b>After</b></section>`;
  }
}

class Guarded extends Component {
  constructor(props) { super(props); this.state = { Count: 0 }; this.Renders = 0; props.Capture?.(this); }
  ShouldComponentUpdate(nextProps, nextState) {
    return nextProps.Title !== this.props.Title || nextState.Count !== this.state.Count;
  }
  Render() { this.Renders++; return html`<p>${this.props.Title}: ${this.state.Count}</p>`; }
}

class InteractiveChecks extends Component {
  constructor(props) {
    super(props);
    this.state = { Environment: "production", Text: "", Open: false, Visible: false };
  }
  Render() {
    return html`<section class="ct-panel">
      <h2>Interactive checks</h2>
      ${Dropdown({ Id: "environment", Label: "Environment", Value: this.state.Environment, Options: ["production", "development"], OnChange: (value) => this.SetState({ Environment: value }) })}
      <label>Notes<input id="notes" ${CT.Attr("value", this.state.Text)} ${CT.On("input", (event) => this.SetState({ Text: event.currentTarget.value }))}></label>
      <p id="selection">Selected: ${this.state.Environment || "none"}; Notes: ${this.state.Text}</p>
      <button id="open-dialog" ${CT.On("click", () => this.SetState({ Open: true }))}>Open dialog</button>
      <button id="show-toast" ${CT.On("click", () => this.SetState({ Visible: true }))}>Show toast</button>
      ${Dialog({ Open: this.state.Open, Title: "Keyboard dialog", Content: html`<label>Dialog input<input id="dialog-input"></label>`, Actions: [{ Label: "Confirm", OnClick: () => this.SetState({ Open: false }) }], OnClose: () => this.SetState({ Open: false }) })}
      ${Toast({ Visible: this.state.Visible, Message: "Saved", OnClose: () => this.SetState({ Visible: false }) })}
    </section>`;
  }
}

try {
  for (const wrapped of [false, true]) {
    await Check(wrapped ? "Keyed templates retain nested component state" : "Keyed component lists move without remounting", async () => {
      const app = new List({ Wrapped: wrapped });
      CT.Mount(app, mount);
      const first = app.Instances.get("A");
      const input = mount.querySelector("input");
      input.value = "A edited";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      await Frame();
      await Update(app, { Names: ["B", "A"] });
      Assert(app.Instances.get("A") === first && mount.querySelectorAll("input")[1] === input && input.value === "A edited", "Reordering lost instance, input DOM, or state");
      Assert(app.Counts.Mounts === 2 && app.Counts.Unmounts === 0, "Reordering ran lifecycle mount/unmount hooks");
      Assert(mount.firstChild.firstChild.textContent === "Before" && mount.firstChild.lastChild.textContent === "After", "Slot crossed static boundaries");
      await Update(app, { Names: ["C", "A"] });
      Assert(app.Counts.Mounts === 3 && app.Counts.Unmounts === 1, "Insertion/deletion lifecycle counts are incorrect");
      await Update(app, { Names: [] });
      Assert(app.Counts.Unmounts === 3, "Removing list did not clean up children");
    });
  }
  await Check("State guards, batching, skipped updates, and ForceUpdate", async () => {
    const app = new Guarded({ Title: "Count" });
    CT.Mount(app, mount);
    app.SetState((state) => ({ Count: state.Count + 1 }));
    app.SetState((state) => ({ Count: state.Count + 1 }));
    await Frame();
    Assert(mount.textContent.includes("2") && app.Renders === 2, "Guard saw next state as current or batching was lost");
    await Update(app, { Count: 2 });
    Assert(app.Renders === 2, "Unchanged state should be skipped");
    app.ForceUpdate();
    await Frame();
    Assert(app.Renders === 3, "ForceUpdate did not bypass guard");
  });
  await Check("Prop guards and parent/child updates in the same frame", async () => {
    let child;
    class Parent extends Component {
      constructor() { super(); this.state = { Title: "Before" }; }
      Render() { return html`<section>${Child(Guarded, { Title: this.state.Title, Capture: (value) => { child = value; } })}</section>`; }
    }
    const app = new Parent();
    CT.Mount(app, mount);
    app.SetState({ Title: "After" });
    child.SetState({ Count: 1 });
    await Frame();
    Assert(mount.textContent === "After: 1" && child.Renders === 2, "Prop guard or coalesced child update failed");
  });
  await Check("Nested render failure recovers on a later parent update", async () => {
    let child;
    let catches = 0;
    class Fragile extends Component {
      constructor() { super(); this.state = { Fail: false }; child = this; }
      ComponentOnCatch() { catches++; }
      Render() { if (this.state.Fail && !this.props.Recover) throw new Error("Expected test failure"); return html`<p>Recovered child</p>`; }
    }
    class Parent extends Component {
      constructor() { super(); this.state = { Recover: false }; }
      Render() { return html`<section>${Child(Fragile, { Recover: this.state.Recover })}</section>`; }
    }
    const app = new Parent();
    CT.Mount(app, mount);
    await Update(child, { Fail: true });
    Assert(mount.querySelector(".ct-fallback") && catches === 1, "Missing child fallback");
    await Update(app, { Recover: true });
    Assert(mount.textContent === "Recovered child" && !mount.querySelector(".ct-fallback"), "Fallback retained stale host DOM");
  });
  await Check("Initial root failures remain owned and can be unmounted", async () => {
    let unmounts = 0;
    class Broken extends Component {
      Render() { throw new Error("Expected initial failure"); }
      ComponentOnUnmount() { unmounts++; }
    }
    const app = new Broken();
    CT.Mount(app, mount);
    Assert(mount.querySelector(".ct-fallback"), "Initial fallback missing");
    CT.Unmount(mount);
    Assert(!mount.textContent && app.vnode === null && unmounts === 1, "Initial fallback root was not cleaned up");
  });
  await Check("Removed children ignore delayed SetState and ForceUpdate", async () => {
    const app = new List({});
    CT.Mount(app, mount);
    const child = app.Instances.get("A");
    app.SetState({ Names: ["B"] });
    child.SetState({ Text: "queued before removal" });
    await Frame();
    const state = child.state;
    child.SetState({ Text: "late completion" });
    child.ForceUpdate();
    await Frame();
    Assert(child.vnode === null && child.__hostVNode === null && child.state === state, "Detached child still accepts updates");
    Assert(app.Counts.Unmounts === 1, "Unmount hook did not run exactly once");
  });
  await Check("Null attributes, changing names, style removal, and boolean reset", async () => {
    class Attributes extends Component {
      constructor() { super(); this.state = { Value: "page", Name: "data-before", Disabled: true, Style: { color: "red" } }; }
      Render() { return html`<button ${CT.Attr("role", undefined)} ${CT.Attr("aria-current", this.state.Value)} ${CT.Attr(this.state.Name, this.state.Value)} ${CT.Attr("className", this.state.Value)} ${CT.Attr("disabled", this.state.Disabled)} ${CT.Attr("style", this.state.Style)}>Attributes</button>`; }
    }
    const app = new Attributes();
    CT.Mount(app, mount);
    const button = mount.querySelector("button");
    Assert(!button.hasAttribute("role"), "An initially absent reflected attribute was created");
    await Update(app, { Value: null, Name: "data-after", Disabled: false, Style: null });
    Assert(!button.hasAttribute("aria-current") && !button.hasAttribute("data-before") && !button.hasAttribute("data-after") && !button.hasAttribute("class") && !button.disabled && !button.style.color, "An absent binding left a value behind");
  });
  await Check("Remounting a retained view still cleans up each mount", () => {
    const counts = { Mounts: 0, Unmounts: 0 };
    const view = Child(Item, { Name: "Reusable", Counts: counts });
    class Reusable extends Component {
      Render() { return html`<section>${view}</section>`; }
    }
    const app = new Reusable();
    for (let index = 0; index < 2; index++) {
      CT.Mount(app, mount);
      CT.Unmount(mount);
    }
    Assert(counts.Mounts === 2 && counts.Unmounts === 2, "A retained vnode skipped its second cleanup");
  });
  await Check("SVG clicks delegate to the correct currentTarget", async () => {
    let buttonTarget;
    let nativeTarget;
    let bubbles = 0;
    class Events extends Component {
      Render() { return html`<section ${CT.On("click", () => { bubbles++; })}><button ${CT.On("click", (event) => { buttonTarget = event.currentTarget; nativeTarget = event.target; event.preventDefault(); event.stopPropagation(); })}><svg><path d="M0 0 L10 10"></path></svg></button></section>`; }
    }
    CT.Mount(new Events(), mount);
    const target = mount.querySelector("path");
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    target.dispatchEvent(event);
    Assert(buttonTarget === mount.querySelector("button") && nativeTarget === target && event.defaultPrevented && bubbles === 0, "SVG delegation or event methods failed");
  });
  await Check("Native forms retain prototype-like field names", () => {
    const form = document.createElement("form");
    form.innerHTML = '<input name="__proto__" value="first"><input name="__proto__" value="second"><input name="constructor" value="name">';
    const values = GetFormValues(form);
    Assert(Object.getPrototypeOf(values) === Object.prototype && values.__proto__.join(",") === "first,second" && values.constructor === "name", "Unsafe form result properties");
  });
  await Check("Dropdown placeholder clears selection without throwing", async () => {
    const app = new InteractiveChecks();
    CT.Mount(app, mount);
    const select = mount.querySelector("select");
    select.value = "";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    await Frame();
    Assert(app.state.Environment === "" && mount.querySelector("select") === select, "Placeholder did not clear selection");
  });
  await Check("Toast closes and reopens on the same mounted instance", async () => {
    const app = new InteractiveChecks();
    CT.Mount(app, mount);
    for (let index = 0; index < 3; index++) {
      mount.querySelector("#show-toast").click();
      await Frame();
      Assert(mount.querySelector(".ct-toast"), "Toast failed to reopen");
      mount.querySelector('[aria-label="Close notification"]').click();
      await Frame();
      Assert(!mount.querySelector(".ct-toast"), "Toast failed to close");
    }
  });
  await Check("Dialog enters the top layer, handles cancel, and restores focus", async () => {
    const app = new InteractiveChecks();
    CT.Mount(app, mount);
    const opener = mount.querySelector("#open-dialog");
    opener.focus();
    opener.click();
    await Frame();
    const dialog = mount.querySelector("dialog");
    Assert(dialog.matches(":modal") && dialog.contains(document.activeElement), "Dialog did not become a focused native modal");
    dialog.dispatchEvent(new Event("cancel", { cancelable: true }));
    await Frame();
    Assert(!dialog.open && document.activeElement === opener, "Cancel or focus restoration failed");
    opener.click();
    await Frame();
    CT.Unmount(mount);
    Assert(!document.querySelector(":modal"), "Unmount left a modal in the top layer");
  });
  CT.Unmount(mount);
  CT.Mount(new InteractiveChecks(), mount);
  document.querySelector("#result").textContent = `${passed} runtime checks passed (${source ? "source" : "minified bundle"}). Try the controls below with mouse and keyboard.`;
} catch (error) {
  document.querySelector("#result").textContent = `FAILED after ${passed} checks: ${error.message}`;
  console.error(error);
}
