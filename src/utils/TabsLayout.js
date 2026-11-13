const options = new Set(["Items", "Label", "Layout", "Columns", "MinPanelWidth", "Value", "OnChange", "HeadingLevel", "ShowHeadings", "OnLayoutChange", "Key"]);
const itemOptions = new Set(["Id", "Title", "Content", "Badge", "Disabled", "Span"]);
const IsId = (value) => (typeof value === "string" && value.length > 0) || Number.isFinite(value);
const IsLabel = (value) => typeof value === "string" && value.trim().length > 0;

const CheckKeys = (value, keys, name) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${name} must be an object.`);
  for (const key of Object.keys(value)) {
    if (!keys.has(key)) throw new TypeError(`Unknown ${name} option: ${key}.`);
  }
};

export const ValidateTabs = (props) => {
  CheckKeys(props, options, "Tabs");
  const { Items = [], HeadingLevel = 2, ShowHeadings = true, Columns, Layout = "auto", MinPanelWidth = "22rem" } = props;
  if (!IsLabel(props.Label)) throw new TypeError("Tabs Label must be a non-empty string.");
  if (!["auto", "columns", "tabs"].includes(Layout)) throw new TypeError("Tabs Layout must be auto, columns or tabs.");
  if (typeof ShowHeadings !== "boolean") throw new TypeError("Tabs ShowHeadings must be a boolean.");
  if (ShowHeadings && (!Number.isInteger(HeadingLevel) || HeadingLevel < 1 || HeadingLevel > 6)) throw new RangeError("Tabs HeadingLevel must be an integer from 1 to 6.");
  if (Columns !== undefined && (!Number.isSafeInteger(Columns) || Columns < 1)) throw new RangeError("Tabs Columns must be a positive integer.");
  if (!IsLabel(MinPanelWidth) || (globalThis.CSS && !(CSS.supports("letter-spacing", MinPanelWidth) && CSS.supports("width", `calc(1 * (${MinPanelWidth}))`)))) {
    throw new TypeError("Tabs MinPanelWidth must be a CSS length.");
  }
  if (props.Value !== undefined && !IsId(props.Value)) throw new TypeError("Tabs Value must be a non-empty string or finite number.");
  for (const name of ["OnChange", "OnLayoutChange"]) {
    if (props[name] !== undefined && typeof props[name] !== "function") throw new TypeError(`Tabs ${name} must be a function.`);
  }

  if (!Array.isArray(Items)) throw new TypeError("Tabs Items must be an array.");
  const ids = new Set();
  for (const item of Items) {
    CheckKeys(item, itemOptions, "Tabs item");
    if (!IsId(item.Id)) throw new TypeError("Tabs items require a non-empty string or finite number Id.");
    if (ids.has(item.Id)) throw new TypeError(`Tabs item Id must be unique. Duplicate: ${item.Id}`);
    if (!IsLabel(item.Title)) throw new TypeError("Tabs item Title must be a non-empty string.");
    if (!Object.hasOwn(item, "Content")) throw new TypeError("Tabs items require Content.");
    if (item.Span !== undefined && item.Span !== "full" && !(Number.isSafeInteger(item.Span) && item.Span >= 1)) throw new RangeError('Tabs item Span must be a positive integer or "full".');
    if (item.Disabled !== undefined && typeof item.Disabled !== "boolean") throw new TypeError("Tabs item Disabled must be a boolean.");
    if (item.Badge !== undefined && typeof item.Badge !== "string" && !Number.isFinite(item.Badge)) throw new TypeError("Tabs item Badge must be text or a finite number.");
    ids.add(item.Id);
  }
};

export const TabsMode = (width, threshold, previous) => {
  // Leave columns when they no longer fit. Require four extra pixels to reopen them.
  const margin = previous === "tabs" ? 4 : 0;

  return width >= threshold + margin ? "columns" : "tabs";
};

export const TabsDestination = (items, id, key) => {
  const enabled = items.filter((item) => !item.Disabled);
  const index = enabled.findIndex((item) => item.Id === id);
  if (index < 0) return;
  switch (key) {
    case "Home":
      return enabled[0].Id;
    case "End":
      return enabled.at(-1).Id;
    case "ArrowLeft":
      return enabled[(index + enabled.length - 1) % enabled.length].Id;
    case "ArrowRight":
      return enabled[(index + 1) % enabled.length].Id;
  }
};
