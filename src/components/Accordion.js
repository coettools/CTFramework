import { Component } from "./Component.js";
import { CreateComponent } from "./ComponentFactory.js";
import { CT } from "../CTFramework.js";

const html = CT.Html;

export class AccordionComponent extends Component {
  constructor(props) {
    super(props);
    this.state = { OpenIds: props.OpenIds || [] };
  }

  ToggleItem(itemId) {
    const openIds = this.state.OpenIds;
    const isOpen = openIds.includes(itemId);
    const nextOpenIds = this.props.Multiple
      ? isOpen ? openIds.filter((openId) => openId !== itemId) : [...openIds, itemId]
      : isOpen ? [] : [itemId];

    this.SetState({ OpenIds: nextOpenIds });
  }

  Render() {
    const { Items = [] } = this.props;

    return html`
      <section class="ct-accordion">
        ${Items.map((item) => {
          const isOpen = this.state.OpenIds.includes(item.Id);

          return html`
            <article class="ct-accordion-item">
              <button
                type="button"
                class="ct-accordion-trigger"
                ${CT.Attr("aria-expanded", isOpen)}
                ${CT.On("click", () => this.ToggleItem(item.Id))}
              >${item.Title}</button>
              <div class="ct-accordion-content" ${CT.Attr("hidden", !isOpen)}>${item.Content}</div>
            </article>
          `;
        })}
      </section>
    `;
  }
}

export const Accordion = (options = {}) => CreateComponent(AccordionComponent, options);
