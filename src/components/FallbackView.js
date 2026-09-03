import { CT } from "../CTFramework.js";

const html = CT.Html;

export const FallbackView = ({ ActionLabel = "Return", Message = "The requested view is not available.", OnAction = null, Title = "Page not found", Type = "not-found" } = {}) => {
  return html`
    <section class="ct-fallback ct-fallback-${Type}" role="alert">
      <p class="ct-eyebrow">CTFramework</p>
      <h1>${Title}</h1>
      <p class="ct-muted">${Message}</p>
      ${OnAction ? html`<button type="button" ${CT.On("click", OnAction)}>${ActionLabel}</button>` : null}
    </section>
  `;
};
