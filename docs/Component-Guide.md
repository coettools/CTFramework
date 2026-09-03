# Component Guide

## Stateful Component

Extend `Component` when a view owns state or behavior. Keep custom helpers as instance methods so each component's work remains contained.

```js
import CT, { Component } from "@coettools/ctframework";

const html = CT.Html;

class Counter extends Component {
  constructor(props) {
    super(props);
    this.state = { Count: props.InitialCount ?? 0 };
  }

  Increase() {
    this.SetState((state) => ({ Count: state.Count + 1 }));
  }

  Render() {
    return html`
      <section class="ct-card">
        <p>Count: ${this.state.Count}</p>
        <button type="button" ${CT.On("click", () => this.Increase())}>Increase</button>
      </section>
    `;
  }
}
```

Use arrow functions for standalone helpers where they make sense:

```js
const FormatName = (firstName, lastName) => `${firstName} ${lastName}`.trim();
```

## Props

Props are passed to the constructor through `super(props)` and available as `this.props`.

```js
CT.Mount(Counter, "#counter", { InitialCount: 10 });
```

## SetState And ForceUpdate

`SetState` accepts an object or a function. Object state merges into the existing state. CTFramework schedules one affected component update and preserves active input DOM.

```js
this.SetState({ IsSaving: true });

this.SetState((state, props) => ({
  Count: state.Count + props.Step
}));

this.ForceUpdate();
```

Use `ForceUpdate` only when data outside `state` or `props` changed. Prefer `SetState` for normal UI changes.

## Lifecycle Methods

Implement only the lifecycle methods needed by the component:

```js
class LiveStatus extends Component {
  ComponentOnMount() {
    this.Refresh();
  }

  ComponentOnUpdate(previousProps, previousState) {
    if (previousState.RefreshInterval !== this.state.RefreshInterval) {
      this.ConfigureRefresh();
    }
  }

  ComponentOnUnmount() {
    clearInterval(this.refreshTimer);
  }

  ShouldComponentUpdate(nextProps, nextState) {
    return nextState.Status !== this.state.Status || nextProps.Title !== this.props.Title;
  }

  ComponentOnCatch(error, info) {
    console.error("Status view failed", error, info);
  }

  Render() {
    return html`<p>${this.state.Status}</p>`;
  }
}
```

`Render()` is required. If it throws, CTFramework calls `ComponentOnCatch(error, info)` and replaces the view with its safe error fallback.

## Component Organization

Give each navigation page its own file and component class. Keep page state, handlers, and lifecycle work in that class. App.js owns the shell and navigation; shared view helpers belong in components/.

```text
App.js
pages/
  HomePage.js
  SettingsPage.js
components/
  PageHeading.js
```

For example, pages/SettingsPage.js owns the settings view:

```js
import CT, { Component } from "@coettools/ctframework";

const html = CT.Html;

export class SettingsPage extends Component {
  Render() {
    return html`<section><h1>Settings</h1></section>`;
  }
}
```

The application mounts the selected page into a dedicated host using the public CT.Mount API:

```js
import CT, { Component } from "@coettools/ctframework";
import { HomePage } from "./pages/HomePage.js";
import { SettingsPage } from "./pages/SettingsPage.js";

const html = CT.Html;
const Pages = { home: HomePage, settings: SettingsPage };

class App extends Component {
  constructor(props) {
    super(props);
    this.state = { ActiveView: "home" };
  }

  Navigate(viewName) {
    this.SetState({ ActiveView: viewName });
  }

  MountPage() {
    CT.Mount(Pages[this.state.ActiveView], "#page");
  }

  ComponentOnMount() {
    this.MountPage();
  }

  ComponentOnUpdate(prevProps, prevState) {
    if (prevState.ActiveView !== this.state.ActiveView) {
      this.MountPage();
    }
  }

  ComponentOnUnmount() {
    CT.Unmount("#page");
  }

  Render() {
    return html`
      <main>
        <nav>
          <button ${CT.On("click", () => this.Navigate("home"))}>Home</button>
          <button ${CT.On("click", () => this.Navigate("settings"))}>Settings</button>
        </nav>
        <div id="page"></div>
      </main>
    `;
  }
}
```

Keep the page host empty in the shell template: the mounted page owns its contents. CT.Mount unmounts the previous page and runs its cleanup before mounting the next page. The shell must also call CT.Unmount for that host during its own cleanup. Page state starts fresh when returning to a page; use Store when state needs to outlive it.

The wiki demonstrates this structure with a Pages.js registry and one class for every navigation section.
