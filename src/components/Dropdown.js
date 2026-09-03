import { Component } from "./Component.js";
import { CreateComponent } from "./ComponentFactory.js";
import { CT } from "../CTFramework.js";

const html = CT.Html;

export class DropdownComponent extends Component {
  GetOptionValue(option) {
    return typeof option === "object" ? option.Value : option;
  }

  GetOptionLabel(option) {
    return typeof option === "object" ? option.Label ?? option.Value : option;
  }

  HandleChange(event) {
    const value = event.target.value;
    const option = (this.props.Options || []).find((item) => String(this.GetOptionValue(item)) === value) ?? null;
    this.props.OnChange?.(this.GetOptionValue(option), option);
  }

  Render() {
    const { Id, Label, Options = [], Placeholder = "Select an option", Value = "" } = this.props;

    return html`
      <label class="ct-dropdown">
        ${Label ? html`<span class="ct-dropdown-label">${Label}</span>` : null}
        <select ${CT.Attr("id", Id)} ${CT.Attr("value", String(Value ?? ""))} ${CT.On("change", (event) => this.HandleChange(event))}>
          <option value="">${Placeholder}</option>
          ${Options.map((option) => html`<option ${CT.Attr("value", this.GetOptionValue(option))}>${this.GetOptionLabel(option)}</option>`)}
        </select>
      </label>
    `;
  }
}

export const Dropdown = (options = {}) => CreateComponent(DropdownComponent, options);
