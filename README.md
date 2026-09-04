# CTFramework

CTFramework is a small raw JavaScript frontend framework for coettools apps.

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

The only dependency is esbuild, used at build time to bundle ES modules and minify
JavaScript and embedded CSS. It is not included in the browser
runtime. The library still has zero runtime dependencies.

## Commands

```bash
npm run build
npm run test
npm run test:browser
npm run check
npm run check:workspace
npm run package:check
npm run setup:git-hooks
npm run sync:projects
npm run sync:projects:preview
npm run projects:check
```

`npm run build` writes the distributable ES module package to `dist/`. Real projects import CTFramework from the package name after installation, or from a local package link during development:

```bash
npm link
```

```bash
npm link @coettools/ctframework
```

When this project is a Git repository, run `npm run setup:git-hooks` once. The pre-commit hook runs `npm run check`. After a successful commit, the post-commit hook runs `npm run sync:projects` to refresh consuming web-dev projects and run their available checks. A post-commit failure does not undo the commit; fix the failure and rerun synchronization before releasing consumers.

## Update consuming projects

Framework work includes its consumers, not just this repository. After each commit:

1. `npm run sync:projects` rebuilds and checks CTFramework from clean, committed build inputs.
2. It discovers direct sibling projects using `vendor/ctframework.bundle.js` or `.min.js`, refreshes the variants they use or already carry, and copies LICENSE.ctframework. Embedded CSS travels with the bundles.
3. It runs each project's `npm run check`, or its build and source syntax checks when no check script exists. Source-only starters get syntax checks and an explicit notice that build/tests are not configured.
4. It verifies vendor bytes and any standard dist/vendor output against the new artifacts. Failures are reported per project and produce a nonzero exit code.
5. Review affected application code and CSS for breaking API/token changes, fix consumers rather than adding legacy aliases, and test actual interactions on desktop and mobile.
6. Commit and release each consumer through its own approved workflow. Updating local files does not update a live Vercel site or VPS.

The hook never stages, commits, pushes, or deploys another project. It only replaces generated vendor files and runs checks/builds; application source and intentional style overrides remain untouched. Linked paths are refused. Package-managed consumers require an explicit dependency/lockfile update and currently stop automatic synchronization rather than being silently skipped. Projects outside this sibling/vendor convention need explicit integration before treating propagation as complete.

Use `npm run sync:projects:preview` while developing to test uncommitted changes across projects. Use `npm run projects:check` to rebuild only the framework and detect stale consumer/vendor and dist files without replacing them. `npm run build` now writes only this library's dist; it no longer has a wiki-specific copying side effect.

The latest local result, commit identity for committed runs, and file hashes are in `reports/ProjectSync.json` (ignored by Git). Browser verification and deployment are marked pending, never inferred from a successful build. If hooks are bypassed or unavailable, run the committed sync command manually. Do not consider an update finished while an affected consumer is stale, failing, or still awaiting the required verification/release.

## Documentation

Start with the [CTFramework Guide](docs/Guide.md). It is the wiki-style documentation hub, with individual practical examples for every public API, service, utility, lifecycle method, DOM helper, and UI component.

`npm run check` also checks the documentation against the source exports: complete imports, the CT method index, component entries and usage examples, and styling references. These checks catch missing or stale entries; changes to behavior and options still need a documentation review alongside the tests and wiki updates.

The interactive wiki is in the sibling `../wiki.ct-framework/` project. Use its own `npm run dev` or `npm run preview` server. The framework test server no longer serves sibling projects or repository metadata.

`npm run check` works in a standalone public checkout. `npm run check:workspace` also verifies wiki API coverage and requires the sibling wiki; `npm run test:wiki` runs that integration check on its own. Consumer synchronization checks wiki coverage when that project is present, then rebuilds and tests each consumer.

## Browser Verification

The [component checks](http://127.0.0.1:4170/tests/browser/components/) cover table
and accordion identity, native dropdown forms/reset, tooltip accessibility, menu
collapse cycles, popup focus, and alert priority. Add `?source` to test source
modules. Follow the [interaction checklist](tests/browser/components/README.md)
as well as the automated results, particularly for native reset-button timing.

Run `npm run test:browser` and open [the showcase](http://127.0.0.1:4170/tests/browser/showcase/). The development server binds only to `127.0.0.1` and serves browser tests, source, and distribution assets. It is not a production server.

The [runtime regression page](http://127.0.0.1:4170/tests/browser/runtime/) checks keyed updates, lifecycle guards, fallback recovery, cleanup, events, forms, dropdowns, toast reuse, and modal behavior. Add `?source` to test source modules instead of the minified bundle. Also run the `rendering`, `code-block`, and `image-carousel` pages under `tests/browser/`. Exercise the controls with mouse, keyboard, and a narrow viewport; Node tests alone do not validate browser behavior.

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

CTFramework adds its Split stylesheet once when `CT.Mount(...)` first renders a component: graphite surroundings, navy panels, compact corners, cyan actions, and green selection or success states. Role-based CSS properties and normal project styles provide overrides without compatibility aliases or another theme library.

Read [Styling.md](docs/Styling.md) for the supplied classes, every theme token, component overrides and full project-wide replacement patterns.

## Components

Read [Components.md](docs/Components.md) for `ApplicationLayout`, `Accordion`, `DataTable`, `Dropdown`, `SideNavigation`, `Tooltip`, `Badge`, `Card`, `CodeBlock`, `ImageCarousel`, `Alert`, `Dialog`, `PopupWindow`, `Toast`, and `FallbackView` usage.

`ImageCarousel` provides manual image navigation, captions, slide selectors,
keyboard controls, and touch/drag swiping. It handles empty galleries and failed
images without adding dependencies. See [usage](docs/Components.md#imagecarousel)
and [style overrides](docs/Styling.md#style-image-galleries).

`CodeBlock` displays formatted source with basic syntax colours, line numbers, Copy,
and a Wrap toggle. It supports JavaScript, C# (`Language: "csharp"`), HTML, CSS, JSON,
and plain text. The wiki and showcase use it for their code examples. See the
[component options](docs/Components.md#codeblock) and [style overrides](docs/Styling.md#style-code-examples).

## License

CTFramework is licensed under the [MIT License](LICENSE).
