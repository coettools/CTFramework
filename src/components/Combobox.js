import { Component } from "./Component.js";
import { CreateComponent } from "./ComponentFactory.js";
import { CT } from "../CTFramework.js";
import { IsOptionContent } from "../utils/ComboboxContent.js";
import { FindOptions, IndexOptions } from "../utils/ComboboxSearch.js";
import { Guid } from "../utils/Guid.js";

const html = CT.Html;
const KeepFocus = (event) => {
  if (event.button === 0) event.preventDefault();
};

export class ComboboxComponent extends Component {
  constructor(props) {
    super(props);
    this._id = `ct-combobox-${Guid()}`;
    this._initialKey = String(props.Value ?? "");
    this._resetTimers = new Set();
    this._queryTimer = null;
    this._form = null;
    this._input = null;
    this.state = { Open: false, Draft: null, DraftKey: null, Query: "" };
    this._activeKey = null;
    this._selected = null;
    this._results = null;
    this._onReset = (event) => this.ScheduleReset(event);
    this._onOutside = (event) => {
      if (this.state.Open && !this.vnode?.dom?.contains(event.target)) this.Close();
    };
  }

  ComponentOnMount() {
    this.SyncDom();
    this._input?.ownerDocument.addEventListener("pointerdown", this._onOutside);
  }

  ComponentOnUpdate() {
    if (this.state.Open && this.props.Disabled) this.Close();
    else if (this.state.Draft !== null && this.GetDraft() === null) {
      this.SetState({ Draft: null, DraftKey: null, Query: "" });
    }

    queueMicrotask(() => this.SyncDom());
  }

  ComponentOnUnmount() {
    this.CancelQuery();
    for (const timer of this._resetTimers) clearTimeout(timer);
    this._resetTimers.clear();
    this._form?.removeEventListener("reset", this._onReset);
    this._input?.ownerDocument.removeEventListener("pointerdown", this._onOutside);
    this._input = null;
    this._form = null;
  }

  CancelQuery() {
    clearTimeout(this._queryTimer);
    this._queryTimer = null;
  }

  GetDraft() {
    return this.state.DraftKey === (this._selected?.key ?? null) ? this.state.Draft : null;
  }

  PrepareOptions() {
    const { Options, Filter, MaxVisible, Value, Disabled } = this.props;
    const replaced = !this._index || this._options !== Options;
    if (replaced) {
      this._index = IndexOptions(Options);
      this._options = Options;
    }

    this._selected = this._index.byValue.get(String(Value ?? "")) ?? null;
    const draft = this.GetDraft();
    if (draft === null || Disabled) this.CancelQuery();
    if (!this.state.Open || Disabled) {
      this._activeKey = null;
      this._results = null;

      return;
    }

    const query = draft === null ? "" : this.state.Query;
    if (replaced || !this._results || this._resultQuery !== query || this._filter !== Filter || this._limit !== MaxVisible) {
      this._results = FindOptions(this._index, query, Filter, MaxVisible, replaced ? this._activeKey : null);
      this._resultQuery = query;
      this._filter = Filter;
      this._limit = MaxVisible;
      const enabled = this._results.enabled;
      if (!enabled.some((entry) => entry.key === this._activeKey)) this._activeKey = enabled[0]?.key ?? null;
    }
  }

  SyncValidity(input) {
    // A committed choice stays valid while its label is being edited, even when the draft is blank.
    input.required = Boolean(this.props.Required && (!this._selected || input.value));
    input.setCustomValidity(this.props.Required && !this._selected && input.value ? "Select an option." : "");
  }

  SyncDom() {
    const input = this.vnode?.dom?.querySelector(".ct-combobox-input");
    if (this.__disposed || !input?.isConnected) return;
    this._input = input;
    if (input.form !== this._form) {
      this._form?.removeEventListener("reset", this._onReset);
      this._form = input.form;
      this._form?.addEventListener("reset", this._onReset);
    }

    const text = this.GetDraft() ?? this._selected?.label ?? "";
    if (input.value !== text) input.value = text;
    this.SyncValidity(input);

    const activeId = input.getAttribute("aria-activedescendant");
    if (activeId && activeId !== this._scrolledId) {
      const row = input.ownerDocument.getElementById(activeId);
      const popup = this.vnode.dom.querySelector(".ct-combobox-popup");
      if (row && popup) {
        const bounds = row.getBoundingClientRect();
        const viewport = popup.getBoundingClientRect();
        if (bounds.top < viewport.top) popup.scrollTop += bounds.top - viewport.top;
        else if (bounds.bottom > viewport.bottom) popup.scrollTop += bounds.bottom - viewport.bottom;
      }
    }

    this._scrolledId = activeId;
  }

  ScheduleReset(event) {
    // Run after the native reset action and after other listeners can cancel it.
    const timer = setTimeout(() => {
      this._resetTimers.delete(timer);
      if (this.__disposed || event.defaultPrevented || this._input?.form !== event.target) return;
      this.PrepareOptions();
      const entry = this._index.byValue.get(this._initialKey);
      this.Close();
      this.props.OnChange?.(entry?.value ?? "", entry?.option ?? null);
    }, 0);
    this._resetTimers.add(timer);
  }

  Close() {
    this.CancelQuery();
    this._activeKey = null;
    this._results = null;
    if (this._input) {
      this._input.value = this._selected?.label ?? "";
      this.SyncValidity(this._input);
    }

    this.SetState({ Open: false, Draft: null, DraftKey: null, Query: "" });
  }

  Toggle() {
    if (this.props.Disabled) return;
    this._input?.focus();
    if (this.state.Open) {
      this.Close();

      return;
    }

    this._activeKey = this._selected?.key ?? null;
    this.SetState({ Open: true });
  }

  HandleInput(event) {
    if (this.props.Disabled) return;
    this.CancelQuery();
    const draft = event.currentTarget.value;
    this.SyncValidity(event.currentTarget);
    this._queryTimer = setTimeout(() => this.ApplyQuery(), 100);
    this.SetState({ Open: true, Draft: draft, DraftKey: this._selected?.key ?? null });
  }

  ApplyQuery() {
    this.CancelQuery();
    this._activeKey = null;
    this._results = null;
    this.SetState({ Query: this.GetDraft() ?? "" });
  }

  Commit(entry) {
    if (this.props.Disabled || (entry && (this._queryTimer !== null || !this._results?.enabled.includes(entry)))) return;
    this.Close();
    this._input?.focus();
    if (entry !== this._selected) this.props.OnChange?.(entry?.value ?? "", entry?.option ?? null);
  }

  HandleKeyDown(event) {
    if (this.props.Disabled || event.defaultPrevented || event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return;
    const key = event.key;
    if (key === "Tab" || key === "Escape") {
      if (this.state.Open) {
        if (key === "Escape") event.preventDefault();
        this.Close();
      }

      return;
    }

    const arrow = key === "ArrowUp" || key === "ArrowDown";
    if (!arrow && !(this.state.Open && ["Enter", "Home", "End"].includes(key))) return;
    event.preventDefault();
    const pending = this._queryTimer !== null;
    if (pending && key === "Enter") return;
    if (pending) this.ApplyQuery();
    const wasOpen = this.state.Open && !pending;
    this.SetState({ Open: true });
    this.PrepareOptions();
    const enabled = this._results.enabled;
    if (key === "Enter") {
      const entry = enabled.find((item) => item.key === this._activeKey);
      if (entry) this.Commit(entry);

      return;
    }

    const last = enabled.length - 1;
    let position = enabled.findIndex((entry) => entry.key === this._activeKey);
    if (key === "Home" || (!wasOpen && key === "ArrowDown")) position = 0;
    else if (key === "End" || (!wasOpen && key === "ArrowUp")) position = last;
    else position = Math.max(0, Math.min(last, position + (key === "ArrowDown" ? 1 : -1)));
    this._activeKey = enabled[position]?.key ?? null;
  }

  RenderOption(entry) {
    const { RenderOption } = this.props;
    const active = this._activeKey === entry.key && this._queryTimer === null;
    let content = null;
    if (RenderOption) {
      const custom = RenderOption(entry.option);
      if (custom?.tag === "ct-template" && IsOptionContent(custom)) content = custom;
    }

    return html`<div
      role="option"
      ${CT.Attr("id", `${this._id}-option-${entry.index}`)}
      ${CT.Attr("className", active ? "ct-combobox-option is-active" : "ct-combobox-option")}
      ${CT.Attr("aria-label", content ? entry.label : null)}
      ${CT.Attr("aria-selected", String(entry === this._selected))}
      ${CT.Attr("aria-disabled", String(entry.disabled))}
      ${CT.On("click", () => this.Commit(entry))}
    >
      ${content ?? html`<span class="ct-combobox-option-label">${entry.label}</span>`} ${!content && entry.option.Description ? html`<span class="ct-combobox-description">${entry.option.Description}</span>` : null}
    </div>`;
  }

  RenderGroup(group, entries) {
    const rows = entries.map((entry) => this.RenderOption(entry));
    if (!group) return rows;
    const headingId = `${this._id}-group-${this._index.groups.get(group)}`;

    return html`<div class="ct-combobox-group" role="group" ${CT.Attr("aria-labelledby", headingId)}>
      <div class="ct-combobox-group-label" ${CT.Attr("id", headingId)}>${group}</div>
      ${rows}
    </div>`;
  }

  Render() {
    const { Id = this._id, Name, Label, Placeholder = "Search", Disabled = false, Required = false, EmptyText = "No matches" } = this.props;
    if (typeof Label !== "string" || !Label.trim()) throw new TypeError("Combobox Label must be a non-empty string.");
    this.PrepareOptions();
    const popupId = `${this._id}-listbox`;
    const labelId = `${this._id}-label`;
    const active = this._queryTimer === null ? this._index.byValue.get(this._activeKey) : null;
    const results = this._results;
    const open = this.state.Open && !Disabled;
    const draft = this.GetDraft();
    const status = results && draft !== null && this._queryTimer === null ? `${results.total} ${results.total === 1 ? "result" : "results"}` : "";

    return html`<div class="ct-combobox">
      <label class="ct-combobox-label" ${CT.Attr("id", labelId)} ${CT.Attr("htmlFor", Id)}>${Label}</label>
      <div class="ct-combobox-field">
        <input
          class="ct-combobox-input"
          type="text"
          role="combobox"
          autocomplete="off"
          aria-autocomplete="list"
          ${CT.Attr("id", Id)}
          ${CT.Attr("placeholder", Placeholder)}
          ${CT.Attr("disabled", Disabled)}
          ${CT.Attr("aria-required", String(Required))}
          ${CT.Attr("aria-controls", popupId)}
          ${CT.Attr("aria-expanded", String(open))}
          ${CT.Attr("aria-activedescendant", active ? `${this._id}-option-${active.index}` : null)}
          ${CT.Attr("value", draft ?? this._selected?.label ?? "")}
          ${CT.On("input", (event) => this.HandleInput(event))}
          ${CT.On("keydown", (event) => this.HandleKeyDown(event))}
          ${CT.On("blur", () => {
            if (this.state.Open) this.Close();
          })}
        />
        ${this._selected
          ? html`<button type="button" class="ct-combobox-clear" aria-label="Clear selection" ${CT.Attr("disabled", Disabled)} ${CT.On("pointerdown", KeepFocus)} ${CT.On("click", () => this.Commit(null))}>&times;</button>`
          : null}
        <button
          type="button"
          class="ct-combobox-toggle"
          tabindex="-1"
          ${CT.Attr("aria-label", open ? "Hide options" : "Show options")}
          ${CT.Attr("aria-controls", popupId)}
          ${CT.Attr("aria-expanded", String(open))}
          ${CT.Attr("disabled", Disabled)}
          ${CT.On("pointerdown", KeepFocus)}
          ${CT.On("click", () => this.Toggle())}
        >
          &#9662;
        </button>
      </div>
      <input type="hidden" ${CT.Attr("name", Name)} ${CT.Attr("value", this._selected?.key ?? "")} ${CT.Attr("disabled", Disabled)} />
      <div
        class="ct-combobox-popup"
        ${CT.Attr("hidden", !open)}
        ${CT.On("pointerdown", (event) => {
          if (event.target !== event.currentTarget) KeepFocus(event);
        })}
      >
        <div role="listbox" ${CT.Attr("id", popupId)} ${CT.Attr("aria-labelledby", labelId)} ${CT.Attr("aria-busy", String(this._queryTimer !== null))}>${results?.groups.map(([group, entries]) => this.RenderGroup(group, entries))}</div>
        ${results && !results.total && this._queryTimer === null ? html`<div class="ct-combobox-empty">${EmptyText}</div>` : null}
        ${results?.remaining ? html`<div class="ct-combobox-more">Keep typing to narrow ${results.remaining} more ${results.remaining === 1 ? "result" : "results"}</div>` : null}
      </div>
      <span class="ct-combobox-status" role="status" aria-live="polite" aria-atomic="true">${status}</span>
    </div>`;
  }
}

export const Combobox = (options = {}) => CreateComponent(ComboboxComponent, options);
