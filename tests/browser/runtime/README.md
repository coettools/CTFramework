# Runtime Regression Checks

Run `npm run check`, then `npm run test:browser`.

- Open `http://127.0.0.1:4170/tests/browser/runtime/` for the minified bundle.
- Open the same URL with `?source` for direct source modules.
- Both runs must report 14 passing checks without browser errors.

The checks cover keyed component and template lists, state/prop guards, batched
updates, ForceUpdate, nested fallback recovery, initial failures, unmount cleanup,
nullable attributes, SVG events, form field collisions, dropdown placeholders,
toast reuse, and native modal ownership.

After the checks finish, use the controls below the results:

1. Select the placeholder, development, and production repeatedly.
2. Type several words in Notes. Focus and the full input value must survive updates.
3. Open the dialog. Tab and Shift+Tab past both ends; focus must cycle inside.
4. Press Escape. It must close and restore focus to Open dialog.
5. Open again, close with Confirm or the backdrop, and repeat. Background controls must not respond while it is open.
6. Show, close, and show the toast three times without remounting the page.
7. Repeat at 390px width. Dialog content must stay within the viewport and scroll vertically when needed.

Synthetic checks do not replace the real keyboard, pointer, and mobile checks.
