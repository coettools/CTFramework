# CTFramework design lab

A local design comparison, not a new default theme or deployable application.
Hosting: local browser-test server only. No Vercel/VPS release or sitemap.

Run `npm run test:browser` from CTFramework, then open:
http://127.0.0.1:4170/tests/browser/style-preview/index.html

This fixture imports the existing minified framework distribution. Build CTFramework
first if dist is absent. No production CSS, bundle, or wiki files are edited by the lab.

## Four starting points

| Direction | Treatment | Tradeoff |
| --- | --- | --- |
| Signal | Graphite, original cyan/green, square corners and accent outlines | Closest to the original style; more framing around dense content. |
| Quiet | Graphite, original cyan/green, neutral borders and rounded corners | Calmer, but less visually distinctive. |
| Split | Graphite shell, navy panels, compact corners and selective accent edges | Selected as the framework default. |
| Mineral | Pale surfaces, deeper teal/green, compact corners | A possible light counterpart. Accents are darkened for legibility. |

The small illustrations compare the same structure. Use the full workspace below
them for real CTFramework interactions. They are not screenshots of separate products.

## Mix and compare

Choose a surface, an accent, and an edge treatment independently. The earlier amber
and sage options remain available in the accent controls. Navy restores the original
blue surfaces; Graphite / navy uses navy only within a graphite shell.

Original dark accents are cyan-blue #2ab0b5 and green #32cd32. Light variants use
darker counterparts, not the same bright colors on white. Logo PNG filenames do not
specify the palette. No external fonts, artwork, or runtime dependencies are added.

Pin for comparison captures the current design settings, not its counter or form data.
Choose another preset or mix to change only the live pane. Both workspaces have
independent state. Replace pinned design updates its appearance; Remove comparison
hides it. Controls keep their state until the page is reloaded. Narrow screens stack
the comparison panes instead of squeezing two applications into phone width.

Navigation links in each workspace scroll to sections of that specimen. They are not
additional application pages. Overlay controls are local demonstrations, not publishing
actions. The lab does not store selections across reloads.

## Responsibilities

- App.js owns the shell and mounts the lab page.
- pages/PalettePage.js owns design selection, mixing, and pinning.
- Designs.js holds the direction/option data and naming helpers.
- components/DirectionCard.js renders a small visual specimen and selection control.
- components/WorkspacePreview.js owns counter, navigation, form, table, and feedback state.
- styles/Preview.css styles the neutral review interface.
- styles/Themes.css scopes experimental tokens and overrides to each specimen.
- tests/Designs.test.js checks the preset registry and all mixed descriptions.

The --design-* tokens are private to this fixture. They are not new public framework
APIs. Existing --ct-* properties are mapped within each theme scope. Body colors do not
change when switching a specimen. This lets dark and light proposals sit together.

Copy is short and developer-facing. Color and density tradeoffs are proposals, not
claims that one aesthetic is universally better. The reference site's hierarchy and
panel contrast remain inspiration: https://videogamescritic.com/.

## Verification

Run `node --test tests/browser/style-preview/tests/Designs.test.js`.

Browser checks for this revision:
- All twelve surface/accent combinations preserve the live search and pinned design.
- Primary button text contrast is at least 6.32:1 and muted body text on panels at
  least 6.09:1 for these twelve combinations. This is not a full accessibility audit.
- Check all three edge treatments, counter updates, dropdown selection, table paging,
  multi-character search, navigation collapse/expand, and leaving/returning to sections.
- Check the dialog, popup, toast, accordion, keyboard focus, and mobile stacking.
- Check pin, replace, remove, and repin without duplicated controls or shared state.

Dropdown initialization and simultaneous option/value updates are covered by the
separate tests/browser/rendering fixture, which uses the minified distribution.
