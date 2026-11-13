// Check template literals once. Interpolated text is never parsed as markup.
const staticContent = new WeakMap();
const interactiveElements = "a[href], area[href], button, input, select, textarea, label, summary, details, iframe, object, embed, audio[controls], video[controls], [tabindex], [usemap]";
const interactiveRoles = /^(button|link|checkbox|radio|switch|combobox|textbox|searchbox|slider|spinbutton|listbox|option|menuitem(?:checkbox|radio)?|tab|treeitem|scrollbar)$/i;

const IsDisplayAttribute = (name, value) => {
  if (value === null || value === undefined || value === false) return true;
  const attribute = name.toLowerCase();
  if (attribute === "role")
    return !String(value)
      .split(/\s+/)
      .some((role) => interactiveRoles.test(role));
  if (attribute === "contenteditable") return String(value).toLowerCase() === "false";

  return !attribute.startsWith("on") && !["tabindex", "autofocus", "usemap", "controls", "innerhtml", "outerhtml", "srcdoc", "is"].includes(attribute);
};

const IsDisplayTemplate = (strings) => {
  if (!staticContent.has(strings)) {
    const template = document.createElement("template");
    template.innerHTML = strings.join(" ");
    const elements = [...template.content.querySelectorAll("*")];
    const valid =
      !template.content.querySelector(interactiveElements) &&
      elements.every((element) => !element.localName.includes("-") && !["script", "style"].includes(element.localName) && [...element.attributes].every(({ name, value }) => IsDisplayAttribute(name, value)));
    staticContent.set(strings, valid);
  }

  return staticContent.get(strings);
};

export const IsOptionContent = (content) => {
  if (Array.isArray(content)) return content.every(IsOptionContent);
  if (content === null || typeof content !== "object") return typeof content !== "function";
  if (content.__ctTemplateMarker === "attribute") {
    // A dynamic href can turn an otherwise passive anchor into a link.
    return !["href", "xlink:href"].includes(content.name.toLowerCase()) && IsDisplayAttribute(content.name, content.value);
  }

  return content.tag === "ct-template" && IsDisplayTemplate(content.props.strings) && content.props.values.every(IsOptionContent);
};
