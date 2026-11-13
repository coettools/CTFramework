const lengthPattern = /^(\d+(?:\.\d+)?|\.\d+)(px|rem|em|ex|rex|ch|rch|cap|rcap|ic|ric|lh|rlh|cm|mm|q|in|pt|pc|(?:[sld]?v|cq)(?:w|h|i|b|min|max))?$/i;

const ReadLength = (value, name) => {
  const match = typeof value === "string" && lengthPattern.exec(value.trim());
  if (!match || !Number.isFinite(Number(match[1])) || (!match[2] && Number(match[1]) !== 0)) throw new TypeError(`SplitLayout ${name} must be a nonnegative CSS length such as "18rem".`);

  return value.trim().toLowerCase();
};

const ReadLabel = (value, name) => {
  if (value === undefined) return null;
  if (typeof value !== "string" || !value.trim()) throw new TypeError(`SplitLayout Label.${name} must be nonempty text.`);

  return value.trim();
};

export const ReadSplitLayoutOptions = ({ SidePosition = "start", SideWidth = { Min: "18rem", Max: "24rem" }, Gap, Sticky = false, StackBelow = "64rem", StackOrder = "side-first", Label = {} }) => {
  if (!["start", "end"].includes(SidePosition)) throw new TypeError("SplitLayout SidePosition must be start or end.");
  if (!["side-first", "main-first"].includes(StackOrder)) throw new TypeError("SplitLayout StackOrder must be side-first or main-first.");
  if (typeof Sticky !== "boolean") throw new TypeError("SplitLayout Sticky must be a boolean.");
  if (!Label || typeof Label !== "object" || Array.isArray(Label)) throw new TypeError("SplitLayout Label must be an object with optional Side and Main names.");

  const min = ReadLength(SideWidth?.Min, "SideWidth.Min");
  const max = ReadLength(SideWidth?.Max, "SideWidth.Max");
  const [, lower, lowerUnit] = lengthPattern.exec(min);
  const [, upper, upperUnit] = lengthPattern.exec(max);
  if ((lowerUnit === upperUnit || Number(upper) === 0) && Number(lower) > Number(upper)) throw new RangeError("SplitLayout SideWidth.Max must be at least SideWidth.Min.");

  return {
    SideWidth: { Min: min, Max: max },
    SidePosition,
    StackOrder,
    Sticky,
    StackBelow: ReadLength(StackBelow, "StackBelow"),
    Gap: Gap === undefined ? null : ReadLength(Gap, "Gap"),
    Label: { Side: ReadLabel(Label.Side, "Side"), Main: ReadLabel(Label.Main, "Main") },
  };
};
