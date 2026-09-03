import CT from "../../../../dist/ctframework.bundle.min.js";

const html = CT.Html;

export const DirectionCard = ({ Design, Selected, OnSelect, Index }) => html`
  <article class="direction-card">
    <div class="direction-heading"><span class="lab-number">0${Index + 1}</span><h3>${Design.Name}</h3>${Design.Id === "split" ? html`<span class="lab-tag">Framework default</span>` : null}</div>
    <div class="design-theme direction-sample" ${CT.Attr("data-surface", Design.Surface)} ${CT.Attr("data-accent", Design.Accent)} ${CT.Attr("data-shape", Design.Shape)} aria-hidden="true">
      <div class="sample-header"><strong>coettools</strong><span class="sample-status">Ready</span></div>
      <div class="sample-body">
        <div class="sample-nav"><span class="sample-selected">Overview</span><span>Components</span><span>Settings</span></div>
        <div class="sample-content"><div class="sample-panel"><span>Component state</span><strong>03</strong><span class="sample-line"></span></div><div class="sample-actions"><span>Primary</span><span>Secondary</span></div></div>
      </div>
    </div>
    <p class="direction-summary">${Design.Summary}</p>
    <p class="direction-detail">${Design.Detail}</p>
    <button class="lab-button direction-select" ${CT.Attr("aria-pressed", String(Selected))} ${CT.Attr("aria-label", `Try ${Design.Name}`)} ${CT.On("click", () => OnSelect(Design))}>${Selected ? "Selected" : "Try this direction"}</button>
  </article>
`;
