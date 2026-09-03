import { Component } from "./Component.js";
import { CreateComponent } from "./ComponentFactory.js";
import { CT } from "../CTFramework.js";

const html = CT.Html;
const ClampIndex = (index, count) => Math.max(0, Math.min(Number.isInteger(index) ? index : 0, count - 1));

export class ImageCarouselComponent extends Component {
  constructor(props = {}) {
    super(props);
    this.state = { Index: ClampIndex(props.InitialIndex ?? 0, this.GetImages().length), FailedSource: null };
    this._gesture = null;
    this._root = null;
    this._viewport = null;
    this._onError = (event) => this.HandleImageError(event);
    this._pointerEvents = {
      pointerdown: (event) => this.HandlePointerDown(event),
      pointerup: (event) => this.HandlePointerUp(event),
      pointercancel: () => { this._gesture = null; },
      lostpointercapture: () => { this._gesture = null; }
    };
  }

  GetImages() {
    return Array.isArray(this.props.Images)
      ? this.props.Images.filter((image) => image && typeof image.Src === "string" && image.Src.trim())
      : [];
  }

  GetActiveIndex() {
    return ClampIndex(this.state.Index, this.GetImages().length);
  }

  SelectImage(index) {
    const images = this.GetImages();
    const nextIndex = ClampIndex(index, images.length);
    if (!images.length || nextIndex === this.GetActiveIndex()) return;
    this.SetState({ Index: nextIndex, FailedSource: null });
    this.props.OnChange?.(nextIndex, images[nextIndex]);
  }

  MoveImage(step) {
    const count = this.GetImages().length;
    if (count < 2) return;
    const nextIndex = this.GetActiveIndex() + step;
    this.SelectImage(this.props.Loop === false ? nextIndex : (nextIndex + count) % count);
  }

  HandleKeyDown(event) {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || this.GetImages().length < 2) return;
    const actions = {
      ArrowLeft: () => this.MoveImage(-1),
      ArrowRight: () => this.MoveImage(1),
      Home: () => this.SelectImage(0),
      End: () => this.SelectImage(this.GetImages().length - 1)
    };
    if (!actions[event.key]) return;
    event.preventDefault();
    actions[event.key]();
  }

  HandlePointerDown(event) {
    if (!event.isPrimary || event.button !== 0 || this.GetImages().length < 2) {
      this._gesture = null;
      return;
    }
    this._gesture = { Id: event.pointerId, X: event.clientX, Y: event.clientY, Source: this.GetImages()[this.GetActiveIndex()].Src };
    if (event.isTrusted) this._viewport?.setPointerCapture?.(event.pointerId);
  }

  HandlePointerUp(event) {
    const gesture = this._gesture;
    if (!gesture || gesture.Id !== event.pointerId) return;
    this._gesture = null;
    if (this._viewport?.hasPointerCapture?.(event.pointerId)) this._viewport.releasePointerCapture(event.pointerId);
    if (gesture.Source !== this.GetImages()[this.GetActiveIndex()]?.Src) return;
    const distanceX = event.clientX - gesture.X;
    const distanceY = event.clientY - gesture.Y;
    if (Math.abs(distanceX) >= 40 && Math.abs(distanceX) > Math.abs(distanceY)) this.MoveImage(distanceX < 0 ? 1 : -1);
  }

  HandleImageError(event) {
    const image = this._root?.querySelector(".ct-image-carousel-image");
    if (event.target !== image || !image?.complete || image.naturalWidth || image.getAttribute("src") !== this.GetImages()[this.GetActiveIndex()]?.Src) return;
    this.SetState({ FailedSource: image.getAttribute("src") });
  }

  ComponentOnMount() {
    this._root = this.vnode.dom;
    this._viewport = this._root.querySelector(".ct-image-carousel-viewport");
    // Image errors do not bubble. Keep capture and gesture listeners local to this control.
    this._root.addEventListener("error", this._onError, true);
    for (const [type, handler] of Object.entries(this._pointerEvents)) this._viewport.addEventListener(type, handler);
    const image = this._root.querySelector(".ct-image-carousel-image");
    if (image?.complete && !image.naturalWidth) this.HandleImageError({ target: image });
  }

  ComponentOnUpdate() {
    const index = this.GetActiveIndex();
    if (index !== this.state.Index) this.SetState({ Index: index, FailedSource: null });
  }

  ComponentOnUnmount() {
    this._root?.removeEventListener("error", this._onError, true);
    for (const [type, handler] of Object.entries(this._pointerEvents)) this._viewport?.removeEventListener(type, handler);
    this._gesture = null;
    this._root = null;
    this._viewport = null;
  }

  RenderImage(image) {
    if (!image) return html`<p class="ct-image-carousel-empty">No images to display.</p>`;
    if (this.state.FailedSource === image.Src) {
      return html`<div class="ct-image-carousel-empty" role="img" ${CT.Attr("aria-label", image.Alt || "Unavailable image")}><p>Image unavailable.</p></div>`;
    }
    return html`<img class="ct-image-carousel-image" ${CT.Attr("src", image.Src)} ${CT.Attr("alt", image.Alt ?? "")} draggable="false" decoding="async">`;
  }

  Render() {
    const { Label = "Image gallery", Loop = true, Fit = "contain", Indicators = true } = this.props;
    const images = this.GetImages();
    const index = this.GetActiveIndex();
    const current = images[index];
    const hasMultiple = images.length > 1;
    return html`
      <section class="ct-image-carousel" role="region" aria-roledescription="carousel" ${CT.Attr("aria-label", Label)}>
        <header class="ct-image-carousel-header">
          <strong>${Label}</strong>
          <span class="ct-image-carousel-count" role="status" aria-live="polite" aria-atomic="true">${images.length ? `${index + 1} of ${images.length}` : "0 images"}</span>
        </header>
        <figure class="ct-image-carousel-slide" role="group" aria-roledescription="slide" ${CT.Attr("aria-label", images.length ? `${index + 1} of ${images.length}` : "Empty gallery")}>
          <div ${CT.Attr("className", `ct-image-carousel-viewport${Fit === "cover" ? " is-cover" : ""}`)}
            ${CT.Attr("tabIndex", hasMultiple ? 0 : -1)} aria-label="Image viewer. Use left and right arrow keys to change images."
            ${CT.On("keydown", (event) => this.HandleKeyDown(event))}>
            ${this.RenderImage(current)}
          </div>
          <figcaption class="ct-image-carousel-caption" ${CT.Attr("hidden", !current?.Caption)}>${current?.Caption ?? ""}</figcaption>
        </figure>
        <div class="ct-image-carousel-controls" ${CT.Attr("hidden", !hasMultiple)}>
          <button type="button" class="ct-button-secondary ct-image-carousel-previous" aria-label="Previous image"
            ${CT.Attr("disabled", !hasMultiple || (!Loop && index === 0))} ${CT.On("click", () => this.MoveImage(-1))}><span aria-hidden="true"></span></button>
          <div class="ct-image-carousel-indicators" role="group" aria-label="Choose an image" ${CT.Attr("hidden", !Indicators)}>
            ${images.map((image, position) => html`<button type="button" class="ct-image-carousel-indicator"
              ${CT.Attr("aria-label", `Show image ${position + 1}`)} ${CT.Attr("aria-current", position === index ? "true" : null)}
              ${CT.Attr("aria-disabled", String(position === index))} ${CT.On("click", () => this.SelectImage(position))}>${position + 1}</button>`)}
          </div>
          <button type="button" class="ct-button-secondary ct-image-carousel-next" aria-label="Next image"
            ${CT.Attr("disabled", !hasMultiple || (!Loop && index === images.length - 1))} ${CT.On("click", () => this.MoveImage(1))}><span aria-hidden="true"></span></button>
        </div>
      </section>
    `;
  }
}

export const ImageCarousel = (options = {}) => CreateComponent(ImageCarouselComponent, options);
