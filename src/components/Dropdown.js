import { Component } from "./Component.js";
import { CreateComponent } from "./ComponentFactory.js";
import { CT } from "../CTFramework.js";

const html = CT.Html;

export class DropdownComponent extends Component {
  constructor(props) {
    super(props);
    this._initialValue = String(props.Value ?? "");
    this._form = null;
    this._select = null;
    this._resetTimers = new Set();
    this._onReset = (event) => {
      // Trusted reset events may run microtasks before their native default action.
      const timer = setTimeout(() => {
        this._resetTimers.delete(timer);
        if (!event.defaultPrevented && !this.__disposed && this._select?.form === event.target) {
          this._select.value = this.GetResetValue(this._select);
          this.HandleChange({ target: this._select });
        }
      }, 0);
      this._resetTimers.add(timer);
    };
  }

  GetResetValue(select) {
    return [...select.options].some((option) => option.value === this._initialValue) ? this._initialValue : "";
  }

  SyncForm() {
    if (this.__disposed) return;
    const select = this.vnode?.dom?.querySelector("select");
    if (!select?.isConnected) return;
    this._select = select;
    if (this._form !== select.form) {
      this._form?.removeEventListener("reset", this._onReset);
      this._form = select.form;
      this._form?.addEventListener("reset", this._onReset);
    }
    const value = select.value;
    const initialValue = this.GetResetValue(select);
    for (const option of select.options) option.defaultSelected = option.value === initialValue;
    select.value = value;
  }

  ComponentOnMount() { this.SyncForm(); }
  ComponentOnUpdate() { queueMicrotask(() => this.SyncForm()); }
  ComponentOnUnmount() {
    for (const timer of this._resetTimers) clearTimeout(timer);
    this._resetTimers.clear();
    this._form?.removeEventListener("reset", this._onReset);
    this._form = null;
    this._select = null;
  }

  GetOptionValue(option) {
    return option !== null && typeof option === "object" ? option.Value : option ?? "";
  }

  GetOptionLabel(option) {
    return option !== null && typeof option === "object" ? option.Label ?? option.Value : option ?? "";
  }

  HandleChange(event) {
    const value = event.target.value;
    const option = (this.props.Options || []).find((item) => String(this.GetOptionValue(item)) === value) ?? null;
    this.props.OnChange?.(this.GetOptionValue(option), option);
  }

  Render() {
    const { Id, Name, Label, Disabled = false, Required = false, Options = [], Placeholder = "Select an option", Value = "" } = this.props;

    return html`
      <label class="ct-dropdown">
        ${Label ? html`<span class="ct-dropdown-label">${Label}</span>` : null}
        <select ${CT.Attr("id", Id)} ${CT.Attr("name", Name)} ${CT.Attr("disabled", Disabled)} ${CT.Attr("required", Required)} ${CT.Attr("value", String(Value ?? ""))} ${CT.On("change", (event) => this.HandleChange(event))}>
          <option value="">${Placeholder}</option>
          ${Options.map((option) => html`<option ${CT.Attr("value", this.GetOptionValue(option))}>${this.GetOptionLabel(option)}</option>`)}
        </select>
      </label>
    `;
  }
}

export const Dropdown = (options = {}) => CreateComponent(DropdownComponent, options);
