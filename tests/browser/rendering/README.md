# Rendering regression checks

Run npm run check, start npm run test:browser, then open:

http://127.0.0.1:4170/tests/browser/rendering/index.html

The page uses the minified distribution. It checks initial Dropdown selection,
simultaneous option/value replacement, DOM identity, and numeric zero values.
The status must report four passing checks. Change the environment manually,
type several characters in Notes, and confirm focus, text, and selection remain.

These browser checks are separate from the Node test count.
