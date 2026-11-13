# Combobox checks

Run `npm run test:browser` from the CTFramework root. Open the page for each distribution after building it with the current source.

- [Source modules](http://127.0.0.1:4170/tests/browser/combobox/?source)
- [Readable bundle](http://127.0.0.1:4170/tests/browser/combobox/?debug)
- [Minified bundle](http://127.0.0.1:4170/tests/browser/combobox/)

Keep the tab active until the page reports seven passed checks. The form then starts with Fireball selected and 5,000 available skills. The results list shows up to five options at a time.

1. Tab to Skill. Its label should be visible and the popup closed. Type `proj fire` and pause. Expect three results under Spells and Attacks. Press Escape once. The popup should close, the field should show Fireball, and focus should stay in the field.
2. Use ArrowDown to reopen. Press Home, End and both arrow keys. Check that the visible highlight follows the active option and skips Fire wall. Press Enter on Fire arrow. Submit and check that the submitted Skill is `arrow`. Repeat using the toggle and a mouse click.
3. While editing a draft, Tab away or click outside. Confirm that the selected label returns and the change count stays the same. Use the clear button with the keyboard, then submit while empty. The browser should focus the required field. Typing an unmatched phrase should show No matches and keep the form invalid.
4. Press the native Reset button with the mouse and again with the keyboard. Each reset should restore Fireball and add exactly one change. Disable the field and submit. The submitted fields should be `{}`.
5. Open the dialog. Choose a skill, reopen the popup, and press Escape. The popup should close first. A second Escape should close the dialog and return focus to Open dialog.
6. At 390 CSS pixels wide with touch, tap the toggle, scroll through the dialog's longer list, and tap an option. The tapped row should become the selection. Check that dragging to scroll does not select a row, clear and toggle are easy to tap, the popup stays inside the viewport, and repeated open/close preserves focus. Repeat with enlarged text and inspect label wrapping and focus outlines.
