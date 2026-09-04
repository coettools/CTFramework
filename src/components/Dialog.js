import { Component } from "./Component.js";
import { CreateComponent } from "./ComponentFactory.js";
import { CT } from "../CTFramework.js";

const html = CT.Html;

export class DialogComponent extends Component {
  constructor(props) {
    super(props);
    this._dialog = null;
    this._returnFocus = null;
    this._onCancel = (event) => {
      event.preventDefault();
      this.Close();
    };
    this._onKeyDown = (event) => this.HandleKeyDown(event);
  }

  Close() {
    this.props.OnClose?.();
  }

  HandleKeyDown(event) {
    if (event.key !== "Tab" || event.target.closest("dialog") !== this._dialog) return;
    const controls = [...this._dialog.querySelectorAll('button, input, select, textarea, a[href], [tabindex]')]
      .filter((element) => !element.matches(":disabled") && element.tabIndex >= 0 && element.getClientRects().length > 0 && !element.closest("[inert]"));
    const first = controls[0];
    const last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first || !event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      (event.shiftKey ? last : first)?.focus();
    }
  }

  SyncModal() {
    if (this.__disposed) return;
    const dialog = this.vnode?.dom;
    if (!dialog?.isConnected) return;
    if (this._dialog !== dialog) {
      this._dialog?.removeEventListener("cancel", this._onCancel);
      this._dialog?.removeEventListener("keydown", this._onKeyDown);
      this._dialog = dialog;
      dialog.addEventListener("cancel", this._onCancel);
      dialog.addEventListener("keydown", this._onKeyDown);
    }
    if (this.props.Open && !dialog.open) {
      this._returnFocus = document.activeElement;
      dialog.showModal();
    } else if (!this.props.Open && dialog.open) {
      dialog.close();
      this.RestoreFocus();
    }
  }

  RestoreFocus() {
    if (this._returnFocus?.isConnected) this._returnFocus.focus();
    this._returnFocus = null;
  }

  ComponentOnMount() {
    this.SyncModal();
  }

  ComponentOnUpdate() {
    // Parent reconciliation attaches replacement DOM before this microtask runs.
    queueMicrotask(() => this.SyncModal());
  }

  ComponentOnUnmount() {
    this._dialog?.removeEventListener("cancel", this._onCancel);
    this._dialog?.removeEventListener("keydown", this._onKeyDown);
    if (this._dialog?.open) this._dialog.close();
    this.RestoreFocus();
    this._dialog = null;
  }

  Render() {
    const { Actions = [], Content = null, Open = false, Title = "Dialog" } = this.props;

    return html`
      <dialog class="ct-dialog-backdrop" ${CT.Attr("aria-label", Title)} ${CT.On("click", (event) => { if (event.target === event.currentTarget) this.Close(); })}>
        ${Open ? html`
        <section class="ct-dialog">
          <header class="ct-dialog-header"><h2>${Title}</h2><button type="button" class="ct-button-secondary" aria-label="Close dialog" ${CT.On("click", () => this.Close())}>Close</button></header>
          <div class="ct-dialog-content">${Content}</div>
          ${Actions.length ? html`<footer class="ct-dialog-actions">${Actions.map((action) => html`<button type="button" ${CT.Attr("className", action.ClassName || "")} ${CT.On("click", () => action.OnClick?.())}>${action.Label}</button>`)}</footer>` : null}
        </section>
        ` : null}
      </dialog>
    `;
  }
}

export const Dialog = (options = {}) => CreateComponent(DialogComponent, options);
