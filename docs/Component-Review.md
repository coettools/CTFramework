# Component Follow-Up Review

Status: the approved component changes are implemented. This revision includes
the runtime audit fixes and the component follow-up together.

## Implemented

- DataTable uses stable `RowKey` values (default `Id`) and column `Key` values. Missing or duplicate keys fail clearly instead of transferring editor state between records. Rows leaving the filtered page unmount; persistent edits belong in application state.
- Table search uses configured column values, including computed `Value(row)` output. `Searchable: false` excludes a column and `SearchText(row, value)` supplies a rendered label.
- Accordion keys items by `Id`, preserves reordered panel state, and links heading buttons to labelled panels with collision-free DOM IDs. Large multi-open accordions use groups rather than adding many region landmarks.
- Dropdown supports native `Name`, `Required`, and `Disabled`. Native reset restores the initial selection and notifies the parent once; cancelled resets and unmounted controls do not call back.
- Tooltip supports hover, focus, Escape, and click dismissal, with `aria-describedby` association and listener cleanup. It reconnects when nested content replaces its trigger. SideNavigation explicitly keeps `ShowOnFocus: false` and exposes `aria-current="page"`.
- PopupWindow has opening focus, Escape dismissal, and conditional opener restoration. It stays non-modal, does not trap focus, and does not steal focus during parent updates or after the user moves elsewhere.
- Alert uses polite status announcements except for danger messages. `Live` can explicitly select polite, assertive, or off without changing the visual type.
- Browser checks also found and fixed removal of reflected attributes: an absent optional role no longer creates `role=""`.

No runtime dependency was added. Default CSS, component documentation, showcase
examples, and wiki previews are updated together. See [Components](Components.md)
for the individual contracts and migration examples, and [Styling](Styling.md)
for safe overrides.

## Verification

Pre-commit verification on 2026-09-04:

- 68 Node tests and framework/showcase/wiki coverage checks passed.
- 13 component checks and 14 runtime checks passed against both source and minified bundles. The existing rendering (4), CodeBlock (14), and ImageCarousel (15) browser checks also passed.
- Real interactions covered edited record reordering, continuous search, native reset-button timing, required and disabled selects, tooltip focus/hover/click/Escape, repeated sidebar toggles, and nested popup Escape/focus restoration.
- The wiki and showcase were checked with the updated examples. At 390px width, the wiki's popup and corrected tooltip fit the viewport. All four web-dev consumers were rebuilt and smoke-tested on desktop/mobile.
- These checks used local builds without deploying any website. The verified minified bundle SHA-256 is `bf1876c952bb0c58860d40e9f72625f463aaeceee0b0b922e552187f4124eae1`.

Run `npm run check`, then open
`/tests/browser/components/index.html` for bundled checks and add `?source`
for source checks. The page covers record identity, paging cleanup, form
validation/reset, numeric values, tooltip replacement/dismissal, repeated menu
toggles, popup focus, nested Escape, and alert priority. Its remaining controls
are available for real mouse and keyboard use.

Continue running the existing runtime, rendering, CodeBlock, ImageCarousel, and
wiki checks. Use `sync:projects:preview` for local uncommitted review builds;
after check-in use the committed synchronization workflow. Local sync does not
publish any website.

## Still Deferred

Sorting, server pagination, virtualization, remote dropdown loading, optional
navigation links, universal heading/layout options, a code editor, and carousel
autoplay are not included. They need a concrete project requirement and a separate
discussion before implementation.

Accessibility references: [WAI accordion pattern](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/)
and [WAI tooltip pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/).
