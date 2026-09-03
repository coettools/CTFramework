import { Component } from "./Component.js";
import { CreateComponent } from "./ComponentFactory.js";
import { CT } from "../CTFramework.js";
import { GetCodeLanguage, GetCodeLines } from "../utils/CodeHighlight.js";

const html = CT.Html;
const LanguageLabels = { javascript: "JavaScript", html: "HTML", css: "CSS", json: "JSON", text: "Plain text" };

export class CodeBlockComponent extends Component {
  constructor(props = {}) {
    super(props);
    this.state = { Wrap: props.Wrap ?? false, IsCopying: false, CopiedCode: null, CopyErrorCode: null };
    this._code = null;
    this._language = null;
    this._lines = [];
    this._disposed = false;
  }

  ToggleWrap() {
    this.SetState((state) => ({ Wrap: !state.Wrap }));
  }

  async CopyCode() {
    if (this.state.IsCopying) return;
    const code = String(this.props.Code ?? "");
    this.SetState({ IsCopying: true, CopiedCode: null, CopyErrorCode: null });
    try {
      if (!globalThis.navigator?.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await globalThis.navigator.clipboard.writeText(code);
      if (!this._disposed) this.SetState({ IsCopying: false, CopiedCode: code });
    } catch {
      if (!this._disposed) this.SetState({ IsCopying: false, CopyErrorCode: code });
    }
  }

  ComponentOnUnmount() {
    this._disposed = true;
  }

  RenderLine(line, index) {
    const tokens = line.map((token) => token.Type === "plain"
      ? token.Text
      : html`<span ${CT.Attr("className", `ct-code-token-${token.Type}`)}>${token.Text}</span>`);
    const newline = index < this._lines.length - 1 ? "\n" : "";
    return html`<span class="ct-code-line"><span class="ct-code-number" aria-hidden="true" ${CT.Attr("data-line", index + 1)}></span><span class="ct-code-text">${tokens}${newline}</span></span>`;
  }

  Render() {
    const { Title = "", Language = "javascript", LineNumbers = true, Copy = true } = this.props;
    const code = String(this.props.Code ?? "");
    const language = GetCodeLanguage(Language);
    if (code !== this._code || language !== this._language) {
      this._code = code;
      this._language = language;
      this._lines = GetCodeLines(code, language);
    }
    const message = this.state.CopyErrorCode === code
      ? "Copy unavailable. Select the code and copy it manually."
      : this.state.CopiedCode === code ? "Copied" : "";

    return html`
      <section ${CT.Attr("className", `ct-code-block${this.state.Wrap ? " is-wrapped" : ""}${LineNumbers ? " has-line-numbers" : ""}`)}>
        <header class="ct-code-toolbar">
          <div class="ct-code-caption">
            ${Title ? html`<strong class="ct-code-title">${Title}</strong>` : null}
            <span class="ct-code-language">${LanguageLabels[language]}</span>
          </div>
          <div class="ct-code-actions">
            <button type="button" class="ct-button-secondary" aria-label="Wrap lines"
              ${CT.Attr("aria-pressed", String(this.state.Wrap))}
              ${CT.On("click", () => this.ToggleWrap())}>Wrap</button>
            ${Copy ? html`<button type="button" class="ct-button-secondary" aria-label="Copy code"
              ${CT.Attr("disabled", this.state.IsCopying)}
              ${CT.On("click", () => this.CopyCode())}>Copy</button>` : null}
          </div>
        </header>
        <pre class="ct-code-viewport" tabindex="0" role="region" ${CT.Attr("aria-label", Title || `${LanguageLabels[language]} code`)}><code class="ct-code-source">${this._lines.map((line, index) => this.RenderLine(line, index))}</code></pre>
        <div class="ct-code-feedback" role="status" aria-live="polite">${Copy ? message : ""}</div>
      </section>
    `;
  }
}

export const CodeBlock = (options = {}) => CreateComponent(CodeBlockComponent, options);
