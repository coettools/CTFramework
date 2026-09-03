# CTFramework Guide

This is the practical entry point for CTFramework. Each page uses the public package API and can be copied into a normal raw JavaScript application.

## Start Here

1. [Getting Started](Getting-Started.md) - install, mount an app, write the first component.
2. [HTML And DOM](Html-And-Dom.md) - `CT.Html`, events, attributes, and every `$()`-style selection method.
3. [Components](Components.md) - one section and example for each included UI component.
4. [Component Lifecycle](Component-Guide.md) - state, props, lifecycle methods, updates, and errors.
5. [Data And Services](Data-And-Services.md) - routes, stores, HTTP, forms, GUIDs, and validation.
6. [Styling](Styling.md) - CTFramework defaults and clean project overrides.
7. [API Reference](Api.md) - concise complete method index.

## Rules That Make CTFramework Predictable

- Use `const html = CT.Html;` once per module, then use `html\`...\`` for views.
- A template must have one root HTML element.
- Put `CT.On(...)` and `CT.Attr(...)` inside an element's start tag.
- Use `SetState` for component state; do not manually redraw a mounted component.
- Import only from `@coettools/ctframework`; application code should not import internal `src` files.
- All public CTFramework options and methods use PascalCase. Browser-native HTML properties retain their native form, such as `className`.

## Complete Import

```js
import CT, {
  Accordion, Alert, ApplicationLayout, Badge, Card, Component, DataTable, Dialog, Dropdown,
  FallbackView, GetFormValues, Guid, HttpClient, MaxLength, PopupWindow,
  Required, Route, Router, SideNavigation, Store, Toast, Tooltip
} from "@coettools/ctframework";
```

The showcase at `tests/browser/showcase/` and the interactive sibling project at `../wiki.ct-framework/` both demonstrate the public API in running applications. They remain outside the production runtime.
