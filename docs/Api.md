# CTFramework API

This is the compact public API index. For copy-ready individual examples, use the [CTFramework Guide](Guide.md). Component-specific options are in [Components.md](Components.md), and default CSS and overrides are in [Styling.md](Styling.md).

```js
import CT, {
  Accordion,
  Alert,
  Badge,
  Card,
  Component,
  DataTable,
  Dialog,
  Dropdown,
  FallbackView,
  GetFormValues,
  Guid,
  HttpClient,
  MaxLength,
  PopupWindow,
  Required,
  Route,
  Router,
  SideNavigation,
  Store,
  Toast
} from "@coettools/ctframework";
```

## CT

`CT` is the default export. It provides document readiness, direct DOM selection, templates, event markers, dynamic attributes, and mounting.

| API | Purpose |
| --- | --- |
| `CT(callback)` | Runs `callback` once the document is ready. |
| `CT(selector, scope?)` | Returns a chainable DOM selection. |
| `CT.Html` | Tagged template function for component markup. One root HTML element is required. |
| `CT.On(eventType, handler)` | Adds an event marker inside an HTML start tag. |
| `CT.Attr(name, value)` | Adds a dynamic attribute marker inside an HTML start tag. |
| `CT.Mount(ComponentClassOrInstance, target, props?)` | Renders a component into an element or selector. |
| `CT.Unmount(target)` | Removes a mounted component and runs its unmount lifecycle. |

```js
const html = CT.Html;

return html`
  <button
    ${CT.Attr("className", isReady ? "ready" : "waiting")}
    ${CT.On("click", save)}
  >Save</button>
`;
```

Selections provide `Get`, `Each`, `Find`, `On`, `Attr`, `Data`, `Css`, `Html`, `Text`, `AddClass`, `RemoveClass`, `ToggleClass`, `HasClass`, and `Remove`.

## Component

Extend `Component` for stateful UI. `constructor` and `Render` are the normal places for component setup and markup. `SetState` merges an object into the current state and updates only the component’s affected dynamic template slots.

| Method | Purpose |
| --- | --- |
| `SetState(newState)` | Merges an object or applies a state callback. |
| `ForceUpdate()` | Schedules a component render without changing state. |
| `ShouldComponentUpdate(nextProps, nextState)` | Return `false` to skip an update. |
| `Render()` | Required. Returns CT markup. |
| `ComponentOnMount()` | Runs after the component enters the DOM. |
| `ComponentOnUpdate(previousProps, previousState)` | Runs after an update. |
| `ComponentOnUnmount()` | Runs before removal. |
| `ComponentOnCatch(error, info)` | Runs when rendering fails before CTFramework shows its fallback error view. |

Use one root element in every `CT.Html` template. Dynamic content may be nested anywhere inside that root, including table cells. CTFramework updates dynamic slots in place, preserving active inputs and unaffected DOM.

## Router And Route

`Route(path, component)` creates a route entry. `Router` manages the current route and browser navigation.

```js
const router = new Router([
  Route("/", "home"),
  Route("/utilities", "utilities"),
  Route("*", "not-found")
]);

router.Subscribe((currentPath, route) => {
  console.log(currentPath, route);
});

router.Navigate("/utilities");
```

`Router` uses hash paths such as `#/utilities` by default, preventing static hosts from returning `Cannot GET /utilities` after a refresh. Use clean history paths only when the server returns the application entry point for client routes:

```js
const router = new Router(routes, { UseHashRouting: false });
```

| Method | Purpose |
| --- | --- |
| `Navigate(path)` | Adds a browser history entry and notifies subscribers. |
| `Replace(path)` | Replaces the current browser history entry. |
| `Resolve(path?)` | Returns the matching route or wildcard route. |
| `Subscribe(listener)` | Registers a listener and returns an unsubscribe function. |
| `Destroy()` | Removes browser listeners and subscriptions. |
| `GetCurrentPath()` | Returns the normalized current route. |
| `Router.NormalizePath(path)` | Normalizes a route path. |
| `Router.ToHashPath(path)` | Converts a path to `#/...`. |
| `Router.ShouldUseHashRouting()` | Returns CTFramework’s default routing mode. |

## Store

`Store` is a small shared-state container.

```js
const store = new Store({ count: 0 });

const unsubscribe = store.Subscribe((state) => console.log(state.count));
store.SetState((state) => ({ count: state.count + 1 }));
unsubscribe();
```

| Method | Purpose |
| --- | --- |
| `GetState()` | Returns the current state object. |
| `SetState(newState)` | Merges an object or applies a callback result. |
| `ReplaceState(newState)` | Replaces the complete state object. |
| `Subscribe(listener)` | Registers a listener and returns an unsubscribe function. |
| `Notify()` | Notifies current subscribers with the latest state. |
| `Destroy()` | Removes all listeners. |

## HttpClient

`HttpClient` is a thin wrapper around `fetch` with JSON and header handling.

```js
const httpClient = new HttpClient({
  baseUrl: "/api",
  headers: { Authorization: "Bearer token" }
});
const response = await httpClient.Get("/status");
const status = await response.json();
```

| Method | Purpose |
| --- | --- |
| `Request(path, options?)` | Sends a custom fetch request. |
| `Get(path, options?)` | Sends a GET request. |
| `Post(path, body, options?)` | Sends a POST request. |
| `Put(path, body, options?)` | Sends a PUT request. |
| `Patch(path, body, options?)` | Sends a PATCH request. |
| `Delete(path, options?)` | Sends a DELETE request. |

The constructor accepts `baseUrl` and `headers`. Pass a request options object as the final argument when needed. `FormData` bodies remain unchanged; plain object bodies are serialized as JSON.

## Utilities

| API | Purpose |
| --- | --- |
| `GetFormValues(form)` | Returns a plain object from a form’s named fields. |
| `Guid()` | Returns a version-4 GUID. |
| `Required(value)` | Returns `true` when a value is not null, undefined, empty, or whitespace. |
| `MaxLength(value, length)` | Returns `true` when a value does not exceed `length`. |

```js
const values = GetFormValues(event.target);

if (!Required(values.name) || !MaxLength(values.name, 80)) {
  return;
}

const requestId = Guid();
```

## Components

`Accordion`, `Alert`, `Badge`, `Card`, `DataTable`, `Dialog`, `Dropdown`, `FallbackView`, `PopupWindow`, `SideNavigation`, and `Toast` are documented in [Components.md](Components.md).
