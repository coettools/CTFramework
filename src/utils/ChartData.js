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
  if (!["line", "area", "bar", "scatter"].includes(Type)) throw new TypeError("Chart Type must be line, area, bar or scatter.");
  if (!Number.isFinite(Height) || Height <= 0) throw new RangeError("Chart Height must be positive and finite.");
  if (typeof Stacked !== "boolean" || (Stacked && !["area", "bar"].includes(Type))) throw new TypeError("Chart Stacked applies to area and bar charts.");
  if (props.OnToggleSeries !== undefined && typeof props.OnToggleSeries !== "function") throw new TypeError("Chart OnToggleSeries must be a function.");

  const x = ReadAxis(props.X === undefined ? {} : props.X, "X", Type === "bar" ? ReadY : ReadChartX);
  const y = ReadAxis(props.Y === undefined ? {} : props.Y, "Y", ReadY);
  const y2 = props.Y2 === undefined ? undefined : ReadAxis(props.Y2, "Y2", ReadY);
  const categories = Array.from(ReadArray(Categories, "Categories"), (label) => ReadLabel(label, "category"));
  const hidden = new Set(ReadArray(Hidden, "Hidden"));
  const ids = new Set();
  let dates = false;

  const series = Array.from(ReadArray(Series, "Series"), (entry, index) => {
    const id = ReadLabel(entry?.Id, "Series.Id");
    if (ids.has(id)) throw new TypeError("Chart Series.Id must be unique.");
    ids.add(id);

    const label = ReadLabel(entry.Label, "Series.Label");
    const type = entry.Type ?? Type;
    if (Type === "bar" ? type !== "bar" : !["line", "area", "scatter"].includes(type)) throw new TypeError("Chart Series.Type must match the chart's category or continuous X axis.");
    if (Stacked && Type === "area" && type !== "area") throw new TypeError("Stacked area charts need area series.");
    const axis = entry.Axis ?? "left";
    if (!["left", "right"].includes(axis) || (axis === "right" && !y2)) throw new TypeError("Chart Series.Axis must be left, or right with a Y2 axis.");
    const pointRadius = entry.PointRadius ?? 2.5;
    if (!Number.isFinite(pointRadius) || pointRadius <= 0) throw new RangeError("Chart Series.PointRadius must be positive and finite.");
    const pointShape = entry.PointShape === undefined ? "circle" : entry.PointShape;
    if (!["circle", "square", "diamond"].includes(pointShape)) throw new TypeError("Chart Series.PointShape must be circle, square or diamond.");
    let colors;
    if (entry.Colors !== undefined) {
      colors = ReadArray(entry.Colors, "Series.Colors").map((color) => (color === null ? null : ReadLabel(color, "Series.Colors color")));
      if (type !== "bar" || colors.length !== categories.length) throw new RangeError("Chart Series.Colors needs one color or null per bar category.");
    }

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
      Type: type,
      Axis: axis,
      PointRadius: pointRadius,
      PointShape: pointShape,
      Colors: colors,
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

  if (Type === "bar" && Stacked && new Set(series.map((item) => item.Axis)).size > 1) {
    throw new TypeError("Stacked bars need one Y axis. Use grouped bars to compare different axes.");
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

  const formatY = (value, axis = "left") => {
    const formatter = (axis === "right" ? y2 : y).Format;

    return value == null ? "—" : String(formatter ? formatter(value) : value);
  };

  return { Title, Type, Height, Stacked, X: x, Y: y, Y2: y2, Series: series, Visible: visible, Positions: positions, Markers: markers, FormatX: formatX, FormatY: formatY, HasData: visible.some((item) => item.Min <= item.Max) };
};
