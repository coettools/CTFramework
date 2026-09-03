# Getting Started

## Install And Import

For a raw HTML and JavaScript project, use the [standalone bundle](#use-the-standalone-bundle). No package resolver is needed in the browser.

For a project with module tooling, install CTFramework's build dependencies and link the built package locally. Run these commands in the CTFramework repository:

```bash
npm ci
npm run build
npm link
```

In the consuming project:

```bash
npm link @coettools/ctframework
```

Create the application component in `src/App.js`:

```js
import CT, { Component } from "@coettools/ctframework";

const html = CT.Html;

export class App extends Component {
  constructor(props) {
    super(props);
    this.state = { Count: 0 };
  }

  Render() {
    return html`
      <main class="ct-shell">
        <h1>My coettools app</h1>
        <button type="button" ${CT.On("click", () => this.SetState({ Count: this.state.Count + 1 }))}>
          Count: ${this.state.Count}
        </button>
      </main>
    `;
  }
}
```

Start it from `src/Main.js`:

```js
import CT from "@coettools/ctframework";
import { App } from "./App.js";

CT(() => {
  CT.Mount(App, "#app");
});
```

The document needs a mount target:

```html
<body>
  <div id="app"></div>
  <script type="module" src="./src/Main.js"></script>
</body>
```

`CT.Mount` adds CTFramework's default stylesheet once. Add ordinary project CSS after your module or stylesheet links to override its layered defaults. See [Styling](Styling.md).

## Use The Standalone Bundle

In the CTFramework repository, run `npm ci` once to install build dependencies, then `npm run build`. This creates two self-contained ES modules: `dist/ctframework.bundle.js` for local debugging and `dist/ctframework.bundle.min.js` for production. Both embed CTFramework's default CSS, so neither needs a source-folder import or separate CTFramework stylesheet. Copy the production file into a project's `vendor/` folder and keep `LICENSE` beside it as `LICENSE.ctframework`.

The project's `index.html` loads its entry module:

```html
<script type="module" src="./src/Main.js"></script>
```

In `src/App.js`, replace the package import with:

```js
import CT, { Component } from "../vendor/ctframework.bundle.min.js";
```

In `src/Main.js`, replace the CT import with the same bundle path. Keep the local `App` import and startup call:

```js
import CT from "../vendor/ctframework.bundle.min.js";
import { App } from "./App.js";

CT(() => CT.Mount(App, "#app"));
```

Serve the project over HTTP rather than opening `index.html` as a local file. Keep import path casing exact for case-sensitive servers. A plain browser cannot resolve `@coettools/ctframework` by itself; use the relative bundle import above unless your project has a package resolver or import map.

Package-managed projects may explicitly import `@coettools/ctframework/bundle` for the minified bundle or `@coettools/ctframework/bundle/debug` for the readable version. Use one variant consistently throughout the application.

## Mount And Unmount

`CT.Mount` accepts a component class plus props, a constructed component instance, or a CT view returned by `CT.Html` or a component function. The target can be a selector or an element.

```js
CT.Mount(App, "#app", { UserName: "Ada" });

const app = new App({ UserName: "Ada" });
CT.Mount(app, document.querySelector("#app"));

CT.Mount(html`<p>Ready.</p>`, "#status");

CT.Unmount("#app");
```

Unmounting calls `ComponentOnUnmount` on the mounted root component and removes its DOM.
