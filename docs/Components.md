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

## Chart

`Chart` draws numeric or time-based line/area series and category-based bars in
SVG, without another runtime library. The plot follows its container's width.
The full data table remains available even when drawing is thinned for width.
The following complete module needs `<div id="app"></div>` in the page.
For a plain browser import, replace the package path with your built vendor URL.

```js
import CT, { Chart, Component } from "@coettools/ctframework";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = { Hidden: [] };
  }

  ToggleSeries(id, visible) {
    this.SetState((state) => ({
      Hidden: visible ? state.Hidden.filter((value) => value !== id) : [...state.Hidden, id]
    }));
  }

  Render() {
    return Chart({
      Title: "Completed jobs",
      Height: 260,
      X: { Label: "Time", Format: (value) => `${value}s` },
      Y: { Label: "Jobs", Min: 0, Format: (value) => `${value} jobs` },
      Series: [
        { Id: "a", Label: "Queue A", Points: [{ X: 0, Y: 2 }, { X: 1, Y: 5 }, { X: 2, Y: 3 }] },
        { Id: "b", Label: "Queue B", Points: [{ X: 0, Y: 1 }, { X: 1, Y: 4 }, { X: 2, Y: 6 }], Dashed: true }
      ],
      Markers: [{ X: 1, Label: "Worker added" }],
      Hidden: this.state.Hidden,
      OnToggleSeries: (id, visible) => this.ToggleSeries(id, visible)
    });
  }
}

CT.Start({ App, Target: "#app" });
```

Bar values correspond to `Categories` in order. Negative values are supported;
positive and negative stacks accumulate separately. Use `Stacked: false` to
compare grouped bars, or `Stacked: true` to show their combined contributions.
This fragment belongs inside a component's `Render` method:

```js
return Chart({
  Title: "Jobs by queue",
  Type: "bar",
  Stacked: true,
  Categories: ["Morning", "Afternoon"],
  Y: { Label: "Jobs", Format: (value) => `${value} jobs` },
  Series: [
    { Id: "a", Label: "Queue A", Values: [12, 17] },
    { Id: "b", Label: "Queue B", Values: [8, 5] }
  ]
});
```

For `Type: "area"`, use the line-series `Points` shape. Stacked areas require
aligned x coordinates across all their series. This avoids implying values
where a series supplied no measurement. `Y: null` marks missing data; gaps are
not interpolated or silently treated as zero. Formatters receive numeric values
for continuous axes and category labels for bar X values;
use numeric timestamps or `Date` values for time coordinates and an appropriate
`X.Format`. No date-string parsing or time-zone assumption is added.

| Option | Default | Purpose |
| --- | --- | --- |
| `Title` | Required | Accessible name and visible heading. |
| `ShowTitle` | `true` | Hide only the visible heading; retain the accessible name. |
| `Type` | `"line"` | `"line"`, `"area"`, or `"bar"`. |
| `Height` | `240` | Plot height in CSS pixels. Width follows its container. |
| `X`, `Y` | Auto | Axis object with `Label`, `Min`, `Max`, `Format`, and `Ticks`. Explicit `Min: 0` is honored. |
| `X.Format`, `Y.Format` | Numeric/category text; ISO for Date X | `(value) => text`, used by ticks, tooltip, and table. Date coordinates normalize to numeric timestamps before custom formatting. |
| `X.Ticks`, `Y.Ticks` | About 5 | Optional explicit tick-value arrays; narrow widths reduce label density. |
| `Series` | `[]` | Unique `Id`, `Label`, optional `Color`, and either `Points` or `Values`. |
| `Series[].Points` | Required for line/area | `{ X, Y }` coordinates. X is finite numeric/Date; Y finite numeric or null. |
| `Series[].Values` | Required for bars | Values aligned to Categories, including null for missing values. |
| `Series[].Dashed` | `false` | Additional line-style cue; series also have labelled legend entries. |
| `Series[].Color` | Chart token | Optional project CSS color. Verify contrast after overriding it. |
| `Categories` | `[]` | Ordered category labels for bars. |
| `Stacked` | `false` | Stack bars/areas instead of independent areas or grouped bars. |
| `Markers` | `[]` | Line/area `{ X, Label }` vertical reference lines with text labels. |
| `Legend` | Multiple series | Show labelled series entries; these become toggles when OnToggleSeries is supplied. |
| `Hidden` | `[]` | Parent-controlled series IDs to omit from the plot and visible-data table. |
| `OnToggleSeries` | None | `(id, visible)` requests a parent update to Hidden; does not mutate parent state. |
| `EmptyText` | `"No data"` | Message when no visible measurements remain. Legend controls remain available. |
| `Key` | None | Managed component identity in a changing sibling list. |

Hover or touch the plot to inspect the nearest supplied x/category. Focus it and
use Left/Right for the same values with polite announcements. Missing values show
a dash rather than interpolation. Select **Show as table** for the formatted
full dataset; **Hide table** closes it. Resize keeps table and keyboard state.
Hidden series can be restored through their legend buttons. There is no entry
animation, data streaming, logarithmic scale, pan, or zoom API in this control.

Use the [chart tokens and styling](Styling.md#style-charts) for project overrides.

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
  RowKey: "Id",
  PageSize: 10,
  Columns: [
    { Key: "Name", Title: "Service" },
    {
      Key: "Status",
      Title: "Status",
      Render: (_, value) => Badge({
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
| `RowKey` | `"Id"` | Stable row property name or `(row) => key` function. |
| `Columns` | `[]` | `{ Key, Title, Value?, Render?, Searchable?, SearchText? }` definitions. |
| `PageSize` | `10` | Number of filtered rows per page. |
| `SearchPlaceholder` | `Search records` | Search field placeholder. |
| `EmptyText` | `No matching records.` | Message shown when no rows match. |

`Value(row)` replaces direct `row[Key]` lookup. `Render(row, value)` controls the rendered cell.

Every row key must be a unique non-empty string or finite number, including zero.
Column keys must also be unique. Missing or duplicate keys produce a clear error
rather than assigning an editor's state to another record. Use `RowKey: "Name"`
only when names are unique and do not change; prefer a permanent record ID.

Reordering rows or columns preserves mounted cell components. Filtering and paging
unmount rows that leave the view. Keep edits in application state, keyed by record
ID, if they must survive leaving the page.

Search uses configured column values, including `Value(row)` output. Hidden row
fields are not searched. Set `Searchable: false` to exclude a column, or supply
`SearchText(row, value)` when a renderer shows a different label:

```js
DataTable({
  Data: records,
  RowKey: (row) => row.ServiceId,
  Columns: [
    { Key: "Name", Title: "Service", Value: (row) => `Service ${row.Name}` },
    {
      Key: "Status",
      Title: "Status",
      SearchText: (_, value) => value === 1 ? "Ready" : "Offline",
      Render: (_, value) => Badge({ Text: value === 1 ? "Ready" : "Offline" })
    },
    { Key: "InternalCode", Title: "Reference", Searchable: false }
  ]
});
```

Search text must be a string, number, or boolean. Rendered HTML is never scraped
or executed to discover searchable text.

## Accordion

`Accordion` groups optional content behind compact expandable sections. Each item needs an `Id`, `Title`, and `Content`. Set `OpenIds` for initially open sections, and set `Multiple: true` when several sections may remain open.

Use unique non-empty string or finite number IDs, not array positions. Reordering
keeps each panel's state with its item. Collapsed content stays mounted; removed
items are unmounted. `OpenIds` is read initially, not a controlled open-state option.
Each trigger sits in an `h3` and is linked to its labelled panel with generated DOM
IDs. Two accordions may reuse the same item IDs without DOM ID collisions.
When more than six items can remain open together, panels use labelled groups
instead of creating a large number of region landmarks.

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
  Name: "Environment",
  Label: "Environment",
  Required: true,
  Disabled: false,
  Placeholder: "Select an option",
  Value: selectedEnvironment,
  Options: [
    { Value: "development", Label: "Development" },
    { Value: "production", Label: "Production" }
  ],
  OnChange: (value, option) => this.SetState({ selectedEnvironment: value })
})}
```

Options can be strings or `{ Value, Label }` objects. `OnChange(value, option)` receives the selected value and source option.

`Placeholder` defaults to `"Select an option"` and labels the empty-string option. Set it to a different string to change that prompt.

Selecting the placeholder calls `OnChange("", null)`. Handle that empty selection explicitly when the value is required; it does not throw or remount the select.

`Value` selects the matching option on the first render, including numeric zero.
You can replace `Options` and `Value` together in a parent update; option children
are rendered before the selected value is applied.

`Name` includes the selection in native `FormData` and `GetFormValues(form)`.
`Disabled` and `Required` default to `false` and use native select behavior:
disabled controls are omitted from submission; a required placeholder is invalid.
Reserve the empty string for the placeholder and give each option a unique value.

Keep `Value` in parent state and update it in `OnChange`. Native `form.reset()` or
a reset button restores the value supplied when the dropdown mounted, then calls
`OnChange` once so the parent stays in sync. If that option was removed, reset
selects the placeholder. A cancelled reset does not change the value or call back.

```js
return html`<form ${CT.On("submit", (event) => {
  event.preventDefault();
  const values = GetFormValues(event.currentTarget);
  console.log(values.Environment);
})}>
  ${Dropdown({
    Name: "Environment",
    Label: "Environment",
    Required: true,
    Value: this.state.Environment,
    Options: ["development", "production"],
    OnChange: (value) => this.SetState({ Environment: value })
  })}
  <button type="submit">Submit</button>
  <button type="reset">Reset</button>
</form>`;
```

## Combobox

Use `Combobox` when a person must choose one value from a long list. The text field filters options; it does not accept a new value. Keep `Value` in parent state and update it from `OnChange(value, option)`. Strings and objects with `Value` and `Label` can be mixed in `Options`.

This complete example needs `<div id="app"></div>` in the page and module tooling that resolves the package import:

```js
import CT, { Combobox, Component, GetFormValues } from "@coettools/ctframework";

const html = CT.Html;
const places = [
  { Value: "harbor", Label: "Harbor", Group: "Coast", Description: "Ferry terminal", Keywords: ["boat", "port"] },
  { Value: "beach", Label: "Beach", Group: "Coast" },
  { Value: "ridge", Label: "Ridge", Group: "Inland", Disabled: true }
];

class App extends Component {
  constructor(props) {
    super(props);
    this.state = { Place: "harbor" };
  }

  Render() {
    return html`<form ${CT.On("submit", (event) => {
      event.preventDefault();
      console.log(GetFormValues(event.currentTarget).Place);
    })}>
      ${Combobox({
        Id: "place",
        Name: "Place",
        Label: "Place",
        Placeholder: "Search places",
        Value: this.state.Place,
        Options: places,
        Required: true,
        EmptyText: "No places match",
        OnChange: (value) => this.SetState({ Place: value })
      })}
      <button type="submit">Submit</button>
      <button type="reset">Reset</button>
    </form>`;
  }
}

CT.Start({ App, Target: "#app" });
```

| Option | Default | Purpose |
| --- | --- | --- |
| `Id` | Generated | Input ID; the visible label points to it. |
| `Name` | None | Native form field name. The selected value, never the search text, is submitted through a hidden field and available to `GetFormValues`. |
| `Label` | Required | Visible input label. |
| `Placeholder` | `"Search"` | Search field placeholder. |
| `Value` | `""` | Parent-controlled selected value. Give each option a unique non-empty value. |
| `Options` | `[]` | Strings or `{ Value, Label, Group?, Description?, Keywords?, Disabled? }`. `Keywords` can be a string or an array. |
| `OnChange` | None | Receives `(value, option)` when selection changes; clearing calls `OnChange("", null)`. |
| `Required` / `Disabled` | `false` | Required selection or disabled control. Disabled fields are omitted from form submission. |
| `EmptyText` | `"No matches"` | Popup message when filtering finds no matches. |
| `MaxVisible` | `50` | Positive cap on matching options rendered at once, rounded down. Invalid or zero values use 50. |
| `Filter` | Built-in matching | Optional `(option, query) => boolean` replacing default matching. |
| `RenderOption` | None | Optional `(option) => CT.Html` for display-only row content; interactive descendants are not accepted. |
| `Key` | None | Stable identity when the component factory is used in a changing list. |

The built-in filter matches every query word, case-insensitively, against labels and keywords and ranks word-start matches first. Filtering waits 100 ms after typing. Only the first `MaxVisible` matches are shown, followed by a count of remaining matches. Group headings follow first-seen group order and cannot be selected. A polite status announces the result count. `Description` appears below a default option label; `RenderOption` replaces that default row content.

Typing, ArrowDown, or the toggle button opens the list; focus alone does not. ArrowUp/ArrowDown move over enabled options, Home/End jump to the first/last enabled option, and Enter selects the active one. Click or tap also selects. The input retains focus while the list is open. Escape closes the list, and Tab closes it and moves focus normally. Leaving without selecting restores the selected label (or an empty input); typed text is never committed. The clear button appears for a selection and calls `OnChange("", null)`.

Replacing `Options` while open retains an active option if it still matches. If the selected value disappears, the input becomes empty without calling `OnChange`. A native form reset restores the value supplied when the component mounted and calls `OnChange` once; if that option is gone, it reports the empty value. A cancelled reset has no effect. See [combobox styling](Styling.md#style-comboboxes-and-pan-zoom-views) for scoped CSS.

Option objects need a non-empty `Label` and a non-empty string or finite numeric
`Value`. Invalid entries are skipped; the first entry wins when values stringify
identically. Replace the `Options` array when changing entries so its search index
is rebuilt. A disabled option supplied as the parent's selected value stays
selected; users cannot choose it from the list. Invalid or interactive
`RenderOption` content uses the default label and description instead.

## PanZoomView

`PanZoomView` displays a bounded world plane. Supply a non-empty `Label`, finite `Bounds: { MinX, MinY, MaxX, MaxY }` with positive width and height, and either SVG `Content` or a canvas `Draw` callback. The `Camera` uses `{ X, Y, Zoom }`: `X` and `Y` are the world point at the viewport center. Keep it in parent state through `OnCameraChange` when the parent controls it. Without `Camera`, the view initially fits the bounds. The viewport is a focusable, labelled `role="group"`.

For SVG content, `CT.Html` accepts detached SVG child roots such as `g` and `circle` and gives them the SVG namespace when inserted. This complete example needs `<div id="app"></div>`:

```js
import CT, { Component, PanZoomView } from "@coettools/ctframework";

const html = CT.Html;

class App extends Component {
  constructor(props) {
    super(props);
    this.state = { Camera: null, Selected: "" };
    this._view = null;
    this._setView = (handle) => { this._view = handle; };
  }

  Render() {
    return html`<section>
      <button type="button" ${CT.On("click", () => this._view?.CenterOn(80, 50, 1.5))}>Find station</button>
      <div class="example-map">
        ${PanZoomView({
          Label: "Station map",
          Bounds: { MinX: 0, MinY: 0, MaxX: 200, MaxY: 100 },
          Camera: this.state.Camera,
          Content: html`<g>
            <rect x="0" y="0" width="200" height="100" fill="#1b3442"></rect>
            <circle data-ct-item="station" role="button" tabindex="0" aria-label="Station"
              cx="80" cy="50" r="12" fill="#2ab0b5"></circle>
          </g>`,
          OnCameraChange: (camera) => this.SetState({ Camera: camera }),
          OnItemActivate: (itemId) => this.SetState({ Selected: itemId }),
          Ref: this._setView
        })}
      </div>
      <p>Selected: ${this.state.Selected || "None"}</p>
    </section>`;
  }
}

CT.Start({ App, Target: "#app" });
```

Set `.example-map { height: 20rem; }` in the page stylesheet. SVG elements opt in to item events with `data-ct-item="id"`. Add `tabindex="0"`, `role="button"`, and an accessible name to interactive items; Enter and Space activate the focused item. A short click or tap activates an item, while a drag does not. `OnItemHover` can provide tooltip state from pointer hover.

For canvas, the caller draws and hit-tests its own data. `Draw(context, camera, size)` receives CSS-pixel `size` and a context already cleared and scaled for the device pixel ratio. Apply the camera transform in CSS pixels yourself. Canvas pixels are hidden from assistive technology, so provide an ordinary accessible alternative list for the same actions, as in this complete example:

```js
import CT, { Component, PanZoomView } from "@coettools/ctframework";

const html = CT.Html;
const points = [{ Id: "a", Name: "North stop", X: 40, Y: 30 }, { Id: "b", Name: "South stop", X: 160, Y: 70 }];

class App extends Component {
  constructor(props) {
    super(props);
    this.state = { Camera: null, Selected: "", Redraw: 0 };
    this._view = null;
    this._setView = (handle) => { this._view = handle; };
  }

  Render() {
    return html`<section>
      <div class="example-map">
        ${PanZoomView({
          Label: "Transit diagram",
          Bounds: { MinX: 0, MinY: 0, MaxX: 200, MaxY: 100 },
          Camera: this.state.Camera,
          Draw: (context, camera, size) => {
            context.translate(size.Width / 2, size.Height / 2);
            context.scale(camera.Zoom, camera.Zoom);
            context.translate(-camera.X, -camera.Y);
            context.fillStyle = "#2ab0b5";
            for (const point of points) {
              context.beginPath();
              context.arc(point.X, point.Y, 8, 0, Math.PI * 2);
              context.fill();
            }
          },
          HitTest: (worldX, worldY) => points.find((point) => Math.hypot(point.X - worldX, point.Y - worldY) <= 8)?.Id ?? null,
          Redraw: this.state.Redraw,
          OnCameraChange: (camera) => this.SetState({ Camera: camera }),
          OnItemActivate: (itemId) => this.SetState({ Selected: itemId }),
          Ref: this._setView
        })}
      </div>
      <h2>Stops</h2>
      <ul>${points.map((point) => html`<li>
        <button type="button" ${CT.On("click", () => {
          this._view?.CenterOn(point.X, point.Y, 1.5);
          this.SetState({ Selected: point.Id });
        })}>${point.Name}</button>
      </li>`)}</ul>
      <p>Selected: ${points.find((point) => point.Id === this.state.Selected)?.Name ?? "None"}</p>
    </section>`;
  }
}

CT.Start({ App, Target: "#app" });
```

Again set `.example-map { height: 20rem; }`. When the underlying canvas data changes, pass a changed `Redraw` value to request another draw. `HitTest(worldX, worldY)` returns an item ID or `null`. The parent owns the alternative list, its labels, and its actions.

| Option | Default | Purpose |
| --- | --- | --- |
| `Label` | Required | Accessible name of the viewport. |
| `Bounds` | Required | World extent `{ MinX, MinY, MaxX, MaxY }`. |
| `Camera` | Fit to bounds initially | `{ X, Y, Zoom }`, with world center coordinates and positive zoom. |
| `MinZoom` / `MaxZoom` | Fit / `4` | Positive finite zoom limits; `MinZoom` must not exceed `MaxZoom`. |
| `Content` | None | SVG children in world coordinates; exclusive with `Draw`. |
| `Draw` | None | `(context, camera, size)` canvas drawing callback; exclusive with `Content`. |
| `HitTest` | None | `(worldX, worldY) => itemId or null` for canvas item events. |
| `Redraw` | None | Any value; changing it requests a canvas redraw. |
| `OnCameraChange` | None | `(camera)` after pan or zoom, at most once per animation frame. |
| `OnItemActivate` | None | `(itemId, event)` after a click, tap, or keyboard activation on an opted-in SVG item, or a canvas hit. |
| `OnItemHover` | None | `(itemId or null, event)` when pointer hover changes. |
| `Controls` | `true` | Show visible Zoom in, Zoom out, and Fit buttons. |
| `Ref` | None | `(handle) => ...` receives `{ CenterOn(x, y, zoom?) }` on mount, then `null` on unmount. |
| `Key` | None | Stable identity when the component factory is used in a changing list. |

Drag with a mouse or one touch pointer to pan; movement below 4 px remains a click. Wheel and trackpad zoom anchor to the pointer, and two-touch pinch anchors to its midpoint. Wheel and touch gestures inside the viewport do not scroll the page. Arrow keys pan by 10% of the current view; `+`/`-` zoom at the center and `0` fits the bounds. Tab reaches SVG items when they are focusable. The view uses native pointer events and `ResizeObserver` to track its container.

The camera is clamped so each axis keeps an overlap of 20% of the smaller of the visible world footprint and the bounds. At high zoom, that means 20% of the viewport footprint, not 20% of the entire bounds. `CenterOn(x, y, zoom?)` animates for 180 ms, subject to clamping, and moves immediately when reduced motion is preferred. The root fills its container with `width: 100%`, `height: 100%`, and `min-height: 16rem`; set the container dimensions. Performance with large scenes depends on the caller's drawing work and requires profiling on target devices. See [viewport styling](Styling.md#style-comboboxes-and-pan-zoom-views).

## SideNavigation

`SideNavigation` lists the supplied items and highlights the active page. Its icon-only collapse control reduces the navigation to a compact rail and shows a short hover hint. Expanding restores the full item list.

The active button exposes `aria-current="page"`. Collapse/Expand hints remain
hover-only and hide on click until the pointer leaves and enters again.

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

`Tooltip` adds a short hint on hover or keyboard focus. `Content` should contain one
target control. `Position` is `top` by default and also supports `right`.

```js
${Tooltip({
  Text: "Save the current changes",
  Position: "top",
  Content: html`<button type="button">Save</button>`
})}
```

The hint is associated with the first enabled control through `aria-describedby`;
existing description IDs are preserved. Text-only content gets a focusable wrapper.
Escape or clicking the target dismisses the hint until a new hover or focus entry.
Moving the pointer over the hint keeps it visible. Keep tooltip text short and put
links, buttons, and essential instructions in ordinary page content instead.
The default hint width and position adjust to remain inside the viewport edges.

`ShowOnFocus` defaults to `true`. Set it to `false` for a deliberate hover-only
hint, as SideNavigation does. Provide a visible or accessible label independently:

```js
Tooltip({
  Text: "Expand",
  ShowOnFocus: false,
  Content: html`<button type="button" aria-label="Expand navigation">+</button>`
});
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

Return the result from a component's `Render` or interpolate it inside `CT.Html`.
Mount the containing component with `CT.Mount`. Use a separate live component
beside it when an example needs a preview.
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
    "namespace coettools.Examples",
    "{",
    "\tpublic static class Greeting",
    "\t{",
    "\t\tpublic static string Create(string name)",
    "\t\t{",
    '\t\t\treturn $"Hello, {name}!";',
    "\t\t}",
    "\t}",
    "}",
    ""
  ].join("\r\n")
});
```

C# highlighting covers keywords, built-in type keywords, comments, numbers,
directives, method calls, and character, regular, verbatim, interpolated, and raw
strings. These [C# string forms](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/strings/)
remain source text; CTFramework does not compile or run them. Use `String.raw` when
writing a JavaScript template string that contains C# backslash escapes.
The display normalizes CRLF to LF; Copy preserves the source's line endings and tabs.

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
| `Labels` | `{}` | Optional translated strings: `Carousel`, `Slide`, `Viewer`, `Previous`, `Next`, `Choose`, `NoImages`, `UnavailableImage`, `ImageUnavailable`, `ZeroImages`, `EmptyGallery`; callbacks `Count(number, total)` and `ShowImage(number)`. Missing labels retain English defaults. |
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

Non-urgent types use `role="status"` with polite announcements. `danger` uses
`role="alert"` with assertive announcements. Override this independently of color
with `Live: "polite"`, `"assertive"`, or `"off"`. Use `off` for static content that
does not need a live announcement; it removes the live-region role.

```js
Alert({ Type: "warning", Message: "Your session is about to expire.", Live: "assertive" });
Alert({ Type: "info", Message: "Example configuration", Live: "off" });
```

## Badge

`Badge` is a compact label, especially useful in a `DataTable` cell.

```js
${Badge({ Text: "In review", Type: "warning" })}
```

`Type` can be `default`, `info`, `success`, `warning`, or `danger`.

## Dialog

Set `CloseLabel` (default `"Close"`) and `CloseAriaLabel` (default `"Close dialog"`) to translate the close button. Updating these options preserves modal state, keyboard behavior and focus.

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

`Dialog` uses the browser's native modal top layer. Opening moves focus inside, Tab and Shift+Tab stay among its controls, and the background is inert. Escape, Close, and a backdrop click request `OnClose`; the parent must set `Open: false`. Closing restores focus to the opener when it still exists. Content is mounted only while open and cleaned up on close or unmount.

`Actions` is an array of `{ Label, ClassName?, OnClick }` objects. Keep related popup/notification previews inside `Content` if they must remain usable above an open modal. Elements outside a native modal cannot be brought above it using `z-index` alone.

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

It is an interactive non-modal window. Opening focuses its Close button once;
ordinary parent updates do not move focus. Tab can leave the window, and the rest
of the page stays usable. Escape while focus is inside requests `OnClose`; set
`Open: false` there. Closing returns focus to the opener if focus was still inside
the window. If the user already moved elsewhere, that focus is left alone.
Content unmounts when closed. Inside a Dialog, its Escape closes only the popup.
Use `Card` for passive output that should not receive opening focus.

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

Set `Visible` back to `true` to show the same notification again. Without `OnClose`, Close dismisses it locally; a subsequent `false` to `true` transition resets that dismissal.

## FallbackView

Use `FallbackView` when a route or expected resource is not available. CTFramework automatically shows a related error view when a component throws unexpectedly.

`Router` uses normal paths such as `/utilities`. Configure a real HTML entry or an explicit rewrite for each application page so direct links and refresh work. Keep missing assets as 404 responses. The framework's fallback renders client errors; it cannot replace a server's missing-page response. See [routing and hosting](Data-And-Services.md#routes-and-router).

```js
${FallbackView({
  Title: "Page not found",
  Message: "The requested page is not part of this application.",
  ActionLabel: "Return to dashboard",
  OnAction: () => router.Navigate("/")
})}
```
