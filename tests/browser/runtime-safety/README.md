# Runtime Safety Checks

Run `npm run check`, then use `npm run test:browser` to open this folder.
Test the default minified bundle, `?debug` readable bundle and `?source` modules.
All eight automatic checks must pass.

With mouse and keyboard, at desktop and 390px widths:

1. Type several words in Draft A and select its checkbox.
2. Click Update other state three times. The draft and checkbox must stay unchanged.
3. Reverse rows three times. Draft A must keep its input node and edited value.
4. Change bound title, then Reset bound title. Both input titles intentionally reset.
5. Type again, use Tab and Enter to activate the controls, and repeat.

Automatic checks cover numeric attribute removal, property-only booleans,
unchanged/changed bindings and caret preservation, role removal and focus aliases,
misuse diagnostics, private error details, bounded lifecycle updates, unrelated
roots and recovery. An update-loop test stops through the framework guard; run
with a browser-process timeout when automating so a regression cannot hang QA.
