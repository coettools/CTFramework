# Showcase Checks

Run `npm run check`, then `npm run test:browser`. Open
http://127.0.0.1:4170/tests/browser/showcase/.

The showcase uses CTFramework's Router with a BasePath. Pages share one index.html;
the test server serves that entry for the registered showcase paths.

1. Select Counter, Notes, DOM, Utilities, and Components. URLs must use normal
   paths under /tests/browser/showcase/, without a hash prefix.
2. Open /tests/browser/showcase/components directly and refresh. The same page,
   its modules, and default styles must load. Test Back and Forward between pages.
3. Type Archive into the component table search. Every character must remain and
   the Archive row must appear. Change Environment and keep using the same control.
4. On Notes, type a complete note and add it. Navigate to Counter, increment, then
   use Back and Forward. The shared store retains notes until a full refresh.
5. Missing scripts or unknown showcase paths must return 404, not the entry HTML.
