const variant = new URLSearchParams(location.search);
const { default: CT, Component, Alert, FallbackView } = await import(variant.has("source") ? "../../../src/Index.js" : variant.has("debug") ? "../../../dist/ctframework.bundle.js" : "../../../dist/ctframework.bundle.min.js");
const html = CT.Html;
const mount = document.querySelector("#app");
let passed = 0;

const Assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const Frame = async () => {
  await new Promise(requestAnimationFrame);
  await new Promise(requestAnimationFrame);
};

const Check = async (name, run) => {
  CT.Unmount(mount);
  await run();
  const item = document.createElement("li");
  item.textContent = `${name}: passed`;
  document.querySelector("#checks").append(item);
  passed++;
};

class DraftRow extends Component {
  Render() {
    return html`<li>
      <label ${CT.Attr("for", `draft-${this.props.Id}`)}>Draft ${this.props.Id}</label>
      <input ${CT.Attr("id", `draft-${this.props.Id}`)} ${CT.Attr("value", this.props.Title)} />
      <label>Selected ${this.props.Id}<input type="checkbox" ${CT.Attr("id", `checked-${this.props.Id}`)} ${CT.Attr("checked", false)} /></label>
    </li>`;
  }
}

class Drafts extends Component {
  constructor() {
    super();
    this.state = { Order: ["A", "B"], Title: "Original", Count: 0, Checked: false };
  }

  Render() {
    return html`<section class="ct-panel">
      <h2>Draft preservation</h2>
      <p>Type in a row, then change other state or reverse the rows. Change bound title and Reset bound title intentionally replace both drafts.</p>
      <ul>
        ${this.state.Order.map((id) => CT.View({ Component: DraftRow, Props: { Id: id, Title: this.state.Title }, Key: id }))}
      </ul>
      <label>Bound selection<input id="bound-checked" type="checkbox" ${CT.Attr("checked", this.state.Checked)} /></label>
      <button type="button" ${CT.On("click", () => this.SetState((state) => ({ Count: state.Count + 1 })))}>Update other state</button>
      <button type="button" ${CT.On("click", () => this.SetState((state) => ({ Order: [...state.Order].reverse() })))}>Reverse rows</button>
      <button type="button" ${CT.On("click", () => this.SetState({ Title: "Changed", Checked: true }))}>Change bound title</button>
      <button type="button" ${CT.On("click", () => this.SetState({ Title: "Original", Checked: false }))}>Reset bound title</button>
      <output id="other-count">${this.state.Count}</output>
    </section>`;
  }
}

try {
  await Check("Numeric reflected bindings remove safely, including initial empty bindings", async () => {
    const errors = [];
    class Numeric extends Component {
      constructor() {
        super();
        this.state = { Value: null };
      }
      ComponentOnCatch(error) {
        errors.push(error);
      }
      Render() {
        return html`<section>
          <input ${CT.Attr("size", this.state.Value)} ${CT.Attr("maxLength", this.state.Value)} ${CT.Attr("tabIndex", this.state.Value)} />
          <textarea ${CT.Attr("rows", this.state.Value)} ${CT.Attr("cols", this.state.Value)}></textarea>
        </section>`;
      }
    }

    const app = new Numeric();
    CT.Mount(app, mount);
    Assert(!mount.querySelector(".ct-fallback"), "Initially null numeric binding failed");
    for (const value of [null, false, undefined]) {
      app.SetState({ Value: 20 });
      await Frame();
      const input = mount.querySelector("input");
      const textarea = mount.querySelector("textarea");
      Assert(input.size === 20 && textarea.rows === 20, "Numeric assignment failed");
      CT(input).Attr("size", null);
      app.SetState({ Value: value });
      await Frame();
      Assert(mount.querySelector("input") === input && !mount.querySelector(".ct-fallback"), "Removal lost the input");
      Assert(
        ["size", "maxlength", "tabindex"].every((name) => !input.hasAttribute(name)),
        "Removed numeric attribute remained",
      );
      Assert(!textarea.hasAttribute("rows") && !textarea.hasAttribute("cols"), "Removed textarea attribute remained");
      app.SetState({ Other: 1 });
      await Frame();
      app.SetState({ Other: 2 });
      await Frame();
      Assert(!mount.querySelector(".ct-fallback") && !input.hasAttribute("size"), "Repeated empty binding invoked a numeric setter");
    }

    Assert(errors.length === 0, "Numeric removal reached the error hook");

    CT.Unmount(mount);
    class Renamed extends Component {
      constructor() {
        super();
        this.state = { Name: "data-limit", Value: 20 };
      }
      ComponentOnCatch(error) {
        errors.push(error);
      }
      Render() {
        return html`<input ${CT.Attr(this.state.Name, this.state.Value)} />`;
      }
    }
    const renamed = new Renamed();
    CT.Mount(renamed, mount);
    renamed.SetState({ Name: "size", Value: null });
    await Frame();
    Assert(!mount.querySelector(".ct-fallback") && !mount.querySelector("input").hasAttribute("size"), "Renamed binding carried the old numeric value");
    Assert(errors.length === 0, "Renamed binding reached the error hook");
  });

  await Check("Property-only and reflected booleans set, clear and remove", async () => {
    class Mixed extends Component {
      constructor() {
        super();
        this.state = { Mixed: true, Disabled: true };
      }
      Render() {
        return html`<input type="checkbox" ${CT.Attr("indeterminate", this.state.Mixed)} ${CT.Attr("disabled", this.state.Disabled)} />`;
      }
    }

    const app = new Mixed();
    CT.Mount(app, mount);
    const input = mount.querySelector("input");
    Assert(input.indeterminate && input.disabled && !input.hasAttribute("indeterminate"), "Boolean set failed");
    for (const value of [false, null, undefined]) {
      app.SetState({ Mixed: value, Disabled: value });
      await Frame();
      Assert(!input.indeterminate && !input.disabled && !input.hasAttribute("disabled"), "Boolean removal failed");
      app.SetState({ Mixed: true, Disabled: true });
      await Frame();
      Assert(input.indeterminate && input.disabled, "Boolean could not be restored");
    }

    CT.Unmount(mount);
    class Options extends Component {
      Render() {
        return html`<form>
          <select>
            <option value="a">A</option>
            <option value="b" ${CT.Attr("selected", true)}>B</option>
          </select>
        </form>`;
      }
    }
    CT.Mount(new Options(), mount);
    const select = mount.querySelector("select");
    select.value = "a";
    mount.querySelector("form").reset();
    Assert(select.value === "b" && select.options[1].defaultSelected, "Boolean binding changed native option reset defaults");
  });

  await Check("Unchanged value and checked bindings retain drafts, identity and caret", async () => {
    const app = new Drafts();
    CT.Mount(app, mount);
    const input = mount.querySelector("#draft-A");
    const checkbox = mount.querySelector("#checked-A");
    input.value = "Unsaved draft";
    checkbox.checked = true;
    input.focus();
    input.setSelectionRange(4, 4);
    app.SetState({ Count: 1 });
    await Frame();
    Assert(input.value === "Unsaved draft" && checkbox.checked, "Unchanged bindings overwrote edits");
    Assert(document.activeElement === input && input.selectionStart === 4, "Unchanged value lost focus or caret");
    app.SetState({ Order: ["B", "A"] });
    await Frame();
    Assert(mount.querySelector("#draft-A") === input && input.value === "Unsaved draft", "Keyed reorder lost identity or draft");
    app.SetState({ Title: "Changed", Checked: true });
    await Frame();
    Assert(input.value === "Changed" && mount.querySelector("#bound-checked").checked, "Changed bindings were skipped");
    app.SetState({ Title: "Original", Checked: false });
    await Frame();
    Assert(input.value === "Original" && !mount.querySelector("#bound-checked").checked, "Intentional reset failed");
  });

  await Check("Reapplying the current DOM value does not move the caret", async () => {
    class Echo extends Component {
      constructor() {
        super();
        this.state = { Name: "Ada" };
      }
      Render() {
        return html`<input ${CT.Attr("value", this.state.Name)} />`;
      }
    }

    const app = new Echo();
    CT.Mount(app, mount);
    const input = mount.querySelector("input");
    input.value = "A beautiful draft";
    input.focus();
    input.setSelectionRange(2, 2);
    app.SetState({ Name: input.value });
    await Frame();
    Assert(input.selectionStart === 2 && document.activeElement === input, "State echo moved caret");
  });

  await Check("Role removal and native focus aliases remain correct", async () => {
    const events = [];
    class Roles extends Component {
      constructor() {
        super();
        this.state = { Role: "status" };
      }
      Render() {
        return html`<section>
          <input ${CT.Attr("role", this.state.Role)} ${CT.On("focus", () => events.push("focus"))} ${CT.On("blur", () => events.push("blur"))} />
          ${Alert({ Title: "Quiet", Message: "No live role", Live: "off" })}
        </section>`;
      }
    }

    const app = new Roles();
    CT.Mount(app, mount);
    const input = mount.querySelector("input");
    input.focus();
    input.blur();
    app.SetState({ Role: null });
    await Frame();
    Assert(events.join(",") === "focus,blur", "Focus or blur normalization regressed");
    Assert(input.getAttribute("role") === null && mount.querySelector(".ct-alert").getAttribute("role") === null, "Removed role remained");
  });

  await Check("FallbackView uses a valid dynamic class binding", () => {
    class Missing extends Component {
      Render() {
        return FallbackView({ Title: "Missing example", Type: "missing" });
      }
    }
    CT.Mount(new Missing(), mount);
    Assert(mount.querySelector(".ct-fallback-missing") && mount.querySelector("h1").textContent === "Missing example", "Built-in fallback used invalid markup");
  });

  await Check("Template misuse gives actionable errors without visible private details", () => {
    class Child extends Component {
      Render() {
        return html`<strong>Child</strong>`;
      }
    }
    const cases = [
      [() => html`<section>${new Child()}</section>`, /CT.View/],
      [() => html`<input id="${"profile"}" />`, /CT.Attr/],
      [() => html`<button>${CT.On("click", () => {})}Save</button>`, /CT.On.*start tag/],
      [() => html`<p>${CT.Attr("title", "Note")}</p>`, /CT.Attr.*start tag/],
      [() => html`<button ${CT.On("mouseenter", () => {})}>Hover</button>`, /Unsupported CT.On event.*mouseenter/],
      [
        () => {
          throw new Error("PRIVATE_DETAIL_SENTINEL");
        },
        /PRIVATE_DETAIL_SENTINEL/,
      ],
    ];

    for (const [render, expected] of cases) {
      CT.Unmount(mount);
      const errors = [];
      class Broken extends Component {
        Render() {
          return render();
        }
        ComponentOnCatch(error) {
          errors.push(error);
        }
      }
      CT.Mount(new Broken(), mount);
      Assert(errors.length === 1 && expected.test(errors[0].message), "Missing actionable error");
      Assert(mount.querySelector(".ct-fallback") && !mount.querySelector("pre"), "Error details were rendered");
      Assert(!mount.textContent.includes(errors[0].message), "Private error appeared in the view");
    }
  });

  await Check("Runaway updates are bounded, other roots continue, and the component recovers", async () => {
    const errors = [];
    class Loop extends Component {
      constructor() {
        super();
        this.state = { Count: 0, Loop: false };
        this.Updates = 0;
      }
      ComponentOnUpdate() {
        this.Updates++;
        if (this.state.Loop) this.SetState({ Count: this.state.Count + 1 });
      }
      ComponentOnCatch(error) {
        errors.push(error);
        this.SetState({ Caught: true });
      }
      Render() {
        return html`<p>Count: ${this.state.Count}</p>`;
      }
    }

    const app = new Loop();
    const other = new Loop();
    CT.Mount(app, mount);
    CT.Mount(other, "#other");
    app.SetState({ Loop: true });
    other.SetState({ Count: 7 });
    await Frame();
    Assert(app.Updates === 100 && errors.length === 1 && /Maximum update limit.*Loop/.test(errors[0].message), "Runaway guard failed");
    Assert(document.querySelector("#other").textContent === "Count: 7", "Unrelated root was starved");
    Assert(!mount.textContent.includes("Maximum update") && mount.querySelector(".ct-fallback"), "Update failure leaked details");
    app.SetState({ Loop: false, Count: 3 });
    await Frame();
    Assert(mount.textContent === "Count: 3" && !mount.querySelector(".ct-fallback"), "Recovery failed");
    CT.Unmount("#other");
  });

  CT.Unmount(mount);
  CT.Mount(new Drafts(), mount);
  document.querySelector("#result").textContent = `${passed} runtime safety checks passed`;
  document.body.dataset.result = "passed";
} catch (error) {
  document.querySelector("#result").textContent = `FAILED after ${passed} checks: ${error.message}`;
  document.body.dataset.result = "failed";
  console.error(error);
}
