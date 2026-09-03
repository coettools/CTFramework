import { Component } from "./Component.js";
import { CreateComponent } from "./ComponentFactory.js";
import { CT } from "../CTFramework.js";

const html = CT.Html;

export class ToastComponent extends Component {
  constructor(props) {
    super(props);
    this.state = { IsVisible: true };
  }

  Close() {
    this.props.OnClose?.();
    this.SetState({ IsVisible: false });
  }

  Render() {
    const { Message = "", Title = "", Type = "info", Visible = true } = this.props;

    if (!Visible || !this.state.IsVisible) {
      return "";
    }

    return html`
      <section ${CT.Attr("className", `ct-toast ct-toast-${Type}`)} role="status" aria-live="polite">
        <div>${Title ? html`<strong>${Title}</strong>` : null}<span>${Message}</span></div>
        <button type="button" class="ct-button-secondary" aria-label="Close notification" ${CT.On("click", () => this.Close())}>Close</button>
      </section>
    `;
  }
}

export const Toast = (options = {}) => CreateComponent(ToastComponent, options);
