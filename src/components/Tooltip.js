import { CT } from "../CTFramework.js";

const html = CT.Html;

export const Tooltip = ({ Content = null, Position = "top", Text = "" } = {}) => {
  return html`
    <span class="ct-tooltip">
      ${Content}
      ${Text ? html`<span ${CT.Attr("className", `ct-tooltip-content ct-tooltip-${Position}`)} role="tooltip">${Text}</span>` : null}
    </span>
  `;
};
