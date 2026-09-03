import assert from "node:assert/strict";
import test from "node:test";
import { ImageCarousel } from "../../src/Index.js";
import { ImageCarouselComponent } from "../../src/components/ImageCarousel.js";
import { CarouselImages } from "../fixtures/CarouselImages.js";

const CreateControl = (props = {}) => {
  const control = new ImageCarouselComponent({ Images: CarouselImages, ...props });
  control.SetState = (update) => { control.state = { ...control.state, ...update }; };
  return control;
};

test("ImageCarousel is public, starts at a clamped index, and handles empty or invalid images", () => {
  assert.equal(ImageCarousel().tag, ImageCarouselComponent);
  for (const [InitialIndex, expected] of [[undefined, 0], [2, 2], [99, 2], [-1, 0], [NaN, 0], [1.5, 0]]) {
    assert.equal(CreateControl({ InitialIndex }).GetActiveIndex(), expected);
  }
  for (const Images of [[], null, {}, [null, {}, { Src: "  " }, { Src: 42 }]]) {
    const control = CreateControl({ Images });
    control.MoveImage(1);
    control.SelectImage(1);
    assert.equal(control.GetActiveIndex(), 0);
    assert.match(JSON.stringify(control.Render()), /No images to display/);
  }
});

test("navigation loops by default, clamps when disabled, and notifies only on a real selection", () => {
  const calls = [];
  const control = CreateControl({ OnChange: (...args) => calls.push(args) });
  control.MoveImage(-1);
  assert.equal(control.state.Index, 2);
  control.MoveImage(1);
  assert.equal(control.state.Index, 0);
  control.SelectImage(0);
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[0], [2, CarouselImages[2]]);
  control.props.Loop = false;
  control.MoveImage(-1);
  assert.equal(calls.length, 2);
  control.SelectImage(2);
  control.MoveImage(1);
  assert.equal(calls.length, 3);
  control.props.Images = [CarouselImages[0]];
  control.ComponentOnUpdate();
  assert.equal(control.state.Index, 0);
  control.props.Images = CarouselImages;
  assert.equal(control.state.Index, 0, "Restoring a list must not restore an out-of-range stale index");
});

test("keyboard controls respect modifiers and do not handle unrelated keys", () => {
  const control = CreateControl();
  let prevented = 0;
  const Press = (key, extra = {}) => control.HandleKeyDown({ key, preventDefault: () => { prevented++; }, ...extra });
  Press("ArrowRight");
  assert.equal(control.state.Index, 1);
  Press("End");
  assert.equal(control.state.Index, 2);
  Press("Home");
  assert.equal(control.state.Index, 0);
  Press("ArrowLeft");
  assert.equal(control.state.Index, 2);
  for (const flag of ["ctrlKey", "altKey", "metaKey", "defaultPrevented"]) Press("ArrowRight", { [flag]: true });
  Press("Tab");
  assert.equal(prevented, 4);
  assert.equal(control.state.Index, 2);
});

test("swipes require a primary pointer, enough horizontal movement, and the same image", () => {
  const control = CreateControl();
  const Start = (extra = {}) => control.HandlePointerDown({ isPrimary: true, button: 0, pointerId: 1, clientX: 200, clientY: 100, ...extra });
  const End = (clientX, clientY = 100) => control.HandlePointerUp({ pointerId: 1, clientX, clientY });
  Start(); End(100);
  assert.equal(control.state.Index, 1);
  Start(); End(300);
  assert.equal(control.state.Index, 0);
  Start(); End(180);
  Start(); End(100, 300);
  Start({ button: 2 }); End(100);
  Start({ isPrimary: false }); End(100);
  Start(); control._pointerEvents.pointercancel(); End(100);
  Start(); control._pointerEvents.lostpointercapture(); End(100);
  assert.equal(control.state.Index, 0);
  Start(); control.SelectImage(2); End(100);
  assert.equal(control.state.Index, 2, "Do not finish an old gesture against a replacement image");
});

test("image errors are local, safe, and clear when changing slides", () => {
  const control = CreateControl();
  const image = { complete: true, naturalWidth: 0, getAttribute: () => CarouselImages[0].Src };
  control._root = { querySelector: () => image };
  control.HandleImageError({ target: {} });
  assert.equal(control.state.FailedSource, null);
  control.HandleImageError({ target: image });
  assert.match(JSON.stringify(control.Render()), /Image unavailable/);
  control.SelectImage(1);
  control.HandleImageError({ target: image });
  assert.equal(control.state.FailedSource, null, "A late failure from another source must be ignored");
  const view = control.RenderImage({ Src: "image.png", Alt: '<script>alert(1)</script>', Caption: "caption" });
  assert.ok(!view.props.strings.join("").includes("<script>"));
  assert.ok(view.props.values.some((value) => value.name === "alt" && value.value.includes("<script>")));
});

test("unmount removes all instance listeners and gesture state", () => {
  const added = [];
  const removed = [];
  const viewport = {
    addEventListener: (...args) => added.push(args),
    removeEventListener: (...args) => removed.push(args)
  };
  const root = {
    querySelector: (selector) => selector === ".ct-image-carousel-viewport" ? viewport : null,
    addEventListener: (...args) => added.push(args),
    removeEventListener: (...args) => removed.push(args)
  };
  const control = CreateControl();
  control.vnode = { dom: root };
  control.ComponentOnMount();
  control._gesture = {};
  control.ComponentOnUnmount();
  assert.deepEqual(removed, added);
  assert.equal(control._gesture, null);
  assert.equal(control._root, null);
  assert.equal(control._viewport, null);
});

test("both distributions render the same carousel and preserve its navigation", async () => {
  for (const file of ["ctframework.bundle.js", "ctframework.bundle.min.js"]) {
    const bundle = await import(`../../dist/${file}`);
    const props = { Images: CarouselImages, InitialIndex: 1, Loop: false, Fit: "cover", Indicators: false };
    const bundled = new (bundle.ImageCarousel(props).tag)(props);
    assert.deepEqual(JSON.parse(JSON.stringify(bundled.Render())), JSON.parse(JSON.stringify(CreateControl(props).Render())));
    bundled.SetState = (update) => { bundled.state = { ...bundled.state, ...update }; };
    bundled.MoveImage(1);
    assert.equal(bundled.state.Index, 2);
  }
});
