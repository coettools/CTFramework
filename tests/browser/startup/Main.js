const variant = new URLSearchParams(location.search);
const { default: CT, Component, ApplicationLayout } = await import(variant.has("source") ? "../../../src/Index.js" : variant.has("debug") ? "../../../dist/ctframework.bundle.js" : "../../../dist/ctframework.bundle.min.js");
const html = CT.Html;
const counts = { Created: 0, Mounted: 0, Removed: 0 };
let child;
let app;

const Frame = async () => {
  await new Promise(requestAnimationFrame);
  await new Promise(requestAnimationFrame);
};

const Check = (condition, message) => {
  if (!condition) throw new Error(message);
  const item = document.createElement("li");
  item.textContent = `${message}: passed`;
  document.querySelector("#checks").append(item);
};

class Child extends Component {
  constructor(props) {
    super(props);
    this.state = { Count: 0, Text: "" };
    counts.Created++;
    child = this;
  }

  ComponentOnMount() {
    counts.Mounted++;
  }
  ComponentOnUnmount() {
    counts.Removed++;
  }

  Render() {
    return html`<section class="ct-panel">
      <p id="name">${this.props.Name}</p>
      <button id="increment" type="button" ${CT.On("click", () => this.SetState((state) => ({ Count: state.Count + 1 })))}>Count: ${this.state.Count}</button>
      <label>Child notes<input id="notes" ${CT.Attr("value", this.state.Text)} ${CT.On("input", (event) => this.SetState({ Text: event.currentTarget.value }))} /></label>
    </section>`;
  }
}

class App extends Component {
  constructor(props) {
    super(props);
    app = this;
    this.state = { Name: props.Name, Visible: true };
  }

  Render() {
    return ApplicationLayout({
      Header: html`<header>
        <button id="parent" type="button" ${CT.On("click", () => this.SetState({ Name: this.state.Name === "Ada" ? "Grace" : "Ada" }))}>Update parent</button>
        <button id="toggle" type="button" ${CT.On("click", () => this.SetState({ Visible: !this.state.Visible }))}>Toggle child</button>
      </header>`,
      Content: this.state.Visible ? CT.View({ Component: Child, Props: { Name: this.state.Name } }) : null,
    });
  }
}

try {
  const root = await CT.Start({ App, Target: "#app", Props: { Name: "Ada" } });
  Check(root === document.querySelector("#app").firstElementChild, "Start resolves the mounted root");
  Check(counts.Created === 1 && counts.Mounted === 1, "View creates and mounts its child once");
  const original = child;
  const button = document.querySelector("#increment");
  button.click();
  button.click();
  await Frame();
  Check(child.state.Count === 2 && button.textContent === "Count: 2", "Child clicks update their own view");

  const input = document.querySelector("#notes");
  input.focus();
  for (const text of ["a", "ab", "abc"]) {
    input.value = text;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await Frame();
  }

  app.SetState({ Name: "Grace" });
  await Frame();
  Check(child === original && child.state.Count === 2 && document.querySelector("#name").textContent === "Grace", "Parent props update without replacing child state");
  Check(input === document.querySelector("#notes") && document.activeElement === input && input.value === "abc", "Typing and parent updates preserve the input and focus");

  app.SetState({ Visible: false });
  await Frame();
  Check(counts.Removed === 1 && !document.querySelector("#increment"), "Removing the child runs cleanup");
  app.SetState({ Visible: true });
  await Frame();
  Check(child !== original && child.state.Count === 0 && counts.Mounted === 2, "Returning creates a fresh child");
  CT.Unmount("#app");
  Check(counts.Removed === 2, "Unmounting the app cleans up its child");

  class Broken extends Component {
    constructor() {
      super();
      throw new Error("Expected startup test failure");
    }
  }
  const fallback = await CT.Start({ App: Broken, Target: "#failure" });
  Check(fallback?.getAttribute("role") === "alert" && fallback.textContent.includes("Expected startup test failure"), "Constructor failures display a useful fallback");
  Check((await CT.Start({ App, Target: "#missing" })) === null, "A missing target does not overwrite the page");
  Check(document.querySelectorAll("#ctframework-default-styles").length === 1, "Default CSS is added once");
  document.querySelector("#failure").replaceChildren();
  await CT.Start({ App, Props: { Name: "Ada" } });
  document.querySelector("#result").textContent = "All checks passed. Try the controls below.";
  document.body.dataset.result = "passed";
} catch (error) {
  document.querySelector("#result").textContent = `FAILED: ${error.message}`;
  document.body.dataset.result = "failed";
  console.error(error);
}
