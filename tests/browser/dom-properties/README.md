# DOM Property Checks

Run `npm run check`, then `npm run test:browser` and open:

- `/tests/browser/dom-properties/` for the minified bundle.
- The same URL with `?debug` for the readable bundle.
- The same URL with `?source` for source modules.

Each run must report seven passing checks. These cover native form ownership,
form data, setting/changing/removing form and datalist associations, changing
attribute names, input identity/focus, writable properties, and setter failures
reaching component error handling.

Use the controls below the results with mouse and keyboard:

1. Type several words into Associated name. Its value and focus must survive updates.
2. Change owner to the second form and submit. The displayed data must contain the name.
3. Change owner back and press Enter in Associated name. The first form must receive the submission.
4. Repeat owner changes and submissions three times.
5. Remove owner. The outside controls must have no form; Inside first form must return to its ancestor form.
6. Change owner again and submit. The input value must remain intact.
7. Repeat at 390px width.

Run these checks in a standalone browser. Node descriptor tests complement the
browser checks but do not establish native form behavior.
