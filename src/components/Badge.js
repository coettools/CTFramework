import { CT } from "../CTFramework.js";

const html = CT.Html;

export const Badge = ({ Text = "", Type = "default" } = {}) => {
  return html`<span ${CT.Attr("className", `ct-badge ct-badge-${Type}`)}>${Text}</span>`;
};
