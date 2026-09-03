import CT, { Component, Dropdown } from "../../../dist/ctframework.bundle.min.js";

const html = CT.Html;
const Assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};
const Update = async (app, state) => {
  app.SetState(state);
  await Promise.resolve();
  await new Promise(requestAnimationFrame);
};

class RenderingChecks extends Component {
  constructor(props) {
    super(props);
    this.state = { Value: "production", Options: ["development", "production"], Text: "" };
  }

  Render() {
    return html`
      <section class="ct-panel">
        ${Dropdown({
          Id: "environment",
          Label: "Environment",
          Value: this.state.Value,
          Options: this.state.Options,
          OnChange: (value) => this.SetState({ Value: value })
        })}
        <label>Notes<input id="notes" ${CT.Attr("value", this.state.Text)} ${CT.On("input", (event) => this.SetState({ Text: event.target.value }))}></label>
        <p>Selected: ${this.state.Value}</p>
        <p>Notes: ${this.state.Text}</p>
      </section>
    `;
  }
}

CT(async () => {
  const result = document.querySelector("#result");
  try {
    const app = new RenderingChecks();
    CT.Mount(app, "#app");
    const select = document.querySelector("#environment");
    Assert(select.value === "production", "Initial value must select a dynamically rendered option.");
    await Update(app, { Value: "staging", Options: ["staging", "preview"] });
    Assert(select.value === "staging", "New options must exist before applying an updated value.");
    Assert(select === document.querySelector("#environment"), "Updates must preserve the select element.");
    await Update(app, { Value: 0, Options: [{ Value: 0, Label: "Zero" }, { Value: 1, Label: "One" }] });
    Assert(select.value === "0", "Numeric zero must remain selectable.");
    await Update(app, { Value: "production", Options: ["development", "production"] });
    result.textContent = "4 rendering checks passed. Try changing the environment and typing notes.";
  } catch (error) {
    result.textContent = `FAILED: ${error.message}`;
    result.className = "ct-error";
    console.error(error);
  }
});
