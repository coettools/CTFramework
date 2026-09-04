import { Component } from "./Component.js";
import { CreateComponent } from "./ComponentFactory.js";
import { CT } from "../CTFramework.js";
import { Guid } from "../utils/Guid.js";

const html = CT.Html;
const FocusableSelector = 'button, input, select, textarea, a[href], [tabindex]';

export class TooltipComponent extends Component {
  constructor(props) {
    super(props);
    this._id = `ct-tooltip-${Guid()}`;
    this._root = null;
    this._target = null;
    this._observer = null;
    this._hovered = false;
    this._focused = false;
    this._dismissed = false;
    this._onPosition = () => this.PositionTooltip();
    this._onEscape = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        this.Dismiss();
      }
    };
    this._handlers = {
      pointerenter: () => { this._hovered = true; this._dismissed = false; this.SyncVisibility(); },
      pointerleave: () => { this._hovered = false; this.SyncVisibility(); },
      focusin: (event) => {
        if (!this._root.contains(event.relatedTarget)) this._dismissed = false;
        this._focused = true;
        this.SyncVisibility();
      },
      focusout: (event) => { this._focused = this._root.contains(event.relatedTarget); this.SyncVisibility(); },
      click: () => this.Dismiss()
    };
  }

  Dismiss() {
    this._dismissed = true;
    this.SyncVisibility();
  }

  RemoveDescription() {
    if (!this._target) return;
    const ids = (this._target.getAttribute("aria-describedby") || "").split(/\s+/).filter((id) => id && id !== this._id);
    if (ids.length) this._target.setAttribute("aria-describedby", ids.join(" "));
    else this._target.removeAttribute("aria-describedby");
    this._target = null;
  }

  SyncVisibility() {
    const tooltip = this._root?.querySelector(`#${this._id}`);
    const visible = Boolean(this.props.Text && !this._dismissed && (this._hovered || this._focused && this.props.ShowOnFocus !== false));
    if (tooltip) tooltip.hidden = !visible;
    document.removeEventListener("keydown", this._onEscape, true);
    window.removeEventListener("resize", this._onPosition);
    if (visible) {
      document.addEventListener("keydown", this._onEscape, true);
      window.addEventListener("resize", this._onPosition);
      this.PositionTooltip();
    }
  }

  PositionTooltip() {
    const tooltip = this._root?.querySelector(`#${this._id}`);
    if (!tooltip || tooltip.hidden) return;
    tooltip.style.marginLeft = "0px";
    tooltip.style.marginTop = "0px";
    tooltip.classList.remove("is-flipped");
    let bounds = tooltip.getBoundingClientRect();
    const viewport = document.documentElement;
    if (this.props.Position === "right" ? bounds.right > viewport.clientWidth - 8 : bounds.top < 8) {
      tooltip.classList.add("is-flipped");
      bounds = tooltip.getBoundingClientRect();
    }
    tooltip.style.marginLeft = `${Math.max(8 - bounds.left, Math.min(0, viewport.clientWidth - 8 - bounds.right))}px`;
    tooltip.style.marginTop = `${Math.max(8 - bounds.top, Math.min(0, viewport.clientHeight - 8 - bounds.bottom))}px`;
  }

  Detach() {
    this._observer?.disconnect();
    this._observer = null;
    this.RemoveDescription();
    for (const [name, handler] of Object.entries(this._handlers)) this._root?.removeEventListener(name, handler);
    document.removeEventListener("keydown", this._onEscape, true);
    window.removeEventListener("resize", this._onPosition);
    this._root = null;
  }

  SyncTarget() {
    if (this.__disposed) return;
    const root = this.vnode?.dom;
    if (!root?.isConnected) return;
    if (this._root !== root) {
      this.Detach();
      this._root = root;
      this._hovered = false;
      for (const [name, handler] of Object.entries(this._handlers)) root.addEventListener(name, handler);
      // Content can replace its own control without rerendering this wrapper.
      this._observer = new MutationObserver(() => this.SyncTarget());
      this._observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ["aria-describedby", "disabled"] });
    }
    const target = this.props.Text
      ? [...root.querySelectorAll(FocusableSelector)].find((element) => !element.matches(":disabled")) || root : null;
    if (this._target !== target) {
      this.RemoveDescription();
      this._target = target;
    }
    if (target === root && this.props.ShowOnFocus !== false) {
      if (root.tabIndex !== 0) root.tabIndex = 0;
    } else if (root.hasAttribute("tabindex")) root.removeAttribute("tabindex");
    if (target) {
      const current = target.getAttribute("aria-describedby") || "";
      const ids = current.split(/\s+/).filter(Boolean);
      const description = [...new Set([...ids, this._id])].join(" ");
      if (current !== description) target.setAttribute("aria-describedby", description);
    }
    this._focused = root.contains(document.activeElement);
    this.SyncVisibility();
  }

  ComponentOnMount() { this.SyncTarget(); }
  ComponentOnUpdate() { queueMicrotask(() => this.SyncTarget()); }
  ComponentOnUnmount() { this.Detach(); }

  Render() {
    const { Content = null, Position = "top", Text = "" } = this.props;
    return html`
      <span class="ct-tooltip">
        ${Content}
        <span ${CT.Attr("id", this._id)} ${CT.Attr("className", `ct-tooltip-content ct-tooltip-${Position === "right" ? "right" : "top"}`)} role="tooltip" hidden>${Text}</span>
      </span>
    `;
  }
}

export const Tooltip = (options = {}) => CreateComponent(TooltipComponent, options);
