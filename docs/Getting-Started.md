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

CT.Start({ App, Target: "#app" });
```

The document needs a mount target:

```html
<body>
  <div id="app">The application has not started. Check the browser console if this message remains.</div>
  <script type="module" src="./src/Main.js"></script>
</body>
```

`CT.Start` mounts the application and adds CTFramework's default stylesheet once. Add ordinary project CSS to override its layered defaults. See [Styling](Styling.md).

## Use The Standalone Bundle

In the CTFramework repository, run `npm ci` once to install build dependencies, then `npm run build`. This creates two self-contained ES modules: `dist/ctframework.bundle.js` for local debugging and `dist/ctframework.bundle.min.js` for production. Both embed CTFramework's default CSS, so neither needs a source-folder import or separate CTFramework stylesheet. Copy the production file into a project's `vendor/` folder and keep `LICENSE` beside it as `LICENSE.ctframework`.

These steps set up CTFramework for use in another application. A clone or fork of CTFramework contains the source, not generated `dist/`, so build it locally first. Build dependencies are not browser runtime dependencies.

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

CT.Start({ App, Target: "#app" });
```

Open the project folder in VS Code and choose **Open with Live Server** on `index.html`, or use any HTTP static server. There is no need to write a custom server, install application packages, or run a build to test these files. Native module imports require HTTP rather than opening `index.html` through `file://`. Keep import path casing exact for case-sensitive servers. A plain browser cannot resolve `@coettools/ctframework` by itself; use the relative bundle import above unless your project has a package resolver or import map.

Package-managed projects may explicitly import `@coettools/ctframework/bundle` for the minified bundle or `@coettools/ctframework/bundle/debug` for the readable version. Use one variant consistently throughout the application.

## Start An Application

`CT.Start` is the application entry point. Pass your `Component` subclass as `App`, not an instance or a call to `Render`. `Target` accepts an element or selector and defaults to `"#app"`. Optional `Props` is an object passed to the constructor.

```js
CT.Start({
  App,
  Target: "#app",
  Props: { UserName: "Ada" }
});
```

The framework waits until the document is ready, resolves the target, mounts the component, and adds the default CSS once. Its promise resolves to the rendered root DOM node or the standard error fallback. Invalid options, constructor failures, and mounting errors are reported to the console. A missing or invalid target resolves to `null` without replacing other page content. If the fallback itself cannot be displayed, the result is also `null`.

Keep a short message in the HTML mount element: if a script or static import cannot load, no JavaScript entry point can run to replace that message. `CT.Start` does not catch failures that prevent the framework or your entry module from loading. Applications needing custom import recovery can retain a small import-error boundary in their entry module.

Use `CT.View` to include stateful children inside your application's returned content. See [Child Components](Component-Guide.md#child-components).

## Mount And Unmount

`CT.Mount` accepts a `Component` subclass plus props or a constructed component instance. The target can be a selector or an element. Return `CT.Html` or a control view from the component's `Render` method; the current runtime does not mount those views directly.

```js
CT.Mount(App, "#app", { UserName: "Ada" });

const app = new App({ UserName: "Ada" });
CT.Mount(app, document.querySelector("#app"));

class Status extends Component {
  Render() {
    return html`<p>Ready.</p>`;
  }
}

CT.Mount(Status, "#status");

CT.Unmount("#app");
```

Unmounting calls `ComponentOnUnmount` on the mounted root component and removes its DOM.
