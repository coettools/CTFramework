import CT, { CodeBlock, Component, Dialog, Dropdown } from "../../../dist/ctframework.bundle.min.js";
import { CSharpCode } from "../../fixtures/CSharpCode.js";

const html = CT.Html;
const Sample = '// A small helper\nconst Add = (left, right) => {\n  return left + right;\n};\n\nconsole.log(Add(2, 3));';
const UnsafeSample = '<script>alert("never execute")</script>\n<img src="missing" onerror="alert(1)">\n\n  <p>&amp; <strong>Keep this as text.</strong></p>\n';
const Assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const Settle = async () => {
  await Promise.resolve();
  await new Promise(requestAnimationFrame);
};

class CodeBlockChecks extends Component {
  constructor(props) {
    super(props);
    this.state = { Code: Sample, Language: "javascript", Count: 0, IsDialogOpen: false };
  }

  Render() {
    return html`
      <section class="ct-panel">
        <label>Source<textarea id="source" rows="7" ${CT.Attr("value", this.state.Code)}
          ${CT.On("input", (event) => this.SetState({ Code: event.target.value }))}></textarea></label>
        ${Dropdown({ Id: "language", Label: "Language", Value: this.state.Language, Options: ["javascript", "csharp", "html", "css", "json", "text"], OnChange: (value) => this.SetState({ Language: value }) })}
        <button type="button" ${CT.On("click", () => this.SetState({ Code: CSharpCode, Language: "csharp" }))}>Load C# example</button>
        <button type="button" ${CT.On("click", () => this.SetState({ IsDialogOpen: true }))}>Open code dialog</button>
        <p><button type="button" ${CT.On("click", () => this.SetState((state) => ({ Count: state.Count + 1 })))}>Update parent</button> Count: ${this.state.Count}</p>
        <div id="primary">${CodeBlock({ Title: "Example", Code: this.state.Code, Language: this.state.Language })}</div>
        <h2>Independent plain text</h2>
        <div id="secondary">${CodeBlock({ Title: "Output.txt", Code: "Build complete.\nNo errors.", Language: "text", Copy: false, LineNumbers: false, Wrap: true })}</div>
        <label>Paste copied source<textarea id="paste" rows="4"></textarea></label>
        ${Dialog({
          Open: this.state.IsDialogOpen,
          Title: "C# in a dialog",
          Content: CodeBlock({ Title: "Greeting.cs", Code: CSharpCode, Language: "csharp" }),
          OnClose: () => this.SetState({ IsDialogOpen: false })
        })}
      </section>
    `;
  }
}

CT(async () => {
  const result = document.querySelector("#result");
  try {
    const app = new CodeBlockChecks();
    CT.Mount(app, "#app");
    const viewport = document.querySelector("#primary pre");
    const source = document.querySelector("#source");
    Assert(viewport.textContent === Sample, "Displayed code must match supplied text, with no gutter numbers or added spaces.");
    Assert(document.querySelectorAll("#primary .ct-code-line").length === 6, "Blank lines must keep their line numbers.");
    Assert(document.querySelectorAll("#primary .ct-code-token-keyword").length > 0, "The production bundle must highlight code.");
    const wrap = document.querySelector('#primary button[aria-label="Wrap lines"]');
    wrap.click();
    await Settle();
    Assert(wrap.getAttribute("aria-pressed") === "true", "Wrap must toggle on.");
    app.SetState({ Count: 1 });
    await Settle();
    Assert(document.querySelector("#primary pre") === viewport && wrap.getAttribute("aria-pressed") === "true", "Parent updates must preserve the code region and wrapping state.");
    app.SetState({ Code: UnsafeSample, Language: "html" });
    await Settle();
    Assert(viewport.textContent === UnsafeSample, "HTML must remain literal text, including entities and final blank lines.");
    Assert(!viewport.querySelector("script, img, strong"), "HTML examples must never become executable DOM.");
    app.SetState({ Code: CSharpCode, Language: "csharp" });
    await Settle();
    Assert(viewport.textContent === CSharpCode && document.querySelector("#primary .ct-code-language").textContent === "C#", "C# source and caption must render from the production bundle.");
    Assert([...viewport.querySelectorAll(".ct-code-token-keyword")].some((token) => token.textContent === "public"), "C# keywords must use the default syntax colours.");
    Assert([...viewport.querySelectorAll(".ct-code-token-string")].some((token) => token.textContent === '$"Hello, {name}!"'), "C# interpolated strings must retain their prefix and contents.");
    app.SetState({ IsDialogOpen: true });
    await Settle();
    const dialog = document.querySelector(".ct-dialog").getBoundingClientRect();
    Assert(dialog.left >= 0 && dialog.right <= innerWidth, "Long code lines must not push the dialog outside the viewport.");
    app.SetState({ IsDialogOpen: false });
    await Settle();
    source.focus();
    app.SetState({ Code: Sample + "\n// Still typing", Language: "javascript" });
    await Settle();
    Assert(document.activeElement === source, "Updating code must not replace or blur the source field.");
    Assert(!document.querySelector('#secondary button[aria-label="Copy code"]'), "Copy can be disabled independently.");
    wrap.click();
    await Settle();
    Assert(document.querySelector("#secondary .is-wrapped"), "Toggling one block must not change another.");
    app.SetState({ Code: Sample });
    await Settle();
    source.blur();
    result.textContent = "14 checks passed. Try typing, changing language, Copy, Wrap, and Update parent.";
  } catch (error) {
    result.textContent = `FAILED: ${error.message}`;
    result.className = "ct-error";
    console.error(error);
  }
});
