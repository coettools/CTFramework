const ReadArray = (value, name) => {
  if (!Array.isArray(value)) throw new TypeError(`Chart ${name} must be an array.`);

  return value;
};

const ReadLabel = (value, name) => {
  if (typeof value !== "string" || !value.trim()) throw new TypeError(`Chart ${name} needs nonempty text.`);

  return value;
};

export const ReadChartX = (value) => {
  const number = value instanceof Date ? value.getTime() : value;
  if (!Number.isFinite(number)) throw new TypeError("Chart X must be a finite number or valid Date.");

  return number;
};

const ReadY = (value) => {
  if (value !== null && !Number.isFinite(value)) throw new TypeError("Chart Y must be a finite number or null.");

  return value;
};

const ReadAxis = (axis, name, readCoordinate) => {
  if (!axis || typeof axis !== "object" || Array.isArray(axis)) throw new TypeError(`Chart ${name} must be an axis object.`);
  if (axis.Format !== undefined && typeof axis.Format !== "function") throw new TypeError(`Chart ${name}.Format must be a function.`);

  const coordinate = (value) => {
    const number = readCoordinate(value);
    if (!Number.isFinite(number)) throw new TypeError(`Chart ${name} axis coordinates must be finite.`);

    return number;
  };

  const min = axis.Min === undefined ? undefined : coordinate(axis.Min);
  const max = axis.Max === undefined ? undefined : coordinate(axis.Max);
  if (min !== undefined && max !== undefined && min >= max) throw new RangeError(`Chart ${name}.Max must exceed Min.`);
  const ticks = axis.Ticks === undefined ? undefined : Array.from(ReadArray(axis.Ticks, `${name}.Ticks`), coordinate);

  return { ...axis, Min: min, Max: max, Ticks: ticks };
};

const DashPatterns = ["none", "8 4", "2 3", "9 3 2 3", "12 4", "4 3", "8 3 2 3 2 3", "12 3 4 3"];

export const CreateChartData = (props) => {
  const { Title, Type = "line", Height = 240, Stacked = false, Series = [], Categories = [], Hidden = [], Markers = [] } = props;
  ReadLabel(Title, "Title");
  if (!["line", "area", "bar"].includes(Type)) throw new TypeError("Chart Type must be line, area or bar.");
  if (!Number.isFinite(Height) || Height <= 0) throw new RangeError("Chart Height must be positive and finite.");
  if (typeof Stacked !== "boolean" || (Stacked && Type === "line")) throw new TypeError("Chart Stacked applies to area and bar charts.");
  if (props.OnToggleSeries !== undefined && typeof props.OnToggleSeries !== "function") throw new TypeError("Chart OnToggleSeries must be a function.");

  const x = ReadAxis(props.X === undefined ? {} : props.X, "X", Type === "bar" ? ReadY : ReadChartX);
  const y = ReadAxis(props.Y === undefined ? {} : props.Y, "Y", ReadY);
  const categories = Array.from(ReadArray(Categories, "Categories"), (label) => ReadLabel(label, "category"));
  const hidden = new Set(ReadArray(Hidden, "Hidden"));
  const ids = new Set();
  let dates = false;

  const series = Array.from(ReadArray(Series, "Series"), (entry, index) => {
    const id = ReadLabel(entry?.Id, "Series.Id");
    if (ids.has(id)) throw new TypeError("Chart Series.Id must be unique.");
    ids.add(id);

    const label = ReadLabel(entry.Label, "Series.Label");
    const values = new Map();
    if (Type === "bar") {
      const raw = ReadArray(entry.Values, "Series.Values");
      if (raw.length !== categories.length) throw new RangeError("Chart needs one value per category. Use null for a gap.");
      for (const [position, value] of raw.entries()) values.set(position, ReadY(value));
    } else {
      for (const point of ReadArray(entry.Points, "Series.Points")) {
        const position = ReadChartX(point?.X);
        if (values.has(position)) throw new TypeError("Chart X positions must be unique within each series.");
        values.set(position, ReadY(point.Y));
        dates ||= point.X instanceof Date;
      }
    }

    const positions = [...values.keys()].sort((left, right) => left - right);
    const finite = [...values.values()].filter((value) => value !== null);
    const dash = DashPatterns[index % DashPatterns.length];

    return {
      Id: id,
      Label: label,
      Values: values,
      Positions: positions,
      Min: finite.reduce((min, value) => Math.min(min, value), Infinity),
      Max: finite.reduce((max, value) => Math.max(max, value), -Infinity),
      Color: entry.Color ?? `var(--ct-chart-${(index % 8) + 1})`,
      Dash: entry.Dashed && dash === "none" ? "6 2" : dash,
      Visible: !hidden.has(id),
    };
  });

  if (Type === "area" && Stacked && series.length) {
    const first = series[0].Positions;
    for (const item of series.slice(1)) {
      if (item.Positions.length !== first.length || item.Positions.some((position, index) => position !== first[index])) {
        throw new RangeError("Stacked areas need aligned X positions in every series. Supply null Y at a gap.");
      }
    }
  }

  const markers = Array.from(ReadArray(Markers, "Markers"), (marker) => ({ X: ReadChartX(marker?.X), Label: ReadLabel(marker.Label, "marker Label") }));
  if (Type === "bar" && markers.length) throw new TypeError("Chart Markers apply to line and area charts.");
  const visible = series.filter((item) => item.Visible);
  const positions = Type === "bar" ? categories.map((_, index) => index) : [...new Set(visible.flatMap((item) => item.Positions))].sort((left, right) => left - right);
  const formatX = (position) => {
    const value = Type === "bar" ? categories[position] : position;
    if (x.Format) return String(x.Format(value));
    if (dates) {
      const date = new Date(position);
      if (Number.isFinite(date.getTime()))
        return date
          .toISOString()
          .replace(/T00:00:00\.000Z$/, "")
          .replace(/\.000Z$/, "Z");
    }

    return String(value);
  };

  const formatY = (value) => (value == null ? "—" : String(y.Format ? y.Format(value) : value));

  return { Title, Type, Height, Stacked, X: x, Y: y, Series: series, Visible: visible, Positions: positions, Markers: markers, FormatX: formatX, FormatY: formatY, HasData: visible.some((item) => item.Min <= item.Max) };
};
