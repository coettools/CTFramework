const variant = new URLSearchParams(location.search);
const modulePath = variant.has("source") ? "../../../src/Index.js" : variant.has("readable") ? "../../../dist/ctframework.bundle.js" : "../../../dist/ctframework.bundle.min.js";
const { default: CT, ApplicationLayout, Component, SideNavigation, SplitLayout } = await import(modulePath);
const html = CT.Html;

const Assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const Settle = async () => {
  for (let frame = 0; frame < 5; frame++) await new Promise(requestAnimationFrame);
};

class Inventory extends Component {
  constructor(props) {
    super(props);
    this.state = { Expanded: true };
  }

  Render() {
    return html`<div>
      <h2>Inventory</h2>
      <button type="button" id="records" ${CT.On("click", () => this.SetState({ Expanded: !this.state.Expanded }))}>${this.state.Expanded ? "Show fewer items" : "Show all items"}</button>
      <ul class="fixture-side-records">
        ${Array.from({ length: this.state.Expanded ? 120 : 1 }, (_, index) => html`<li>Item ${index + 1}</li>`)}
      </ul>
    </div>`;
  }
}

class Fixture extends Component {
  constructor(props) {
    super(props);
    this.state = { Order: "side-first", Position: "start", Threshold: "64rem" };
  }

  Render() {
    const header = html`<div>
      <h1>SplitLayout checks</h1>
      <p id="result" role="status">Checking layout…</p>
      <div class="fixture-actions">
        <button type="button" id="order" ${CT.On("click", () => this.SetState({ Order: this.state.Order === "side-first" ? "main-first" : "side-first" }))}>Reverse reading order</button>
        <button type="button" id="position" ${CT.On("click", () => this.SetState({ Position: this.state.Position === "start" ? "end" : "start" }))}>Switch side position</button>
      </div>
    </div>`;
    const main = html`<div class="fixture-editor">
      <h2>Editor</h2>
      <label>Item note <input id="draft" /></label>
      <canvas width="1800" height="80" aria-label="Wide preview"></canvas>
    </div>`;

    return ApplicationLayout({
      Header: header,
      Footer: "Inventory editor",
      SideNavigation: SideNavigation({ Title: "Workspace navigation", Items: [{ Id: "editor", Label: "Inventory editor" }], ActiveId: "editor" }),
      Content: html`<div class="fixture-frame">
        ${SplitLayout({
          Side: CT.View({ Component: Inventory }),
          Main: main,
          Label: { Side: "Inventory", Main: "Editor" },
          Sticky: true,
          StackBelow: this.state.Threshold,
          StackOrder: this.state.Order,
          SidePosition: this.state.Position,
          SideWidth: { Min: "7rem", Max: "12rem" },
        })}
      </div>`,
    });
  }
}

const Check = async (app) => {
  const root = document.querySelector(".ct-split-layout");
  const side = root.querySelector(".ct-split-layout-side");
  const main = root.querySelector(".ct-split-layout-main");
  const frame = root.parentElement;
  const content = frame.parentElement;
  const navigation = document.querySelector(".ct-side-navigation-toggle");
  const input = main.querySelector("#draft");
  const records = side.querySelector("#records");
  const stacked = () => root.hasAttribute("data-stacked");
  const width = () => root.getBoundingClientRect().width;
  const threshold = async (value) => {
    app.SetState({ Threshold: value });
    await Settle();
  };

  // Exercise a two-column layout even on a phone, where the scrollport is the document.
  await threshold("0px");
  Assert(getComputedStyle(main).containerType === "inline-size" && getComputedStyle(main).minWidth === "0px", "Main must expose a shrinkable query container.");
  Assert(main.scrollWidth > main.clientWidth && document.documentElement.scrollWidth <= document.documentElement.clientWidth, "The wide canvas must scroll inside Main.");
  Assert(side.localName === "aside" && side.getAttribute("aria-label") === "Inventory" && side.tabIndex === 0, "The tall side must be a named, focusable aside.");
  const desktop = getComputedStyle(content).overflowY === "auto";
  const scrollport = desktop ? content : document.scrollingElement;
  const padding = () => (desktop ? parseFloat(getComputedStyle(content).paddingTop) + parseFloat(getComputedStyle(content).paddingBottom) : 0);
  const checkHeight = () => Assert(Math.abs(parseFloat(getComputedStyle(side).maxHeight) - (scrollport.clientHeight - padding() - 8)) < 1, "Side height must follow the current scrollport's usable box and sticky inset.");
  checkHeight();
  scrollport.scrollTop = root.getBoundingClientRect().top + scrollport.scrollTop + 150;
  await Settle();
  const stickyTop = (desktop ? content.getBoundingClientRect().top + content.clientTop + parseFloat(getComputedStyle(content).paddingTop) : 0) + 8;
  Assert(Math.abs(side.getBoundingClientRect().top - stickyTop) < 2, "Side must stick eight pixels inside the active scrollport.");
  const outerScroll = scrollport.scrollTop;
  side.focus({ preventScroll: true });
  side.scrollTop = side.scrollHeight;
  Assert(side.scrollTop > 0 && scrollport.scrollTop === outerScroll, "The last inventory item must be independently reachable.");
  side.scrollTop = 0;
  scrollport.scrollTop = 0;

  if (desktop) {
    const header = document.querySelector(".ct-application-layout-header");
    const before = content.clientHeight;
    header.style.paddingBottom = "3rem";
    await Settle();
    Assert(content.clientHeight < before, "Growing the header must shrink the content scrollport.");
    checkHeight();
    header.style.removeProperty("padding-bottom");
    await Settle();
    checkHeight();
  }

  frame.style.overflowY = "auto";
  frame.style.height = "260px";
  await Settle();
  // Discover a nearer scrollport after its overflow changes without changing the split width.
  app.ForceUpdate();
  await Settle();
  for (const height of [260, 320]) {
    frame.style.height = `${height}px`;
    await Settle();
    Assert(parseFloat(getComputedStyle(side).maxHeight) === frame.clientHeight - 8, "A resized nested scrollport must supply the side height.");
  }

  frame.style.removeProperty("overflow-y");
  frame.style.removeProperty("height");
  app.ForceUpdate();
  await Settle();
  checkHeight();
  for (let cycle = 0; cycle < 2; cycle++) {
    records.click();
    await Settle();
    Assert(side.querySelectorAll("li").length === 1 && !side.hasAttribute("tabindex") && side.scrollHeight <= side.clientHeight, "Shortening the managed child alone must remove the scroll tab stop.");
    records.click();
    await Settle();
    Assert(side.querySelectorAll("li").length === 120 && side.tabIndex === 0 && side.scrollHeight > side.clientHeight, "Growing the managed child alone must restore the scroll tab stop.");
  }

  input.focus();
  input.value = "Draft item";
  for (const order of ["main-first", "side-first"]) {
    app.SetState({ Order: order });
    await Settle();
    Assert(root.firstElementChild === (order === "main-first" ? main : side), "DOM order must follow StackOrder in both modes.");
    Assert(document.activeElement === input && input.value === "Draft item" && main.querySelector("#draft") === input && side.querySelector("#records") === records, "Changing reading order must preserve focus, draft and child nodes.");
  }

  const startLeft = side.getBoundingClientRect().left < main.getBoundingClientRect().left;
  frame.dir = "rtl";
  Assert(startLeft && side.getBoundingClientRect().left > main.getBoundingClientRect().left, "Logical start must follow the layout direction.");
  app.SetState({ Position: "end" });
  await Settle();
  Assert(side.getBoundingClientRect().left < main.getBoundingClientRect().left && root.firstElementChild === side, "Logical end in RTL must keep DOM reading order.");
  frame.dir = "ltr";
  Assert(side.getBoundingClientRect().left > main.getBoundingClientRect().left, "Logical end must place the side on the right in LTR.");
  frame.removeAttribute("dir");

  const boundary = Math.floor(width()) - 32;
  frame.style.width = `${boundary}px`;
  await threshold(`${boundary}px`);
  Assert(!stacked(), "An exact threshold match must keep both columns.");
  frame.style.width = `${boundary - 1}px`;
  await Settle();
  Assert(stacked() && getComputedStyle(side).position === "static" && getComputedStyle(side).maxHeight === "none" && !side.hasAttribute("tabindex"), "One pixel below the threshold must release the side.");
  app.SetState({ Order: "main-first" });
  await Settle();
  Assert(root.firstElementChild === main && main.getBoundingClientRect().bottom <= side.getBoundingClientRect().top, "The stacked visual order must follow its DOM order.");
  frame.style.removeProperty("width");
  await Settle();
  if (desktop) {
    const expanded = width();
    navigation.click();
    await Settle();
    const collapsed = width();
    Assert(collapsed > expanded, "Collapsing the navigation must make the split wider.");
    await threshold(`${(expanded + collapsed) / 2}px`);
    for (let cycle = 0; cycle < 2; cycle++) {
      navigation.click();
      await Settle();
      Assert(stacked(), "Expanding the navigation must stack the panels.");
      navigation.click();
      await Settle();
      Assert(!stacked(), "Collapsing the navigation must restore both columns.");
    }

    navigation.click();
  }

  app.SetState({ Threshold: "64rem", Position: "start", Order: "side-first" });
  await Settle();
  if (window.innerWidth === 390) Assert(stacked() && !side.hasAttribute("tabindex"), "The default layout must stack at a 390px viewport.");
  scrollport.scrollTop = 0;
  document.querySelector("#result").textContent = "SplitLayout checks passed.";
};

CT(async () => {
  const app = new Fixture();
  CT.Mount(app, "#app");
  await Settle();

  try {
    await Check(app);
  } catch (error) {
    document.querySelector("#result").textContent = `SplitLayout check failed. ${error.message}`;
    throw error;
  }
});
