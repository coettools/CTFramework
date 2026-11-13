const variant = new URLSearchParams(location.search);
const modulePath = variant.has("source") ? "../../../src/Index.js" : variant.has("readable") ? "../../../dist/ctframework.bundle.js" : "../../../dist/ctframework.bundle.min.js";
const { default: CT, Chart, Component } = await import(modulePath);
const html = CT.Html;
const theme = variant.get("theme");
if (theme === "light" || theme === "dark") {
  document.documentElement.style.colorScheme = theme;
  document.documentElement.dataset.theme = theme;
}

const Assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const Settle = async () => {
  for (let frame = 0; frame < 4; frame++) await new Promise(requestAnimationFrame);
};

const Points = (count, offset) => Array.from({ length: count }, (_, index) => ({ X: index, Y: index === 2 ? null : (index % 9) + offset }));
const first = { Id: "a", Label: "Channel A", Points: Points(600, -2) };
const second = { Id: "b", Label: "Channel B", Points: Points(600, 2).filter((point) => point.X !== 1) };
const bars = {
  Type: "bar",
  Categories: ["Morning", "Evening"],
  Series: [
    { Id: "a", Label: "Channel A", Values: [3, -4] },
    { Id: "b", Label: "Channel B", Values: [2, -2] },
  ],
  X: { Format: (value) => `Shift ${value}` },
  Y: { Format: (value) => `${value} units` },
};

class ChartChecks extends Component {
  constructor(props) {
    super(props);
    this.state = { Hidden: [], Updated: false };
    this.Requests = [];
  }

  Toggle(id, visible) {
    this.Requests.push([id, visible]);
    this.SetState({ Hidden: visible ? this.state.Hidden.filter((key) => key !== id) : [...this.state.Hidden, id] });
  }

  Render() {
    const updated = this.state.Updated ? { ...first, Points: [{ X: 0, Y: 42 }, ...first.Points.slice(1)] } : first;

    return html`<section>
      <div id="timeline">
        ${Chart({
          Title: "Synthetic readings",
          X: { Label: "Time", Format: (value) => `t${value}` },
          Y: { Label: "Reading", Format: (value) => `${value} units` },
          Series: [updated, second],
          Markers: [{ X: 100, Label: "Checkpoint" }],
          Hidden: this.state.Hidden,
          OnToggleSeries: (id, visible) => this.Toggle(id, visible),
        })}
      </div>
      ${Chart({ ...bars, Title: "Grouped readings" })} ${Chart({ ...bars, Title: "Stacked readings", Stacked: true })}
      ${Chart({ Title: "Stacked areas", Type: "area", Stacked: true, Series: [first, { ...second, Points: Points(600, -4) }] })}
      <div id="four-series">${Chart({ Title: "Four channels", Series: [first, second, { Id: "c", Label: "Channel C", Points: Points(600, 4) }, { Id: "d", Label: "Channel D", Points: Points(600, 6) }] })}</div>
      ${Chart({ Title: "Empty readings", EmptyText: "No readings yet", ShowTitle: false })}
      <button id="open-dialog" type="button" ${CT.On("click", () => document.querySelector("#chart-dialog").showModal())}>Open chart dialog</button>
      <dialog id="chart-dialog" aria-label="Chart dialog">
        ${Chart({ Title: "Dialog readings", Series: [first] })}
        <form method="dialog"><button type="submit">Close dialog</button></form>
      </dialog>
    </section>`;
  }
}

CT(async () => {
  const result = document.querySelector("#result");

  try {
    const app = new ChartChecks();
    CT.Mount(app, "#app");
    window.chartChecks = app;
    await Settle();
    const root = document.querySelector("#timeline .ct-chart");
    const plot = root.querySelector(".ct-chart-plot");
    const svg = plot.querySelector("svg");
    const tooltip = root.querySelector(".ct-chart-tooltip");
    const status = root.querySelector("[aria-live]");
    const button = root.querySelector("[aria-controls]");
    const legend = root.querySelectorAll(".ct-chart-legend button");
    const table = () => root.querySelector("table");
    Assert(svg.getAttribute("aria-label").includes("Channel A") && svg.getAttribute("role") === "img", "SVG needs a title and range summary");
    Assert(svg.querySelector("path").getBBox().width > 0 && svg.querySelector("path").namespaceURI === "http://www.w3.org/2000/svg", "SVG data geometry must be drawn");
    Assert(svg.querySelector(".ct-chart-marker").textContent.includes("Checkpoint"), "Reference marker needs a visible label");
    Assert(svg.querySelector(".ct-chart-axis").textContent.includes("units"), "Axis uses the unit formatter");
    const four = document.querySelector("#four-series");
    Assert(four.querySelectorAll(".ct-chart-series").length === 4, "Four 600-point series draw together");
    four.querySelector("[aria-controls]").click();
    await Settle();
    Assert(four.querySelectorAll("tbody tr").length === 600 && four.querySelector("tbody tr").cells.length === 5, "Four-series table retains every sample");
    four.querySelector("[aria-controls]").click();
    await Settle();

    plot.focus();
    plot.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowRight" }));
    Assert(status.textContent === "t1 · Channel A: -1 units · Channel B: —", "Right arrow announces exact values and gaps");
    Assert(tooltip.textContent === status.textContent && !tooltip.hidden, "Focused tooltip matches the live region");
    plot.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowLeft" }));
    Assert(status.textContent.startsWith("t0 ·"), "Left arrow returns to first sample");

    button.focus();
    for (let attempt = 0; attempt < 2; attempt++) {
      button.click();
      await Settle();
      Assert(document.activeElement === button && button.getAttribute("aria-expanded") === "true", "Table opens without moving button focus");
      const rows = table().tBodies[0].rows;
      Assert(rows.length === 600 && rows[1].cells[0].textContent === "t1" && rows[1].cells[2].textContent === "—", "Table has all positions and missing values");
      Assert(rows[0].cells[1].textContent === "-2 units", "Table applies Y.Format");
      button.click();
      await Settle();
      Assert(!table() && button.getAttribute("aria-expanded") === "false", "Closing removes the table and updates disclosure state");
    }

    for (const item of [legend[0], legend[1], legend[1], legend[0]]) {
      item.focus();
      item.click();
      await Settle();
      Assert(document.activeElement === item, "Legend keeps focus across parent updates");
      if (app.state.Hidden.length === 2) Assert(root.textContent.includes("No data") && !plot.querySelector("svg"), "All-hidden chart can be restored through its legend");
    }

    Assert(
      JSON.stringify(app.Requests) ===
        JSON.stringify([
          ["a", false],
          ["b", false],
          ["b", true],
          ["a", true],
        ]),
      "Legend requests controlled visibility",
    );
    Assert(document.querySelector('[aria-label="Empty readings"].ct-chart').textContent.includes("No readings yet"), "Custom empty text renders");

    plot.focus();
    app.SetState({ Updated: true });
    await Settle();
    Assert(document.activeElement === plot && status.textContent.includes("42 units"), "Series replacement preserves focus and refreshes values");
    app.SetState({ Updated: false });
    await Settle();

    const host = document.querySelector("#timeline");
    const liveSvg = plot.querySelector("svg");
    const before = liveSvg.viewBox.baseVal.width;
    host.style.width = "70%";
    await Settle();
    Assert(liveSvg.viewBox.baseVal.width < before && document.activeElement === plot, "Resize updates the same SVG and preserves focus");
    host.style.removeProperty("width");
    await Settle();
    const rect = liveSvg.getBoundingClientRect();
    liveSvg.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerType: "touch", clientX: rect.right - 2 }));
    Assert(tooltip.textContent.startsWith("t599 ·") && liveSvg.querySelector(".ct-chart-crosshair").getAttribute("visibility") === "visible", "Touch inspects the nearest full-resolution sample");

    const grouped = document.querySelector('.ct-chart[aria-label="Grouped readings"]');
    const stacked = document.querySelector('.ct-chart[aria-label="Stacked readings"]');
    const barX = (chart) => Array.from(chart.querySelectorAll(".ct-chart-series"), (series) => series.querySelector("rect").getAttribute("x"));
    Assert(new Set(barX(grouped)).size === 2 && new Set(barX(stacked)).size === 1, "Grouped bars use adjacent slots and stacked bars share a slot");
    Assert(grouped.querySelector(".ct-chart-axis").textContent.includes("Shift Morning"), "Categorical axis calls X.Format with the label");

    const dialog = document.querySelector("#chart-dialog");
    for (let attempt = 0; attempt < 2; attempt++) {
      dialog.showModal();
      await Settle();
      const dialogSvg = dialog.querySelector(".ct-chart-svg");
      Assert(Math.abs(dialogSvg.viewBox.baseVal.width - dialogSvg.getBoundingClientRect().width) < 2, "Chart observes its dialog when the dialog opens");
      dialog.close();
      await Settle();
    }

    const series = liveSvg.querySelector(".ct-chart-series");
    const original = getComputedStyle(series).color;
    root.style.setProperty("--ct-chart-1", "rgb(1, 2, 3)");
    Assert(getComputedStyle(series).color === "rgb(1, 2, 3)" && original !== "rgb(1, 2, 3)", "Project overrides reach the drawn series");
    root.style.removeProperty("--ct-chart-1");
    plot.blur();
    window.scrollTo(0, 0);
    result.textContent = "PASS: SVG geometry, focus, keyboard values, touch, controlled legend, full table, formatters, resize, dialog and theme override.";
    result.dataset.status = "passed";
  } catch (error) {
    result.textContent = error.stack;
    result.dataset.status = "failed";
    console.error(error);
  }
});
