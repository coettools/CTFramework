# HTML And DOM

`CT.Html` is CTFramework's raw HTML template tag. `CT(selector)` is the small, chainable DOM helper inspired by the useful part of jQuery.

## CT.Html

Create a module-level alias and return one root element from `Render` or a component function:

```js
const html = CT.Html;

const Panel = ({ Title, Message }) => html`
  <section class="panel">
    <h2>${Title}</h2>
    <p>${Message}</p>
  </section>
`;
```

Values in `${...}` become text or CTFramework child views. Do not use raw string HTML for user-provided values.

## Events: CT.On

Place `CT.On(eventType, handler)` in the opening element tag. The handler receives the browser event.

```js
html`<button type="button" ${CT.On("click", (event) => console.log(event.currentTarget))}>Save</button>`;
```

Template events support `click`, `dblclick`, `input`, `change`, `submit`, keyboard, mouse, pointer, focus, blur, and context-menu events.

## Dynamic Attributes: CT.Attr

Use `CT.Attr(name, value)` for values that change during rendering. `true` creates a boolean attribute; `false`, `null`, and `undefined` remove it.

```js
html`
  <input
    ${CT.Attr("value", this.state.Name)}
    ${CT.Attr("disabled", this.state.IsSaving)}
    ${CT.Attr("className", this.state.HasError ? "has-error" : "")}
  >
`;
```

## Ready

Pass a callback to `CT(...)`, or call `CT.Ready(...)`, to wait for the document:

```js
CT(() => CT.Mount(App, "#app"));
CT.Ready(() => console.log("DOM ready"));
```

## Select Elements

```js
const saveButton = CT("#save-button");
const buttons = CT("button", ".toolbar");
const firstButton = buttons.Get();
const secondButton = buttons.Get(1);
```

`CT(selector, scope?)` returns all matching elements. The optional scope may be a selector or DOM element. `length` contains the selected count and `Get(index?)` returns one element or `null`.

`CT.CreateSelection(target, scope?)` is the explicit form of the selection helper. Both forms also accept a DOM node or an iterable of nodes:

```js
const buttons = CT.CreateSelection("button", ".toolbar");
const selectedNodes = CT.CreateSelection(document.querySelectorAll(".selected"));
selectedNodes.AddClass("is-ready");
```

## Each And Find

```js
CT(".row").Each((element, index) => {
  element.dataset.index = index;
});

const inputs = CT("#profile-form").Find("input, select");
```

`Each(callback)` returns the original selection for chaining. `Find(selector)` searches within every selected element and returns a new selection.

## On Events

Bind an event directly, or delegate from a containing element. Both return the selection when used through `CT(...)`.

```js
CT("#save-button").On("click", SaveProfile);

CT("#records").On("click", ".delete-record", (event, button) => {
  DeleteRecord(button.dataset.id);
});
```

CTFramework automatically cleans up template event handlers when their component unmounts. For direct DOM behavior that must be removed earlier, keep the handler function and use the browser's `removeEventListener` on `CT("#save-button").Get()`.

## Attributes And Dataset

```js
CT("#email")
  .Attr("aria-invalid", true)
  .Data("record-id", 42);

const invalid = CT("#email").Attr("aria-invalid");
const recordId = CT("#email").Data("record-id");

CT("#email").Attr("aria-invalid", null).Data("record-id", null);
```

`Attr(name, value?)` reads when no value is supplied. `Data(name, value?)` reads or writes `data-*`; hyphenated names convert to browser dataset names automatically.

## CSS, HTML, And Text

```js
CT("#status").Css("color", "var(--ct-color-success)");
CT("#status").Css({ fontWeight: "700", "margin-top": "8px" });
const color = CT("#status").Css("color");

CT("#message").Html("<strong>Saved</strong>");
const markup = CT("#message").Html();

CT("#message").Text("Saved safely");
const message = CT("#message").Text();
```

`Html` deliberately assigns `innerHTML`; use it only with trusted markup. Prefer `Text` for values that could come from users or a server.

## Classes And Removal

```js
CT("#panel")
  .AddClass("is-ready is-visible")
  .RemoveClass("is-loading")
  .ToggleClass("is-expanded", true);

const isExpanded = CT("#panel").HasClass("is-expanded");
CT(".temporary-notice").Remove();
```

All class methods accept space-separated class names. `ToggleClass(name, force?)` uses normal toggle behavior without `force`, or explicitly adds/removes when it is `true`/`false`.
