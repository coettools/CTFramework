import assert from "node:assert/strict";
import test from "node:test";
import { Chart } from "../../src/components/Chart.js";
import { CreateChartData } from "../../src/utils/ChartData.js";
import { ChartAxis, ChartBars, ChartLayers, ChartLayout, ChartPaths, NearestChartIndex } from "../../src/utils/ChartGeometry.js";

const Series = (id, values, xs = values.map((_, index) => index)) => ({ Id: id, Label: id.toUpperCase(), Points: Array.from(values, (y, index) => ({ X: xs[index], Y: y })) });
const Data = (options = {}) => CreateChartData({ Title: "Readings", ...options });
const Control = (options) => {
  const view = Chart({ Title: "Readings", ...options });

  return new view.tag(view.props);
};

test("factory uses one managed component and validates the input contract", () => {
  assert.equal(Chart({ Key: "test" }).key, "test");
  assert.equal(Control({}).Render().tag, "ct-template");
  assert.equal(Data().Height, 240);
  assert.equal(Data().HasData, false);
  for (const options of [
    { Title: " " },
    { Type: "stackedbar" },
    { Type: null },
    { Stacked: true },
    { Height: NaN },
    { Series: [Series("a", [1]), Series("a", [2])] },
    { Series: [Series("a", [3, 2], [0, 0])] },
    { Series: [Series("a", [1], ["2020-01-01"])] },
    { Series: [Series("a", [2], [new Date(NaN)])] },
    { Series: [Series("a", [NaN])] },
    { Series: [Series("a", [Infinity])] },
    { Series: [Series("a", [undefined])] },
    { Series: [{ Id: "a", Label: "A" }] },
    { X: { Min: null } },
    { Y: { Min: NaN } },
    { Y: { Min: -1, Max: -1 } },
    { X: { Min: 4, Max: 2 } },
    { Y: { Ticks: [Infinity] } },
    { Y: { Ticks: 5 } },
    { Type: "bar", Categories: ["A", "B"], Series: [{ Id: "s", Label: "S", Values: [2] }] },
  ])
    assert.throws(() => Data(options), /Chart/);
});

test("zero, negative, one-sided, constant and empty domains generate finite ordered ticks", () => {
  assert.deepEqual(ChartAxis({ Min: 0 }, 2.2, 8.3), { Min: 0, Max: 10, Ticks: [0, 5, 10] });
  assert.deepEqual(ChartAxis({ Min: -6, Max: 3, Ticks: [7, 3, -5, 0, 0] }, -20, 20).Ticks, [-5, 0, 3]);
  for (const [axis, min, max] of [
    [{}, -9, -2],
    [{}, 0, 0],
    [{ Min: 5 }, -4, -1],
    [{ Max: -2 }, 1, 5],
    [{}, Infinity, -Infinity],
    [{}, 1e12, 1e12 + 0.003],
  ]) {
    const scale = ChartAxis(axis, min, max);
    assert.ok(scale.Max > scale.Min && scale.Ticks.length > 0);
    assert.ok(scale.Ticks.every((tick, index, ticks) => Number.isFinite(tick) && tick >= scale.Min && tick <= scale.Max && (!index || tick > ticks[index - 1])));
    if (axis.Min !== undefined) assert.equal(scale.Min, axis.Min);
    if (axis.Max !== undefined) assert.equal(scale.Max, axis.Max);
  }

  assert.deepEqual(ChartAxis({ Ticks: [] }, 0, 100).Ticks, []);
});

test("Date coordinates and markers normalize to epoch numbers; series join only on exact X", () => {
  const data = Data({
    Series: [Series("a", [1, null, 5], [new Date(10), new Date(30), new Date(50)]), Series("b", [7, 4], [50, 20])],
    Markers: [{ X: new Date(30), Label: "Sample" }],
    X: { Format: (value) => `t${value}`, Ticks: [new Date(20)] },
    Y: { Format: (value) => `${value} cm` },
  });
  assert.deepEqual(data.Positions, [10, 20, 30, 50]);
  assert.equal(data.Markers[0].X, 30);
  assert.deepEqual(data.X.Ticks, [20]);
  assert.equal(data.FormatX(20), "t20");
  assert.equal(data.FormatY(data.Visible[0].Values.get(20)), "—");
  assert.equal(data.FormatY(data.Visible[0].Values.get(30)), "—");
  assert.equal(data.FormatY(data.Visible[1].Values.get(20)), "4 cm");
  assert.deepEqual(
    ChartLayout(data, 600).Labels.map((tick) => tick.Label),
    ["t20"],
  );
});

test("full data and series identity survive thinning, explicit bounds and controlled visibility", () => {
  const series = [
    Series(
      "a",
      Array.from({ length: 2400 }, (_, i) => (i % 100 === 20 ? null : Math.sin(i))),
    ),
    Series("b", [2], [100]),
  ];
  const data = Data({ Series: series, Hidden: ["b"], X: { Min: 40, Max: 2100 } });
  const layout = ChartLayout(data, 180);
  const paths = ChartPaths(layout.Layers[0], layout, false, false);
  assert.equal(data.Positions.length, 2400);
  assert.equal(layout.Selectable[0], 40);
  assert.equal(layout.Selectable.at(-1), 2100);
  const visibleRuns = paths.Line.split("M")
    .slice(1)
    .filter((run) => {
      const coordinates = run
        .trim()
        .split(/\s+L/)
        .map((vertex) => Number(vertex.split(",")[0]));

      return coordinates[0] <= layout.Right && coordinates.at(-1) >= layout.Left;
    });
  assert.equal(visibleRuns.length, 21);
  assert.ok(paths.Line.match(/[LM]/g).length < 250);
  assert.doesNotMatch(paths.Line, /NaN|Infinity/);
  assert.equal(data.Series[1].Color, "var(--ct-chart-2)");
  assert.notEqual(data.Series[1].Dash, data.Series[0].Dash);
  assert.equal(Data({ Series: series, Hidden: ["a", "b"] }).HasData, false);
  assert.equal(Data({ Series: [Series("a", [null])] }).HasData, false);
});

test("grouped and divergent stacked bars use category centers and independent sign totals", () => {
  const options = {
    Type: "bar",
    Categories: ["First", "Second"],
    X: { Format: (value) => `Set ${value}` },
    Series: [
      { Id: "a", Label: "A", Values: [5, -2] },
      { Id: "b", Label: "B", Values: [-7, -3] },
      { Id: "c", Label: "C", Values: [4, null] },
    ],
  };
  const grouped = ChartLayout(Data(options), 600);
  const bars = grouped.Layers.map((layer, index) => ChartBars(layer, grouped, index, 3, false));
  assert.equal(bars[0][0].X + bars[0][0].Width, bars[1][0].X);
  assert.equal(bars[2].length, 1);
  assert.deepEqual(
    grouped.Labels.map((tick) => tick.Label),
    ["Set First", "Set Second"],
  );

  const layout = ChartLayout(Data({ ...options, Stacked: true }), 600);
  assert.deepEqual(
    layout.Layers.map((layer) => layer.map((point) => point && [point.Base, point.Top])),
    [
      [
        [0, 5],
        [0, -2],
      ],
      [
        [0, -7],
        [-2, -5],
      ],
      [[5, 9], null],
    ],
  );
  const stacked = layout.Layers.map((layer, index) => ChartBars(layer, layout, index, 3, true));
  assert.equal(stacked[0][0].X, stacked[2][0].X);
  assert.ok(stacked[0][0].Width > bars[0][0].Width);
});

test("stacked areas align every series, preserve unknown baselines and split sign crossings", () => {
  assert.throws(() => Data({ Type: "area", Stacked: true, Hidden: ["b"], Series: [Series("a", [2, 1]), Series("b", [3], [4])] }), /aligned X/);
  const data = Data({ Type: "area", Stacked: true, Series: [Series("a", [5, 5, null, 4]), Series("b", [2, -2, 7, 1])] });
  const layers = ChartLayers(data);
  const layout = ChartLayout(data, 400);
  assert.deepEqual(
    layers[1].map((point) => point && [point.X, point.Base, point.Top]),
    [[0, 5, 7], [0.5, 5, 5], [1, 0, -2], null, [3, 4, 5]],
  );
  const paths = ChartPaths(layers[1], layout, true, true);
  assert.equal(paths.Area.match(/Z/g).length, 2);
  assert.equal(paths.Dots.length, 1);
  assert.equal(data.Positions.includes(0.5), false);
  assert.equal(data.FormatY(data.Visible[1].Values.get(2)), "7");
});

test("narrow plots declutter formatted automatic and explicit tick labels; selection uses full-resolution positions", () => {
  const data = Data({ Series: [Series("a", Array(21).fill(1))], X: { Ticks: Array.from({ length: 21 }, (_, i) => i), Format: (value) => `Interval ${value}` } });
  const narrow = ChartLayout(data, 220);
  const wide = ChartLayout(data, 880);
  assert.ok(narrow.Labels.length < wide.Labels.length);
  assert.equal(narrow.Selectable.length, 21);
  for (const position of [0, 5, 12, 20]) assert.equal(NearestChartIndex(narrow.Selectable, narrow.ScaleX(position) + 0.01, narrow.ScaleX), position);
  assert.equal(
    NearestChartIndex([], 2, (value) => value),
    -1,
  );
});

test("keyboard inspection uses raw rows for both announcements and crosshair, including repeated endpoint presses", () => {
  const chart = Control({ Series: [Series("a", [1, null, 3]), Series("b", [9], [1])], X: { Format: (value) => `t${value}` }, Y: { Format: (value) => `${value} m` } });
  chart.Render();
  const attributes = new Map();
  const tooltip = {};
  const live = {};
  chart._plot = { querySelector: () => ({ setAttribute: (key, value) => attributes.set(key, value) }) };
  chart.vnode = { dom: { querySelector: (name) => (name === ".ct-chart-tooltip" ? tooltip : live) } };
  const press = (key) => chart.InspectKey({ key, preventDefault() {} });
  chart.Select(0, true);
  press("ArrowRight");
  assert.equal(live.textContent, "t1 · A: — · B: 9 m");
  assert.equal(tooltip.textContent, live.textContent);
  assert.equal(attributes.get("x1"), chart._layout.ScaleX(1));
  press("ArrowRight");
  press("ArrowRight");
  assert.equal(live.textContent, "t2 · A: 3 m · B: —");
  press("ArrowLeft");
  press("Escape");
  assert.equal(tooltip.hidden, true);
  assert.equal(live.textContent, "");
});
