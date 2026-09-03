export const Surfaces = [
  { Id: "graphite", Name: "Graphite", Description: "Neutral shell and panels." },
  { Id: "navy", Name: "Navy", Description: "The original blue surfaces." },
  { Id: "split", Name: "Graphite / navy", Description: "Graphite shell, navy panels." },
  { Id: "mineral", Name: "Mineral", Description: "Pale surfaces with darker accents." }
];

export const Accents = [
  { Id: "original", Name: "Blue + green", Description: "Cyan actions, green selection and success." },
  { Id: "amber", Name: "Amber", Description: "Warm actions, restrained green status." },
  { Id: "sage", Name: "Sage", Description: "Subdued green emphasis." }
];

export const Shapes = [
  { Id: "sharp", Name: "Sharp", Description: "Square corners and colored outlines." },
  { Id: "soft", Name: "Soft", Description: "Rounded corners and neutral borders." },
  { Id: "hybrid", Name: "Hybrid", Description: "Small radii with selective accent edges." }
];

export const Designs = [
  { Id: "signal", Name: "Signal", Surface: "graphite", Accent: "original", Shape: "sharp", Summary: "The original style, on graphite.", Detail: "Square edges. Cyan outlines. Solid green selection.", Tradeoff: "Most familiar, but the outlines compete with content on dense screens." },
  { Id: "quiet", Name: "Quiet", Surface: "graphite", Accent: "original", Shape: "soft", Summary: "The same colors, with less framing.", Detail: "Soft corners. Neutral borders. Smaller color accents.", Tradeoff: "Calmer for everyday tools, with a less pronounced visual identity." },
  { Id: "split", Name: "Split", Surface: "split", Accent: "original", Shape: "hybrid", Summary: "Graphite around the work. Navy within it.", Detail: "Compact corners. Blue panels. Selective cyan edges.", Tradeoff: "Selected as the framework default. Keeps the blue identity without making the entire interface blue." },
  { Id: "mineral", Name: "Mineral", Surface: "mineral", Accent: "original", Shape: "hybrid", Summary: "A light counterpart, not a different brand.", Detail: "Pale panels. Ink text. Deeper teal and green accents.", Tradeoff: "A useful light direction. Accents are darkened for readable contrast." }
];

export const MatchDesign = (selection) => Designs.find((design) =>
  design.Surface === selection.Surface && design.Accent === selection.Accent && design.Shape === selection.Shape
);

export const DescribeDesign = (selection) => [
  Surfaces.find((surface) => surface.Id === selection.Surface)?.Name,
  Accents.find((accent) => accent.Id === selection.Accent)?.Name,
  Shapes.find((shape) => shape.Id === selection.Shape)?.Name
].join(" / ");
