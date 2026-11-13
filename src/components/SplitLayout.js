import { CT } from "../CTFramework.js";
import { Component } from "./Component.js";
import { CreateComponent } from "./ComponentFactory.js";
import { ReadSplitLayoutOptions } from "../utils/SplitLayoutOptions.js";

const html = CT.Html;

const FindScrollport = (root) => {
  const { body, documentElement } = root.ownerDocument;
  for (let ancestor = root.parentElement; ancestor && ancestor !== documentElement; ancestor = ancestor.parentElement) {
    // When the root's overflow is visible, the body's overflow applies to the viewport.
    if (ancestor === body && getComputedStyle(documentElement).overflowY === "visible") break;
    if (["auto", "scroll", "hidden", "overlay"].includes(getComputedStyle(ancestor).overflowY)) return ancestor;
  }

  return documentElement;
};

export class SplitLayoutComponent extends Component {
  ComponentOnMount() {
    if (!this.vnode.dom.matches(".ct-split-layout")) return;
    this._root = this.vnode.dom;
    this._scheduleMeasure = () => {
      if (this._frame == null) {
        this._frame = requestAnimationFrame(() => {
          this._frame = null;
          this.Measure();
        });
      }
    };

    this._observer = new ResizeObserver(this._scheduleMeasure);
    window.addEventListener("resize", this._scheduleMeasure);
    this.ObserveLayout();
  }

  ComponentOnUpdate() {
    if (this._root !== this.vnode.dom) {
      this.ComponentOnUnmount();
      this.ComponentOnMount();
    } else this.ObserveLayout();
    if (this._focus?.isConnected && document.activeElement === document.body) this._focus.focus({ preventScroll: true });
    this._focus = null;
  }

  ComponentOnUnmount() {
    this._observer?.disconnect();
    window.removeEventListener("resize", this._scheduleMeasure);
    if (this._frame != null) cancelAnimationFrame(this._frame);
    this._frame = null;
  }

  ObserveLayout() {
    this._observer.disconnect();
    this._scrollport = null;
    this._side = this._root.querySelector(":scope > .ct-split-layout-side");
    this._probe = this._root.querySelector(":scope > .ct-split-layout-measure > span");
    for (const element of [this._root, this._probe, this._side, this._side.firstElementChild]) this._observer.observe(element);
    this.Measure();
  }

  Measure() {
    const rootStyle = getComputedStyle(this._root);
    let width = parseFloat(rootStyle.width);
    if (rootStyle.boxSizing === "border-box") width -= parseFloat(rootStyle.paddingLeft) + parseFloat(rootStyle.paddingRight) + parseFloat(rootStyle.borderLeftWidth) + parseFloat(rootStyle.borderRightWidth);

    const stacked = width < parseFloat(getComputedStyle(this._probe).width);
    const sticky = this._options.Sticky && !stacked;
    const scrollport = sticky ? FindScrollport(this._root) : null;
    if (scrollport !== this._scrollport) {
      if (this._scrollport) this._observer.unobserve(this._scrollport);
      if (scrollport) this._observer.observe(scrollport);
      this._scrollport = scrollport;
    }

    this._root.toggleAttribute("data-stacked", stacked);
    this._root.toggleAttribute("data-sticky", sticky);
    if (scrollport) {
      const style = getComputedStyle(scrollport);
      const padding = scrollport === this._root.ownerDocument.documentElement ? 0 : (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0);
      this._root.style.setProperty("--_ct-split-scrollport-height", `${Math.max(0, scrollport.clientHeight - padding)}px`);
    } else this._root.style.removeProperty("--_ct-split-scrollport-height");

    const overflows = sticky && (this._side.scrollHeight > this._side.clientHeight || this._side.scrollWidth > this._side.clientWidth);
    if (overflows) this._side.setAttribute("tabindex", "0");
    else this._side.removeAttribute("tabindex");
    if (!this._options.Label.Side) {
      if (overflows) {
        this._side.setAttribute("role", "region");
        this._side.setAttribute("aria-label", "Side panel");
      } else {
        this._side.removeAttribute("role");
        this._side.removeAttribute("aria-label");
      }
    }
  }

  Render() {
    const options = ReadSplitLayoutOptions(this.props);
    if (this._root && this._options.StackOrder !== options.StackOrder && this._root.contains(document.activeElement)) this._focus = document.activeElement;
    this._options = options;
    const { Label, SideWidth } = options;
    const content = html`<div class="ct-split-layout-side-content">${this.props.Side}</div>`;
    const side = Label.Side ? html`<aside class="ct-split-layout-side" ${CT.Attr("aria-label", Label.Side)}>${content}</aside>` : html`<div class="ct-split-layout-side">${content}</div>`;
    const main = html`<div class="ct-split-layout-main" ${CT.Attr("role", Label.Main ? "region" : null)} ${CT.Attr("aria-label", Label.Main)}>${this.props.Main}</div>`;
    side.key = "side";
    main.key = "main";
    const style = `--_ct-split-min: ${SideWidth.Min}; --_ct-split-max: ${SideWidth.Max};${options.Gap === null ? "" : ` gap: ${options.Gap};`}`;

    return html`<div class="ct-split-layout" ${CT.Attr("style", style)} ${CT.Attr("data-side-position", options.SidePosition)}>
      ${options.StackOrder === "side-first" ? [side, main] : [main, side]}
      <div class="ct-split-layout-measure" aria-hidden="true"><span ${CT.Attr("style", `width: ${options.StackBelow}`)}></span></div>
    </div>`;
  }
}

export const SplitLayout = (options = {}) => CreateComponent(SplitLayoutComponent, options);
