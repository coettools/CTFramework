# SplitLayout checks

After building CTFramework, run `npm run test:browser` and open the fixture in an active browser tab.

- [Minified bundle](http://127.0.0.1:4170/tests/browser/split-layout/)
- [Readable bundle](http://127.0.0.1:4170/tests/browser/split-layout/?readable)
- [Source modules](http://127.0.0.1:4170/tests/browser/split-layout/?source)

Load each variant at desktop size and at 390px wide. The header reports “SplitLayout checks passed.” after the assertions finish. Reload after resizing to run the assertions again for the new viewport.

The fixture places a 120-item inventory and a wide canvas inside an ApplicationLayout with a header, footer and collapsible SideNavigation. It checks sticky geometry after scrolling, changes in scrollport height, independent side scrolling, child-only content updates, reading order, draft and focus retention, and logical placement in both text directions. It also checks the exact stacking threshold and the width one pixel below it. On desktop it crosses a container breakpoint twice by toggling the navigation. On mobile it temporarily requests two columns to exercise window scrolling before restoring the default breakpoint.

## Keyboard and responsive checks

1. Start at 1440 × 900. Tab to Inventory and use Page Down or End to reach item 120. The editor should stay in place. Tab to **Show fewer items**, activate it, then Shift+Tab. With a short inventory the side wrapper should drop out of the tab order. **Show all items** should restore its tab stop.
2. Type a note. Switch side position and reverse the reading order twice. The note and inventory count should survive. Side position should change the desktop placement. Reading order should change the order in which Tab reaches the two panels.
3. Resize to 390px. Scroll through both panels, reverse reading order, and swipe the wide canvas horizontally. The whole page should scroll vertically and the canvas should scroll within the editor. The side should follow normal document scrolling.
4. Collapse and expand navigation several times. Resize back to desktop and repeat with increased text size. Check that focused controls remain visible, that item 120 stays reachable and that the document has no horizontal scrollbar.
