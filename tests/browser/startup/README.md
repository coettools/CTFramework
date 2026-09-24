# Startup and child views

Run `npm run test:browser`, then open `/tests/browser/startup/`.
The default page uses the minified bundle; `?debug` uses the readable bundle and
`?source` uses source modules. All three should report that every check passed.
The constructor failure and missing target deliberately log errors during the tests.

Also exercise the controls yourself:

1. Click Count twice and type several words into Child notes.
2. Click Update parent. The name should change without clearing the count or notes.
3. Click Toggle child twice. The returning child should have a fresh count and notes.
4. Repeat at a narrow viewport and with keyboard navigation.

The fixture checks ready startup, root results, managed child identity, props,
typing/focus, unmount cleanup, fallback handling and one-time default stylesheet insertion.
