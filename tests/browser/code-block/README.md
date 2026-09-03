# CodeBlock browser checks

Run npm run build and npm run test:browser. Open
http://127.0.0.1:4170/tests/browser/code-block/index.html.
This fixture uses the production minified bundle. Expect 10 automatic checks.

1. Type multiple characters in Source. Focus and the text selection must stay in the field.
2. Switch Language between JavaScript, HTML, CSS, JSON, and text. Supply matching code and verify colours; text has none.
3. Toggle Wrap repeatedly, update the parent, and keep typing. Only the intended code changes; the independent block keeps its settings.
4. Click Copy, then paste into the empty Paste copied source field. It must match Source, without line numbers. Feedback appears only after success. Unit tests cover denied/unavailable clipboard and unmount during copying.
5. Test long lines at desktop and 390px mobile widths. The page must not overflow; code scrolls locally or wraps. Tab to the code region and scroll with the keyboard.
6. Visit the showcase Counter, Notes, DOM, Utilities, and Components routes. Each example uses CodeBlock; exercise Copy/Wrap while counters, search, and dropdowns still work.

No code entered in this fixture is executed. HTML/script-shaped source is tested as literal text.
