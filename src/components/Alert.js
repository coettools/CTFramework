import { CT } from "../CTFramework.js";

const html = CT.Html;

export const Alert = ({ Title = "", Message = "", Type = "info" } = {}) => {
  return html`
    <section ${CT.Attr("className", `ct-alert ct-alert-${Type}`)} role="alert">
      ${Title ? html`<strong>${Title}</strong>` : null}
      <span>${Message}</span>
    </section>
  `;
};
