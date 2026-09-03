import { Component } from "./Component.js";
import { CreateComponent } from "./ComponentFactory.js";
import { CT } from "../CTFramework.js";

const html = CT.Html;

export class PopupWindowComponent extends Component {
  Close() {
    this.props.OnClose?.();
  }

  Render() {
    const { Content = null, Open = false, Position = "bottom-right", Title = "Window" } = this.props;

    if (!Open) {
      return "";
    }

    return html`
      <section ${CT.Attr("className", `ct-popup-window ct-popup-window-${Position}`)} role="dialog" ${CT.Attr("aria-label", Title)}>
        <header><strong>${Title}</strong><button type="button" class="ct-button-secondary" aria-label="Close window" ${CT.On("click", () => this.Close())}>Close</button></header>
        <div>${Content}</div>
      </section>
    `;
  }
}

export const PopupWindow = (options = {}) => CreateComponent(PopupWindowComponent, options);
