import { CT } from "../CTFramework.js";
import { NormalizeNodes } from "../html/RenderNodes.js";

const html = CT.Html;

export const Card = ({ Title = "", HeadingLevel = 2, Actions = null, Content = null, Footer = null } = {}) => {
  if (!Number.isInteger(HeadingLevel) || HeadingLevel < 1 || HeadingLevel > 6) throw new RangeError("Card HeadingLevel must be an integer from 1 to 6.");
  const heading = Title ? { tag: `h${HeadingLevel}`, props: {}, children: NormalizeNodes([Title]) } : null;

  return html`
    <article class="ct-card">
      ${Title || Actions ? html`<header class="ct-card-header">${heading}${Actions ? html`<div class="ct-card-actions">${Actions}</div>` : null}</header>` : null}
      <div class="ct-card-content">${Content}</div>
      ${Footer ? html`<footer class="ct-card-footer">${Footer}</footer>` : null}
    </article>
  `;
};
