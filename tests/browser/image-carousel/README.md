# ImageCarousel browser checks

Run `npm run build` and `npm run test:browser`, then open
http://127.0.0.1:4170/tests/browser/image-carousel/index.html.
This fixture uses the minified bundle and three local SVG landscape illustrations.
Expect 15 automatic checks; there are no remote image services.

1. Click Next, Previous, and each numbered selector repeatedly. Check the image, caption, counter, and callback output agree. Only one image is rendered.
2. Focus the viewer and use Left, Right, Home, and End. Tab through the normal buttons and activate them with Enter/Space. Focus should not jump when slides change.
3. Drag horizontally on desktop and swipe on touch devices. Short or mostly vertical gestures must not change slides; vertical scrolling and pinch zoom remain available.
4. Toggle looping off and verify the end buttons disable. Toggle selectors and image fit. The carousel and unrelated notes input must remain usable.
5. Show one image, no images, and a broken image. Restore the full list and navigate away from the failed image. The second carousel stays independent.
6. Type several characters in Notes, update the parent, leave the showcase page, and return. No duplicate controls, lost focus during typing, or abandoned gesture handlers.
7. At 390px width, verify the full control fits the page and a wiki Dialog. Image controls remain reachable and code snippets scroll separately.

The carousel is manual, with no timers, autoplay, or animation to override reduced-motion preferences.
