# Data And Services

## Routes And Router

`Route(path, component)` creates a small route record. `component` can be an application view name, class, or any value your application uses to choose a view.

```js
const routes = [
  Route("/", "home"),
  Route("/settings", "settings"),
  Route("*", "not-found")
];

const router = new Router(routes);
const unsubscribe = router.Subscribe((path, route) => console.log(path, route.component));

router.Navigate("/settings");
router.Replace("/");
const activeRoute = router.Resolve();
const currentPath = router.GetCurrentPath();

unsubscribe();
router.Destroy();
```

Routes use normal URL paths such as `/settings`. Navigate and Replace update browser history without reloading the document; Back and Forward notify subscribers. Subscribe does not render the initial page, so call your page-rendering function once after subscribing.

Pages can remain JavaScript Component classes with one `index.html`. Register each path against its class using Route; Router resolves the class and notifies your application when the path changes. No separate HTML page is required.

For direct links and refresh, configure your host to serve that same `index.html` for application paths. This is a server rewrite, not another router: CTFramework still selects the page. Missing scripts and images must return 404. A JavaScript fallback cannot repair a server's missing-page response.

For an application hosted at `/guide/`, keep route records relative to that application:

```js
const router = new Router(routes, { BasePath: "/guide" });
router.Navigate("/settings"); // URL: /guide/settings
```

Static helpers:

```js
Router.NormalizePath("settings/"); // "/settings"
Router.NormalizePath("/settings?tab=profile#details"); // "/settings"
```

BasePath defaults to `/`. GetCurrentPath returns the route without that prefix, or null outside its boundary. Resolve matches exact normalized pathnames, then `*` or `/*`; it does not parse route parameters. Query strings and ordinary section fragments are preserved by navigation but ignored for matching. Read them using the browser's URL APIs. Pass application paths, not external URLs or fragment-only navigation. Use native anchors for ordinary section links. Clean-path routing is the only mode; no hash-routing helpers or compatibility aliases are included.

## Store

`Store` is a small shared state container. `SetState` merges an object; `ReplaceState` replaces it completely.

```js
const userStore = new Store({ User: null, IsLoading: false });

const unsubscribe = userStore.Subscribe((state) => {
  console.log(state.User);
});

userStore.SetState({ IsLoading: true });
userStore.SetState((state) => ({ IsLoading: !state.IsLoading }));
userStore.ReplaceState({ User: { Name: "Ada" }, IsLoading: false });
const state = userStore.GetState();
userStore.Notify();

unsubscribe();
userStore.Destroy();
```

## HttpClient

`HttpClient` is a thin `fetch` wrapper. Plain object request bodies become JSON and receive `Content-Type: application/json`; `FormData`, `Blob`, `URLSearchParams`, and binary bodies are left intact.

Arrays also become JSON. This happens even when you supply a content type yourself; your explicit header is preserved. For a non-JSON encoding, provide an already encoded string or native fetch body. Typed arrays, `DataView`, buffers, and streams are passed through without JSON conversion.

Headers accept plain objects, native `Headers`, or `[name, value]` pairs. Request headers override client defaults case-insensitively:

```js
await httpClient.Post("/users", { Name: "Ada" }, {
  headers: new Headers({ "content-type": "application/json" })
});
```

```js
const httpClient = new HttpClient({
  baseUrl: "/api",
  headers: { Authorization: "Bearer token" }
});

const statusResponse = await httpClient.Get("/status");
const status = await statusResponse.json();

await httpClient.Post("/users", { Name: "Ada" });
await httpClient.Put("/users/42", { Name: "Grace" });
await httpClient.Patch("/users/42", { IsActive: true });
await httpClient.Delete("/users/42");

await httpClient.Request("/reports", {
  method: "GET",
  headers: { Accept: "text/csv" }
});
```

Pass standard fetch options as the final method argument:

```js
await httpClient.Post("/users", { Name: "Ada" }, { signal: abortController.signal });
```

## Form Values

`GetFormValues(formElement)` returns a plain object from named form controls. Repeated fields become arrays.

All field names are own properties, including `constructor` and `__proto__`. Files stay `File` objects; use `FormData` directly when uploading a form.

```js
const HandleSubmit = (event) => {
  event.preventDefault();
  const values = GetFormValues(event.currentTarget);
  console.log(values.Name, values.Roles);
};

const view = html`
  <form ${CT.On("submit", HandleSubmit)}>
    <input name="Name">
    <label><input type="checkbox" name="Roles" value="Admin"> Admin</label>
    <label><input type="checkbox" name="Roles" value="Editor"> Editor</label>
    <button>Save</button>
  </form>
`;
```

## Guid And Validation

`Guid()` creates a version-4 UUID using the browser's cryptographic random source (`randomUUID`, or `getRandomValues` where needed). It requires Web Crypto and never falls back to `Math.random`. Use it for identifiers, not as a replacement for authentication or server-side authorization.

```js
const id = Guid();

const IsValidName = (name) => {
  return Required(name) && MaxLength(name, 80);
};

if (!IsValidName(values.Name)) {
  console.log("A name is required and cannot exceed 80 characters.");
}
```

`Required(value)` rejects null, undefined, empty strings, and whitespace. `MaxLength(value, length)` returns `true` when the supplied value has at most `length` characters.
