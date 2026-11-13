import { Component } from "./Component.js";
import { CreateComponent } from "./ComponentFactory.js";
import { CT } from "../CTFramework.js";
import { ValidateBounds, FitCamera, CameraLimits, ClampCamera, WorldPoint, ZoomCamera } from "../utils/PanZoomCamera.js";

const html = CT.Html;
const SameCamera = (left, right) => left?.X === right?.X && left?.Y === right?.Y && left?.Zoom === right?.Zoom;
const Interactive = "button, input, select, textarea, a[href], [contenteditable]";

export class PanZoomViewComponent extends Component {
  constructor(props = {}) {
    super(props);

    this._size = { Width: 1, Height: 1 };
    this._camera = null;
    this._lastCameraProps = props.Camera ? { ...props.Camera } : null;
    this._pointers = new Map();
    this._gesture = null;
    this._hovered = null;
    this._frame = null;
    this._animation = null;
    this._pendingCenter = null;
    this._notify = false;
    this._suppressClick = false;
    this._handle = { CenterOn: (x, y, zoom) => this.CenterOn(x, y, zoom) };
    this._events = {
      pointerdown: (event) => this.PointerDown(event),
      pointermove: (event) => this.PointerMove(event),
      pointerup: (event) => this.PointerEnd(event),
      pointercancel: (event) => this.PointerEnd(event),
      lostpointercapture: (event) => this.PointerEnd(event),
      pointerleave: (event) => {
        if (!this._pointers.size) this.Hover(null, event);
      },
      wheel: (event) => this.Wheel(event),
      keydown: (event) => this.KeyDown(event),
      click: (event) => this.Click(event),
    };
  }

  ComponentOnMount() {
    this._root = this.vnode.dom;
    for (const [name, handler] of Object.entries(this._events)) this._root.addEventListener(name, handler, { passive: false, capture: name === "click" });
    this._resize = new ResizeObserver(() => this.Resize());
    this._resize.observe(this._root);
    this._onScroll = () => {
      this._rect = this._root.getBoundingClientRect();
    };

    document.addEventListener("scroll", this._onScroll, true);
    this.Resize();
    this.props.Ref?.(this._handle);
  }

  ComponentOnUpdate(previousProps) {
    if (previousProps.Ref !== this.props.Ref) {
      previousProps.Ref?.(null);
      this.props.Ref?.(this._handle);
    }

    if (!SameCamera(this.props.Camera, this._lastCameraProps)) {
      this._lastCameraProps = this.props.Camera ? { ...this.props.Camera } : null;
      if (!SameCamera(this.props.Camera, this._emittedCamera)) {
        this._animation = null;
        if (!this._camera) this._pendingCenter = null;
        else this.SetCamera(this.props.Camera ?? this.GetFit());
      }
    } else this.SetCamera(this._camera);
    if (previousProps.Redraw !== this.props.Redraw || previousProps.Draw !== this.props.Draw || previousProps.Content !== this.props.Content) this.QueueFrame();
  }

  ComponentOnUnmount() {
    this._resize?.disconnect();
    document.removeEventListener("scroll", this._onScroll, true);
    if (this._frame !== null) cancelAnimationFrame(this._frame);
    this._frame = null;
    this._animation = null;
    this._pendingCenter = null;
    this._pointers.clear();
    for (const [name, handler] of Object.entries(this._events)) this._root?.removeEventListener(name, handler, name === "click");
    this.props.Ref?.(null);
    this._root = null;
  }

  GetLimits() {
    return CameraLimits(this.props.Bounds, this._size, this.props.MinZoom, this.props.MaxZoom);
  }

  GetFit() {
    return ClampCamera(FitCamera(this.props.Bounds, this._size), this.props.Bounds, this._size, this.GetLimits());
  }

  Resize() {
    const rect = this._root.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const initial = !this._camera;
    this._size = { Width: this._root.clientWidth || rect.width, Height: this._root.clientHeight || rect.height };
    this._rect = this._root.getBoundingClientRect();
    const pending = initial ? this._pendingCenter : null;
    const camera = pending ? { ...pending, Zoom: pending.Zoom ?? this.props.Camera?.Zoom ?? this.GetFit().Zoom } : initial ? (this.props.Camera ?? this.GetFit()) : this._camera;
    this.SetCamera(camera, Boolean(pending) || !initial);
    this._pendingCenter = null;
    this.QueueFrame();
  }

  SetCamera(camera, notify = false) {
    if (!camera) return;
    const next = ClampCamera(camera, this.props.Bounds, this._size, this.GetLimits());
    const changed = !SameCamera(next, this._camera);
    this._camera = next;
    this._notify ||= notify && changed;
    if (changed) this.QueueFrame();
  }

  QueueFrame() {
    if (this.__disposed || !this._root || this._frame !== null) return;
    this._frame = requestAnimationFrame((time) => {
      this._frame = null;
      if (this.__disposed) return;

      try {
        if (this._animation) {
          const progress = Math.min(1, (time - this._animation.Start) / 180);
          const eased = 1 - (1 - progress) ** 3;
          const { From, To } = this._animation;
          this._camera = ClampCamera({ X: From.X + (To.X - From.X) * eased, Y: From.Y + (To.Y - From.Y) * eased, Zoom: From.Zoom + (To.Zoom - From.Zoom) * eased }, this.props.Bounds, this._size, this.GetLimits());
          this._notify = true;
          if (progress === 1) this._animation = null;
        }

        this.Paint();
        const notify = this._notify;
        this._notify = false;
        if (notify) {
          this._emittedCamera = { ...this._camera };
          this.props.OnCameraChange?.({ ...this._camera });
        }
        if (this._animation) this.QueueFrame();
      } catch (error) {
        this._animation = null;
        this._notify = false;
        throw error;
      }
    });
  }

  Paint() {
    if (!this._camera) return;
    const { Width, Height } = this._size;
    const { X, Y, Zoom } = this._camera;
    const canvas = this._root.querySelector("canvas");
    if (canvas) {
      const ratio = window.devicePixelRatio || 1;
      const width = Math.round(Width * ratio);
      const height = Math.round(Height * ratio);
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, width, height);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.save();

      try {
        this.props.Draw(context, { ...this._camera }, { ...this._size });
      } finally {
        context.restore();
      }
    } else {
      const svg = this._root.querySelector("svg");
      svg?.setAttribute("viewBox", `0 0 ${Width} ${Height}`);
      this._root.querySelector(".ct-pan-zoom-plane")?.setAttribute("transform", `translate(${Width / 2} ${Height / 2}) scale(${Zoom}) translate(${-X} ${-Y})`);
    }
  }

  Point(event) {
    return { X: event.clientX - this._rect.left - this._root.clientLeft, Y: event.clientY - this._rect.top - this._root.clientTop };
  }

  BeginGesture() {
    const points = [...this._pointers.values()].slice(0, 2);
    const midpoint = points.length > 1 ? { X: (points[0].X + points[1].X) / 2, Y: (points[0].Y + points[1].Y) / 2 } : points[0];
    this._gesture = points.length ? { Camera: { ...this._camera }, Midpoint: midpoint, Distance: points.length > 1 ? Math.hypot(points[1].X - points[0].X, points[1].Y - points[0].Y) : 0, Dragged: this._suppressClick } : null;
  }

  PointerDown(event) {
    if (event.button !== 0 || event.target.closest(".ct-pan-zoom-controls") || !this._camera) return;
    this._animation = null;
    this._rect = this._root.getBoundingClientRect();
    if (!this._pointers.size) {
      this._suppressClick = false;
      this._pressedItem = this.FindItem(event);
    }

    this._pointers.set(event.pointerId, this.Point(event));
    if (this._pointers.size > 1) this._suppressClick = true;
    this.BeginGesture();
    if (event.isTrusted) this._root.setPointerCapture(event.pointerId);
    if (!event.target.closest("[data-ct-item]")) this._root.focus({ preventScroll: true });
  }

  PointerMove(event) {
    if (!this._pointers.has(event.pointerId)) {
      if (this._camera) this.Hover(this.FindItem(event), event);

      return;
    }

    this._pointers.set(event.pointerId, this.Point(event));
    const points = [...this._pointers.values()].slice(0, 2);
    const midpoint = points.length > 1 ? { X: (points[0].X + points[1].X) / 2, Y: (points[0].Y + points[1].Y) / 2 } : points[0];
    const gesture = this._gesture;
    if (!gesture) return;
    const dx = midpoint.X - gesture.Midpoint.X;
    const dy = midpoint.Y - gesture.Midpoint.Y;
    if (points.length === 1 && !gesture.Dragged && Math.hypot(dx, dy) < 4) return;
    gesture.Dragged = true;
    this._suppressClick = true;
    this.Hover(null, event);
    const distance = points.length > 1 ? Math.hypot(points[1].X - points[0].X, points[1].Y - points[0].Y) : 0;
    const limits = this.GetLimits();
    const zoom = gesture.Distance > 0 && distance > 0 ? Math.min(limits.Max, Math.max(limits.Min, (gesture.Camera.Zoom * distance) / gesture.Distance)) : gesture.Camera.Zoom;
    const anchor = WorldPoint(gesture.Midpoint, gesture.Camera, this._size);
    this.SetCamera({ X: anchor.X - (midpoint.X - this._size.Width / 2) / zoom, Y: anchor.Y - (midpoint.Y - this._size.Height / 2) / zoom, Zoom: zoom }, true);
  }

  PointerEnd(event) {
    if (!this._pointers.has(event.pointerId)) return;
    this._pointers.delete(event.pointerId);
    if (["pointercancel", "lostpointercapture"].includes(event.type)) this._suppressClick = true;
    if (!this._pointers.size && event.type === "pointerup") {
      const item = this._pressedItem;
      const activate = !this._suppressClick && item !== null;
      this._suppressClick = true;
      this._pressedItem = null;
      if (activate) this.props.OnItemActivate?.(item, event);
    }

    this.BeginGesture();
  }

  FindItem(event) {
    if (this.props.Draw) {
      const world = WorldPoint(this.Point(event), this._camera, this._size);

      return this.props.HitTest?.(world.X, world.Y) ?? null;
    }

    const item = event.target.closest?.("[data-ct-item]");

    return item && this._root.contains(item) ? item.getAttribute("data-ct-item") : null;
  }

  Hover(item, event) {
    if (item === this._hovered) return;
    this._hovered = item;
    this.props.OnItemHover?.(item, event);
  }

  Click(event) {
    if (event.target.closest(".ct-pan-zoom-controls")) return;
    if (this._suppressClick && event.detail !== 0) {
      event.preventDefault();
      event.stopPropagation();
      this._suppressClick = false;

      return;
    }

    const item = this.FindItem(event);
    if (item !== null) this.props.OnItemActivate?.(item, event);
  }

  ZoomBy(factor, point = { X: this._size.Width / 2, Y: this._size.Height / 2 }) {
    this._animation = null;
    const limits = this.GetLimits();
    const zoom = Math.max(limits.Min, Math.min(limits.Max, this._camera.Zoom * factor));
    this.SetCamera(ZoomCamera(this._camera, zoom, point, this._size), true);
  }

  Wheel(event) {
    if (!this._camera) return;
    event.preventDefault();
    this._rect = this._root.getBoundingClientRect();
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? this._size.Height : 1);
    this.ZoomBy(Math.exp(-Math.max(-500, Math.min(500, delta)) * 0.002), this.Point(event));
  }

  KeyDown(event) {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || !this._camera || event.target.closest(".ct-pan-zoom-controls")) return;
    const item = event.target.closest?.("[data-ct-item]");
    if (item && ["Enter", " "].includes(event.key)) {
      if (event.repeat) return;
      event.preventDefault();
      this.props.OnItemActivate?.(item.getAttribute("data-ct-item"), event);

      return;
    }
    if (event.target !== this._root && event.target.closest(Interactive)) return;
    const directions = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (directions[event.key]) {
      event.preventDefault();
      this._animation = null;
      const [x, y] = directions[event.key];
      this.SetCamera({ ...this._camera, X: this._camera.X + ((x * this._size.Width) / this._camera.Zoom) * 0.1, Y: this._camera.Y + ((y * this._size.Height) / this._camera.Zoom) * 0.1 }, true);
    } else if (["+", "=", "-", "0"].includes(event.key)) {
      event.preventDefault();
      if (event.key === "0") this.SetCamera(this.GetFit(), true);
      else this.ZoomBy(event.key === "-" ? 1 / 1.25 : 1.25);
    }
  }

  CenterOn(x, y, zoom = this._camera?.Zoom ?? this.props.Camera?.Zoom) {
    if (!this._root || this.__disposed) return;
    if (!Number.isFinite(x) || !Number.isFinite(y) || (zoom !== undefined && (!Number.isFinite(zoom) || zoom <= 0))) throw new TypeError("PanZoomView CenterOn needs finite X/Y and an optional positive Zoom.");
    if (!this._camera) {
      this._animation = null;
      this._pendingCenter = { X: x, Y: y, Zoom: zoom };

      return;
    }

    const target = ClampCamera({ X: x, Y: y, Zoom: zoom }, this.props.Bounds, this._size, this.GetLimits());
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) this.SetCamera(target, true);
    else {
      this._animation = { From: { ...this._camera }, To: target, Start: performance.now() };
      this.QueueFrame();
    }
  }

  Render() {
    ValidateBounds(this.props.Bounds);
    CameraLimits(this.props.Bounds, this._size, this.props.MinZoom, this.props.MaxZoom);
    if (typeof this.props.Label !== "string" || !this.props.Label.trim() || (this.props.Draw && this.props.Content != null) || (this.props.Draw && typeof this.props.Draw !== "function")) {
      throw new TypeError("PanZoomView needs a Label and either SVG Content or a Draw callback, not both.");
    }
    if ((this.props.HitTest != null && typeof this.props.HitTest !== "function") || (this.props.Ref != null && typeof this.props.Ref !== "function")) {
      throw new TypeError("PanZoomView HitTest and Ref must be callbacks.");
    }
    if (this.props.Camera) ClampCamera(this.props.Camera, this.props.Bounds, this._size, this.GetLimits());

    return html`<div class="ct-pan-zoom-view" role="group" tabindex="0" ${CT.Attr("aria-label", this.props.Label)}>
      ${this.props.Draw ? html`<canvas class="ct-pan-zoom-canvas" aria-hidden="true"></canvas>` : html`<svg class="ct-pan-zoom-svg"><g class="ct-pan-zoom-plane">${this.props.Content}</g></svg>`}
      ${this.props.Controls === false
        ? null
        : html`<div class="ct-pan-zoom-controls">
            <button type="button" ${CT.On("click", () => this.ZoomBy(1.25))}>Zoom in</button>
            <button type="button" ${CT.On("click", () => this.ZoomBy(1 / 1.25))}>Zoom out</button>
            <button
              type="button"
              ${CT.On("click", () => {
                this._animation = null;
                this.SetCamera(this.GetFit(), true);
              })}
            >
              Fit
            </button>
          </div>`}
    </div>`;
  }
}

export const PanZoomView = (options = {}) => CreateComponent(PanZoomViewComponent, options);
