import { Component } from "./Component.js";
import { CreateComponent } from "./ComponentFactory.js";
import { CT } from "../CTFramework.js";
import { Guid } from "../utils/Guid.js";
import { PositionPopover } from "../utils/PopoverPosition.js";
import { GetPopoverTrigger, PopoverTriggerAttributes } from "../utils/PopoverTrigger.js";

const html = CT.Html;
let activeHover = null;
const openPanels = new Set();
const ValidWidth = (value) => {
  if (typeof value !== "string" || !value.trim() || /[;{}]/.test(value)) return false;
  if (globalThis.CSS?.supports) return CSS.supports("max-width", value) && CSS.supports("max-width", `min(${value}, 100vw)`);

  // Without a CSS parser validate simple dimensions and defer math/variables
  // to the browser. Width is assigned as one property, never as stylesheet text.
  return /^(?:0|(?:\d+(?:\.\d+)?|\.\d+)(?:%|px|em|rem|ex|ch|lh|rlh|cap|ic|cm|mm|q|in|pt|pc|(?:s|l|d)?v(?:h|w|min|max|i|b)|cq(?:w|h|i|b|min|max))|(?:calc|min|max|clamp|var)\([\w.\s,%+*/()-]+\))$/i.test(value.trim());
};

// CT templates carry mutable slot records. Visibility changes must not reconcile
// an unchanged trigger or content template with itself.
class PopoverSlot extends Component {
  ShouldComponentUpdate(next) {
    return next.Child !== this.props.Child;
  }

  Render() {
    return html`<span ${CT.Attr("className", this.props.ClassName)}>${this.props.Child}</span>`;
  }
}

export class PopoverComponent extends Component {
  constructor(props) {
    super(props);

    this.state = { Open: false };
    this._id = `ct-popover-${Guid()}`;
    this._timer = null;
    this._hovered = false;
    this._returningFocus = false;
    this._firstTouch = false;
    this._onPosition = () => this.Position();
  }

  ComponentOnMount() {
    const root = this.vnode.dom;
    this._host = root.querySelector(".ct-popover-trigger");
    this._panel = root.querySelector(".ct-popover-panel");
    this._events = new AbortController();
    const { signal } = this._events;
    this.SyncTrigger(true);

    for (const element of [this._host, this._panel]) {
      element.addEventListener("pointerenter", (event) => this.PointerEnter(event), { signal });
      element.addEventListener("pointerleave", (event) => this.PointerLeave(event), { signal });
    }

    this._host.addEventListener(
      "pointerdown",
      (event) => {
        this._firstTouch = this.IsHover && event.pointerType === "touch" && !this.state.Open;
      },
      { signal },
    );
    this._host.addEventListener(
      "pointercancel",
      () => {
        this._firstTouch = false;
      },
      { signal },
    );
    this._host.addEventListener("click", (event) => this.Activate(event), { signal });
    this._host.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "Tab" && !event.shiftKey && !event.defaultPrevented && this.IsHover && this.state.Open) {
          event.preventDefault();
          this._panel.focus({ preventScroll: true });

          return;
        }
        if (event.defaultPrevented || event.repeat || !["Enter", " "].includes(event.key)) return;
        if (event.target.matches('[role="button"][tabindex]:not(button, input, select, textarea, a[href], summary)')) {
          event.preventDefault();
          event.target.click();
        }
      },
      { signal },
    );
    root.addEventListener("focusin", () => this.FocusIn(), { signal });
    root.addEventListener("focusout", (event) => this.FocusOut(event), { signal });
    this._panel.addEventListener("toggle", () => this.SyncNative(), { signal });

    // A managed trigger can change independently of this component's render cycle.
    this._observer = new MutationObserver(() => this.SyncTrigger());
    this._observer.observe(this._host, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["disabled", "hidden", "inert", "tabindex", "href", "type", "contenteditable", "aria-expanded", "aria-controls", "aria-haspopup", "aria-describedby"],
    });
  }

  ComponentOnUpdate(previous) {
    if (!this._panel) return;
    if ((previous.Open ?? "hover") !== (this.props.Open ?? "hover")) this.Close(false);
    this.SyncTrigger();
    this.Position();
  }

  ComponentOnUnmount() {
    const wasOpen = this.state.Open;
    this.CancelTimer();
    this._observer?.disconnect();
    this._events?.abort();
    this.StopTracking();
    this._attributes?.Release();
    if (activeHover === this) activeHover = null;
    if (this._panel?.matches(":popover-open")) this._panel.hidePopover();
    this._attributes = null;
    this._panel = null;
    this._host = null;
    this._hovered = false;
    this.state.Open = false;
    if (wasOpen) this.props.OnOpenChange?.(false);
  }

  get IsHover() {
    return this.props.Open !== "click";
  }

  SyncTrigger(initial = false) {
    if (!this._host) return;
    const target = GetPopoverTrigger(this._host);
    if (initial && !target) throw new TypeError("Popover Trigger must render one focusable control as its root.");
    if (this._attributes?.target !== target) {
      this.CancelTimer();
      this._attributes?.Release();
      this._attributes = target ? new PopoverTriggerAttributes(target) : null;
      this._hovered = false;
      this.Close(false);
    }

    if (!this._attributes) return;
    this._attributes.Set("aria-controls", this._id, true);
    this._attributes.Set("aria-expanded", String(this.state.Open));
    if (this.IsHover) {
      this._attributes.Restore("aria-haspopup");
      this._attributes.Set("aria-describedby", `${this._id}-summary`, true);
    } else {
      this._attributes.Restore("aria-describedby");
      this._attributes.Set("aria-haspopup", "dialog");
    }
  }

  CancelTimer() {
    clearTimeout(this._timer);
    this._timer = null;
  }

  PointerEnter(event) {
    if (!this.IsHover || event.pointerType === "touch" || !this._attributes) return;
    this.CancelTimer();
    this._hovered = true;
    if (!this.state.Open) this._timer = setTimeout(() => this.Show(), 150);
  }

  PointerLeave(event) {
    if (!this.IsHover || event.pointerType === "touch") return;
    this.CancelTimer();
    this._hovered = false;
    if (this.state.Open && !this.vnode.dom.contains(document.activeElement)) this._timer = setTimeout(() => this.Close(false), 160);
  }

  FocusIn() {
    if (!this.IsHover || this._returningFocus) return;
    this.CancelTimer();
    this.Show();
  }

  FocusOut(event) {
    if (this.IsHover && !this._hovered && !this.vnode.dom.contains(event.relatedTarget)) this.Close(false);
  }

  Activate(event) {
    if (!this._attributes?.target.contains(event.target)) return;
    if (this._firstTouch && this._attributes.target.matches("a[href]")) event.preventDefault();
    this._firstTouch = false;
    if (!this.IsHover && this.state.Open) this.Close(true);
    else this.Show();
  }

  Show() {
    this.CancelTimer();
    if (!this._attributes || this.state.Open || !this._panel.isConnected) return;
    if (!this._panel.matches(":popover-open")) this._panel.showPopover({ source: this._attributes.target });
    if (!this._panel.matches(":popover-open")) return;
    if (this.IsHover) {
      if (activeHover) activeHover.Close(activeHover._panel.contains(document.activeElement));
      activeHover = this;
    }

    this.SetState({ Open: true });
    this.SyncTrigger();
    this.StartTracking();
    this.Position();
    if (!this.IsHover) this._panel.focus({ preventScroll: true });
    this.props.OnOpenChange?.(true);
  }

  Close(returnFocus) {
    this.CancelTimer();
    if (!this.state.Open) return;
    this.StopTracking();
    if (activeHover === this) activeHover = null;
    this._returningFocus = true;
    this.SetState({ Open: false });

    try {
      if (this._panel.matches(":popover-open")) this._panel.hidePopover();
      this._attributes?.Set("aria-expanded", "false");
      if (returnFocus && this._attributes?.target.isConnected) this._attributes.target.focus({ preventScroll: true });
    } finally {
      this._returningFocus = false;
    }

    this.props.OnOpenChange?.(false);
  }

  SyncNative() {
    // Native toggle events may be coalesced across a close/reopen in one task.
    if (this._panel.matches(":popover-open") && !this._attributes) this._panel.hidePopover();
    else if (this._panel.matches(":popover-open")) this.Show();
    else this.Close(!this.IsHover);
  }

  StartTracking() {
    openPanels.add(this);
    this._tracking = new AbortController();
    const { signal } = this._tracking;
    document.addEventListener(
      "keydown",
      (event) => {
        if (event.key !== "Escape" || event.defaultPrevented || [...openPanels].at(-1) !== this) return;
        event.preventDefault();
        event.stopPropagation();
        this.Close(!this.IsHover || this.vnode.dom.contains(document.activeElement));
      },
      { capture: true, signal },
    );
    const dismissOutside = (event) => {
      if (event.composedPath().includes(this.vnode.dom)) return;
      // Restore dialog focus if it is still ours. A pointer's normal focus
      // action can then land on the outside control the user actually chose.
      this.Close(!this.IsHover && (document.activeElement === document.body || this._panel.contains(document.activeElement)));
    };

    document.addEventListener("pointerdown", dismissOutside, { capture: true, signal });
    document.addEventListener("click", dismissOutside, { capture: true, signal });
    document.addEventListener("scroll", this._onPosition, { capture: true, signal });
    window.addEventListener("resize", this._onPosition, { signal });
    window.visualViewport?.addEventListener("resize", this._onPosition, { signal });
    window.visualViewport?.addEventListener("scroll", this._onPosition, { signal });
    this._sizes = new ResizeObserver(this._onPosition);
    this._sizes.observe(this._panel);
    this._sizes.observe(this._attributes.target);
  }

  StopTracking() {
    openPanels.delete(this);
    this._tracking?.abort();
    this._sizes?.disconnect();
    this._tracking = null;
    this._sizes = null;
  }

  Position() {
    if (!this.state.Open || !this._attributes || !this._panel.matches(":popover-open")) return;
    const element = document.documentElement;
    const visual = window.visualViewport;
    const viewport = { left: visual?.offsetLeft ?? 0, top: visual?.offsetTop ?? 0, width: visual?.width ?? element.clientWidth, height: visual?.height ?? element.clientHeight };
    const style = this._panel.style;
    style.setProperty("--_ct-popover-viewport-width", `${viewport.width}px`);
    style.setProperty("--_ct-popover-viewport-height", `${viewport.height}px`);
    if (this.props.Width) style.setProperty("--_ct-popover-width", this.props.Width);
    else style.removeProperty("--_ct-popover-width");
    const position = PositionPopover(this._attributes.target.getBoundingClientRect(), this._panel.getBoundingClientRect(), viewport, this.props.Placement ?? "top");
    style.left = `${position.left}px`;
    style.top = `${position.top}px`;
    this._panel.dataset.placement = position.side;
  }

  Render() {
    const { Trigger, Content, Width, OnOpenChange, Label = "Details", Open = "hover", Placement = "top" } = this.props;
    if (!Trigger || Array.isArray(Trigger) || typeof Trigger !== "object" || !Trigger.tag) throw new TypeError("Popover Trigger must render one focusable control as its root.");
    if (typeof Label !== "string" || !Label.trim()) throw new TypeError("Popover Label must be a non-empty string.");
    if (!["hover", "click"].includes(Open)) throw new TypeError('Popover Open must be "hover" or "click".');
    if (!["top", "right", "bottom", "left"].includes(Placement)) throw new TypeError('Popover Placement must be "top", "right", "bottom" or "left".');
    if (Width !== undefined && !ValidWidth(Width)) {
      throw new TypeError("Popover Width must be a CSS length or percentage.");
    }
    if (OnOpenChange !== undefined && typeof OnOpenChange !== "function") throw new TypeError("Popover OnOpenChange must be a function.");

    return html`<span class="ct-popover">
      ${CT.View({ Component: PopoverSlot, Props: { ClassName: "ct-popover-trigger", Child: Trigger } })}
      <span hidden ${CT.Attr("id", `${this._id}-summary`)}>${Label}</span>
      <span class="ct-popover-panel" popover="manual" ${CT.Attr("id", this._id)} ${CT.Attr("role", this.IsHover ? "region" : "dialog")} ${CT.Attr("aria-label", Label)} ${CT.Attr("tabindex", this.IsHover ? "0" : "-1")}>
        ${this.state.Open ? CT.View({ Component: PopoverSlot, Props: { ClassName: "ct-popover-content", Child: Content } }) : null}
      </span>
    </span>`;
  }
}

export const Popover = (options = {}) => CreateComponent(PopoverComponent, options);
