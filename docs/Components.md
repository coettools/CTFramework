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
  Footer: html`<small>coettools</small>`
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

`Value` selects the matching option on the first render, including numeric zero.
You can replace `Options` and `Value` together in a parent update; option children
are rendered before the selected value is applied.

## SideNavigation

`SideNavigation` lists the supplied items and highlights the active page. Its icon-only collapse control reduces the navigation to a compact rail and shows a short hover hint. Expanding restores the full item list.

```js
${SideNavigation({
  Title: "Workspace",
  ActiveId: activeArea,
  Items: [
    { Id: "overview", Label: "Overview" },
    { Id: "settings", Label: "Settings" }
  ],
  OnNavigate: (item) => this.SetState({ activeArea: item.Id })
})}
```

## Tooltip

`Tooltip` adds a short hover hint to a control without changing the control itself. `Content` is the element to wrap. `Position` is `top` by default and also supports `right`.

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

## CodeBlock

Use `CodeBlock` for source examples, configuration, or logs. It preserves indentation,
adds basic syntax colours, and keeps long lines inside its own scroll area. No runtime
dependency or remote service is used. The wiki and showcase use this same control.

```js
import { CodeBlock } from "./vendor/ctframework.bundle.min.js";

const source = [
  "const Add = (left, right) => {",
  "  return left + right;",
  "};"
].join("\n");

CodeBlock({
  Title: "Helpers.js",
  Language: "javascript",
  Code: source
});
```

Return the result from `Render`, interpolate it inside `CT.Html`, or pass it to
`CT.Mount`. Use a separate live component beside it when an example needs a preview.
`Code` is always text: HTML and scripts are never executed.

| Option | Default | Purpose |
| --- | --- | --- |
| `Code` | `""` | Source string. Preserve your newlines and indentation here. |
| `Title` | `""` | Optional filename or caption, also used as the scroll region's accessible name. |
| `Language` | `"javascript"` | `javascript`, `csharp`, `html`, `css`, `json`, or `text`. C# also accepts `c#` and `cs`. Unknown languages use plain text. |
| `LineNumbers` | `true` | Show a gutter; line numbers are excluded from the copied source. |
| `Wrap` | `false` | Initial wrapping state. The reader can toggle Wrap without changing the source. |
| `Copy` | `true` | Show Copy. It copies the original string, including indentation and line endings. |

The keyboard-focusable code region supports horizontal scrolling. Copy uses the
browser Clipboard API, normally available on HTTPS or localhost. If copying is
unavailable or denied, an inline message explains how to copy manually. `Copied`
appears only after the browser confirms success.

```js
CodeBlock({
  Title: "Response.json",
  Language: "json",
  Code: JSON.stringify(response, null, 2),
  Wrap: true,
  LineNumbers: false,
  Copy: false
});
```

This is a code display, not an editor or automatic formatter. Supply formatted
source; it does not rewrite your code. Highlighting is intentionally lightweight,
not a full language parser: JavaScript template strings use one string colour.
Inputs above 100,000 characters use plain text to limit highlighting work. For large
logs, display a useful excerpt rather than rendering an entire file.

### C# Examples

Set `Language: "csharp"` to display C# source with the same Copy, Wrap, and line-number
controls. The caption reads C#. For example:

```js
CodeBlock({
  Title: "Greeting.cs",
  Language: "csharp",
  Code: [
    "public static string Create(string name)",
    "{",
    '    return $"Hello, {name}!";',
    "}"
  ].join("\n")
});
```

C# highlighting covers keywords, built-in type keywords, comments, numbers,
directives, method calls, and character, regular, verbatim, interpolated, and raw
strings. These [C# string forms](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/strings/)
remain source text; CTFramework does not compile or run them. Use `String.raw` when
writing a JavaScript template string that contains C# backslash escapes.

Highlighting is lexical, not semantic: contextual keywords are coloured wherever
they occur, and custom types are not inferred. Interpolated string contents use one
string colour; nested C# expressions with their own quotes are not fully parsed.
Unfinished strings remain readable while editing an example.

See [Styling](Styling.md#style-code-examples) for syntax colours and scoped overrides.

## ImageCarousel

`ImageCarousel` displays one image at a time with a caption, previous/next buttons,
and numbered slide selectors. Navigation is manual: there is no autoplay, timer,
animation, or external dependency.

```js
import { ImageCarousel } from "./vendor/ctframework.bundle.min.js";

ImageCarousel({
  Label: "Project gallery",
  Images: [
    {
      Src: "./images/ridge.jpg",
      Alt: "Blue mountain ridges beneath a pale moon",
      Caption: "Northern ridge"
    },
    {
      Src: "./images/coast.jpg",
      Alt: "Rose-coloured peaks above the coast at dusk",
      Caption: "Coastal dusk"
    }
  ],
  OnChange: (index, image) => console.log(index, image.Caption)
});
```

Return the view from `Render` or interpolate it inside `CT.Html`, like the other
controls. Relative `Src` URLs resolve against the document URL, not the JavaScript
module. Include the referenced image files in the project's deployment output.

| Option | Default | Purpose |
| --- | --- | --- |
| `Images` | `[]` | Objects with a non-empty `Src`, descriptive `Alt`, and optional `Caption`. Invalid or empty sources are ignored. |
| `Label` | `"Image gallery"` | Visible title and accessible name. Give each gallery a meaningful label. |
| `InitialIndex` | `0` | Zero-based starting position, clamped to the available images. Read only at construction. |
| `Loop` | `true` | Wrap previous/next navigation. Set `false` to disable the respective button at each end. |
| `Fit` | `"contain"` | Show the full image. `"cover"` fills the frame with cropping; other values use contain. |
| `Indicators` | `true` | Show numbered image selectors. Set `false` for a large gallery to reduce tab stops. |
| `OnChange` | None | Receives `(index, image)` after user navigation changes the selected position. |

The index refers to the valid images after filtering. Replacing `Images` keeps the
current position when possible and clamps it when the list shrinks. Updating the
parent does not reset the selection. `OnChange` does not run during initial render,
data replacement, or selecting the already active image.

An empty gallery displays "No images to display." A single image has no navigation
controls. Failed loads display "Image unavailable." without blocking the remaining
slides; leaving that slide and returning tries its source again.

### Keyboard And Touch

Tab to the viewer and use Left/Right to navigate or Home/End to jump to the first or
last image. Buttons retain normal Tab, Enter, and Space behavior. Navigation keeps
focus in place and announces the new position. Horizontal swipes and mouse drags
of at least 40px also navigate; vertical gestures remain available for page scrolling.

Use meaningful `Alt` text. Use `Alt: ""` only when an image is intentionally
decorative. Captions are plain text, not HTML. Only the current image is in the DOM;
this control does not preload or download the entire gallery. Its accessible
structure follows the [WAI carousel pattern](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/).

The default frame is 16:9. See [carousel styling](Styling.md#style-image-galleries)
for changing its ratio and appearance without modifying the framework.

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
