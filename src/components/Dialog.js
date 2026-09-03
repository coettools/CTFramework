import { Component } from "./Component.js";
import { CreateComponent } from "./ComponentFactory.js";
import { CT } from "../CTFramework.js";

const html = CT.Html;

export class DialogComponent extends Component {
  Close() {
    this.props.OnClose?.();
  }

  Render() {
    const { Actions = [], Content = null, Open = false, Title = "Dialog" } = this.props;

    if (!Open) {
      return "";
    }

    return html`
      <div class="ct-dialog-backdrop" role="presentation" ${CT.On("click", () => this.Close())}>
        <section class="ct-dialog" role="dialog" aria-modal="true" ${CT.Attr("aria-label", Title)} ${CT.On("click", (event) => event.stopPropagation())}>
          <header class="ct-dialog-header"><h2>${Title}</h2><button type="button" class="ct-button-secondary" aria-label="Close dialog" ${CT.On("click", () => this.Close())}>Close</button></header>
          <div class="ct-dialog-content">${Content}</div>
          ${Actions.length ? html`<footer class="ct-dialog-actions">${Actions.map((action) => html`<button type="button" ${CT.Attr("className", action.ClassName || "")} ${CT.On("click", () => action.OnClick?.())}>${action.Label}</button>`)}</footer>` : null}
        </section>
      </div>
    `;
  }
}

export const Dialog = (options = {}) => CreateComponent(DialogComponent, options);
