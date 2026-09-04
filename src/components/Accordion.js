import { Component } from "./Component.js";
import { CreateComponent } from "./ComponentFactory.js";
import { CT } from "../CTFramework.js";
import { Guid } from "../utils/Guid.js";

const html = CT.Html;

export class AccordionComponent extends Component {
  constructor(props) {
    super(props);
    this.state = { OpenIds: props.OpenIds || [] };
    this._itemIds = new Map();
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
    const keys = new Set();
    for (const item of Items) {
      if (!(typeof item.Id === "string" && item.Id.length > 0 || typeof item.Id === "number" && Number.isFinite(item.Id))) {
        throw new Error("Accordion items require a non-empty string or finite number Id.");
      }
      if (keys.has(item.Id)) throw new Error(`Accordion item Id must be unique. Duplicate: ${item.Id}`);
      keys.add(item.Id);
      if (!this._itemIds.has(item.Id)) this._itemIds.set(item.Id, `ct-accordion-${Guid()}`);
    }
    for (const key of this._itemIds.keys()) {
      if (!keys.has(key)) this._itemIds.delete(key);
    }

    return html`
      <section class="ct-accordion">
        ${Items.map((item) => {
          const isOpen = this.state.OpenIds.includes(item.Id);
          const id = this._itemIds.get(item.Id);

          return { ...html`
            <article class="ct-accordion-item">
              <h3 class="ct-accordion-heading">
              <button
                type="button"
                class="ct-accordion-trigger"
                ${CT.Attr("id", `${id}-trigger`)}
                ${CT.Attr("aria-controls", `${id}-panel`)}
                ${CT.Attr("aria-expanded", String(isOpen))}
                ${CT.On("click", () => this.ToggleItem(item.Id))}
              >${item.Title}</button>
              </h3>
              <div class="ct-accordion-content" ${CT.Attr("role", this.props.Multiple && Items.length > 6 ? "group" : "region")} ${CT.Attr("id", `${id}-panel`)} ${CT.Attr("aria-labelledby", `${id}-trigger`)} ${CT.Attr("hidden", !isOpen)}>${item.Content}</div>
            </article>
          `, key: item.Id };
        })}
      </section>
    `;
  }
}

export const Accordion = (options = {}) => CreateComponent(AccordionComponent, options);
