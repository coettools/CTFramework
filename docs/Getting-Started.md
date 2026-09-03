# Getting Started

## Install And Import

Build CTFramework, then link it locally while developing another project:

```bash
npm run build
npm link
```

In the consuming project:

```bash
npm link @coettools/ctframework
```

Create an application entry module:

```js
import CT, { Component } from "@coettools/ctframework";

const html = CT.Html;

class App extends Component {
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

CT(() => {
  CT.Mount(App, "#app");
});
```

The document needs a mount target:

```html
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.js"></script>
</body>
```

`CT.Mount` adds CTFramework's default stylesheet once. Add ordinary project CSS after your module or stylesheet links to override its layered defaults. See [Styling](Styling.md).

## Use The Standalone Bundle

`npm run build` creates two self-contained ES modules: `dist/ctframework.bundle.js` for local debugging and `dist/ctframework.bundle.min.js` for production. Both embed CTFramework's default CSS, so neither needs a source-folder import or separate CTFramework stylesheet. Copy the production file into a project's `vendor/` folder and import it normally:

```html
<script type="module" src="/src/main.js"></script>
```

```js
import CT, { Component, DataTable } from "/vendor/ctframework.bundle.min.js";
```

Use the package import for package-managed projects, and use the standalone bundle for raw static sites or projects that intentionally keep their dependencies as local files. Package-managed projects may explicitly import `@coettools/ctframework/bundle` for the minified bundle or `@coettools/ctframework/bundle/debug` for the readable version.

## Mount And Unmount

`CT.Mount` accepts either a component class plus props, or a constructed component instance. The target can be a selector or an element.

```js
CT.Mount(App, "#app", { UserName: "Ada" });

const app = new App({ UserName: "Ada" });
CT.Mount(app, document.querySelector("#app"));

CT.Unmount("#app");
```

Unmounting calls `ComponentOnUnmount` on the mounted root component and removes its DOM.
