import assert from "node:assert/strict";
import test from "node:test";

import { CTFramework } from "../../src/CTFramework.js";

class Element {
  constructor() {
    this.attributes = new Map();
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  removeAttribute(name) {
    this.attributes.delete(name);
  }

  hasAttribute(name) {
    return this.attributes.has(name);
  }
}

test("getter-only relationships use attributes for setting, changing and removal", () => {
  class Input extends Element {
    get form() {
      throw new Error("Reading a relationship is unnecessary for assigning its attribute");
    }
  }

  const input = new Input();
  CTFramework.UpdateDomProperties(input, {}, { form: "first" });
  assert.equal(input.attributes.get("form"), "first");
  CTFramework.UpdateDomProperties(input, { form: "first" }, { form: "second" });
  assert.equal(input.attributes.get("form"), "second");

  for (const value of [false, null, undefined]) {
    CTFramework.UpdateDomProperties(input, { form: "second" }, { form: value });
    assert.equal(input.attributes.has("form"), false);
    CTFramework.UpdateDomProperties(input, {}, { form: "second" });
  }

  CTFramework.UpdateDomProperties(input, { form: 7 }, {});
  assert.equal(input.attributes.has("form"), false);
});

test("an own read-only property shadows an inherited writable property", () => {
  const prototype = Object.create(Element.prototype);
  Object.defineProperty(prototype, "form", { value: "inherited", writable: true });
  const input = Object.assign(Object.create(prototype), new Element());
  Object.defineProperty(input, "form", { value: "native owner", writable: false });

  CTFramework.UpdateDomProperties(input, {}, { form: "first" });
  assert.equal(input.form, "native owner");
  assert.equal(input.attributes.get("form"), "first");
  CTFramework.UpdateDomProperties(input, { form: 1 }, {});
  assert.equal(input.form, "native owner");
  assert.equal(input.attributes.has("form"), false);
});

test("writable data properties and inherited setters still receive values and resets", () => {
  class Input extends Element {
    constructor() {
      super();
      this.tabIndex = 0;
      this.value = "";
      this.checked = false;
      this._selection = 0;
    }

    set selectionStart(value) {
      this._selection = Number(value);
    }

    get selectionStart() {
      return this._selection;
    }
  }

  const input = new Input();
  const props = { tabIndex: 3, selectionStart: 2, value: "Ada", checked: true };
  CTFramework.UpdateDomProperties(input, {}, props);
  assert.equal(input.tabIndex, 3);
  assert.equal(input.selectionStart, 2);
  assert.equal(input.value, "Ada");
  assert.equal(input.checked, true);
  assert.equal(input.attributes.size, 0);

  CTFramework.UpdateDomProperties(input, props, {});
  assert.equal(input.tabIndex, "");
  assert.equal(input.selectionStart, 0);
  assert.equal(input.value, "");
  assert.equal(input.checked, false);
});

test("writable setter errors propagate when setting and removing a binding", () => {
  const input = new Element();
  const failure = new TypeError("Rejected property value");
  let reject = true;
  Object.defineProperty(input, "selectionStart", {
    set: () => {
      if (reject) throw failure;
    },
  });

  assert.throws(
    () => CTFramework.UpdateDomProperties(input, {}, { selectionStart: 2 }),
    (error) => error === failure,
  );
  reject = false;
  CTFramework.UpdateDomProperties(input, {}, { selectionStart: 2 });
  reject = true;
  assert.throws(
    () => CTFramework.UpdateDomProperties(input, { selectionStart: 2 }, {}),
    (error) => error === failure,
  );
  assert.equal(input.attributes.size, 0);
});

test("reflected numeric attributes are removed without assigning an invalid empty value", () => {
  class Input extends Element {
    set size(value) {
      if (Number(value) <= 0) throw new RangeError("Invalid input size");
      this.setAttribute("size", value);
    }
  }

  for (const value of [null, false, undefined]) {
    const input = new Input();
    CTFramework.UpdateDomProperties(input, {}, { size: value });
    assert.equal(input.hasAttribute("size"), false);
    CTFramework.UpdateDomProperties(input, {}, { size: 20 });
    input.removeAttribute("size");
    CTFramework.UpdateDomProperties(input, { size: 20 }, { size: value });
    assert.equal(input.hasAttribute("size"), false);
    CTFramework.UpdateDomProperties(input, { size: value }, { size: value });
    assert.equal(input.hasAttribute("size"), false);
  }
});

test("a renamed empty binding does not inherit another property's old value", () => {
  const input = new Element();
  Object.defineProperty(input, "size", {
    set: () => {
      throw new Error("Never assigned");
    },
  });
  input.attributes.set("data-ct-template-attribute-0", "");
  const bindingElement = {
    attributes: [{ name: "data-ct-template-attribute-0" }],
    hasAttribute: input.hasAttribute.bind(input),
    removeAttribute: input.removeAttribute.bind(input),
    setAttribute: input.setAttribute.bind(input),
  };
  Object.defineProperty(bindingElement, "size", Object.getOwnPropertyDescriptor(input, "size"));
  CTFramework.UpdateTemplateBindings([bindingElement], [{ name: "size", value: null }], [{ name: "data-limit", value: 20 }]);
  assert.equal(input.hasAttribute("size"), false);
});

test("property-only booleans set and reset without inventing HTML attributes", () => {
  const input = Object.assign(new Element(), { indeterminate: false });
  CTFramework.UpdateDomProperties(input, {}, { indeterminate: true });
  assert.equal(input.indeterminate, true);
  assert.equal(input.hasAttribute("indeterminate"), false);
  CTFramework.UpdateDomProperties(input, { indeterminate: true }, { indeterminate: false });
  assert.equal(input.indeterminate, false);
  CTFramework.UpdateDomProperties(input, {}, { indeterminate: true });
  CTFramework.UpdateDomProperties(input, { indeterminate: true }, {});
  assert.equal(input.indeterminate, false);
});

test("HTML boolean attributes keep their content-attribute and reset semantics", () => {
  const option = Object.assign(new Element(), { selected: false });
  CTFramework.SetDomProperty(option, "selected", true);
  assert.equal(option.attributes.get("selected"), "");
  assert.equal(option.selected, false);
});
