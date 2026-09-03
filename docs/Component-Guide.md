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

Keep an application component structured around named responsibilities:

```js
class App extends Component {
  constructor(props) {
    super(props);
    this.state = { ActiveView: "home" };
  }

  Navigate(viewName) {
    this.SetState({ ActiveView: viewName });
  }

  RenderNavigation() {
    return html`<button ${CT.On("click", () => this.Navigate("settings"))}>Settings</button>`;
  }

  RenderCurrentView() {
    return this.state.ActiveView === "settings"
      ? html`<section>Settings</section>`
      : html`<section>Home</section>`;
  }

  Render() {
    return html`<main>${this.RenderNavigation()}${this.RenderCurrentView()}</main>`;
  }
}
```
