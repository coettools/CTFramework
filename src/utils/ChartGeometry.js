const NiceStep = (raw) => {
  const power = 10 ** Math.floor(Math.log10(raw)) || Number.MIN_VALUE;
  const fraction = raw / power;
  const unit = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;

  return unit * power;
};

export const ChartAxis = (axis, dataMin, dataMax, count = 5) => {
  const empty = dataMin > dataMax;
  let min = axis.Min ?? (empty ? (axis.Max ?? 1) - 1 : dataMin);
  let max = axis.Max ?? (empty ? min + 1 : dataMax);
  if (min >= max) {
    const center = axis.Min ?? axis.Max ?? min;
    const delta = Math.max(1, Math.abs(center) * Number.EPSILON * 4);
    if (axis.Min === undefined) min = center - delta;
    if (axis.Max === undefined) max = center + delta;
  }

  min = Math.max(-Number.MAX_VALUE, min);
  max = Math.min(Number.MAX_VALUE, max);
  if (max <= min) throw new RangeError("Chart axis needs a representable positive range.");
  const intervals = Math.max(1, count - 1);
  const raw = Number.isFinite(max - min) ? (max - min) / intervals : max / intervals - min / intervals;
  const step = NiceStep(raw || Number.MIN_VALUE);
  const first = Math.floor(min / step) * step;
  const last = Math.ceil(max / step) * step;
  if (axis.Min === undefined && Number.isFinite(first)) min = Math.min(min, first);
  if (axis.Max === undefined && Number.isFinite(last)) max = Math.max(max, last);

  let ticks = axis.Ticks && [...new Set(axis.Ticks.filter((tick) => tick >= min && tick <= max))].sort((a, b) => a - b);
  if (!ticks) {
    ticks = [];
    const start = Math.ceil(min / step);
    for (let offset = 0; offset <= count + 2; offset++) {
      const multiple = (start + offset) * step;
      // Remove binary rounding noise while retaining fine steps around a large offset.
      const rounded = Number(multiple.toPrecision(15));
      const tick = Math.abs(rounded - multiple) < step * 1e-8 ? rounded : multiple;
      if (!Number.isFinite(tick) || tick > max) break;
      if (tick >= min && ticks.at(-1) !== tick) ticks.push(tick || 0);
    }

    if (!ticks.length) ticks = [min, max];
  }

  return { Min: min, Max: max, Ticks: ticks };
};

const LayerValues = (data, rows) => {
  // A missing lower layer has an unknown contribution. Leave its dependants open.
  return rows.map((row) => {
    const axes = { left: { Positive: 0, Negative: 0, Complete: true }, right: { Positive: 0, Negative: 0, Complete: true } };
    const layers = row.Values.map((value, index) => {
      const axis = axes[data.Visible[index].Axis];
      if (value === null || (!axis.Complete && data.Stacked && data.Type === "area")) {
        axis.Complete = false;

        return null;
      }

      const base = data.Stacked ? (value < 0 ? axis.Negative : axis.Positive) : 0;
      const top = base + value;
      if (!Number.isFinite(top)) throw new RangeError("Chart stacked total must be finite.");
      const layer = { X: row.X, Value: value, Base: base, Top: top, Positive: axis.Positive, Negative: axis.Negative };
      if (data.Stacked && value < 0) axis.Negative = top;
      else if (data.Stacked) axis.Positive = top;

      return layer;
    });

    return layers;
  });
};

// Insert geometric vertices where a known segment changes sign. All layers use
// the same crossings, so both sides of a stack share their exact boundary.
const StackCrossings = (rows, series) => {
  const result = [];
  for (const [index, row] of rows.entries()) {
    const previous = rows[index - 1];
    if (previous) {
      const crossings = new Map();
      const incomplete = new Set();
      for (const [layer, value] of row.Values.entries()) {
        const prior = previous.Values[layer];
        const axis = series[layer].Axis;
        if (prior === null || value === null) incomplete.add(axis);
        if (incomplete.has(axis)) continue;
        if (!((prior < 0 && value > 0) || (prior > 0 && value < 0))) continue;
        const fraction = 1 / (1 + Math.abs(value / prior));
        if (!crossings.has(fraction)) crossings.set(fraction, new Set());
        crossings.get(fraction).add(layer);
      }

      for (const fraction of [...crossings.keys()].sort((a, b) => a - b)) {
        const zeros = crossings.get(fraction);
        const values = row.Values.map((value, layer) => {
          const prior = previous.Values[layer];
          if (prior === null || value === null) return null;

          return zeros.has(layer) ? 0 : prior * (1 - fraction) + value * fraction;
        });
        result.push({ X: previous.X * (1 - fraction) + row.X * fraction, Values: values });
      }
    }

    result.push(row);
  }

  return result;
};

export const ChartLayers = (data) => {
  if (data.Type !== "bar" && !data.Stacked) {
    return data.Visible.map((series) =>
      series.Positions.map((x) => {
        const value = series.Values.get(x);

        return value === null ? null : { X: x, Value: value, Base: 0, Top: value };
      }),
    );
  }

  const rows = data.Positions.map((x) => ({ X: x, Values: data.Visible.map((series) => series.Values.get(x)) }));
  const layers = LayerValues(data, data.Type === "area" ? StackCrossings(rows, data.Visible) : rows);

  return data.Visible.map((_, index) => layers.map((row) => row[index]));
};

export const ChartLayout = (data, width, measure = (value) => String(value).length * 7) => {
  const layers = ChartLayers(data);
  const ranges = { left: { Min: Infinity, Max: -Infinity }, right: { Min: Infinity, Max: -Infinity } };
  for (const [index, layer] of layers.entries()) {
    const series = data.Visible[index];
    const range = ranges[series.Axis];
    for (const point of layer) {
      if (!point) continue;
      range.Min = Math.min(range.Min, point.Top, ["area", "bar"].includes(series.Type) ? point.Base : Infinity);
      range.Max = Math.max(range.Max, point.Top, ["area", "bar"].includes(series.Type) ? point.Base : -Infinity);
    }
  }

  const bottom = Math.max(2, data.Height - (data.X.Label ? 42 : 24));
  const top = Math.min(bottom - 1, data.Markers.length ? 24 : 10);
  const tickCount = Math.min(6, Math.max(2, Math.floor((bottom - top) / 42) + 1));
  const y = ChartAxis(data.Y, ranges.left.Min, ranges.left.Max, tickCount);
  const y2 = data.Y2 ? ChartAxis(data.Y2, ranges.right.Min, ranges.right.Max, tickCount) : null;
  const labelWidth = y.Ticks.reduce((size, tick) => Math.max(size, measure(data.FormatY(tick))), 0);
  const rightLabelWidth = y2 ? y2.Ticks.reduce((size, tick) => Math.max(size, measure(data.FormatY(tick, "right"))), 0) : 0;
  const marginCap = width * (y2 ? 0.33 : 0.45);
  const left = Math.min(marginCap, Math.ceil(labelWidth) + (data.Y.Label ? 26 : 8));
  const right = Math.max(left + 1, width - (y2 ? Math.min(marginCap, Math.ceil(rightLabelWidth) + (data.Y2.Label ? 26 : 8)) : 8));
  const plotWidth = right - left;
  const count = Math.max(2, Math.min(6, Math.floor(plotWidth / 75) + 1));
  const positions = data.Positions;
  const x = ChartAxis(data.X, positions[0] ?? Infinity, positions.at(-1) ?? -Infinity, count);
  const bars = data.Type === "bar";
  if (bars) {
    x.Min = data.X.Min ?? 0;
    x.Max = data.X.Max ?? Math.max(0, positions.length - 1);
    x.Ticks = [...new Set(data.X.Ticks ?? positions)].filter((index) => Number.isInteger(index) && index >= x.Min && index <= x.Max && index >= 0 && index < positions.length).sort((a, b) => a - b);
  }

  const fraction = (value, low, high) => (Number.isFinite(high - low) ? (value - low) / (high - low) : (value / 2 - low / 2) / (high / 2 - low / 2));
  const band = bars ? plotWidth / Math.max(1, x.Max - x.Min + 1) : 0;
  const scaleX = (value) => (bars ? left + (value - x.Min + 0.5) * band : left + fraction(value, x.Min, x.Max) * plotWidth);
  const scaleY = (value) => bottom - fraction(value, y.Min, y.Max) * (bottom - top);
  const scaleY2 = y2 ? (value) => bottom - fraction(value, y2.Min, y2.Max) * (bottom - top) : null;
  const selectable = positions.filter((position) => position >= x.Min && position <= x.Max);

  let end = -Infinity;
  const labels = [];
  for (const tick of x.Ticks) {
    const label = data.FormatX(tick);
    const size = measure(label);
    const px = scaleX(tick);
    const anchor = px + size / 2 > width ? "end" : px - size / 2 < 0 ? "start" : "middle";
    const start = px - (anchor === "end" ? size : anchor === "middle" ? size / 2 : 0);
    if (start < end + 8) continue;
    labels.push({ X: px, Label: label, Anchor: anchor });
    end = start + size;
  }

  const yLabels = [];
  let previousY = Infinity;
  for (const tick of y.Ticks) {
    const pixel = scaleY(tick);
    if (previousY - pixel < 16) continue;
    yLabels.push(tick);
    previousY = pixel;
  }

  const y2Labels = [];
  previousY = Infinity;
  for (const tick of y2?.Ticks ?? []) {
    const pixel = scaleY2(tick);
    if (previousY - pixel < 16) continue;
    y2Labels.push(tick);
    previousY = pixel;
  }

  return {
    Width: width,
    Left: left,
    Right: right,
    Top: top,
    Bottom: bottom,
    X: x,
    Y: y,
    Y2: y2,
    ScaleX: scaleX,
    ScaleY: scaleY,
    ScaleY2: scaleY2,
    Band: band,
    Layers: layers,
    Selectable: selectable,
    Labels: labels,
    YLabels: yLabels,
    Y2Labels: y2Labels,
  };
};

export const NearestChartIndex = (values, target, project) => {
  if (!values.length) return -1;
  let low = 0;
  let high = values.length - 1;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (project(values[mid]) < target) low = mid + 1;
    else high = mid;
  }

  return low && target - project(values[low - 1]) <= project(values[low]) - target ? low - 1 : low;
};

export const ChartBars = (points, layout, index, count, stacked) => {
  const group = layout.Band * 0.8;
  const width = stacked ? group : group / count;

  return points
    .filter((point) => point && point.X >= layout.X.Min && point.X <= layout.X.Max)
    .map((point) => {
      const base = layout.ScaleY(point.Base);
      const top = layout.ScaleY(point.Top);

      return { Position: point.X, X: layout.ScaleX(point.X) - group / 2 + (stacked ? 0 : index * width), Y: Math.min(base, top), Width: width, Height: Math.abs(base - top) };
    });
};

export const ChartDots = (points, layout) => {
  const buckets = new Map();
  for (const point of points) {
    if (!point || point.X < layout.X.Min || point.X > layout.X.Max) continue;
    const x = layout.ScaleX(point.X);
    buckets.set(Math.floor(x), { X: x, Top: layout.ScaleY(point.Top) });
  }

  return [...buckets.values()];
};

// Keep the endpoints of each continuous run and one representative per pixel
// between them. A gap or a change of stack sign always starts a new run.
export const ChartPaths = (points, layout, area, stacked) => {
  const runs = [];
  let run = [];
  let previous = null;
  let sign = 0;
  const finish = () => {
    if (run.length) runs.push(run);
    run = [];
  };

  const append = (point, side) => {
    const base = stacked && point.Value === 0 ? (side < 0 ? point.Negative : point.Positive) : point.Base;
    const top = stacked && point.Value === 0 ? base : point.Top;
    const px = layout.ScaleX(point.X);
    // Off-screen samples collapse into the adjacent edge bucket. The closest
    // neighbours still define the segment clipped at that edge.
    const bucket = Math.floor(Math.max(layout.Left - 1, Math.min(layout.Right + 1, px)));
    const vertex = { X: px, Top: layout.ScaleY(top), Base: layout.ScaleY(base), Bucket: bucket };
    const last = run.at(-1);
    if (last?.X > layout.Right && px > layout.Right) return;
    if (run.length > 1 && last.Bucket === bucket) run[run.length - 1] = vertex;
    else run.push(vertex);
  };

  for (const point of points) {
    if (!point) {
      finish();
      previous = null;
      sign = 0;
      continue;
    }

    const next = Math.sign(point.Value);
    if (stacked && previous?.Value === 0 && next && next !== sign) {
      finish();
      append(previous, next);
    }
    if (next) sign = next;
    append(point, sign);
    previous = point;
  }

  finish();

  const line = [];
  const fill = [];
  const dots = [];
  for (const vertices of runs) {
    const first = vertices[0];
    if (vertices.length === 1) {
      dots.push(first);
      continue;
    }

    const outline = vertices.map((vertex, index) => `${index ? "L" : "M"}${vertex.X},${vertex.Top}`).join(" ");
    line.push(outline);
    if (area) {
      const baseline = vertices
        .slice()
        .reverse()
        .map((vertex) => `L${vertex.X},${vertex.Base}`)
        .join(" ");
      fill.push(`${outline} ${baseline} Z`);
    }
  }

  return { Line: line.join(" "), Area: fill.join(" "), Dots: dots };
};
