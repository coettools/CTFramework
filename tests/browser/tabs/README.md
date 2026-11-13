# Tabs interaction checks

With the framework test server running, open `/tests/browser/tabs/` for the minified build. Use `?readable` for the readable bundle or `?source` for source modules. Each variant needs the integrated Tabs export and default styles.

Wait for the visible PASS result and `#result[data-status="passed"]`. The page exposes its current status, completed assertions, layout and selection events, managed child mount counts, canvas draws, last camera and size through `window.tabsChecks`. A failed check leaves its error in the page and in `window.tabsChecks.error`.

The fixture resizes its container while the viewport stays fixed. It verifies keyboard selection, both focus paths on collapse, weighted columns and hysteresis. It keeps a note, a child counter, a real Chart SVG and a panned PanZoomView canvas through tab switches, parent updates and layout changes. Revealing a resized panel checks the chart viewBox and the canvas draw size.

Run each variant at desktop width and at 390 CSS pixels with touch enabled. After PASS, use **Switch layout** to force tabs or columns. In tabs, tap Gear and Passive tree twice, then pan the tree and confirm its position when you return. Use Tab and Shift+Tab to check the focus ring and reading order from the selected tab into the panel. Check Left, Right, Home and End with keyboard input. At narrow widths, scroll the tab strip to its last label and verify the page itself stays within the viewport.
