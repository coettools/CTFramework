# CTFramework Styling

Split is the default coettools design: graphite surroundings, navy panels, compact
corners, cyan actions, and green selection or success states. Borders stay neutral;
accent edges belong to headers and selected navigation items.

## Load The Default

`CT.Mount` adds the stylesheet once. Both standalone bundles embed it; no separate
framework CSS download or import is needed. The module distribution includes its
stylesheet in styles/Default.css.

```js
import CT, { Card } from "./vendor/ctframework.bundle.min.js";

CT(() => {
  CT.Mount(Card({
    Title: "Project status",
    Content: CT.Html`<p>Ready to work.</p>`
  }), "#app");
});
```

The stylesheet uses `@layer ctframework`. Normal, unlayered project CSS takes
precedence even when loaded before the first mount. Do not edit the vendor bundle
or framework source from a consuming project.

## Surface And Accent Roles

| Role | Default |
| --- | --- |
| Page, application navigation, inputs | Graphite #101315 |
| Cards, panels, dialogs, popups | Navy #081f2b |
| Headers, alerts, raised regions | Raised navy #102e3c |
| Primary actions, links, keyboard focus | Cyan #2ab0b5 |
| Selected navigation and success | Green #32cd32 |
| Panels / controls / badges | 6px / 4px / 3px corners at the default 16px root size |

Use the same roles in project-specific themes. Do not use a success color to imply
that an unrelated action succeeded. Status badges also include text, not color alone.

## Supplied Classes

```js
const html = CT.Html;

const Dashboard = () => html`
  <main class="ct-shell">
    <section class="ct-panel">
      <p class="ct-eyebrow">Project status</p>
      <h1>Ready to work</h1>
      <p class="ct-muted">Select a project to continue.</p>
      <button type="button">Open project</button>
      <button type="button" class="ct-button-secondary">Cancel</button>
    </section>
  </main>
`;
```

| Class | Purpose |
| --- | --- |
| `ct-shell` | Centered page container with responsive spacing. |
| `ct-panel` | Navy content surface with neutral borders and compact corners. |
| `ct-eyebrow` | Small uppercase accent label. |
| `ct-muted` | Secondary readable text. |
| `ct-button-secondary` | Transparent secondary action; raised surface on hover. |
| `ct-button-success` | Filled positive action with its own hover color. |
| `ct-status` | Compact success-colored monospace status text. |
| `ct-error` | Error text. |
| `ct-code-snippet` | Plain wrapping preformatted text, also used by startup/error fallbacks. Use CodeBlock for interactive source examples. |

Native buttons, fields, links, and keyboard focus indicators are styled as well.
Use labels on fields and keep the visible focus outline.

## Theme Properties

Names describe purpose rather than a particular palette. These are the supported
properties; no compatibility aliases are provided.

| Property | Default | Purpose |
| --- | --- | --- |
| `--ct-color-background` | #101315 | Page, navigation, code and field backgrounds. |
| `--ct-color-surface` | #081f2b | Panels, cards and windows. |
| `--ct-color-surface-raised` | #102e3c | Headers, alerts and secondary hover surfaces. |
| `--ct-color-accent` | #2ab0b5 | Main actions, links, selected accent edges and focus. |
| `--ct-color-accent-hover` | #46c8cc | Primary action hover. |
| `--ct-color-on-accent` | #021019 | Text on filled primary and success actions. |
| `--ct-color-success` | #32cd32 | Positive text, active navigation and success actions. |
| `--ct-color-success-hover` | #55dd55 | Success action hover. |
| `--ct-color-success-soft` | #19371f | Selected navigation and success badge backgrounds. |
| `--ct-color-text` | #e4e4eb | Primary text. |
| `--ct-color-muted` | #adb4bd | Secondary text and placeholders. |
| `--ct-color-warning` | #edc671 | Warning text and indicators. |
| `--ct-color-warning-soft` | #3b3020 | Warning badge background. |
| `--ct-color-danger` | #f3a2aa | Error text and indicators. |
| `--ct-color-danger-soft` | #40262e | Error badge background. |
| `--ct-color-border` | #354a55 | Panel borders and dividers. |
| `--ct-color-field-border` | #6b8390 | Visible boundaries around editable fields. |
| `--ct-color-backdrop` | rgba(5, 11, 18, .79) | Modal backdrop. |
| `--ct-code-keyword` | #81b6fa | Code keywords and HTML tags. |
| `--ct-code-string` | #b1ce91 | Code strings and template literals. |
| `--ct-code-number` | #e7b66b | Numbers, literal values and HTML entities. |
| `--ct-code-property` | #70cbd2 | Object properties, HTML attributes and CSS properties. |
| `--ct-code-function` | #e4d29c | JavaScript function calls. |
| `--ct-code-comment` | #94a3af | Code comments. |
| `--ct-radius-panel` | .375rem | Panels, cards and windows. |
| `--ct-radius-control` | .25rem | Buttons, fields, code, alerts, tooltips and toast. |
| `--ct-radius-badge` | .1875rem | Badge corners. |
| `--ct-font-family` | Bahnschrift, "Arial Narrow", sans-serif | Interface text; no remote font dependency. |
| `--ct-font-mono` | Consolas, "Courier New", monospace | Code and technical text. |
| `--ct-focus-ring` | none | Optional focus shadow; the accent outline stays visible. |

## Change An Accent

Place this in the project's own stylesheet. Update the hover and on-accent text
together so the button remains readable in both states.

```css
:root {
  --ct-color-accent: #e7b66b;
  --ct-color-accent-hover: #f2cc92;
  --ct-color-on-accent: #021019;
}
```

This changes actions and accent edges. It does not change success, warning, or error
meaning. To change positive states too, set success, success-hover, and success-soft.

## Change Corners

```css
/* Square treatment for this project. */
:root {
  --ct-radius-panel: 0;
  --ct-radius-control: 0;
  --ct-radius-badge: 0;
}
```

## Theme One Section

Custom properties inherit. A scoped override affects only that section, including
controls rendered within it. It does not change the wiki navigation or another page.

```css
.settings-section {
  --ct-color-accent: #e7b66b;
  --ct-color-accent-hover: #f2cc92;
}
```

```js
const Settings = () => CT.Html`
  <section class="settings-section">
    ${Card({ Title: "Settings", Content: CT.Html`<button>Save settings</button>` })}
  </section>
`;
```

## Use A Light Palette

Change the complete surface and status set, not just the page background. Bright
dark-theme accents need darker counterparts for text on pale surfaces.

```css
:root {
  color-scheme: light;
  --ct-color-background: #e6ebeb;
  --ct-color-surface: #f8fafa;
  --ct-color-surface-raised: #dce5e6;
  --ct-color-text: #162b34;
  --ct-color-muted: #4e626c;
  --ct-color-accent: #126a70;
  --ct-color-accent-hover: #0d555a;
  --ct-color-on-accent: #ffffff;
  --ct-color-success: #197532;
  --ct-color-success-hover: #105d26;
  --ct-color-success-soft: #d6e9db;
  --ct-color-warning: #795410;
  --ct-color-warning-soft: #f2e5c7;
  --ct-color-danger: #a8273a;
  --ct-color-danger-soft: #f6dce1;
  --ct-color-border: #a4b5bc;
  --ct-color-field-border: #697e89;
  --ct-color-backdrop: rgba(5, 11, 18, .65);
  --ct-code-keyword: #245993;
  --ct-code-string: #3b641d;
  --ct-code-number: #7a4b12;
  --ct-code-property: #14616a;
  --ct-code-function: #67551d;
  --ct-code-comment: #4e626c;
}
```

This is an optional project override, not an automatically switched framework theme.
Check normal, hover, focus, disabled, and status states after changing colors.

## Override A Component

Use normal selectors without `!important` or a competing layer. For example:

```css
/* Only this project's cards lose the header accent edge. */
.project-card .ct-card-header {
  border-left: 0;
}

/* Give a project popup more space without changing every dialog. */
.ct-popup-window {
  width: min(calc(100% - 2rem), 32rem);
}
```

Do not clip a navigation container to round its corners: its tooltip must be able
to extend over nearby content. Defaults preserve that overflow.

## Style Code Examples

`CodeBlock` uses a graphite code surface, a navy toolbar, 14px monospace text, and
1.65 line spacing. Long lines scroll locally unless Wrap is enabled. Syntax colours
are independent of success/warning colours so highlighting does not imply a status.

C# uses these same six syntax properties and token classes. No language-specific
stylesheet is needed; existing dark, light, and scoped overrides apply to C# too.
The default dialog constrains its content to the viewport, including on mobile;
unwrapped code scrolls inside the block instead of widening the dialog.

```css
/* Scope these changes to examples in one part of the project. */
.project-examples {
  --ct-code-keyword: #9fc7fa;
  --ct-code-string: #c3daa9;
}

.project-examples .ct-code-viewport {
  font-size: 1rem;
  line-height: 1.8;
  max-height: 32rem;
}
```

The root is `ct-code-block`; the main parts are `ct-code-toolbar`, `ct-code-caption`,
`ct-code-actions`, `ct-code-viewport`, `ct-code-source`, `ct-code-line`,
`ct-code-number`, `ct-code-text`, and `ct-code-feedback`. Highlight spans use
`ct-code-token-keyword`, `ct-code-token-string`, `ct-code-token-number`,
`ct-code-token-property`, `ct-code-token-function`, and `ct-code-token-comment`.
Prefer the six properties above to overriding individual token classes. When using
a light palette, change all six along with the code background and text.

## Style Image Galleries

`ImageCarousel` uses the same navy frame, graphite image surface, and green selected
state as other controls. It starts with a 16:9 image area and `Fit: "contain"` so
images are not cropped. Use `Fit: "cover"` when a project deliberately wants cropping.

```css
.project-gallery .ct-image-carousel-viewport {
  aspect-ratio: 4 / 3;
}

.project-gallery .ct-image-carousel-caption {
  font-size: .875rem;
  color: var(--ct-color-muted);
}
```

Wrap the control in `.project-gallery` to scope these overrides. Its root is
`ct-image-carousel`; parts are `ct-image-carousel-header`, `ct-image-carousel-count`,
`ct-image-carousel-slide`, `ct-image-carousel-viewport`, `ct-image-carousel-image`,
`ct-image-carousel-caption`, `ct-image-carousel-empty`, `ct-image-carousel-controls`,
`ct-image-carousel-previous`, `ct-image-carousel-next`, `ct-image-carousel-indicators`,
and `ct-image-carousel-indicator`. The selected button has `aria-current="true"`.
Keep the visible focus ring and `touch-action: pan-y pinch-zoom` on the viewer so
keyboard navigation, vertical scrolling, and zoom continue to work.

## Component Reference

Components add their own classes. Use these only when you need a focused override.

| Component | Class | Split treatment |
| --- | --- | --- |
| `ApplicationLayout` | `ct-application-layout` | Graphite shell, navy header with accent edge; independent content scrolling on desktop. |
| `SideNavigation` | `ct-side-navigation` | Graphite rail; green-tinted selection with a left edge. |
| `Card` | `ct-card` | Navy panel, raised header and selective accent edge. |
| `CodeBlock` | `ct-code-block` | Graphite source, navy toolbar, syntax colours, optional gutter, Copy and Wrap. |
| `ImageCarousel` | `ct-image-carousel` | Navy frame, uncropped 16:9 image viewer, caption, and green selected image button. |
| `Accordion` | `ct-accordion` | Navy surface, plus/minus indicator, active success-colored label. |
| `DataTable` | `ct-data-table` | Raised toolbar, neutral dividers, compact pager, horizontal table overflow. |
| `Dropdown` | `ct-dropdown` | Label and native graphite field with visible border. |
| `Badge` | `ct-badge` | Compact corners and tinted success, warning or danger background. |
| `Alert` | `ct-alert` | Raised surface with a status-colored left edge. |
| `Dialog` | `ct-dialog` | Navy modal panel inside a native `dialog.ct-dialog-backdrop`; tall content scrolls in the full-screen dialog. |
| `PopupWindow` | `ct-popup-window` | Fixed navy window with compact corners and bounded height. |
| `Toast` | `ct-toast` | Raised notification with a status edge. |
| `Tooltip` | `ct-tooltip` | Raised hover/focus label positioned above surrounding content. |
| `FallbackView` | `ct-fallback` | Navy recovery panel with an accent or error edge. |

Accordion headings use `ct-accordion-heading` with inherited font size and no
extra margin. Style `ct-accordion-trigger` rather than replacing its heading or
ARIA relationships. Disabled dropdowns use the same reduced opacity as buttons.

Tooltip visibility is controlled by the component's `hidden` state, not a CSS
`:hover` rule. Do not override `[hidden]` or force tooltips to display; that would
undo click and Escape dismissal. Its `::before` area bridges the small pointer gap
between the trigger and hint. Keep that bridge when overriding positioning.
Hints have a viewport-bounded width and an inline margin adjustment at screen
edges; avoid overriding those margins if you want the default edge protection.

PopupWindow keeps its focus ring, bounded height, and scroll area. Alert's `Live`
option changes announcements, not its `Type` colors. Use semantic behavior options
in JavaScript and visual overrides in project CSS.

## Keep Styles In Sync

A new or changed control needs its default CSS, usage example, showcase, wiki entry,
and tests in the same change. JavaScript uses PascalCase; framework CSS classes and
properties use lower-case hyphenated names prefixed with `ct-` or `--ct-`.

The design lab in tests/browser/style-preview remains a separate exploration tool.
Only Split is shipped as the production default. Build CTFramework to regenerate
the module distribution and both bundles, then rebuild each consuming project.
