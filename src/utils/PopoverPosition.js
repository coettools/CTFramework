const Opposite = { top: "bottom", right: "left", bottom: "top", left: "right" };
const Clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const PositionPopover = (anchor, panel, viewport, preferred) => {
  const left = viewport.left + 8;
  const top = viewport.top + 8;
  const right = viewport.left + viewport.width - 8;
  const bottom = viewport.top + viewport.height - 8;
  const space = { top: anchor.top - top, right: right - anchor.right, bottom: bottom - anchor.bottom, left: anchor.left - left };
  const vertical = preferred === "top" || preferred === "bottom";
  const extent = vertical ? panel.height : panel.width;
  const opposite = Opposite[preferred];
  const side = space[preferred] < extent && space[opposite] > space[preferred] ? opposite : preferred;

  // Adjacent edges provide a continuous pointer path between trigger and panel.
  const x = vertical ? (anchor.left + anchor.right - panel.width) / 2 : side === "right" ? anchor.right : anchor.left - panel.width;
  const y = !vertical ? (anchor.top + anchor.bottom - panel.height) / 2 : side === "bottom" ? anchor.bottom : anchor.top - panel.height;

  return { side, left: Clamp(x, left, right - panel.width), top: Clamp(y, top, bottom - panel.height) };
};
