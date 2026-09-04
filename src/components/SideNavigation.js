import { Component } from "./Component.js";
import { CreateComponent } from "./ComponentFactory.js";
import { CT } from "../CTFramework.js";
import { Tooltip } from "./Tooltip.js";

const html = CT.Html;

export class SideNavigationComponent extends Component {
  constructor(props) {
    super(props);
    this.state = { IsOpen: true };
  }

  ToggleNavigation() {
    this.SetState((state) => ({ IsOpen: !state.IsOpen }));
  }

  Render() {
    const { ActiveId, Items = [], OnNavigate, Title = "Navigation" } = this.props;
    const isOpen = this.state.IsOpen;
    const toggleLabel = isOpen ? "Collapse" : "Expand";

    return html`
      <aside ${CT.Attr("className", `ct-side-navigation ${isOpen ? "is-open" : "is-closed"}`)}>
        <header class="ct-side-navigation-header">
          ${isOpen ? html`<strong>${Title}</strong>` : null}
          ${Tooltip({
            Text: toggleLabel,
            Position: "right",
            ShowOnFocus: false,
            Content: html`
              <button
                type="button"
                class="ct-side-navigation-toggle"
                ${CT.Attr("aria-label", toggleLabel)}
                ${CT.Attr("aria-expanded", String(isOpen))}
                ${CT.On("click", () => this.ToggleNavigation())}
              >
                <span class="ct-side-navigation-collapse-icon" aria-hidden="true"></span>
              </button>
            `
          })}
        </header>
        ${isOpen
          ? html`
              <div class="ct-side-navigation-content">
                <nav ${CT.Attr("aria-label", Title)}>
                  ${Items.length
                    ? Items.map((item) => html`<button type="button" ${CT.Attr("className", `ct-side-navigation-item ${item.Id === ActiveId ? "is-active" : ""}`)} ${CT.Attr("aria-current", item.Id === ActiveId ? "page" : null)} ${CT.On("click", () => OnNavigate?.(item))}>${item.Label}</button>`)
                    : html`<p class="ct-muted">No navigation items.</p>`}
                </nav>
              </div>
            `
          : null}
      </aside>
    `;
  }
}

export const SideNavigation = (options = {}) => CreateComponent(SideNavigationComponent, options);
