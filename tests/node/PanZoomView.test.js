import assert from "node:assert/strict";
import test from "node:test";
import { PanZoomViewComponent, PanZoomView } from "../../src/components/PanZoomView.js";
import { ValidateBounds, FitCamera, CameraLimits, ClampCamera, WorldPoint, ZoomCamera } from "../../src/utils/PanZoomCamera.js";

const bounds = { MinX: -1000, MinY: -800, MaxX: 1000, MaxY: 800 };
const size = { Width: 800, Height: 400 };
const CreateControl = (props = {}) => {
  const control = new PanZoomViewComponent({ Label: "Diagram", Bounds: bounds, MinZoom: 0.01, ...props });
  control._size = size;
  control._camera = { X: 0, Y: 0, Zoom: 1 };
  control.QueueFrame = () => {};

  control._root = { clientLeft: 0, clientTop: 0, contains: () => true, focus: () => {}, getBoundingClientRect: () => ({ left: 0, top: 0 }) };
  control._rect = { left: 0, top: 0 };

  return control;
};

test("PanZoomView factory, bounds, cameras and zoom limits have a single validated contract", () => {
  assert.equal(PanZoomView().tag, PanZoomViewComponent);
  for (const value of [null, {}, { ...bounds, MaxX: -1000 }, { ...bounds, MinY: NaN }]) assert.throws(() => ValidateBounds(value), /Bounds/);
  for (const value of [
    { X: NaN, Y: 0, Zoom: 1 },
    { X: 0, Y: 0, Zoom: 0 },
  ])
    assert.throws(() => ClampCamera(value, bounds, size, { Min: 0.1, Max: 4 }), /Camera/);
  assert.throws(() => CameraLimits(bounds, size, 5, 4), /limits/);
  assert.deepEqual(FitCamera(bounds, size), { X: 0, Y: 0, Zoom: 0.25 });
  assert.deepEqual(CameraLimits(bounds, size), { Min: 0.25, Max: 4 });
});

test("cursor zoom preserves the world point beneath an off-centre pointer", () => {
  const camera = { X: 123, Y: -42, Zoom: 0.6 };
  const point = { X: 670, Y: 85 };
  const world = WorldPoint(point, camera, size);
  const zoomed = ZoomCamera(camera, 1.4, point, size);
  assert.ok(Math.abs(WorldPoint(point, zoomed, size).X - world.X) < 1e-10);
  assert.ok(Math.abs(WorldPoint(point, zoomed, size).Y - world.Y) < 1e-10);
});

test("clamping preserves twenty percent overlap on each axis at both small and large zoom", () => {
  for (const zoom of [0.01, 1, 4]) {
    const camera = ClampCamera({ X: 1e8, Y: -1e8, Zoom: zoom }, bounds, size, { Min: 0.01, Max: 4 });
    const width = size.Width / camera.Zoom;
    const height = size.Height / camera.Zoom;
    assert.ok(camera.X - width / 2 <= bounds.MaxX - Math.min(width, 2000) * 0.2 + 1e-8);
    assert.ok(camera.Y + height / 2 >= bounds.MinY + Math.min(height, 1600) * 0.2 - 1e-8);
  }
});

test("keyboard pans ten percent, zooms and fits without consuming unrelated controls", () => {
  const control = CreateControl();
  const target = { closest: () => null };
  control._root = Object.assign(control._root, target);
  let prevented = 0;
  const Press = (key, extra = {}) => control.KeyDown({ key, target: control._root, preventDefault: () => prevented++, ...extra });
  Press("ArrowRight");
  assert.equal(control._camera.X, 80);
  Press("+");
  assert.equal(control._camera.Zoom, 1.25);
  Press("0");
  assert.deepEqual(control._camera, FitCamera(bounds, size));
  Press("Tab");
  Press("ArrowLeft", { ctrlKey: true });
  assert.equal(prevented, 3);
});

test("drag threshold, click suppression and pinching are separate from item activation", () => {
  const activated = [];
  const control = CreateControl({ OnItemActivate: (id) => activated.push(id) });
  const target = { closest: (selector) => (selector === "[data-ct-item]" ? { getAttribute: () => "node" } : null) };
  const Event = (type, id, x, y) => ({ type, pointerId: id, clientX: x, clientY: y, button: 0, target });
  control.PointerDown(Event("pointerdown", 1, 100, 100));
  control.PointerMove(Event("pointermove", 1, 102, 101));
  assert.equal(control._camera.X, 0);
  control.PointerEnd(Event("pointerup", 1, 102, 101));
  assert.deepEqual(activated, ["node"]);
  control.PointerDown(Event("pointerdown", 1, 100, 100));
  control.PointerMove(Event("pointermove", 1, 110, 100));
  control.PointerEnd(Event("pointerup", 1, 110, 100));
  assert.equal(control._camera.X, -10);
  assert.deepEqual(activated, ["node"]);
  control.PointerDown(Event("pointerdown", 1, 200, 200));
  control.PointerDown(Event("pointerdown", 2, 400, 200));
  control.PointerMove(Event("pointermove", 2, 600, 200));
  assert.equal(control._camera.Zoom, 2);
  control.PointerEnd(Event("pointerup", 2, 600, 200));
  control.PointerEnd(Event("pointerup", 1, 200, 200));
  assert.deepEqual(activated, ["node"]);
});

test("canvas hit testing receives world coordinates and keyboard activation handles zero identifiers", () => {
  const hits = [];
  const activated = [];
  const control = CreateControl({
    Draw: () => {},
    HitTest: (x, y) => {
      hits.push([x, y]);

      return 0;
    },
    OnItemActivate: (id) => activated.push(id),
  });
  const target = { closest: () => null };
  assert.equal(control.FindItem({ target, clientX: 450, clientY: 250 }), 0);
  assert.deepEqual(hits, [[50, 50]]);
  control.Click({ target, detail: 0, clientX: 450, clientY: 250 });
  assert.deepEqual(activated, [0]);
});

test("cancelled pointers and lost capture cannot later activate a stale item", () => {
  const activated = [];
  const control = CreateControl({ OnItemActivate: (id) => activated.push(id) });
  const target = { closest: (selector) => (selector === "[data-ct-item]" ? { getAttribute: () => "node" } : null) };
  const event = { pointerId: 1, clientX: 100, clientY: 100, button: 0, target };
  control.PointerDown(event);
  control.PointerEnd({ ...event, type: "pointercancel" });
  control.PointerEnd({ ...event, type: "pointerup" });
  assert.deepEqual(activated, []);
  assert.equal(control._pointers.size, 0);
});
