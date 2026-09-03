import { CT } from "../CTFramework.js";

const html = CT.Html;

export const Card = ({ Title = "", Content = null, Footer = null } = {}) => {
  return html`
    <article class="ct-card">
      ${Title ? html`<header class="ct-card-header"><h2>${Title}</h2></header>` : null}
      <div class="ct-card-content">${Content}</div>
      ${Footer ? html`<footer class="ct-card-footer">${Footer}</footer>` : null}
    </article>
  `;
};
