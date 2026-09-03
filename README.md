# CTFramework

CTFramework is a small raw JavaScript frontend framework for CoetTools apps.

It uses one small `CT` entry point for HTML templates, components, mounting and direct DOM work.

## Principles

- plain HTML, JavaScript and CSS
- zero runtime dependencies
- small focused API surface
- production code in `src/`
- test and showcase code in `tests/`

## Naming

- PascalCase for classes, components, exported functions and public methods
- camelCase for parameters, local values and callback arguments
- `_camelCase` for private instance values when a private value is needed
- browser and HTML names keep their native spelling, such as `className`, `textContent` and `onClick`

## Structure

```text
src/                     production framework code
scripts/                 local build and browser test helpers
tests/node/              automated Node tests
tests/browser/showcase/  browser smoke test and example app
docs/                    framework documentation
```

## Install

```bash
npm install
```

There are no package dependencies right now, so install is only there for normal package workflow consistency.

## Commands

```bash
npm run build
npm run test
npm run test:browser
npm run check
npm run package:check
npm run setup:git-hooks
```

`npm run build` writes the distributable ES module package to `dist/`. Real projects import CTFramework from the package name after installation, or from a local package link during development:

```bash
npm link
```

```bash
npm link @coettools/ctframework
```

When this project is a Git repository, run `npm run setup:git-hooks` once. The tracked pre-commit hook runs `npm run check`, so builds and tests complete before every commit.

## Documentation

Start with the [CTFramework Guide](docs/Guide.md). It is the wiki-style documentation hub, with individual practical examples for every public API, service, utility, lifecycle method, DOM helper, and UI component.

The interactive CTFramework wiki is in the sibling `../wiki.ct-framework/` folder and is built using CTFramework itself. Each `npm run build` creates the standalone `dist/ctframework.bundle.js` file and copies it to `wiki.ct-framework/vendor/`. Run `npm run test:browser`, then open `http://localhost:4170/wiki/`. `npm run check` verifies that every public export has a wiki coverage entry, so framework changes cannot silently leave the wiki behind.

- [Getting Started](docs/Getting-Started.md)
- [HTML And DOM](docs/Html-And-Dom.md)
- [Component Guide](docs/Component-Guide.md)
- [Components](docs/Components.md)
- [Data And Services](docs/Data-And-Services.md)
- [Styling](docs/Styling.md)
- [API Reference](docs/Api.md)

```js
import CT, {
  Component,
  Router,
  Route,
  Store,
  HttpClient,
  GetFormValues,
  Guid,
  Required,
  MaxLength
} from "@coettools/ctframework";
```

## Basic usage

```js
import CT, { Component } from "@coettools/ctframework";

const html = CT.Html;

class App extends Component {
  constructor(props) {
    super(props);
    this.state = { count: 0 };
  }

  Render() {
    return html`
      <main class="app-shell">
        <h1>CTFramework</h1>
        <button type="button" ${CT.On("click", () => this.SetState({ count: this.state.count + 1 }))}>
          Count: ${this.state.count}
        </button>
      </main>
    `;
  }
}

CT(() => {
  CT.Mount(App, "#app");
});
```

## DOM helpers

`CT(...)` is the direct DOM helper. It returns a small chainable selection, modeled on the usefulness of `$()` without importing jQuery:

```js
CT("#save-button")
  .AddClass("is-ready")
  .Attr("aria-disabled", false)
  .On("click", save);

const title = CT(".page-title").Text();
```

`CT(callback)` runs when the document is ready. `CT.Html` is the primary component markup API. It accepts one root HTML element, supports `${value}` for text or child views, and keeps user data out of raw HTML strings. Use `CT.On(eventType, handler)` inside a start tag for events, and `CT.Attr(name, value)` for dynamic attributes.

```js
const html = CT.Html;

return html`
  <button ${CT.Attr("className", isReady ? "ready" : "waiting")} ${CT.On("click", save)}>
    ${label}
  </button>
`;
```

`CT(...)` returns a chainable selection with PascalCase methods including `Get`, `Find`, `On`, `Attr`, `Data`, `Css`, `Html`, `Text`, `AddClass`, `RemoveClass`, `ToggleClass`, `HasClass`, and `Remove`.

## Browser showcase

The browser showcase is kept outside production code:

```text
tests/browser/showcase/
```

Run the local server:

```bash
npm run test:browser
```

Then open:

```text
http://localhost:4170/tests/browser/showcase/
```

## Default style

CTFramework adds its default stylesheet once when `CT.Mount(...)` first renders a component. It establishes the CoetTools navy, signal cyan and vital green visual language while allowing normal project CSS to override it automatically.

Read [Styling.md](docs/Styling.md) for the supplied classes, every theme token, component overrides and full project-wide replacement patterns.

## Components

Read [Components.md](docs/Components.md) for `ApplicationLayout`, `Accordion`, `DataTable`, `Dropdown`, `SideNavigation`, `Tooltip`, `Badge`, `Card`, `Alert`, `Dialog`, `PopupWindow`, `Toast`, and `FallbackView` usage.

## License

CTFramework is licensed under the [MIT License](LICENSE).
