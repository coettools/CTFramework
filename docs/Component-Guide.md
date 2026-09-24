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

State changes immediately; DOM updates are batched into an animation frame. Callback updates receive the latest state, including earlier updates from the same event. `ForceUpdate` bypasses `ShouldComponentUpdate`. Calls to either method after unmount are ignored; still release timers, subscriptions, and requests in your cleanup hook.

## Lifecycle Methods

Implement only the lifecycle methods needed by the component:

```js
class LiveStatus extends Component {
  ComponentOnMount() {
    this.Refresh();
  }

  ComponentOnUpdate(_, previousState) {
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

During `ShouldComponentUpdate`, `this.props` and `this.state` hold the previous values; the arguments contain the proposed values. Returning `false` skips rendering, not the state/prop assignment. Keep this method free of side effects. `ComponentOnUpdate` receives the previous values after an update is accepted.

A nested component's render failure stays in that component's view. A later state or parent update can render it again; the fallback does not leave a detached component behind.

## Child Components

Use `CT.View` to include your own component in a template or a layout's `Content`. It returns a view description; CTFramework constructs and renders the child when its parent is mounted.

This complete entry module defines a child counter and its parent. Load it with a module script from a page containing `<div id="app"></div>`. The bundle path assumes the module is in `src/` and the bundle is in `vendor/`; adjust it to match your files. `Counter` and `App` are example classes, not framework controls.

```js
import CT, { Component } from "../vendor/ctframework.bundle.min.js";

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
    return html`<section>
      <p role="status">Count: ${this.state.Count}</p>
      <button type="button" ${CT.On("click", () => this.Increase())}>
        Increment
      </button>
    </section>`;
  }
}

class App extends Component {
  Render() {
    return html`<main>
      <h1>Child component example</h1>
      ${CT.View({
        Component: Counter,
        Props: { InitialCount: 5 },
      })}
    </main>`;
  }
}

// Add <div id="app"></div> to your HTML.
CT.Start({ App, Target: "#app" });
```

The counter starts at 5. Clicking Increment changes its own state without remounting the parent. `Props.InitialCount` supplies the initial value; the child owns subsequent changes to `Count`.

`Component` must be a class extending CTFramework's `Component`. `Props` defaults to an empty object. Read current parent values from `this.props` inside the child; copying props into state in the constructor captures only their initial values.

CTFramework manages the child's instance, rendering, and mount/update/unmount lifecycle. The same component type and identity retain local state across parent updates while receiving current props. Removing the child and adding it again starts a new instance.

For a changing list, supply a stable `Key` on the view options. Changing the key or component class deliberately creates a fresh child. Keep keys unique among siblings.

In this fragment, `people` is your data array and `PersonCard` is a component you define to display `this.props.Person`.

```js
return html`<section>
  ${people.map((person) => CT.View({
    Component: PersonCard,
    Props: { Person: person },
    Key: person.Id
  }))}
</section>`;
```

`CT.View` does not add a wrapper element or additional CSS. The child's markup and any controls it uses determine its appearance.

## Identity In Lists

Stateful framework controls accept `Key` to identify an item within a dynamic list. Use a stable record identifier, not the current array position. Moving a keyed control keeps its instance and state; removing it runs cleanup. Keys must be unique within that list.

```js
return html`<section>${records.map((record) => Dropdown({
  Key: record.Id,
  Label: record.Name,
  Options: ["Active", "Paused"],
  Value: record.Status,
  OnChange: (value) => UpdateStatus(record.Id, value)
}))}</section>`;
```

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

class App extends Component {
  constructor(props) {
    super(props);

    this.state = { ActivePage: "home" };
    this._pageHost = null;
  }

  ComponentOnMount() {
    this._pageHost = this.vnode.dom.querySelector("#page");

    this.MountPage();
  }

  ComponentOnUpdate(_, previousState) {
    if (previousState.ActivePage === this.state.ActivePage) return;

    this.MountPage();
  }

  ComponentOnUnmount() {
    CT.Unmount(this._pageHost);
    this._pageHost = null;
  }

  Navigate(pageName) {
    this.SetState({ ActivePage: pageName });
  }

  MountPage() {
    const pageClass = this.state.ActivePage === "settings" ? SettingsPage : HomePage;
    this._page = new pageClass({});

    CT.Mount(this._page, this._pageHost);
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
