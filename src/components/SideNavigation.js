import { Component } from "./Component.js";
import { CreateComponent } from "./ComponentFactory.js";
import { CT } from "../CTFramework.js";
import { Tooltip } from "./Tooltip.js";

const html = CT.Html;

export class SideNavigationComponent extends Component {
  constructor(props) {
    super(props);
    this.state = { IsOpen: true, SearchTerm: "" };
  }

  GetVisibleItems() {
    const searchTerm = this.state.SearchTerm.trim().toLowerCase();
    const items = this.props.Items || [];
    return searchTerm ? items.filter((item) => String(item.Label).toLowerCase().includes(searchTerm)) : items;
  }

  ToggleNavigation() {
    this.SetState((state) => ({ IsOpen: !state.IsOpen }));
  }

  HandleSearch(event) {
    this.SetState({ SearchTerm: event.target.value });
  }

  Render() {
    const { ActiveId, Items = [], OnNavigate, Searchable = false, Title = "Navigation" } = this.props;
    const visibleItems = this.GetVisibleItems();
    const isOpen = this.state.IsOpen;
    const toggleLabel = isOpen ? "Collapse" : "Expand";

    return html`
      <aside ${CT.Attr("className", `ct-side-navigation ${isOpen ? "is-open" : "is-closed"}`)}>
        <header class="ct-side-navigation-header">
          ${isOpen ? html`<strong>${Title}</strong>` : null}
          ${Tooltip({
            Text: toggleLabel,
            Position: "right",
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
                ${Searchable
                  ? html`<label class="ct-side-navigation-search"><span>Search navigation</span><input type="search" ${CT.Attr("value", this.state.SearchTerm)} ${CT.On("input", (event) => this.HandleSearch(event))}></label>`
                  : null}
                <nav ${CT.Attr("aria-label", Title)}>
                  ${visibleItems.length
                    ? visibleItems.map((item) => html`<button type="button" ${CT.Attr("className", `ct-side-navigation-item ${item.Id === ActiveId ? "is-active" : ""}`)} ${CT.On("click", () => OnNavigate?.(item))}>${item.Label}</button>`)
                    : html`<p class="ct-muted">No navigation items found.</p>`}
                </nav>
              </div>
            `
          : null}
      </aside>
    `;
  }
}

export const SideNavigation = (options = {}) => CreateComponent(SideNavigationComponent, options);
