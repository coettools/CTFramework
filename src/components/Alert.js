import { CT } from "../CTFramework.js";

const html = CT.Html;

export const Alert = ({ Title = "", Message = "", Type = "info", Live = Type === "danger" ? "assertive" : "polite" } = {}) => {
  if (!["polite", "assertive", "off"].includes(Live)) throw new Error("Alert Live must be polite, assertive, or off.");
  return html`
    <section ${CT.Attr("className", `ct-alert ct-alert-${Type}`)} ${CT.Attr("role", Live === "off" ? null : Live === "assertive" ? "alert" : "status")} ${CT.Attr("aria-live", Live)} aria-atomic="true">
      ${Title ? html`<strong>${Title}</strong>` : null}
      <span>${Message}</span>
    </section>
  `;
};
