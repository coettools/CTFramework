# Chart browser checks

With the CTFramework browser test server running, open `/tests/browser/chart/index.html`. The page exercises the minified bundle by default. Append `?readable` for the debug bundle or `?source` for the source entry point. Use `theme=light` or `theme=dark` in the query string to set the page color scheme. For example, `?source&theme=light`.

The runner exposes its mounted fixture as `window.chartChecks`. Wait for `#result[data-status="passed"]`. A failure sets the status to `failed` and displays the failed assertion. The fixture uses synthetic data throughout.

- At desktop width and at 390 CSS pixels, focus the first plot. Press Left and Right repeatedly, including at either end. Inspect the crosshair, formatted values, polite announcements, and focus outline. Escape dismisses the tooltip.
- At touch width, tap or drag horizontally. Check the nearest sample and confirm vertical page scrolling remains usable.
- Open and close the full table with the keyboard. Check that it includes 600 positions, missing measurements display a dash, and the scrollable table fits inside the page.
- Toggle both legend entries off and on. Verify focus, names, pressed states, the empty message and recovery. Compare the plot and legend patterns in each theme.
- Inspect grouped and signed stacked bars, stacked areas with gaps, the labelled marker and the empty chart. Open and close the native dialog twice and resize while it is open.

Line and area coordinates accept finite numbers and valid Dates. Date coordinates are normalized to epoch milliseconds before formatting. X positions are unique per series. Stacked areas require identical X positions across all series, including hidden series. Use a null Y for a missing measurement. A missing lower area leaves a gap in each area whose baseline depends on it. The tooltip and table retain supplied values even when that baseline is unknown.
