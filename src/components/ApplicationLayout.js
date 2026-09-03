import { CT } from "../CTFramework.js";

const html = CT.Html;

export const ApplicationLayout = ({ Content = null, Footer = null, Header = null, SideNavigation = null } = {}) => {
  const classNames = [
    "ct-application-layout",
    Header ? "has-header" : "",
    Footer ? "has-footer" : "",
    SideNavigation ? "has-side-navigation" : ""
  ].filter(Boolean).join(" ");

  return html`
    <main ${CT.Attr("className", classNames)}>
      ${Header ? html`<header class="ct-application-layout-header">${Header}</header>` : null}
      <div class="ct-application-layout-workspace">
        ${SideNavigation ? html`<aside class="ct-application-layout-navigation">${SideNavigation}</aside>` : null}
        <section class="ct-application-layout-content">${Content}</section>
      </div>
      ${Footer ? html`<footer class="ct-application-layout-footer">${Footer}</footer>` : null}
    </main>
  `;
};
