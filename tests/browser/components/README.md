# Component Regression Checks

Run `npm run check` and `npm run test:browser`, then open:

- `/tests/browser/components/index.html` for the minified distribution.
- `/tests/browser/components/index.html?source` for native source modules.

Both must report 13 passing checks. Keep the tab active while checks use animation
frames. These checks are browser-only; `node --test` does not run them.

Use the remaining controls with real mouse and keyboard input:

1. Edit Alpha and Beta, then reverse records/columns. Visible record edits must follow their records. Off-page edits are intentionally discarded unless the application stores them.
2. Type several search characters without losing focus. Search Ready to match a computed column, then clear the search and page forward/back.
3. Edit an accordion panel, reverse records, collapse and reopen. Check its value and trigger focus.
4. Select production, submit, and reset the form. Expect the initial development selection in both the field and displayed state. Clear the selection to check required validation. Disable the dropdown and submit to check omission.
5. Tab to Help button. Escape and click must dismiss its hint; a new focus entry must show it again. Check hover and movement onto the hint without focus leaving the control.
6. Collapse/expand the menu repeatedly, alternating Overview and Settings. Its hint is hover-only, hides on click, and its active button has aria-current=page.
7. Open popup. Tab through its controls and out to After popup; no focus trap. Reopen and press Escape inside; focus returns to Open popup.
8. Open parent dialog, then Open nested popup. Escape closes the popup only and returns to its opener. A second Escape closes the parent dialog.
9. Repeat at 390px width. Fields, controls, and windows must stay within the viewport; the table may scroll horizontally inside its own container.

Also run the existing runtime, rendering, CodeBlock, and ImageCarousel pages.
