# HTML And DOM

`CT.Html` is CTFramework's raw HTML template tag. `CT(selector)` is the small, chainable DOM helper inspired by the useful part of jQuery.

## CT.Html

SVG child templates such as ``html`<g>...</g>` `` and
``html`<circle cx="0" cy="0" r="10"></circle>` `` keep their SVG namespace,
including when interpolated into another SVG view. Use `CT.Attr` for dynamic SVG
attributes just as for HTML. See the [PanZoomView example](Components.md#panzoomview).

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

Template handlers receive a delegated event view: `target` is the original clicked element, while `currentTarget` is the element carrying `CT.On`, including clicks on nested SVG icons. Event methods such as `preventDefault` and `stopPropagation` operate on the original event.

```js
html`<button type="button" ${CT.On("click", (event) => console.log(event.currentTarget))}>Save</button>`;
```

Template events support `click`, `dblclick`, `input`, `change`, `submit`, `keydown`, `keyup`, `keypress`, `mousedown`, `mouseup`, `pointerdown`, `pointerup`, `pointerenter`, `pointerleave`, `pointerover`, `pointerout`, `mouseenter`, `mouseleave`, `focusin`, `focusout`, and `contextmenu`. Enter/leave events run on their native target without bubbling; over/out events bubble. `focus` and `blur` also work; CTFramework normalizes them to delegated `focusin` and `focusout`. Unsupported event names are rejected. An event marker in template content is invalid; keep it in an opening tag.

## Dynamic Attributes: CT.Attr

Use `CT.Attr(name, value)` for values that change during rendering. For HTML boolean attributes, `true` sets the attribute and `false`, `null`, or `undefined` removes it. Property-only booleans such as a checkbox's `indeterminate` set or reset the DOM property instead.

Use strings for ARIA states: `CT.Attr("aria-expanded", String(isOpen))`. Use `null` to omit an ARIA attribute, for example on an inactive carousel selector. A changed attribute name removes the previous binding. Object style bindings remove properties no longer present.

`value`, `checked`, and `indeterminate` are special DOM-property bindings. Other boolean values use HTML content attributes, including `selected`, so native `defaultSelected` and form-reset behavior remain intact. Other non-boolean bindings may use writable DOM properties where available. Getter-only relationships such as `form` and `list` use HTML attributes: pass the target form or datalist's ID, not the element itself. Changing the ID updates the association; removing `form` restores the nearest ancestor form, or leaves the control unowned when it has no ancestor form. Invalid values rejected by a writable property still reach the component's error handling.

Use a complete marker in the start tag, such as `${CT.Attr("title", title)}`. Do not place the marker inside a quoted attribute value. Static `class="panel"` uses HTML spelling; dynamic `CT.Attr("class", value)` and `CT.Attr("className", value)` both write that same `class` attribute.

On an unrelated update, an unchanged `value` or `checked` binding leaves a user's current DOM edit alone. When the bound value changes, CTFramework applies it. If the edit should persist as application state, update state in an `input` or `change` handler:

```js
return html`<label>Name
  <input
    ${CT.Attr("value", this.state.Name)}
    ${CT.On("input", (event) => this.SetState({ Name: event.currentTarget.value }))}
  >
</label>`;
```

Changing a numeric binding such as `CT.Attr("size", 20)` to `CT.Attr("size", null)` removes the reflected HTML attribute without assigning an invalid empty value to its numeric property. `CT.Attr("indeterminate", true)` sets a checkbox's indeterminate property; `false` or removal clears it.

```js
html`
  <input
    ${CT.Attr("value", this.state.Name)}
    ${CT.Attr("disabled", this.state.IsSaving)}
    ${CT.Attr("className", this.state.HasError ? "has-error" : "")}
  >
`;
```

For example, this input uses native form and datalist associations. This is a `Render` fragment; `this.state.FormId` is `"profile-form"` and `this.state.ListId` is `"name-suggestions"` initially.

```js
return html`
  <section>
    <form id="profile-form">
      <button type="submit">Save</button>
    </form>
    <label for="profile-name">Name</label>
    <input
      id="profile-name"
      name="Name"
      ${CT.Attr("form", this.state.FormId)}
      ${CT.Attr("list", this.state.ListId)}
    >
    <datalist id="name-suggestions">
      <option value="Ada"></option>
      <option value="Grace"></option>
    </datalist>
  </section>
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

CT("#records").On("click", ".delete-record", (_, button) => {
  DeleteRecord(button.dataset.id);
});
```

CTFramework automatically cleans up template event handlers when their component unmounts. For direct DOM behavior that must be removed earlier, keep the handler function and use the browser's `removeEventListener` on `CT("#save-button").Get()`.

Selection `On` returns the selection, not an unsubscribe function, and there is no selection `Off` method. Its delegated form wraps your handler, so removing the original callback does not remove that wrapper. Prefer template bindings for component-owned markup, or register your own native listener when delegated behavior needs explicit early cleanup.

## Attributes And Dataset

```js
CT("#email")
  .Attr("aria-invalid", "true")
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

`AddClass`, `RemoveClass`, and `ToggleClass` accept space-separated class names. `HasClass` expects one class name and returns true if any selected element has it. `ToggleClass(name, force?)` toggles without `force`, or explicitly adds/removes when it is `true`/`false`.

Selection `Remove`, `Html`, and `Text` perform direct DOM changes, not component lifecycle cleanup. Use `SetState` for component-owned content and `CT.Unmount` for a mounted host.
