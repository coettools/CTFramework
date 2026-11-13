# Popover checks

Run the framework browser test server and open `/tests/browser/popover/`. Use
`?source` for source modules or `?debug` for the readable bundle. The default
page loads the minified bundle. Seven checks run before the interactive examples
appear. Repeat at desktop width and 390 CSS pixels with touch input.

1. Move the pointer briefly over Jacket, then away before the panel opens. Hover
   again and move slowly from the button into the details. Follow the shared
   edge and confirm that the panel stays open outside the scrolling card.
2. Tab to Jacket. Focus should stay on the button while its details appear.
   Tab into the named region and its link, then press Escape. Focus should return
   to Jacket. Tab away and back to reopen. With a screen reader, check that the
   button retains “Winter clothing” and describes “Jacket details” once.
3. At 390px, tap Fabric care. The first tap should open the washing instructions
   and keep the page in place. Tap again to follow the link, or tap Continue to
   dismiss. Increase text size and confirm long text wraps and scrolls.
4. Activate Size guide using Enter and Space. Tab into its button and out to
   Continue. Reopen as needed and close using Escape, the trigger, and an outside
   click. A pointer click on Continue should leave keyboard focus on Continue.
5. Open Compare sizes, then Measurements. Check the panel is visible above the
   modal and receives focus. The first Escape closes the panel and returns focus
   to Measurements. A second Escape closes the modal.
6. Resize and scroll with a panel open. Verify it follows the trigger and stays
   inside the viewport. Repeat an open/close cycle and confirm the detail link
   still works. Check PanZoomView anchoring in the framework showcase.
