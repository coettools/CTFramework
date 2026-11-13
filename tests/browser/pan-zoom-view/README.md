# PanZoomView browser checks

The fixture also starts a canvas hidden, calls its Ref handle's CenterOn before
the first size, then reveals it. The canvas must paint at the requested camera
without animation or frame errors, with backing dimensions matching its viewport.

Run `npm run build` and `npm run test:browser`. Open
`/tests/browser/pan-zoom-view/`, then repeat with `?source` and `?readable`.
The status must read PASS. Controls remain available for manual use afterward.

Test pointer clicks versus drags, pointer-centred wheel zoom, repeated two-finger
pinch followed by one-finger pan, viewport arrow/+/-/0 keys, and Tab/Enter/Space on
the SVG nodes. The canvas alternative is deliberately ordinary text beside it.
Repeat at 390px with touch emulation and with reduced motion enabled. Check Fit,
the independent canvas controls, resize, page scrolling outside the view, and
unmount/remount cleanup. Emulated gestures are not physical-device testing.
