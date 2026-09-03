# CTFramework Styling

CTFramework provides a CoetTools default visual language: sovereign navy surfaces, signal cyan structure and vital green for positive or active states. It is a starting point, not a restriction. Each project can keep it, adjust it, or replace parts of it with normal CSS.

## How it loads

The default stylesheet is added once, immediately before the first `CT.Mount(...)` render. There is nothing to import and nothing to configure in an application.

The stylesheet is placed in the `ctframework` CSS layer. Your normal project stylesheet is not layered, so it overrides CTFramework automatically even if the browser loaded your stylesheet before the first mount. Do not edit CTFramework's `Default.css` from a project; write project CSS instead.

```js
CT(() => {
  CT.Mount(App, "#app");
});
```

## Start With The Default

Use the supplied classes where the structure matches your page. They keep CoetTools projects familiar without adding a component library.

```js
const html = CT.Html;

const Dashboard = () => html`
  <main class="ct-shell">
    <section class="ct-panel">
      <p class="ct-eyebrow">System status</p>
      <h1>Deployment ready</h1>
      <p class="ct-muted">The last validation completed successfully.</p>
      <button type="button" class="ct-button-success">Deploy</button>
    </section>
  </main>
`;
```

| Class | Purpose |
| --- | --- |
| `ct-shell` | Centered page container with responsive horizontal spacing. |
| `ct-panel` | Navy content surface with cyan border treatment. |
| `ct-eyebrow` | Compact, uppercase cyan section label. |
| `ct-muted` | Secondary text color. |
| `ct-button-secondary` | Transparent secondary button treatment. |
| `ct-button-success` | Green positive or active action treatment. |
| `ct-status` | Compact green monospace status text. |
| `ct-error` | Error text color. |

Native `button`, `input`, `select`, `textarea`, `a`, and `:focus-visible` also receive defaults. This means a usable page has a coherent baseline before project-specific styles are added.

## Component Styles

Every framework component ships with a `ct-*` class and default styling. Use the class directly only when adding a project-specific adjustment; the component adds it for you.

| Component | Default class | Style role |
| --- | --- | --- |
| `Accordion` | `ct-accordion` | Expandable sections with an active green trigger state. |
| `Card` | `ct-card` | Structured navy content surface with header, content and footer regions. |
| `Badge` | `ct-badge` | Compact status marker with `success`, `warning`, or `danger` variants. |
| `Alert` | `ct-alert` | Inline information message with a colored left signal. |
| `Dropdown` | `ct-dropdown` | Labelled native select layout. |
| `FallbackView` | `ct-fallback` | Clear not-found or recovery view; unexpected render errors use `ct-fallback-error`. |
| `DataTable` | `ct-data-table` | Search, table and pager structure with responsive horizontal scrolling. |
| `SideNavigation` | `ct-side-navigation` | Bordered vertical navigation with local search and active state. |
| `Dialog` | `ct-dialog` | Centered modal over `ct-dialog-backdrop`. |
| `PopupWindow` | `ct-popup-window` | Non-blocking fixed window with position variants. |
| `Toast` | `ct-toast` | Fixed status notification with type variants. |

For example, a project can widen only its popup window without changing the framework default for every other project:

```css
.ct-popup-window {
  width: min(calc(100% - 2rem), 32rem);
}
```

## Change The Theme

Change custom properties first. This keeps the existing component relationships while moving the project toward a different palette.

```css
/* Project stylesheet: normal CSS intentionally overrides CTFramework. */
:root {
  --ct-color-abyss: #111827;
  --ct-color-navy: #1f2937;
  --ct-color-navy-light: #374151;
  --ct-color-cyan: #60a5fa;
  --ct-color-green: #86efac;
  --ct-color-text: #f9fafb;
  --ct-color-muted: #cbd5e1;
  --ct-color-border: rgba(96, 165, 250, .45);
}
```

| Property | Default role |
| --- | --- |
| `--ct-color-abyss` | Page background and dark text on filled actions. |
| `--ct-color-navy` | Main panels and editable controls. |
| `--ct-color-navy-light` | Raised or selected dark surface. |
| `--ct-color-cyan` | Main action, link and structural accent. |
| `--ct-color-green` | Success, ready and active state. |
| `--ct-color-text` | Primary readable text. |
| `--ct-color-muted` | Secondary readable text. |
| `--ct-color-danger` | Error and destructive text. |
| `--ct-color-warning` | Warning state. |
| `--ct-color-border` | Borders and dividers. |
| `--ct-font-family` | Primary interface font stack. |
| `--ct-font-mono` | Technical status and value font stack. |
| `--ct-focus-ring` | Keyboard focus shadow. |

## Override A Component

Write normal selectors in the project stylesheet. They are unlayered, so they win against CTFramework's layered rule without `!important` or greater selector specificity.

```css
/* Give only this project's panels a softer shape. */
.ct-panel {
  border-radius: .5rem;
}

/* Make the application primary action wider. */
.save-button {
  min-width: 11rem;
}

/* The project decides this form needs compact fields. */
.inline-form input {
  min-height: 2rem;
}
```

Do not place overrides in `@layer ctframework`; that would make them part of the framework layer. Normal, unlayered CSS is the simplest and recommended approach.

## Replace A Broad Default

When a project intentionally needs a different global style, replace the relevant native selector in its own stylesheet. Keep this scoped to the project decision instead of changing CTFramework defaults.

```css
/* This project uses rounded controls by design. */
button,
input,
select,
textarea {
  border-radius: .375rem;
}

/* This project uses a flat page background. */
body {
  background: #061f2e;
}
```

The default stylesheet is still present, but these project rules take precedence. This keeps every project self-contained and makes its intentional design differences easy to find.

## Naming

JavaScript public APIs use PascalCase. CSS uses lower-case, hyphenated names because that is the standard browser convention. Framework classes and properties begin with `ct-` or `--ct-` so they remain identifiable and avoid common project-name collisions.
