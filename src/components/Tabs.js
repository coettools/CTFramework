import { CT } from "../CTFramework.js";
import { NormalizeNodes } from "../html/RenderNodes.js";
import { Guid } from "../utils/Guid.js";
import { TabsDestination, TabsMode, ValidateTabs } from "../utils/TabsLayout.js";
import { Badge } from "./Badge.js";
import { Component } from "./Component.js";
import { CreateComponent } from "./ComponentFactory.js";

const html = CT.Html;
const attr = CT.Attr;
const Caption = (item) => [item.Title, item.Badge === undefined ? null : Badge({ Text: item.Badge })];

// Selection and measurement updates only change the panel's surrounding section.
class PanelContent extends Component {
  ShouldComponentUpdate(nextProps) {
    return nextProps.Content !== this.props.Content;
  }

  Render() {
    return html`<div class="ct-tabs-content">${this.props.Content}</div>`;
  }
}

class TabsComponent extends Component {
  constructor(props) {
    super(props);
    this._ids = new Map();
    this._autoMode = null;
    this._selected = null;
    this._mode = null;
  }

  ComponentOnMount() {
    this.SyncMeasurement();
  }

  ComponentOnUpdate() {
    this.RepairFocus();
    const auto = (this.props.Layout ?? "auto") === "auto";
    if (auto && this._autoMode && this._reportedMode !== this._mode) {
      const previous = this._reportedMode;
      this._reportedMode = this._mode;
      if (previous) this.props.OnLayoutChange?.(this._mode);
    }

    this.SyncMeasurement();
  }

  ComponentOnUnmount() {
    this.StopMeasurement();
  }

  StopMeasurement() {
    this._observer?.disconnect();
    this._observer = null;
  }

  SyncMeasurement() {
    if ((this.props.Layout ?? "auto") !== "auto") {
      this.StopMeasurement();
      this._autoMode = null;
      this._reportedMode = null;

      return;
    }
    if (this._observer) return;
    const root = this.vnode.dom;
    const ruler = root.querySelector(".ct-tabs-ruler");
    const observer = new ResizeObserver((entries) => {
      if (this._observer !== observer) return;
      for (const entry of entries) {
        if (entry.target === root) this._width = entry.contentRect.width;
        if (entry.target === ruler) this._threshold = entry.contentRect.width;
      }

      if (!(this._width > 0) || this._threshold === null) return;
      const mode = TabsMode(this._width, this._threshold, this._autoMode);
      if (this._autoMode === mode) return;
      this._autoMode = mode;
      this.ForceUpdate();
    });
    this._observer = observer;
    this._width = null;
    this._threshold = null;
    observer.observe(root);
    observer.observe(ruler);
  }

  FindFocus() {
    const root = this.vnode?.dom;
    const active = root?.ownerDocument.activeElement;
    if (!active || !root.contains(active)) return null;
    for (const [id, prefix] of this._ids) {
      if (active.id === `${prefix}-tab`) return { id, tab: true, active };
      const panel = root.ownerDocument.getElementById(`${prefix}-panel`);
      if (panel?.contains(active)) return { id, tab: false, active };
    }

    return null;
  }

  FocusItem(id, part) {
    const root = this.vnode.dom;
    const target = root.ownerDocument.getElementById(`${this._ids.get(id)}-${part}`);
    (target ?? root).focus();
  }

  RepairFocus() {
    const focus = this._focus;
    if (!focus) return;
    if (this._mode === "columns") {
      if (focus.tab || !this._ids.has(focus.id)) this.FocusItem(this._ids.has(focus.id) ? focus.id : this._selected, "panel");
    } else if (focus.id !== this._selected) {
      this.FocusItem(this._selected, "tab");
    }

    const doc = this.vnode.dom.ownerDocument;
    if (doc.activeElement === doc.body && focus.active?.isConnected && (this._mode === "columns" || focus.id === this._selected)) focus.active.focus();
  }

  Select(id) {
    if (this._mode !== "tabs" || !this.props.Items.some((item) => item.Id === id && !item.Disabled)) return;
    if (id !== this._selected) {
      if (this.props.Value === undefined) {
        this._selected = id;
        this.ForceUpdate();
      }

      this.props.OnChange?.(id);
    }

    this.FocusItem(this._selected, "tab");
  }

  Navigate(event, id) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const next = TabsDestination(this.props.Items, id, event.key);
    if (next === undefined) return;
    event.preventDefault();
    this.Select(next);
  }

  RenderTab(item) {
    const id = this._ids.get(item.Id);
    const selected = item.Id === this._selected;

    return {
      ...html`<button
        type="button"
        role="tab"
        class="ct-tabs-tab"
        ${attr("id", `${id}-tab`)}
        ${attr("aria-controls", `${id}-panel`)}
        ${attr("aria-selected", String(selected))}
        ${attr("tabindex", selected ? 0 : -1)}
        ${attr("disabled", item.Disabled)}
        ${CT.On("click", () => this.Select(item.Id))}
        ${CT.On("keydown", (event) => this.Navigate(event, item.Id))}
      >
        ${Caption(item)}
      </button>`,
      key: item.Id,
    };
  }

  RenderPanel(item) {
    const id = this._ids.get(item.Id);
    const tabs = this._mode === "tabs";
    const heading = {
      tag: `h${this.props.HeadingLevel ?? 2}`,
      props: { id: `${id}-heading`, className: "ct-tabs-heading" },
      children: NormalizeNodes(Caption(item)),
    };

    return {
      ...html`<section
        class="ct-tabs-panel"
        ${attr("id", `${id}-panel`)}
        ${attr("role", tabs ? "tabpanel" : null)}
        ${attr("aria-labelledby", `${id}-${tabs ? "tab" : "heading"}`)}
        ${attr("tabindex", tabs ? 0 : -1)}
        ${attr("hidden", tabs && item.Id !== this._selected)}
      >
        ${tabs ? null : heading} ${CreateComponent(PanelContent, { Content: item.Content })}
      </section>`,
      key: item.Id,
    };
  }

  Render() {
    const { Items = [], Layout = "auto", MinPanelWidth = "22rem", Value } = this.props;
    const mode = Layout === "auto" ? (this._autoMode ?? "tabs") : Layout;
    this._focus = this.FindFocus();
    const collapsing = this._mode === "columns" && mode === "tabs";
    const preferred = Value ?? (collapsing ? this._focus?.id : this._selected);
    const enabled = Items.filter((item) => !item.Disabled);
    this._selected = enabled.find((item) => item.Id === preferred)?.Id ?? enabled[0]?.Id ?? null;
    this._mode = mode;

    this._ids = new Map(Items.map((item) => [item.Id, this._ids.get(item.Id) ?? `ct-tabs-${Guid()}`]));
    const units = Items.reduce((sum, item) => sum + (item.Span ?? 1), 0);
    const threshold = `calc(${units} * (${MinPanelWidth}) + ${Math.max(0, Items.length - 1)} * var(--ct-tabs-gap, 1rem))`;
    const tracks = Items.map((item) => `minmax(0, ${item.Span ?? 1}fr)`).join(" ");

    return html`<div class="ct-tabs" tabindex="-1" ${attr("data-layout", mode)}>
      <div class="ct-tabs-measure" aria-hidden="true"><div class="ct-tabs-ruler" ${attr("style", { width: threshold })}></div></div>
      ${mode === "tabs" && Items.length ? html`<div class="ct-tabs-list" role="tablist" ${attr("aria-label", this.props.Label)}>${Items.map((item) => this.RenderTab(item))}</div>` : null}
      <div class="ct-tabs-panels" ${attr("style", { gridTemplateColumns: mode === "columns" ? tracks : "" })}>${Items.map((item) => this.RenderPanel(item))}</div>
    </div>`;
  }
}

export const Tabs = (options = {}) => {
  ValidateTabs(options);

  return CreateComponent(TabsComponent, options);
};
