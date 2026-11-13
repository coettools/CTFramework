const variant = new URLSearchParams(location.search);
const modulePath = variant.has("source") ? "../../../src/Index.js" : variant.has("readable") ? "../../../dist/ctframework.bundle.js" : "../../../dist/ctframework.bundle.min.js";
const result = document.querySelector("#result");
const checks = { status: "running", assertions: [], layouts: [], changes: [], mounts: 0, unmounts: 0, draws: 0 };
window.tabsChecks = checks;

const Assert = (condition, message) => {
  if (!condition) throw new Error(message);
  checks.assertions.push(message);
};

const Settle = async () => {
  for (let index = 0; index < 6; index++) await new Promise(requestAnimationFrame);
};

const Key = (target, key) => target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));

try {
  const { default: CT, Chart, Component, PanZoomView, Tabs } = await import(modulePath);
  const html = CT.Html;
  class Planner extends Component {
    constructor(props) {
      super(props);
      this.state = { Count: 0 };
      this.Draw = (ctx, camera, size) => {
        checks.draws++;
        checks.camera = camera;
        checks.size = size;
        ctx.fillRect(size.Width / 2 - camera.X, size.Height / 2 - camera.Y, 12, 12);
      };
    }

    ComponentOnMount() {
      checks.mounts++;
    }

    ComponentOnUnmount() {
      checks.unmounts++;
    }

    Render() {
      return html`<div>
        <label>Build notes <input id="notes" /></label>
        <button type="button" id="count" ${CT.On("click", () => this.SetState({ Count: this.state.Count + 1 }))}>Changes: ${this.state.Count}</button>
        ${PanZoomView({ Label: "Passive tree", Bounds: { MinX: -2000, MinY: -2000, MaxX: 2000, MaxY: 2000 }, Camera: { X: 0, Y: 0, Zoom: 1 }, Draw: this.Draw })}
        ${Chart({
          Title: "Damage preview",
          Series: [
            {
              Id: "build",
              Label: "Current build",
              Points: [
                { X: 0, Y: 12 },
                { X: 1, Y: 18 },
              ],
            },
          ],
        })}
      </div>`;
    }
  }

  class Fixture extends Component {
    constructor(props) {
      super(props);
      this.state = { Controlled: false, Value: 0, Layout: "auto" };
    }

    Render() {
      return html`<div>
        <div id="fixture">
          ${Tabs({
            Label: "Character sections",
            Key: "character",
            Layout: this.state.Layout,
            HeadingLevel: 3,
            MinPanelWidth: "calc(7rem + 3px)",
            Value: this.state.Controlled ? this.state.Value : undefined,
            OnChange: (id) => {
              checks.changes.push(id);
              if (this.state.Controlled) this.SetState({ Value: id });
            },
            OnLayoutChange: (mode) => checks.layouts.push(mode),
            Items: [
              { Id: 0, Title: "Gear and equipment", Content: html`<p>Equipped items</p>` },
              { Id: "locked", Title: "Unavailable", Disabled: true, Content: "Unavailable in this build." },
              { Id: "tree", Title: "Passive tree and damage preview", Span: 2, Badge: 0, Content: CT.View({ Component: Planner }) },
            ],
          })}
        </div>
        <button id="outside" type="button" ${CT.On("click", () => this.SetState({ Layout: this.state.Layout === "tabs" ? "columns" : "tabs" }))}>Switch layout</button>
      </div>`;
    }
  }

  const app = new Fixture();
  CT.Mount(app, "#app");
  checks.app = app;
  const host = document.querySelector("#fixture");
  const root = host.querySelector(".ct-tabs");
  const TabsList = () => Array.from(root.querySelectorAll('[role="tab"]'));
  const panels = Array.from(root.querySelectorAll(".ct-tabs-panel"));
  const planner = panels[2];
  const wrapper = planner.querySelector(".ct-tabs-content");
  const notes = planner.querySelector("#notes");
  const count = planner.querySelector("#count");
  const viewer = planner.querySelector(".ct-pan-zoom-view");
  const canvas = viewer.querySelector("canvas");
  const svg = planner.querySelector(".ct-chart-svg");
  const Resize = async (width) => {
    host.style.width = `${width}px`;
    await Settle();
  };

  const CheckSize = () => {
    Assert(Math.abs(svg.viewBox.baseVal.width - svg.getBoundingClientRect().width) < 2 && svg.viewBox.baseVal.width > 0, "Chart redraws at the visible plot width");
    Assert(checks.size.Width === viewer.clientWidth && canvas.width === Math.round(checks.size.Width * devicePixelRatio), "PanZoomView draws at the visible canvas width");
  };

  await Resize(320);
  const firstWidth = Math.round(root.querySelector(".ct-tabs-ruler").getBoundingClientRect().width);
  const expected = 4 * (7 * parseFloat(getComputedStyle(document.documentElement).fontSize) + 3) + 2 * parseFloat(getComputedStyle(document.documentElement).fontSize);
  Assert(Math.abs(firstWidth - expected) <= 1, "The browser resolves rem, calc, spans and gaps");
  const [gear, disabled, tree] = TabsList();
  Assert(root.querySelector('[role="tablist"]').getAttribute("aria-label") === "Character sections", "The tab list has the supplied label");
  Assert(gear.tabIndex === 0 && disabled.disabled && tree.tabIndex === -1 && planner.hidden, "Only the active tab is in the tab order and the inactive panel is mounted");
  Assert(tree.getAttribute("aria-controls") === planner.id && planner.getAttribute("aria-labelledby") === tree.id, "The tab and panel label each other by ID");
  gear.focus();
  Key(gear, "ArrowLeft");
  await Settle();
  Assert(document.activeElement === tree && tree.getAttribute("aria-selected") === "true" && !planner.hidden, "Left wraps and activates the last enabled tab");
  CheckSize();
  notes.value = "Keep this draft";
  count.click();
  await Settle();
  viewer.focus();
  Key(viewer, "ArrowRight");
  await Settle();
  const camera = { ...checks.camera };
  Assert(camera.X > 0, "The user moved the camera before the panel was hidden");
  for (let cycle = 0; cycle < 2; cycle++) {
    tree.focus();
    Key(tree, "Home");
    await Settle();
    Assert(document.activeElement === gear && planner.hidden, "Home selects and focuses the first tab");
    const draws = checks.draws;
    await Resize(340 + 16 * cycle);
    Key(gear, cycle === 0 ? "ArrowRight" : "End");
    await Settle();
    Assert(document.activeElement === tree && checks.draws > draws, "Reveal skips disabled tabs and triggers a new canvas draw");
    CheckSize();
  }

  notes.focus();
  const changeCount = checks.changes.length;
  checks.layouts.length = 0;
  for (let cycle = 0; cycle < 2; cycle++) {
    await Resize(firstWidth + 4);
    Assert(root.dataset.layout === "columns" && !root.querySelector('[role="tablist"]'), "Growing the control restores ordinary sections");
    const heading = planner.querySelector("h3");
    Assert(heading?.id === planner.getAttribute("aria-labelledby") && panels.every((panel) => !panel.hidden && !panel.hasAttribute("role")), "Each visible region uses its own heading");
    const widths = panels.map((panel) => panel.getBoundingClientRect().width);
    Assert(Math.abs(widths[2] - 2 * widths[0]) < 1, "The double-span panel receives twice the width");
    CheckSize();
    await Resize(firstWidth - 1);
    Assert(document.activeElement === notes && !planner.hidden, "Collapsing selects the focused uncontrolled panel and keeps its input focused");
    await Resize(firstWidth + 2);
    Assert(root.dataset.layout === "tabs", "Small fluctuations leave tabs in place");
  }

  Assert(checks.layouts.join() === "columns,tabs,columns,tabs" && checks.changes.length === changeCount, "Auto changes report once and never request a user selection");
  await Resize(firstWidth + 24);
  app.SetState({ Controlled: true, Value: 0 });
  await Settle();
  notes.focus();
  await Resize(320);
  Assert(planner.hidden && document.activeElement === TabsList()[0], "A controlled collapse honors numeric zero and moves focus out of the hidden panel");
  Key(document.activeElement, "End");
  await Settle();
  Assert(app.state.Value === "tree" && document.activeElement === TabsList()[2], "Controlled selection follows the parent update and focuses the selected tab");
  const layouts = checks.layouts.length;
  app.SetState({ Layout: "columns" });
  await Settle();
  Assert(document.activeElement === planner && checks.layouts.length === layouts, "Removing the focused tab places focus in its region without a forced-layout callback");
  Assert(wrapper === planner.querySelector(".ct-tabs-content") && notes === planner.querySelector("#notes") && notes.value === "Keep this draft", "The content wrapper, input and draft survived all switches");
  Assert(canvas === planner.querySelector("canvas") && svg === planner.querySelector(".ct-chart-svg") && count === planner.querySelector("#count"), "The original canvas, SVG and stateful button survived");
  Assert(count.textContent.includes("1") && checks.mounts === 1 && checks.unmounts === 0, "The managed child retained its state with one mount");
  Assert(checks.camera.X === camera.X && checks.camera.Y === camera.Y && checks.camera.Zoom === camera.Zoom, "The camera survived reveal and width changes");
  document.querySelector("#outside").focus();
  host.style.removeProperty("width");
  app.SetState({ Controlled: false, Layout: "auto" });
  await Settle();
  Assert(document.activeElement.id === "outside", "Returning to auto preserves focus outside Tabs");
  Assert(document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1, "The responsive fixture fits the viewport");
  checks.status = result.dataset.status = "passed";
  result.textContent = `PASS: ${checks.assertions.length} Tabs checks passed.`;
} catch (error) {
  checks.status = result.dataset.status = "failed";
  checks.error = error.stack ?? String(error);
  result.textContent = `FAIL: ${checks.error}`;
  console.error(error);
}
