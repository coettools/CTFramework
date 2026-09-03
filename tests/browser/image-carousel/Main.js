import CT, { Component, ImageCarousel } from "../../../dist/ctframework.bundle.min.js";
import { CarouselImages } from "../../fixtures/CarouselImages.js";

const html = CT.Html;
const BrokenImage = { Src: "data:image/png;base64,invalid", Alt: "Unavailable sample", Caption: "Missing image" };
const Assert = (condition, message) => { if (!condition) throw new Error(message); };
const Settle = async () => { await Promise.resolve(); await new Promise(requestAnimationFrame); };
const Until = async (predicate) => {
  for (let index = 0; index < 120; index++) {
    if (predicate()) return;
    await Settle();
  }
  throw new Error("Timed out waiting for an image update.");
};

class CarouselChecks extends Component {
  constructor(props) {
    super(props);
    this.state = { Images: CarouselImages, Loop: true, Fit: "contain", Indicators: true, Notes: "", LastChange: "No selection yet.", Updates: 0 };
  }

  Render() {
    return html`
      <section class="ct-panel">
        <div>
          <button type="button" ${CT.On("click", () => this.SetState({ Images: CarouselImages }))}>Show all images</button>
          <button type="button" ${CT.On("click", () => this.SetState({ Images: CarouselImages.slice(0, 1) }))}>Show one image</button>
          <button type="button" ${CT.On("click", () => this.SetState({ Images: [] }))}>Show empty gallery</button>
          <button type="button" ${CT.On("click", () => this.SetState({ Images: [BrokenImage, ...CarouselImages] }))}>Show broken image</button>
          <button type="button" ${CT.On("click", () => this.SetState((state) => ({ Loop: !state.Loop })))}>Toggle looping</button>
          <button type="button" ${CT.On("click", () => this.SetState((state) => ({ Indicators: !state.Indicators })))}>Toggle selectors</button>
          <button type="button" ${CT.On("click", () => this.SetState((state) => ({ Fit: state.Fit === "contain" ? "cover" : "contain" })))}>Toggle image fit</button>
        </div>
        <p id="settings">Loop: ${String(this.state.Loop)}. Fit: ${this.state.Fit}.</p>
        <label>Notes<input id="notes" ${CT.Attr("value", this.state.Notes)} ${CT.On("input", (event) => this.SetState({ Notes: event.target.value }))}></label>
        <p id="last-change">${this.state.LastChange}</p>
        <div id="primary">${ImageCarousel({
          Label: "Landscape gallery",
          Images: this.state.Images,
          Loop: this.state.Loop,
          Fit: this.state.Fit,
          Indicators: this.state.Indicators,
          OnChange: (index, image) => this.SetState({ LastChange: `Selected ${index + 1}: ${image.Caption}` })
        })}</div>
        <button type="button" ${CT.On("click", () => this.SetState((state) => ({ Updates: state.Updates + 1 })))}>Update parent</button>
        <p>Parent updates: ${this.state.Updates}</p>
        <h2>Independent single image</h2>
        <div id="secondary">${ImageCarousel({ Label: "Single image", Images: CarouselImages.slice(0, 1) })}</div>
      </section>
    `;
  }
}

CT(async () => {
  const result = document.querySelector("#result");
  try {
    const app = new CarouselChecks();
    CT.Mount(app, "#app");
    const root = document.querySelector("#primary .ct-image-carousel");
    const viewport = root.querySelector(".ct-image-carousel-viewport");
    const next = root.querySelector('[aria-label="Next image"]');
    const previous = root.querySelector('[aria-label="Previous image"]');
    const Count = () => root.querySelector(".ct-image-carousel-count").textContent;
    await Until(() => root.querySelector("img")?.naturalWidth > 0);
    Assert(Count() === "1 of 3" && root.querySelectorAll("img").length === 1, "Render just the current image.");
    next.focus(); next.click(); await Settle();
    Assert(Count() === "2 of 3" && document.activeElement === next, "Next keeps button focus and updates only the slide.");
    Assert(document.querySelector("#last-change").textContent === "Selected 2: Coastal dusk", "OnChange receives the selected index and image.");
    next.click(); await Settle(); next.click(); await Settle();
    Assert(Count() === "1 of 3", "Next wraps to the first image.");
    previous.click(); await Settle();
    Assert(Count() === "3 of 3", "Previous wraps to the last image.");
    viewport.focus();
    viewport.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true, cancelable: true }));
    await Settle();
    Assert(Count() === "1 of 3" && document.activeElement === viewport, "Keyboard navigation preserves viewer focus.");
    root.querySelector('[aria-label="Show image 2"]').click(); await Settle();
    Assert(Count() === "2 of 3" && root.querySelector('[aria-current="true"]').textContent === "2", "The selector marks the active image.");
    const notes = document.querySelector("#notes");
    notes.focus(); await app.SetState({ Notes: "Typing across a parent update" }); await Settle();
    Assert(document.activeElement === notes && root === document.querySelector("#primary .ct-image-carousel") && Count() === "2 of 3", "Parent changes preserve the input, carousel, and selection.");
    app.SetState({ Loop: false }); await Settle();
    root.querySelector('[aria-label="Show image 3"]').click(); await Settle();
    Assert(next.disabled && !previous.disabled, "Non-looping navigation disables the last Next button.");
    app.SetState({ Images: [] }); await Settle();
    Assert(root.textContent.includes("No images to display.") && getComputedStyle(root.querySelector(".ct-image-carousel-controls")).display === "none", "An empty gallery has no active navigation.");
    app.SetState({ Images: [BrokenImage, ...CarouselImages], Loop: true });
    await Until(() => root.textContent.includes("Image unavailable."));
    Assert(!root.querySelector("img"), "Broken images show a clean fallback.");
    next.click(); await Until(() => root.querySelector("img")?.naturalWidth > 0);
    Assert(Count() === "2 of 4", "A broken image does not prevent navigation to a working image.");
    app.SetState({ Images: CarouselImages.slice(0, 1) }); await Settle(); await Settle();
    Assert(Count() === "1 of 1" && getComputedStyle(root.querySelector(".ct-image-carousel-controls")).display === "none", "Shrinking to one image clamps the index and hides navigation.");
    app.SetState({ Images: CarouselImages }); await Settle();
    viewport.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 4, isPrimary: true, button: 0, clientX: 180, clientY: 50 }));
    viewport.dispatchEvent(new PointerEvent("pointerup", { pointerId: 4, isPrimary: true, button: 0, clientX: 60, clientY: 55 }));
    await Settle();
    Assert(Count() === "2 of 3" && document.querySelector("#secondary .ct-image-carousel-count").textContent === "1 of 1", "Swiping affects only its own carousel.");
    CT.Unmount("#app");
    Assert(!document.querySelector("#primary"), "The carousel unmounts cleanly.");
    CT.Mount(CarouselChecks, "#app");
    result.textContent = "15 checks passed. Try navigation, keyboard, swiping, changing images, and typing notes.";
  } catch (error) {
    result.textContent = `FAILED: ${error.message}`;
    result.className = "ct-error";
    console.error(error);
  }
});
