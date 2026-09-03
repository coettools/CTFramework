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

The default mode uses hash paths (`#/settings`), so static hosts never need a server rewrite to avoid `Cannot GET /settings`. For a server that does return the frontend entry page for all routes:

```js
const router = new Router(routes, { UseHashRouting: false });
```

Static helpers:

```js
Router.NormalizePath("settings/"); // "/settings"
Router.ToHashPath("/settings"); // "#/settings"
Router.ShouldUseHashRouting(); // true
```

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
