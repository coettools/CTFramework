const variant = new URLSearchParams(location.search);
const modulePath = variant.has("source") ? "../../../src/Index.js" : variant.has("readable") ? "../../../dist/ctframework.bundle.js" : "../../../dist/ctframework.bundle.min.js";
const { default: CT, Component, PanZoomView } = await import(modulePath);
const html = CT.Html;
const Assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const Settle = async () => {
  await new Promise(requestAnimationFrame);
  await new Promise(requestAnimationFrame);
};

const Near = (left, right) => Math.abs(left - right) < 0.01;

class Checks extends Component {
  constructor(props) {
    super(props);
    this.state = { Camera: { X: 0, Y: 0, Zoom: 1 }, CanvasCamera: { X: 0, Y: 0, Zoom: 1 }, Redraw: 0 };
    this.Activations = [];
    this.Updates = 0;
    this.Draws = 0;
    this.Hits = [];
    this.Ref = (handle) => {
      this.Handle = handle;
    };
  }

  Draw(context, camera, size) {
    this.Draws++;
    this.LastSize = size;
    context.translate(size.Width / 2, size.Height / 2);
    context.scale(camera.Zoom, camera.Zoom);
    context.translate(-camera.X, -camera.Y);
    context.fillStyle = "#32cd32";
    context.fillRect(-30, -30, 60, 60);
  }

  Render() {
    return html`<section>
      <p id="activated">Activated: ${this.Activations.join(", ") || "none"}</p>
      <div class="viewer" id="svg-view">
        ${PanZoomView({
          Label: "SVG diagram",
          Bounds: { MinX: -500, MinY: -400, MaxX: 500, MaxY: 400 },
          MinZoom: 0.1,
          MaxZoom: 4,
          Camera: this.state.Camera,
          Ref: this.Ref,
          Content: html`<g>${[0, 1].map((id) => html`<circle ${CT.Attr("cx", id * 100)} cy="0" r="30" role="button" tabindex="0" ${CT.Attr("data-ct-item", id)} ${CT.Attr("aria-label", `Node ${id}`)}></circle>`)}</g>`,
          OnCameraChange: (camera) => {
            this.Updates++;
            this.SetState({ Camera: camera });
          },
          OnItemActivate: (id) => {
            this.Activations.push(id);
            this.ForceUpdate();
          },
        })}
      </div>
      <div class="viewer" id="canvas-view">
        ${PanZoomView({
          Label: "Canvas diagram",
          Bounds: { MinX: -500, MinY: -400, MaxX: 500, MaxY: 400 },
          MinZoom: 0.1,
          Camera: this.state.CanvasCamera,
          Redraw: this.state.Redraw,
          Draw: (context, camera, size) => this.Draw(context, camera, size),
          HitTest: (x, y) => {
            this.Hits.push({ X: x, Y: y });

            return Math.abs(x) <= 30 && Math.abs(y) <= 30 ? "square" : null;
          },
          OnCameraChange: (camera) => this.SetState({ CanvasCamera: camera }),
          OnItemActivate: (id) => {
            this.Activations.push(id);
            this.ForceUpdate();
          },
        })}
      </div>
      <button id="redraw" type="button" ${CT.On("click", () => this.SetState({ Redraw: this.state.Redraw + 1 }))}>Redraw canvas</button>
      <p>Canvas alternative: a green square at (0, 0).</p>
    </section>`;
  }
}

CT(async () => {
  try {
    const app = new Checks();
    CT.Mount(app, "#app");
    window.panZoomChecks = app;
    window.panZoomFramework = CT;
    await Settle();
    const root = document.querySelector("#svg-view .ct-pan-zoom-view");
    const circle = root.querySelector("circle");
    Assert(circle.namespaceURI === "http://www.w3.org/2000/svg", "Dynamic SVG children need the SVG namespace");
    Assert(circle.getBoundingClientRect().width > 0, "SVG item must render, not just exist in the DOM");
    const Pointer = (type, id, x, y, target = root) => target.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: id, pointerType: "touch", button: 0, clientX: x, clientY: y }));
    const rect = root.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    Pointer("pointerdown", 1, x, y, circle);
    Pointer("pointermove", 1, x + 2, y + 1);
    Pointer("pointerup", 1, x + 2, y + 1);
    Assert(app.Activations.length === 1, "Short press activates once");
    Pointer("pointerdown", 1, x, y, circle);
    Pointer("pointermove", 1, x + 20, y);
    Pointer("pointerup", 1, x + 20, y);
    root.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, detail: 1 }));
    await Settle();
    Assert(app.Activations.length === 1 && app.state.Camera.X < 0, "Drag pans but does not activate");
    Assert(root === document.querySelector("#svg-view .ct-pan-zoom-view"), "Camera echo must preserve root identity");
    root.focus();
    root.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }));
    await Settle();
    const camera = { ...app.state.Camera };
    const wheelRect = root.getBoundingClientRect();
    const wheel = new WheelEvent("wheel", { deltaY: -100, clientX: wheelRect.left + wheelRect.width * 0.65, clientY: wheelRect.top + wheelRect.height * 0.3, bubbles: true, cancelable: true });
    const px = wheel.clientX - wheelRect.left - root.clientLeft;
    const py = wheel.clientY - wheelRect.top - root.clientTop;
    const world = { X: camera.X + (px - root.clientWidth / 2) / camera.Zoom, Y: camera.Y + (py - root.clientHeight / 2) / camera.Zoom };
    root.dispatchEvent(wheel);
    await Settle();
    Assert(Near(world.X, app.state.Camera.X + (px - root.clientWidth / 2) / app.state.Camera.Zoom), "Wheel keeps pointer world X fixed");
    Assert(Near(world.Y, app.state.Camera.Y + (py - root.clientHeight / 2) / app.state.Camera.Zoom), "Wheel keeps pointer world Y fixed");
    for (let repeat = 0; repeat < 3; repeat++) {
      const before = app.state.Camera.Zoom;
      Pointer("pointerdown", 1, x - 50, y);
      Pointer("pointerdown", 2, x + 50, y);
      Pointer("pointermove", 2, x + 90, y);
      Pointer("pointerup", 2, x + 90, y);
      Pointer("pointermove", 1, x - 40, y + 10);
      Pointer("pointerup", 1, x - 40, y + 10);
      await Settle();
      Assert(app.state.Camera.Zoom > before, "Repeated pinch zooms and transitions back to pan");
    }

    Assert(app.Activations.length === 1, "Pinches do not activate");
    root.dispatchEvent(new KeyboardEvent("keydown", { key: "0", bubbles: true, cancelable: true }));
    await Settle();
    Assert(Near(app.state.Camera.X, 0) && Near(app.state.Camera.Y, 0), "Fit centres content");
    Assert(circle === root.querySelector("circle"), "Parent camera updates preserve SVG items");
    circle.focus();
    circle.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
    await Settle();
    Assert(app.Activations.length === 2, "Focusable SVG items support Enter");
    const beforeDraw = app.Draws;
    app.SetState({ Redraw: 1 });
    await Settle();
    Assert(app.Draws > beforeDraw, "Redraw requests a canvas frame");
    const canvas = document.querySelector("canvas");
    Assert(canvas.width >= app.LastSize.Width, "Canvas backing size accounts for device scale");
    app.Handle.CenterOn(70, 50, 1);
    await new Promise((resolve) => setTimeout(resolve, 240));
    await Settle();
    Assert(Near(app.state.Camera.X, 70) && Near(app.state.Camera.Y, 50), "CenterOn completes with a controlled parent echo");
    document.querySelector("#canvas-view").classList.add("small");
    await Settle();
    await Settle();
    Assert(app.LastSize.Height < 330, "ResizeObserver redraws a resized canvas");
    document.querySelector("#result").textContent = "PASS: SVG namespace, identity, threshold, activation, wheel anchor, keyboard, pinch, controlled CenterOn, canvas redraw and resize.";
    document.querySelector("#result").dataset.status = "passed";
  } catch (error) {
    document.querySelector("#result").textContent = error.stack;
    document.querySelector("#result").dataset.status = "failed";
    console.error(error);
  }
});
