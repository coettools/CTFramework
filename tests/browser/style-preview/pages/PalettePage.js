import CT, { Component } from "../../../../dist/ctframework.bundle.min.js";
import { Accents, Designs, DescribeDesign, MatchDesign, Shapes, Surfaces } from "../Designs.js";
import { DirectionCard } from "../components/DirectionCard.js";
import { WorkspacePreview } from "../components/WorkspacePreview.js";

const html = CT.Html;

export class PalettePage extends Component {
  constructor(props) {
    super(props);
    this.state = { Selection: { Surface: "split", Accent: "original", Shape: "hybrid" }, Pinned: null };
  }

  ComponentOnMount() {
    CT.Mount(WorkspacePreview, "#live-workspace", { Id: "live" });
    CT.Mount(WorkspacePreview, "#pinned-workspace", { Id: "pinned" });
  }

  ComponentOnUnmount() {
    CT.Unmount("#live-workspace");
    CT.Unmount("#pinned-workspace");
  }

  SelectDesign(design) {
    this.SetState({ Selection: { Surface: design.Surface, Accent: design.Accent, Shape: design.Shape } });
  }

  ChangeSelection(key, value) {
    this.SetState((state) => ({ Selection: { ...state.Selection, [key]: value } }));
  }

  PinComparison() {
    this.SetState({ Pinned: { ...this.state.Selection } });
  }

  RenderChoices(label, key, options) {
    return html`<fieldset class="lab-choice-group"><legend>${label}</legend><div class="lab-choices">${options.map((option) => html`
      <button class="lab-button" ${CT.Attr("aria-pressed", String(this.state.Selection[key] === option.Id))} ${CT.Attr("title", option.Description)} ${CT.On("click", () => this.ChangeSelection(key, option.Id))}>${option.Name}</button>
    `)}</div></fieldset>`;
  }

  RenderWorkspace(selection, pinned = false) {
    const design = MatchDesign(selection);
    return html`<section class="lab-workspace-column" ${CT.Attr("aria-label", pinned ? "Pinned comparison" : "Live design")} ${CT.Attr("hidden", pinned && !this.state.Pinned)}>
      <header class="lab-workspace-heading"><div><p class="lab-eyebrow">${pinned ? "Pinned reference" : "Live preview"}</p><h2>${design?.Name || "Custom mix"}</h2><p>${DescribeDesign(selection)}</p></div>${pinned ? html`<button class="lab-button" ${CT.On("click", () => this.SetState({ Pinned: null }))}>Remove comparison</button>` : html`<button class="lab-button" ${CT.On("click", () => this.PinComparison())}>${this.state.Pinned ? "Replace pinned design" : "Pin for comparison"}</button>`}</header>
      <div class="design-theme" ${CT.Attr("data-surface", selection.Surface)} ${CT.Attr("data-accent", selection.Accent)} ${CT.Attr("data-shape", selection.Shape)}>
        <div ${CT.Attr("id", pinned ? "pinned-workspace" : "live-workspace")}></div>
      </div>
    </section>`;
  }

  Render() {
    const design = MatchDesign(this.state.Selection);
    return html`<div class="lab-page">
      <header class="lab-intro"><div><p class="lab-eyebrow">coettools / visual direction</p><h1>One foundation.<br><span>Four directions.</span></h1></div><div class="lab-intro-note"><p>Keep what works. Change what gets in the way.</p><p>Compare the original sharp style, a softer version, a graphite/navy split, and a light counterpart. Then mix the parts.</p><span>Design study only. Nothing here changes the default or the live wiki.</span></div></header>
      <section aria-labelledby="directions-heading"><div class="lab-section-heading"><h2 id="directions-heading">01 / Choose a starting point</h2><span>Same structure. Different treatment.</span></div><div class="direction-grid">${Designs.map((item, index) => DirectionCard({ Design: item, Index: index, Selected: design?.Id === item.Id, OnSelect: (selected) => this.SelectDesign(selected) }))}</div></section>
      <section class="lab-mixer" aria-labelledby="mixer-heading"><div class="lab-section-heading"><h2 id="mixer-heading">02 / Mix the parts</h2><span>Amber and sage are still here.</span></div><div class="lab-mixer-controls">${this.RenderChoices("Surface", "Surface", Surfaces)}${this.RenderChoices("Accent", "Accent", Accents)}${this.RenderChoices("Shape & borders", "Shape", Shapes)}</div><p class="lab-selection-note" aria-live="polite"><strong>${design?.Name || "Custom mix"}:</strong> ${design?.Tradeoff || "A combination of your chosen surfaces, accents, and edge treatment."}</p></section>
      <section aria-labelledby="workspace-heading"><div class="lab-section-heading"><h2 id="workspace-heading">03 / Try it in use</h2><span>Pin a design, then change the live version.</span></div><div ${CT.Attr("class", `lab-comparison ${this.state.Pinned ? "has-reference" : ""}`)}>${this.RenderWorkspace(this.state.Selection)}${this.RenderWorkspace(this.state.Pinned || this.state.Selection, true)}</div></section>
      <footer class="lab-footer"><span>coettools / CTFramework</span><p>The eventual default can share one set of colors and controls while allowing deliberate dark, light, or product-specific variations.</p><span>Proposal, not a release.</span></footer>
    </div>`;
  }
}
