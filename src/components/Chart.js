import { CT } from "../CTFramework.js";
import { Component } from "./Component.js";
import { CreateComponent } from "./ComponentFactory.js";
import { Guid } from "../utils/Guid.js";
import { CreateChartData } from "../utils/ChartData.js";
import { ChartBars, ChartLayout, ChartPaths, NearestChartIndex } from "../utils/ChartGeometry.js";

const html = CT.Html;
const attr = CT.Attr;
const Identity = (value) => value;

class ChartComponent extends Component {
  constructor(props) {
    super(props);
    this.state = { Width: 320, TableOpen: false };
    this._id = `ct-chart-${Guid()}`;
    this._selected = null;
    this._plot = null;
    this._events = {
      pointermove: (event) => this.InspectPointer(event),
      pointerdown: (event) => this.InspectPointer(event),
      pointerleave: (event) => {
        if (event.pointerType !== "touch" && document.activeElement !== this._plot) this.Select(null);
      },
      pointercancel: () => this.Select(null),
      focus: () => this.Select(this._selected ?? this._layout.Selectable[0], true),
      blur: () => this.Select(null),
      keydown: (event) => this.InspectKey(event),
    };
  }

  ComponentOnMount() {
    this.BindPlot();
  }

  ComponentOnUpdate() {
    this.BindPlot();
    const positions = this._layout.Selectable;
    if (this._selected !== null && positions.length) {
      this._selected = positions[NearestChartIndex(positions, this._selected, Identity)];
    }

    this.Select(this._selected, document.activeElement === this._plot);
  }

  ComponentOnUnmount() {
    this.ReleasePlot();
  }

  ReleasePlot() {
    this._observer?.disconnect();
    for (const [name, handler] of Object.entries(this._events)) this._plot?.removeEventListener(name, handler);
    this._plot = null;
  }

  BindPlot() {
    const plot = this.vnode.dom.querySelector(".ct-chart-plot");
    if (this._plot === plot) return;
    this.ReleasePlot();
    if (!plot) return;

    this._plot = plot;
    for (const [name, handler] of Object.entries(this._events)) plot.addEventListener(name, handler);
    this._observer = new ResizeObserver(([entry]) => {
      if (this._plot !== entry.target) return;
      const width = Math.floor(entry.contentRect.width);
      if (width > 0 && width !== this.state.Width) this.SetState({ Width: width });
    });
    this._observer.observe(plot);
  }

  InspectPointer(event) {
    const rect = this._plot.querySelector("svg")?.getBoundingClientRect();
    if (!rect?.width) return;
    const pixel = ((event.clientX - rect.left) / rect.width) * this._layout.Width;
    const positions = this._layout.Selectable;
    const index = NearestChartIndex(positions, pixel, this._layout.ScaleX);
    this.Select(positions[index]);
  }

  InspectKey(event) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.defaultPrevented) return;
    if (event.key === "Escape") {
      this.Select(null);

      return;
    }
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    const positions = this._layout.Selectable;
    if (!positions.length) return;

    event.preventDefault();
    const current = positions.indexOf(this._selected);
    const next = Math.max(0, Math.min(positions.length - 1, current + (event.key === "ArrowRight" ? 1 : -1)));
    this.Select(positions[next], true);
  }

  Select(position, announce = false) {
    if (!this._plot) return;
    const data = this._data;
    this._selected = data.HasData && this._layout.Selectable.length ? (position ?? null) : null;
    const active = this._selected !== null;
    const line = this._plot.querySelector(".ct-chart-crosshair");
    const tooltip = this.vnode.dom.querySelector(".ct-chart-tooltip");
    const status = this.vnode.dom.querySelector("[aria-live]");
    let text = "";
    if (active) {
      const x = this._layout.ScaleX(position);
      line.setAttribute("x1", x);
      line.setAttribute("x2", x);
      const values = data.Visible.map((series) => `${series.Label}: ${data.FormatY(series.Values.get(position))}`);
      text = [data.FormatX(position), ...values].join(" · ");
    }

    line?.setAttribute("visibility", active ? "visible" : "hidden");
    tooltip.hidden = !active;
    if (tooltip.textContent !== text) tooltip.textContent = text;
    const announcement = announce ? text : "";
    if (status.textContent !== announcement) status.textContent = announcement;
  }

  RenderLegend(data) {
    if (!(this.props.Legend ?? data.Series.length > 1)) return null;

    return html`<div class="ct-chart-legend" role="group" aria-label="Series">
      ${data.Series.map((series) => {
        const swatch = html`<svg width="32" height="12" aria-hidden="true" ${attr("style", { color: series.Color })}>
          <line x1="1" x2="31" y1="6" y2="6" stroke="currentColor" stroke-width="3" ${attr("stroke-dasharray", series.Dash)}></line>
        </svg>`;
        const entry = this.props.OnToggleSeries
          ? html`<button type="button" class="ct-button-secondary" ${attr("aria-pressed", String(series.Visible))} ${CT.On("click", () => this.props.OnToggleSeries(series.Id, !series.Visible))}>${swatch}${series.Label}</button>`
          : html`<span>${swatch}${series.Label}${series.Visible ? "" : " (hidden)"}</span>`;

        return { ...entry, key: series.Id };
      })}
    </div>`;
  }

  RenderTable(data) {
    return html`<table>
      <caption>
        ${data.Title}
      </caption>
      <thead>
        <tr>
          <th scope="col">${data.X.Label || (data.Type === "bar" ? "Category" : "X")}</th>
          ${data.Visible.map((item) => html`<th scope="col">${item.Label}</th>`)}
        </tr>
      </thead>
      <tbody>
        ${data.Positions.map(
          (position) =>
            html`<tr>
              <th scope="row">${data.FormatX(position)}</th>
              ${data.Visible.map((item) => html`<td>${data.FormatY(item.Values.get(position))}</td>`)}
            </tr>`,
        )}
      </tbody>
    </table>`;
  }

  RenderSeries(series, index, data, layout) {
    const points = layout.Layers[index];
    let shapes;
    if (data.Type === "bar") {
      const bars = ChartBars(points, layout, index, data.Visible.length, data.Stacked);
      shapes = bars.map((bar) => html`<rect fill="currentColor" stroke="var(--ct-color-surface)" ${attr("x", bar.X)} ${attr("y", bar.Y)} ${attr("width", bar.Width)} ${attr("height", bar.Height)}></rect>`);
    } else {
      const paths = ChartPaths(points, layout, data.Type === "area", data.Stacked);
      shapes = [
        paths.Area ? html`<path fill="currentColor" fill-opacity="0.27" ${attr("d", paths.Area)}></path>` : null,
        paths.Line ? html`<path fill="none" stroke="currentColor" ${attr("d", paths.Line)}></path>` : null,
        paths.Dots.map((dot) => html`<circle r="2.5" fill="currentColor" ${attr("cx", dot.X)} ${attr("cy", dot.Top)}></circle>`),
      ];
    }

    return {
      ...html`<g class="ct-chart-series" ${attr("data-series", series.Id)} ${attr("style", { color: series.Color })} ${attr("stroke-dasharray", series.Dash)}>${shapes}</g>`,
      key: series.Id,
    };
  }

  RenderSvg(data, layout) {
    const { Left, Right, Top, Bottom, Width, ScaleX, ScaleY } = layout;
    const clip = `${this._id}-clip`;
    const summary = data.Visible.map((series) => (series.Min <= series.Max ? `${series.Label}, ${data.FormatY(series.Min)} to ${data.FormatY(series.Max)}` : `${series.Label}, no values`));
    const markers = data.Markers.filter((marker) => marker.X >= layout.X.Min && marker.X <= layout.X.Max);

    return html`<svg
      class="ct-chart-svg"
      width="100%"
      ${attr("height", data.Height)}
      ${attr("viewBox", `0 0 ${Width} ${data.Height}`)}
      role="img"
      ${attr("aria-label", [data.Title, ...summary, ...markers.map((marker) => `${marker.Label}, ${data.FormatX(marker.X)}`)].join(". "))}
    >
      <defs>
        <clipPath ${attr("id", clip)}><rect ${attr("x", Left)} ${attr("y", Top)} ${attr("width", Right - Left)} ${attr("height", Bottom - Top)}></rect></clipPath>
      </defs>
      <g class="ct-chart-grid">${layout.Y.Ticks.map((tick) => html`<line ${attr("x1", Left)} ${attr("x2", Right)} ${attr("y1", ScaleY(tick))} ${attr("y2", ScaleY(tick))}></line>`)}</g>
      <g ${attr("clip-path", `url(#${clip})`)}>${data.Visible.map((series, index) => this.RenderSeries(series, index, data, layout))}</g>
      <g class="ct-chart-axis">
        ${layout.YLabels.map((tick) => html`<text text-anchor="end" dominant-baseline="middle" ${attr("x", Left - 5)} ${attr("y", ScaleY(tick))}>${data.FormatY(tick)}</text>`)}
        ${layout.Labels.map((tick) => html`<text ${attr("text-anchor", tick.Anchor)} ${attr("x", tick.X)} ${attr("y", Bottom + 15)}>${tick.Label}</text>`)}
        ${data.Y.Label ? html`<text text-anchor="middle" ${attr("transform", `translate(12 ${(Top + Bottom) / 2}) rotate(-90)`)}>${data.Y.Label}</text>` : null}
        ${data.X.Label ? html`<text text-anchor="middle" ${attr("x", (Left + Right) / 2)} ${attr("y", data.Height - 4)}>${data.X.Label}</text>` : null}
        ${markers.map(
          (marker) =>
            html`<g class="ct-chart-marker">
              <line stroke="currentColor" stroke-dasharray="2 3" ${attr("x1", ScaleX(marker.X))} ${attr("x2", ScaleX(marker.X))} ${attr("y1", Top)} ${attr("y2", Bottom)}></line>
              <text ${attr("text-anchor", ScaleX(marker.X) > (Left + Right) / 2 ? "end" : "start")} ${attr("x", ScaleX(marker.X))} ${attr("y", Top - 5)}>${marker.Label}</text>
            </g>`,
        )}
      </g>
      <line class="ct-chart-crosshair" visibility="hidden" ${attr("y1", Top)} ${attr("y2", Bottom)}></line>
    </svg>`;
  }

  Render() {
    const data = CreateChartData(this.props);
    const layout = ChartLayout(data, this.state.Width);
    this._data = data;
    this._layout = layout;
    const tableId = `${this._id}-table`;
    const helpId = `${this._id}-help`;
    const empty = this.props.EmptyText ?? "No data";
    const hasRows = data.Visible.length > 0 && data.Positions.length > 0;

    return html`<section class="ct-chart" ${attr("aria-label", data.Title)}>
      ${this.props.ShowTitle === false ? null : html`<header class="ct-chart-header"><h2>${data.Title}</h2></header>`} ${this.RenderLegend(data)}
      <p hidden ${attr("id", helpId)}>Use the left and right arrow keys to explore values.</p>
      <div class="ct-chart-plot" role="group" ${attr("aria-label", data.Title)} ${attr("aria-describedby", data.HasData ? helpId : null)} ${attr("tabindex", data.HasData ? "0" : null)}>
        ${data.HasData ? this.RenderSvg(data, layout) : html`<p>${empty}</p>`}
      </div>
      <div class="ct-chart-tooltip" hidden></div>
      <div class="ct-chart-status" role="status" aria-live="polite" aria-atomic="true"></div>
      ${hasRows
        ? html`<button type="button" class="ct-button-secondary" ${attr("aria-controls", tableId)} ${attr("aria-expanded", String(this.state.TableOpen))} ${CT.On("click", () => this.SetState({ TableOpen: !this.state.TableOpen }))}>
            ${this.state.TableOpen ? "Hide table" : "Show as table"}
          </button>`
        : null}
      <div class="ct-chart-table" ${attr("id", tableId)} ${attr("hidden", !hasRows || !this.state.TableOpen)}>${hasRows && this.state.TableOpen ? this.RenderTable(data) : null}</div>
    </section>`;
  }
}

export const Chart = (options = {}) => CreateComponent(ChartComponent, options);
