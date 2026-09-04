import { Component } from "./Component.js";
import { CreateComponent } from "./ComponentFactory.js";
import { CT } from "../CTFramework.js";

const html = CT.Html;

export class PopupWindowComponent extends Component {
  constructor(props) {
    super(props);
    this._window = null;
    this._isOpen = false;
    this._returnFocus = null;
    this._onKeyDown = (event) => {
      if (event.key === "Escape" && event.target.closest(".ct-popup-window") === this._window) {
        event.preventDefault();
        event.stopPropagation();
        this.Close();
      }
    };
  }

  RestoreFocus() {
    const active = document.activeElement;
    if (this._returnFocus?.isConnected && (active === document.body || this._window?.contains(active))) {
      this._returnFocus.focus();
    }
    this._returnFocus = null;
  }

  SyncWindow() {
    if (this.__disposed) return;
    const window = this.vnode?.dom;
    if (!window?.isConnected) return;
    if (this._window !== window) {
      this._window?.removeEventListener("keydown", this._onKeyDown);
      this._window = window;
      window.addEventListener("keydown", this._onKeyDown);
    }
    const isOpen = Boolean(this.props.Open);
    if (isOpen && !this._isOpen) {
      this._returnFocus = document.activeElement;
      window.querySelector("button")?.focus();
    } else if (!isOpen && this._isOpen) {
      this.RestoreFocus();
    }
    this._isOpen = isOpen;
  }

  ComponentOnMount() { this.SyncWindow(); }
  ComponentOnUpdate() { queueMicrotask(() => this.SyncWindow()); }
  ComponentOnUnmount() {
    this._window?.removeEventListener("keydown", this._onKeyDown);
    this.RestoreFocus();
    this._window = null;
  }

  Close() {
    this.props.OnClose?.();
  }

  Render() {
    const { Content = null, Open = false, Position = "bottom-right", Title = "Window" } = this.props;

    return html`
      <section ${CT.Attr("className", `ct-popup-window ct-popup-window-${Position}`)} role="dialog" ${CT.Attr("aria-label", Title)} ${CT.Attr("hidden", !Open)}>
        ${Open ? [
          html`<header><strong>${Title}</strong><button type="button" class="ct-button-secondary" aria-label="Close window" ${CT.On("click", () => this.Close())}>Close</button></header>`,
          html`<div>${Content}</div>`
        ] : null}
      </section>
    `;
  }
}

export const PopupWindow = (options = {}) => CreateComponent(PopupWindowComponent, options);
