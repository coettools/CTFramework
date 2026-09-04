const source = new URLSearchParams(location.search).has("source");
const { default: CT, Component, DataTable, Accordion, Dropdown, Tooltip, PopupWindow, Dialog, SideNavigation, Alert, GetFormValues } = await import(source
  ? "../../../src/Index.js" : "../../../dist/ctframework.bundle.min.js");
const html = CT.Html;
const Assert = (condition, message) => { if (!condition) throw new Error(message); };
const Frame = async () => { await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame); };
const Update = async (app, state) => { app.SetState(state); await Frame(); };
// Internal vnode construction is used only to test stateful cells and panels.
const Child = (type, props = {}) => ({ tag: type, props, key: null, children: [], dom: null });
const mount = document.querySelector("#app");
let passed = 0;
const Check = async (name, run) => {
  CT.Unmount(mount);
  await run();
  const item = document.createElement("li");
  item.textContent = `${name}: passed`;
  document.querySelector("#checks").append(item);
  passed++;
};

class Editor extends Component {
  constructor(props) { super(props); this.state = { Text: props.Name }; }
  Render() {
    return html`<label>${this.props.Name}<input ${CT.Attr("aria-label", this.props.Name)} ${CT.Attr("value", this.state.Text)} ${CT.On("input", (event) => this.SetState({ Text: event.target.value }))}></label>`;
  }
}

class View extends Component {
  Render() { return this.props.Content; }
}

class Records extends Component {
  constructor(props) {
    super(props);
    this.state = { Rows: [{ Id: 0, Name: "Alpha", Status: 1 }, { Id: 1, Name: "Beta", Status: 0 }, { Id: 2, Name: "Gamma", Status: 1 }], ReverseColumns: false };
  }
  Render() {
    const columns = [
      { Key: "Name", Title: "Name", Render: (row) => Child(Editor, { Name: row.Name }) },
      { Key: "Status", Title: "Status", Value: (row) => row.Status ? "Ready" : "Offline" }
    ];
    return html`<section>
      <h2>Record identity</h2>
      <button ${CT.On("click", () => this.SetState({ Rows: [...this.state.Rows].reverse() }))}>Reverse records</button>
      <button ${CT.On("click", () => this.SetState({ ReverseColumns: !this.state.ReverseColumns }))}>Reverse columns</button>
      ${DataTable({ Data: this.state.Rows, Columns: this.state.ReverseColumns ? columns.reverse() : columns, PageSize: 2 })}
      ${Accordion({ Multiple: true, OpenIds: [0, 1, 2], Items: this.state.Rows.map((row) => ({ Id: row.Id, Title: row.Name, Content: Child(Editor, { Name: `${row.Name} panel` }) })) })}
    </section>`;
  }
}

class Controls extends Component {
  constructor(props) {
    super(props);
    this.state = { Value: props?.InitialValue ?? "development", Disabled: false, Options: props?.Options ?? ["development", "production"], Open: false, Modal: false, Text: "Helpful description", Link: false, ActiveId: "overview", Result: "Not submitted" };
    this.Changes = 0;
  }
  Render() {
    return html`<section>
      <h2>Forms and keyboard</h2>
      <form id="control-form" ${CT.On("submit", (event) => { event.preventDefault(); this.SetState({ Result: JSON.stringify(GetFormValues(event.currentTarget)) }); })}>
        ${Dropdown({ Id: "environment", Name: "Environment", Label: "Environment", Required: true, Disabled: this.state.Disabled, Value: this.state.Value, Options: this.state.Options, OnChange: (value) => { this.Changes++; this.SetState({ Value: value }); } })}
        <button type="submit">Submit form</button>
        <button type="reset">Reset form</button>
      </form>
      <button ${CT.On("click", () => this.SetState({ Disabled: !this.state.Disabled }))}>Toggle disabled</button>
      <p id="form-result">${this.state.Result}</p>
      <p id="selected">Selected: ${this.state.Value || "none"}</p>
      <p id="existing">Existing description</p>
      ${Tooltip({ Text: this.state.Text, Content: this.state.Link
        ? html`<a href="#app" aria-describedby="existing">Help link</a>`
        : html`<button id="help" aria-describedby="existing">Help button</button>` })}
      ${SideNavigation({ Title: "Test navigation", ActiveId: this.state.ActiveId, Items: [{ Id: "overview", Label: "Overview" }, { Id: "settings", Label: "Settings" }], OnNavigate: (item) => this.SetState({ ActiveId: item.Id }) })}
      <button id="open-popup" ${CT.On("click", () => this.SetState({ Open: true }))}>Open popup</button>
      ${PopupWindow({ Open: !this.state.Modal && this.state.Open, Title: "Tool window", Content: html`<label>Window notes<input id="window-notes"></label>`, OnClose: () => this.SetState({ Open: false }) })}
      <button id="after-popup">After popup</button>
      <button id="open-modal" ${CT.On("click", () => this.SetState({ Modal: true }))}>Open parent dialog</button>
      ${Dialog({ Open: this.state.Modal, Title: "Parent dialog", OnClose: () => this.SetState({ Modal: false, Open: false }), Content: html`<section>
        <button id="nested-opener" ${CT.On("click", () => this.SetState({ Open: true }))}>Open nested popup</button>
        ${PopupWindow({ Open: this.state.Modal && this.state.Open, Title: "Nested window", Content: "Escape closes only this window.", OnClose: () => this.SetState({ Open: false }) })}
      </section>` })}
      ${Alert({ Title: "Saved", Message: "Routine status uses polite announcements.", Type: "success" })}
      ${Alert({ Title: "Connection lost", Message: "Urgent status uses assertive announcements.", Type: "danger" })}
    </section>`;
  }
}

try {
  await Check("Table edits follow row and column identity", async () => {
    const app = new Records();
    CT.Mount(app, mount);
    const input = mount.querySelector('table input[aria-label="Alpha"]');
    input.value = "Edited alpha";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await Frame();
    await Update(app, { Rows: [app.state.Rows[1], app.state.Rows[0], app.state.Rows[2]], ReverseColumns: true });
    Assert(mount.querySelector('table input[aria-label="Alpha"]') === input && input.value === "Edited alpha", "Row or column reorder lost editor state");
    const search = mount.querySelector('input[type="search"]');
    search.value = "ready";
    search.dispatchEvent(new Event("input", { bubbles: true }));
    await Frame();
    Assert(mount.querySelectorAll("tbody tr").length === 2 && mount.querySelector('table input[aria-label="Alpha"]') === input, "Computed search or keyed filtering failed");
  });
  await Check("Paging unmounts off-page editors rather than transferring their state", async () => {
    CT.Mount(new Records(), mount);
    const input = mount.querySelector("table input");
    input.value = "Do not transfer";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await Frame();
    [...mount.querySelectorAll("button")].find((button) => button.textContent === "Next").click();
    await Frame();
    Assert(mount.querySelector("table input").value === "Gamma" && !input.isConnected, "Off-page state transferred");
    [...mount.querySelectorAll("button")].find((button) => button.textContent === "Previous").click();
    await Frame();
    Assert(mount.querySelector("table input").value === "Alpha", "Table unexpectedly retained unmounted rows");
  });
  await Check("Accordion state follows items and relationships stay unique", async () => {
    const app = new Records();
    CT.Mount(app, mount);
    const input = mount.querySelector('input[aria-label="Alpha panel"]');
    input.value = "Panel edit";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await Frame();
    await Update(app, { Rows: [...app.state.Rows].reverse() });
    Assert(mount.querySelector('input[aria-label="Alpha panel"]') === input && input.value === "Panel edit", "Panel state moved to another item");
    const extra = document.createElement("div");
    mount.append(extra);
    CT.Mount(new View({ Content: Accordion({ Items: [{ Id: 0, Title: "Second instance" }] }) }), extra);
    const triggers = [...mount.querySelectorAll(".ct-accordion-trigger")];
    Assert(new Set(triggers.map((trigger) => trigger.id)).size === triggers.length, "Duplicate trigger IDs");
    for (const trigger of triggers) {
      const panel = document.getElementById(trigger.getAttribute("aria-controls"));
      Assert(panel?.getAttribute("aria-labelledby") === trigger.id && trigger.parentElement.tagName === "H3", "Broken panel relationship");
    }
    CT.Unmount(extra);
    extra.remove();
  });
  await Check("Dropdown participates in native forms, required validation, and disabled omission", async () => {
    const app = new Controls();
    CT.Mount(app, mount);
    const form = mount.querySelector("form");
    const select = form.querySelector("select");
    Assert(GetFormValues(form).Environment === "development" && form.checkValidity(), "Named dropdown missing");
    select.value = "";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    await Frame();
    Assert(!form.checkValidity() && app.state.Value === "", "Required placeholder accepted");
    await Update(app, { Disabled: true });
    Assert(!Object.hasOwn(GetFormValues(form), "Environment") && form.checkValidity(), "Disabled select participated in submission");
    await Update(app, { Disabled: false });
    Assert(form.querySelector("select") === select && !select.disabled, "Updating native options replaced the select");
  });
  await Check("Native reset restores the initial dropdown value and notifies parent once", async () => {
    const app = new Controls();
    CT.Mount(app, mount);
    const form = mount.querySelector("form");
    await Update(app, { Value: "production" });
    for (let cycle = 0; cycle < 3; cycle++) {
      form.reset();
      await Frame();
      Assert(app.state.Value === "development" && app.Changes === cycle + 1, "Reset state or listener count incorrect");
      await Update(app, { Value: "production" });
    }
    form.addEventListener("reset", (event) => event.preventDefault(), { once: true });
    form.reset();
    await Frame();
    Assert(app.state.Value === "production" && app.Changes === 3, "Cancelled reset changed state");
    await Update(app, { Options: ["production"] });
    form.reset();
    await Frame();
    Assert(app.state.Value === "" && !form.checkValidity(), "Missing initial option did not reset to placeholder");
    CT.Unmount(mount);
    form.reset();
    await Frame();
    Assert(app.Changes === 4, "Reset listener survived unmount");
  });
  await Check("Dropdown reset preserves numeric zero and original option types", async () => {
    const app = new Controls({ InitialValue: 0, Options: [{ Value: 0, Label: "Zero" }, { Value: 1, Label: "One" }] });
    CT.Mount(app, mount);
    const form = mount.querySelector("form");
    Assert(form.querySelector("select").value === "0" && form.checkValidity(), "Zero was treated as an empty value");
    await Update(app, { Value: 1 });
    form.reset();
    await Frame();
    Assert(app.state.Value === 0 && GetFormValues(form).Environment === "0", "Reset lost numeric option identity");
  });
  await Check("Tooltip associates focus, dismisses on Escape and click, preserves descriptions", async () => {
    const app = new Controls();
    CT.Mount(app, mount);
    const button = mount.querySelector("#help");
    button.focus();
    const tooltip = button.parentElement.querySelector('[role="tooltip"]');
    Assert(!tooltip.hidden && button.getAttribute("aria-describedby") === `existing ${tooltip.id}`, "Focus hint or description missing");
    const escape = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
    button.dispatchEvent(escape);
    Assert(tooltip.hidden && escape.defaultPrevented, "Escape did not dismiss hint");
    await Update(app, { Text: "Updated description" });
    Assert(tooltip.hidden && tooltip.textContent === "Updated description", "Parent update reopened dismissed hint");
    mount.querySelector("#after-popup").focus();
    button.focus();
    Assert(!tooltip.hidden, "Focus re-entry did not show hint");
    button.click();
    Assert(tooltip.hidden, "Click did not dismiss hint");
    await Update(app, { Link: true });
    const link = mount.querySelector('a[href="#app"]');
    Assert(button.getAttribute("aria-describedby") === "existing" && link.getAttribute("aria-describedby").includes(tooltip.id), "Replaced trigger retained stale association");
    await Update(app, { Text: "" });
    Assert(link.getAttribute("aria-describedby") === "existing", "Empty hint left its association");
    await Update(app, { Text: "Restored hint" });
    link.focus();
    CT.Unmount(mount);
    const after = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
    document.dispatchEvent(after);
    Assert(!after.defaultPrevented, "Tooltip leaked document listener");
  });
  await Check("Navigation keeps hover-only hints and one current page through repeated toggles", async () => {
    const app = new Controls();
    CT.Mount(app, mount);
    for (let cycle = 0; cycle < 3; cycle++) {
      const toggle = mount.querySelector(".ct-side-navigation-toggle");
      toggle.focus();
      const root = toggle.parentElement;
      const tooltip = root.querySelector('[role="tooltip"]');
      Assert(tooltip.hidden, "Navigation hint appeared on focus");
      root.dispatchEvent(new PointerEvent("pointerenter"));
      Assert(!tooltip.hidden, "Hover hint missing");
      toggle.click();
      await Frame();
      Assert(tooltip.hidden && toggle.getAttribute("aria-label") === "Expand", "Click hint or collapse failed");
      root.dispatchEvent(new PointerEvent("pointerleave"));
      root.dispatchEvent(new PointerEvent("pointerenter"));
      Assert(!tooltip.hidden && tooltip.textContent === "Expand", "Hover re-entry failed");
      toggle.click();
      await Frame();
      await Update(app, { ActiveId: cycle % 2 ? "overview" : "settings" });
      Assert(mount.querySelectorAll('.ct-side-navigation-item[aria-current="page"]').length === 1 && mount.querySelectorAll(".ct-side-navigation-item").length === 2, "Navigation duplicated or lost active semantics");
    }
  });
  await Check("Tooltip reconnects when a child replaces its own control", async () => {
    class ChangingTarget extends Component {
      constructor(props) { super(props); this.state = { Link: false, Description: "original" }; }
      Render() {
        return this.state.Link ? html`<a href="#app" ${CT.Attr("aria-describedby", this.state.Description)} ${CT.On("click", (event) => { event.preventDefault(); this.SetState({ Description: "changed" }); })}>New target</a>`
          : html`<button ${CT.On("click", () => this.SetState({ Link: true }))}>Replace target</button>`;
      }
    }
    CT.Mount(new View({ Content: Tooltip({ Text: "Child hint", Content: Child(ChangingTarget) }) }), mount);
    const old = mount.querySelector("button");
    const tooltip = mount.querySelector('[role="tooltip"]');
    old.click();
    await Frame();
    const link = mount.querySelector("a");
    Assert(link.getAttribute("aria-describedby") === `original ${tooltip.id}` && !old.hasAttribute("aria-describedby"), "Child replacement left a stale trigger");
    link.focus();
    Assert(!tooltip.hidden, "New child target did not show its hint");
    link.click();
    await Frame();
    Assert(link.getAttribute("aria-describedby") === `changed ${tooltip.id}`, "Child description update removed the hint association");
  });
  await Check("Popup opening and Escape restore focus without trapping or stealing later focus", async () => {
    const app = new Controls();
    CT.Mount(app, mount);
    const opener = mount.querySelector("#open-popup");
    opener.focus();
    opener.click();
    await Frame();
    const popup = mount.querySelector(".ct-popup-window");
    Assert(popup.contains(document.activeElement), "Popup did not receive opening focus");
    const input = popup.querySelector("input");
    input.focus();
    await Update(app, { Result: "Parent update" });
    Assert(document.activeElement === input, "Parent update stole popup focus");
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
    await Frame();
    Assert(popup.hidden && document.activeElement === opener, "Escape or focus restoration failed");
    opener.click();
    await Frame();
    const outside = mount.querySelector("#after-popup");
    outside.focus();
    Assert(document.activeElement === outside, "Popup trapped focus");
    await Update(app, { Open: false });
    Assert(document.activeElement === outside, "Closing stole focus from another control");
  });
  await Check("Tooltip stays within the viewport at a corner", () => {
    CT.Mount(new View({ Content: html`<div style="position:fixed;left:0;top:0">${Tooltip({ Text: "A short hint near the viewport edge remains readable.", Content: html`<button>Corner target</button>` })}</div>` }), mount);
    mount.querySelector("button").focus();
    const tooltip = mount.querySelector('[role="tooltip"]');
    const bounds = tooltip.getBoundingClientRect();
    Assert(!tooltip.hidden && bounds.left >= 7.5 && bounds.top >= 7.5 && bounds.right <= document.documentElement.clientWidth - 7.5, "Hint clipped at the viewport edge");
    Assert(bounds.top >= mount.querySelector("button").getBoundingClientRect().bottom, "Flipped hint covers its target");
  });
  await Check("Nested popup Escape does not close its parent dialog", async () => {
    const app = new Controls();
    CT.Mount(app, mount);
    mount.querySelector("#open-modal").click();
    await Frame();
    const opener = mount.querySelector("#nested-opener");
    opener.focus();
    opener.click();
    await Frame();
    const popup = mount.querySelector('dialog .ct-popup-window');
    Assert(popup.contains(document.activeElement), "Nested popup did not take focus");
    document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
    await Frame();
    Assert(popup.hidden && mount.querySelector("dialog").open && document.activeElement === opener, "Nested Escape closed parent or lost opener");
  });
  await Check("Alert priority has native roles and explicit overrides", async () => {
    CT.Mount(new View({ Content: html`<section>${Alert({ Type: "success" })}${Alert({ Type: "danger" })}${Alert({ Live: "off" })}</section>` }), mount);
    const alerts = mount.querySelectorAll(".ct-alert");
    Assert(alerts[0].getAttribute("role") === "status" && alerts[1].getAttribute("role") === "alert" && !alerts[2].hasAttribute("role") && alerts[2].getAttribute("aria-live") === "off", "Alert announcement priority incorrect");
  });
  CT.Unmount(mount);
  CT.Mount(new View({ Content: html`<section>${Child(Records)}${Child(Controls)}</section>` }), mount);
  document.querySelector("#result").textContent = `${passed} component checks passed (${source ? "source" : "minified bundle"}). Try editing, reordering, reset, Tab, and Escape below.`;
} catch (error) {
  document.querySelector("#result").textContent = `FAILED after ${passed} checks: ${error.message}`;
  console.error(error);
}
