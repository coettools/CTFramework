import CT, { ApplicationLayout, Component } from "../../../dist/ctframework.bundle.min.js";
import { PalettePage } from "./pages/PalettePage.js";

const html = CT.Html;

export class App extends Component {
  ComponentOnMount() {
    CT.Mount(PalettePage, "#palette-page");
  }

  ComponentOnUnmount() {
    CT.Unmount("#palette-page");
  }

  Render() {
    return ApplicationLayout({
      Header: html`<div class="preview-header">
        <a class="preview-brand" href="./index.html">CT<span>Framework</span><small>by coettools</small></a>
        <span class="lab-eyebrow">Design lab</span>
        <a href="../showcase/index.html" target="_blank" rel="noopener">Framework showcase</a>
      </div>`,
      Content: html`<div id="palette-page"></div>`
    });
  }
}
