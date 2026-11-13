const variant = new URLSearchParams(location.search);
const { default: CT, Component, Dialog, Popover } = await import(variant.has("source") ? "../../../src/Index.js" : variant.has("debug") ? "../../../dist/ctframework.bundle.js" : "../../../dist/ctframework.bundle.min.js");
const html = CT.Html;
const mount = document.querySelector("#app");
const Wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const Frame = async () => {
  await new Promise(requestAnimationFrame);
  await new Promise(requestAnimationFrame);
};

const Assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const Check = async (name, run) => {
  await run();
  const item = document.createElement("li");
  item.textContent = name;
  document.querySelector("#checks").append(item);
};

const Pointer = (element, type, pointerType = "mouse") => element.dispatchEvent(new PointerEvent(type, { pointerType, bubbles: !["pointerenter", "pointerleave"].includes(type), cancelable: true }));
const Escape = (element) => element.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
const Panel = (trigger) => trigger.closest(".ct-popover").querySelector(".ct-popover-panel");
const Host = (trigger) => trigger.closest(".ct-popover-trigger");
const IsOpen = (trigger) => Panel(trigger).matches(":popover-open") && trigger.getAttribute("aria-expanded") === "true";
const counts = { mounts: 0, unmounts: 0 };
const changes = [];

class Details extends Component {
  ComponentOnMount() {
    counts.mounts++;
  }

  ComponentOnUnmount() {
    counts.unmounts++;
  }

  Render() {
    return html`<article>
      <h2>Wool jacket</h2>
      <p>Wool lining with a windproof outer shell and two inside pockets.</p>
      <a href="#care">Care instructions</a>
    </article>`;
  }
}

class Example extends Component {
  Render() {
    return html`<section>
      <p id="hint">Winter clothing</p>
      <div class="scroll-card">
        ${Popover({
          Trigger: html`<button id="jacket" type="button" aria-describedby="hint" aria-expanded="false">Jacket</button>`,
          Content: CT.View({ Component: Details }),
          Label: "Jacket details",
          Placement: "right",
          Width: "22rem",
          OnOpenChange: (open) => changes.push(open),
        })}
      </div>
      ${Popover({ Trigger: html`<a id="care-link" href="#care">Fabric care</a>`, Content: html`<p>Wash wool by hand.</p>`, Label: "Washing instructions" })}
      ${Popover({ Trigger: html`<button type="button" id="size">Size guide</button>`, Open: "click", Content: html`<p>Measure around the chest. <button type="button">Centimetres</button></p>` })}
      <button type="button" id="outside">Continue</button>
      <button type="button" id="modal" ${CT.On("click", () => this.SetState({ Modal: true }))}>Compare sizes</button>
      ${Dialog({
        Open: Boolean(this.state.Modal),
        Title: "Compare sizes",
        OnClose: () => this.SetState({ Modal: false }),
        Content: Popover({ Trigger: html`<button type="button" id="measure">Measurements</button>`, Open: "click", Label: "Sleeve length", Content: html`<p>Measure from shoulder to wrist.</p>` }),
      })}
      <p id="care">Dry wool garments flat.</p>
    </section>`;
  }
}

try {
  const app = new Example();
  CT.Mount(app, mount);
  const jacket = mount.querySelector("#jacket");
  const link = mount.querySelector("#care-link");
  const size = mount.querySelector("#size");
  const outside = mount.querySelector("#outside");
  const card = Panel(jacket);
  await document.fonts.ready;
  await Frame();

  await Check("The closed trigger describes a short summary and has no mounted details", () => {
    const references = jacket.getAttribute("aria-describedby").split(/\s+/);
    Assert(references.includes("hint") && references.length === 2, "Original description lost");
    Assert(document.getElementById(references[1]).textContent === "Jacket details", "Rich panel used as the summary");
    Assert(counts.mounts === 0 && !card.querySelector("article"), "Closed content mounted early");
  });
  await Check("Hover waits, flips away from the edge and crosses the scroll card boundary", async () => {
    Pointer(Host(jacket), "pointerenter");
    Assert(!IsOpen(jacket), "Hover opened without delay");
    await Wait(220);
    await Frame();
    Assert(IsOpen(jacket) && counts.mounts === 1, "Hover failed to mount content");
    Assert(card.dataset.placement === "left", "Right edge failed to flip left");
    const bounds = card.getBoundingClientRect();
    const scrollBounds = jacket.closest(".scroll-card").getBoundingClientRect();
    Assert(bounds.left >= 7 && bounds.right <= document.documentElement.clientWidth - 7, "Panel overflows viewport");
    const x = bounds.left + 4;
    const y = bounds.bottom > scrollBounds.bottom + 3 ? bounds.bottom - 3 : bounds.top + 3;
    Assert((y > scrollBounds.bottom || y < scrollBounds.top) && card.contains(document.elementFromPoint(x, y)), "Panel is clipped outside the scroll card");
    Pointer(Host(jacket), "pointerleave");
    await Wait(50);
    Pointer(card, "pointerenter");
    await Wait(220);
    Assert(IsOpen(jacket), "Panel closed while crossing the trigger edge");
    Pointer(card, "pointerleave");
    await Wait(220);
    await Frame();
    Assert(!IsOpen(jacket) && counts.unmounts === 1, "Leaving failed to clean up content");
  });
  await Check("Hover ownership transfers once and Escape restores trigger focus", async () => {
    jacket.focus();
    await Frame();
    Assert(document.activeElement === jacket && IsOpen(jacket), "Hover stole focus");
    card.querySelector("a").focus();
    Pointer(Host(link), "pointerenter");
    await Wait(220);
    await Frame();
    Assert(IsOpen(link) && !IsOpen(jacket) && document.activeElement === jacket, "Hover handoff lost focus or left two panels");
    Escape(jacket);
    outside.focus();
    jacket.focus();
    await Frame();
    card.querySelector("a").focus();
    Escape(document.activeElement);
    await Frame();
    Assert(document.activeElement === jacket && !IsOpen(jacket), "Escape reopened the panel");
    Assert(JSON.stringify(changes) === JSON.stringify([true, false, true, false, true, false]), "Incorrect transition notifications");
  });
  await Check("A touch link previews on its first tap and an outside tap dismisses", async () => {
    Pointer(Host(link), "pointerenter", "touch");
    await Wait(200);
    Assert(!IsOpen(link), "Touch hover opened the panel");
    Pointer(link, "pointerdown", "touch");
    link.focus();
    Assert(!link.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })), "First touch followed the link");
    Assert(IsOpen(link), "First tap failed to open");
    Pointer(outside, "pointerdown", "touch");
    await Frame();
    Assert(!IsOpen(link), "Outside tap left the panel open");
  });
  await Check("Activation, Escape and native toggle keep dialog focus and state in sync", async () => {
    const panel = Panel(size);
    size.focus();
    size.click();
    await Frame();
    Assert(IsOpen(size) && panel.getAttribute("role") === "dialog" && document.activeElement === panel, "Dialog did not receive focus");
    size.click();
    Assert(!IsOpen(size) && document.activeElement === size, "Second activation did not close");
    size.click();
    await Frame();
    panel.hidePopover();
    await Wait(50);
    await Frame();
    Assert(size.getAttribute("aria-expanded") === "false" && document.activeElement === size && !panel.querySelector("button"), "Native dismissal failed to unmount content or return focus");
    size.click();
    Escape(panel);
    Assert(!IsOpen(size) && document.activeElement === size, "Escape failed to return focus");
  });
  await Check("A popover inside a modal takes the first Escape", async () => {
    mount.querySelector("#modal").click();
    await Frame();
    const modal = mount.querySelector("dialog:modal");
    const trigger = modal.querySelector("#measure");
    trigger.click();
    await Frame();
    const panel = Panel(trigger);
    const bounds = panel.getBoundingClientRect();
    Assert(IsOpen(trigger) && panel.contains(document.elementFromPoint(bounds.left + 5, bounds.top + 5)), "Panel did not receive modal hit testing");
    Assert(!Escape(panel) && modal.open && !IsOpen(trigger) && document.activeElement === trigger, "Inner Escape closed modal or lost focus");
    modal.querySelector("header button").click();
    await Frame();
  });
  await Check("Unmount restores trigger attributes, disposes open children and cancels pending hover", async () => {
    jacket.focus();
    Pointer(Host(link), "pointerenter");
    await Frame();
    CT.Unmount(mount);
    await Wait(220);
    Assert(counts.mounts === counts.unmounts && !document.querySelector(":popover-open"), "Unmount leaked content");
    Assert(jacket.getAttribute("aria-describedby") === "hint" && jacket.getAttribute("aria-expanded") === "false" && !jacket.hasAttribute("aria-controls"), "Unmount changed original attributes");
  });
  CT.Mount(new Example(), mount);
  document.querySelector("#result").textContent = `${document.querySelector("#checks").childElementCount} Popover checks passed. Try the controls below.`;
} catch (error) {
  document.querySelector("#result").textContent = `FAILED: ${error.message}`;
  console.error(error);
}
