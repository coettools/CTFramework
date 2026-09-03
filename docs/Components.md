# CTFramework Components

CTFramework components are plain JavaScript functions. Call a component with one options object inside `CT.Html`; no JSX, build plugin, or separate component package is needed. Public option names use PascalCase.

```js
const html = CT.Html;

return html`
  <main class="ct-shell">
    ${Card({
      Title: "Operations",
      Content: html`<p>Component content remains plain HTML.</p>`
    })}
  </main>
`;
```

## ApplicationLayout

`ApplicationLayout` is the default application shell: a fixed `Header`, optional `SideNavigation`, independently scrolling `Content`, and optional `Footer`. It fills the desktop viewport and returns to normal page scrolling on smaller screens. Pass raw HTML or CTFramework components to each region.

```js
${ApplicationLayout({
  Header: html`<div><strong>Operations</strong></div>`,
  SideNavigation: SideNavigation({
    Title: "Workspace",
    ActiveId: activeArea,
    Items: navigationItems,
    OnNavigate: (item) => this.SetState({ activeArea: item.Id })
  }),
  Content: html`<section><h1>Overview</h1><p>Only this region scrolls on desktop.</p></section>`,
  Footer: html`<small>CoetTools</small>`
})}
```

When `SideNavigation` is used, its collapse control reduces the layout to a compact rail automatically. Do not add fixed positioning or overflow rules in application CSS unless the project intentionally needs a different layout behavior.

## DataTable

`DataTable` provides client-side search and paging. `Data` is an array of plain objects. `Columns` controls the visible columns. A column's optional `Render(row, value)` function can return text, HTML, or another CTFramework component.

```js
${DataTable({
  Data: services,
  PageSize: 10,
  Columns: [
    { Key: "Name", Title: "Service" },
    {
      Key: "Status",
      Title: "Status",
      Render: (row, value) => Badge({
        Text: value,
        Type: value === "Ready" ? "success" : "warning"
      })
    }
  ]
})}
```

| Option | Default | Purpose |
| --- | --- | --- |
| `Data` | `[]` | Rows to search and page. |
| `Columns` | `[]` | `{ Key, Title, Value?, Render? }` definitions. |
| `PageSize` | `10` | Number of filtered rows per page. |
| `SearchPlaceholder` | `Search records` | Search field placeholder. |
| `EmptyText` | `No matching records.` | Message shown when no rows match. |

`Value(row)` replaces direct `row[Key]` lookup. `Render(row, value)` controls the rendered cell.

## Accordion

`Accordion` groups optional content behind compact expandable sections. Each item needs an `Id`, `Title`, and `Content`. Set `OpenIds` for initially open sections, and set `Multiple: true` when several sections may remain open.

```js
${Accordion({
  OpenIds: ["details"],
  Multiple: true,
  Items: [
    { Id: "details", Title: "Details", Content: html`<p>Deployment information.</p>` },
    { Id: "history", Title: "History", Content: html`<p>No earlier deployments.</p>` }
  ]
})}
```

## Dropdown

`Dropdown` renders a native, accessible select with dynamic options.

```js
${Dropdown({
  Id: "environment",
  Label: "Environment",
  Value: selectedEnvironment,
  Options: [
    { Value: "development", Label: "Development" },
    { Value: "production", Label: "Production" }
  ],
  OnChange: (value, option) => this.SetState({ selectedEnvironment: value })
})}
```

Options can be strings or `{ Value, Label }` objects. `OnChange(value, option)` receives the selected value and source option.

## SideNavigation

`SideNavigation` has an icon-only collapse control that reduces the navigation to a compact rail. The control exposes an accessible hover and keyboard-focus hint, and optional local search remains available when expanded.

```js
${SideNavigation({
  Title: "Workspace",
  Searchable: true,
  ActiveId: activeArea,
  Items: [
    { Id: "overview", Label: "Overview" },
    { Id: "settings", Label: "Settings" }
  ],
  OnNavigate: (item) => this.SetState({ activeArea: item.Id })
})}
```

## Tooltip

`Tooltip` adds a short hint to a control without changing the control itself. `Content` is the element to wrap. `Position` is `top` by default and also supports `right`.

```js
${Tooltip({
  Text: "Save the current changes",
  Position: "top",
  Content: html`<button type="button">Save</button>`
})}
```

## Card

```js
${Card({
  Title: "System health",
  Content: html`<p>All services are available.</p>`,
  Footer: html`<button type="button">Open details</button>`
})}
```

`Card` accepts `Title`, `Content`, and optional `Footer`.

## Alert

`Alert` communicates a status inside the normal page flow.

```js
${Alert({
  Title: "Saved",
  Message: "Your changes are available to the team.",
  Type: "success"
})}
```

`Type` can be `info`, `success`, `warning`, or `danger`.

## Badge

`Badge` is a compact label, especially useful in a `DataTable` cell.

```js
${Badge({ Text: "In review", Type: "warning" })}
```

`Type` can be `default`, `info`, `success`, `warning`, or `danger`.

## Dialog

These components are controlled by parent state. The parent owns `Open` or `Visible`, so the UI remains easy to trace.

```js
${Dialog({
  Open: this.state.IsDialogOpen,
  Title: "Delete record",
  Content: html`<p>This cannot be undone.</p>`,
  OnClose: () => this.SetState({ IsDialogOpen: false }),
  Actions: [
    { Label: "Cancel", ClassName: "ct-button-secondary", OnClick: () => this.SetState({ IsDialogOpen: false }) },
    { Label: "Delete", OnClick: deleteRecord }
  ]
})}
```

`Dialog` is modal and closes when its backdrop is selected. `Actions` is an array of `{ Label, ClassName?, OnClick }` objects.

## PopupWindow

```js
${PopupWindow({
  Open: this.state.IsWindowOpen,
  Position: "bottom-right",
  Title: "Build output",
  Content: html`<p class="ct-muted">Build completed.</p>`,
  OnClose: () => this.SetState({ IsWindowOpen: false })
})}
```

`PopupWindow` is non-blocking and accepts `top-left`, `top-right`, `bottom-left`, or `bottom-right` for `Position`.

## Toast

```js
${Toast({
  Visible: this.state.IsToastVisible,
  Title: "Saved",
  Message: "Changes are available.",
  Type: "success",
  OnClose: () => this.SetState({ IsToastVisible: false })
})}
```

`Toast` displays in the bottom-right and has a close action. Set the parent `Visible` state to `false` in `OnClose` when the notification must stay dismissed after another parent update.

## FallbackView

Use `FallbackView` when a route or expected resource is not available. CTFramework automatically shows a related error view when a component throws unexpectedly.

`Router` uses hash paths such as `#/utilities` by default. This keeps a direct link or browser refresh on a static host from producing `Cannot GET /utilities`. Use `{ UseHashRouting: false }` only when the application's server is configured to return the frontend entry page for every client route.

```js
${FallbackView({
  Title: "Page not found",
  Message: "The requested page is not part of this application.",
  ActionLabel: "Return to dashboard",
  OnAction: () => router.Navigate("/")
})}
```
