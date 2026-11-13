import assert from "node:assert/strict";
import test from "node:test";
import { Combobox } from "../../src/Index.js";
import { ComboboxComponent } from "../../src/components/Combobox.js";
import { FindOptions, IndexOptions } from "../../src/utils/ComboboxSearch.js";

const options = [
  { Value: "slow", Label: "Wildfire", Group: "Spells", Keywords: ["projectile"] },
  { Value: 17, Label: "Fireball", Group: "Spells", Keywords: ["projectile"], Description: "A burning orb." },
  { Value: "locked", Label: "Fire wall", Group: "Spells", Disabled: true },
  { Value: "arrow", Label: "Fire arrow", Group: "Attacks", Keywords: ["projectile"] },
  "Ice",
];

test("invalid render caps use the documented default rather than hiding every option", () => {
  const index = IndexOptions(Array.from({ length: 100 }, (_, value) => `Entry ${value}`));
  for (const cap of [0, -1, NaN, Infinity, "10"]) {
    assert.equal(FindOptions(index, "", null, cap).enabled.length, 50);
  }

  assert.equal(FindOptions(index, "", null, 2.9).enabled.length, 2);
});

const CreateControl = (props = {}) => {
  const control = new ComboboxComponent({ Options: options, Label: "Skill", ...props });
  control.Render();

  return control;
};

const Press = (control, key, extra = {}) => {
  let prevented = false;
  control.HandleKeyDown({
    key,
    preventDefault: () => {
      prevented = true;
    },
    ...extra,
  });

  return prevented;
};

const Input = (control, value) => control.HandleInput({ currentTarget: { value, setCustomValidity: () => {} } });
const Wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

test("Combobox factory creates a keyed managed child and unique generated IDs", () => {
  const child = Combobox({ Key: "main", Options: options });
  assert.equal(child.tag, ComboboxComponent);
  assert.equal(child.key, "main");
  assert.equal(child.props.Options, options);
  assert.notEqual(CreateControl()._id, CreateControl()._id);
  for (const label of [undefined, null, "", " \t ", 17]) {
    assert.throws(() => CreateControl({ Label: label }), { name: "TypeError", message: /Combobox Label must be a non-empty string/ });
  }
});

test("malformed and empty choices are omitted; the first valid option owns a stringified value", () => {
  const first = { Value: 0, Label: "Zero" };
  const index = IndexOptions([null, undefined, 3, "", " ", {}, { Value: {}, Label: "Object" }, { Value: 0, Label: "" }, first, "0", { Value: "0", Label: "Duplicate" }]);
  assert.deepEqual(
    index.entries.map((entry) => entry.option),
    [first],
  );
  assert.equal(index.byValue.get("0").value, 0);
  assert.throws(() => IndexOptions("wrong container"), TypeError);
});

test("a parent-selected disabled option remains a valid committed value but cannot be picked", () => {
  const control = CreateControl({ Value: "locked", Required: true, OnChange: () => assert.fail("disabled row changed the value") });
  assert.equal(control._selected.key, "locked");
  assert.equal(control._selected.label, "Fire wall");
  control.Toggle();
  control.Render();
  assert.equal(
    control._results.enabled.some((entry) => entry.key === "locked"),
    false,
  );
  control.Commit(control._selected);
  assert.equal(control.state.Open, true);
  control.props.Options = [options[2]];
  control.Render();
  assert.equal(control._activeKey, null);
  Press(control, "Enter");
  assert.equal(control.state.Open, true);
});

test("matching uses all words, ranks word starts, and groups in source order", () => {
  const index = IndexOptions(options);
  const results = FindOptions(index, "  PROJ  FiRe ", null, 3);
  assert.deepEqual(
    results.groups.map(([group]) => group),
    ["Spells", "Attacks"],
  );
  assert.deepEqual(
    results.enabled.map((entry) => entry.key),
    ["17", "slow", "arrow"],
  );
  const capped = FindOptions(index, "fire proj", null, 2);
  assert.deepEqual(
    capped.enabled.map((entry) => entry.key),
    ["17", "arrow"],
  );
  assert.equal(capped.remaining, 1);
  assert.equal(FindOptions(index, "fire missing").total, 0);
  assert.equal(FindOptions(index, "burning").total, 0);
  assert.equal(FindOptions(IndexOptions(["Ice-Fire", "Wildfire"]), "fire").enabled[0].label, "Ice-Fire");
});

test("5,000 precomputed entries respect the cap, custom filter, and cached navigation", () => {
  let labelsRead = 0;
  let filterCalls = 0;
  const large = Array.from({ length: 5000 }, (_, index) => ({
    Value: index,
    get Label() {
      labelsRead++;

      return `Entry ${index}`;
    },
  }));
  const control = CreateControl({
    Options: large,
    Filter: (option, query) => {
      filterCalls++;

      return query === "" && option.Value % 2 === 0;
    },
  });
  Press(control, "ArrowDown");
  assert.equal(control._results.total, 2500);
  assert.equal(control._results.enabled.length, 50);
  assert.equal(control._results.remaining, 2450);
  for (const key of ["End", "Home", "ArrowDown", "ArrowUp"]) {
    Press(control, key);
    control.Render();
  }

  assert.equal(labelsRead, 5000);
  assert.equal(filterCalls, 5000);
});

test("navigation skips disabled rows, respects boundaries and commits only a changed choice", () => {
  const changes = [];
  const control = CreateControl({ Value: "slow", OnChange: (...args) => changes.push(args) });
  assert.equal(Press(control, "Home"), false);
  assert.equal(Press(control, "ArrowDown", { isComposing: true }), false);
  Press(control, "ArrowUp");
  assert.equal(control._activeKey, "Ice");
  Press(control, "Home");
  Press(control, "Enter");
  assert.deepEqual(changes, []);
  Press(control, "ArrowDown");
  Press(control, "ArrowDown");
  assert.equal(control._activeKey, "17");
  Press(control, "ArrowDown");
  assert.equal(control._activeKey, "arrow");
  Press(control, "ArrowUp");
  Press(control, "Enter");
  assert.deepEqual(changes, [[17, options[1]]]);
  assert.equal(control.state.Open, false);
  control.Render();
  assert.equal(control._selected.label, "Wildfire", "Parent owns Value");
  control.Commit(null);
  assert.deepEqual(changes.at(-1), ["", null]);
});

test("debounce applies only the final draft; Escape, Tab and disposal cancel pending searches", async () => {
  const changes = [];
  const queries = new Set();
  const control = CreateControl({
    Value: 17,
    Filter: (_, query) => {
      queries.add(query);

      return true;
    },
    OnChange: (...args) => changes.push(args),
  });
  for (const draft of ["f", "fi", "fire"]) {
    Input(control, draft);
    control.Render();
  }

  Press(control, "Enter");
  assert.deepEqual([...queries], [""]);
  assert.deepEqual(changes, []);
  await Wait(130);
  control.Render();
  assert.deepEqual([...queries], ["", "fire"]);
  for (const key of ["Tab", "Escape"]) {
    Input(control, "other");
    assert.equal(Press(control, key), key === "Escape");
    assert.equal(control.GetDraft(), null);
    assert.equal(control.state.Open, false);
  }

  Input(control, "disposed");
  control.ComponentOnUnmount();
  await Wait(130);
  assert.equal(control.state.Query, "");
  assert.equal(control._queryTimer, null);
});

test("option replacement keeps the active row within the cap and silently invalidates a missing selection", () => {
  const control = CreateControl({ Value: 17, MaxVisible: 2, OnChange: () => assert.fail("replacement fired OnChange") });
  Press(control, "ArrowDown");
  Press(control, "ArrowDown");
  Input(control, "pending");
  control.props = { ...control.props, Options: ["New", "Ice", options[1]] };
  control.Render();
  assert.equal(control._activeKey, "17");
  assert.equal(control._results.enabled.length, 2);
  assert.ok(control._results.enabled.some((entry) => entry.key === "17"));
  control.props.Options = ["Ice"];
  control.Render();
  assert.equal(control._selected, null);
  assert.equal(control.GetDraft(), null);
  assert.equal(control._queryTimer, null);
  assert.equal(control._activeKey, "Ice");
});

test("an arrow pressed during debounce navigates the latest draft immediately", () => {
  const control = CreateControl();
  Input(control, "ice");
  Press(control, "ArrowDown");
  assert.equal(control._activeKey, "Ice");
  assert.equal(control._results.total, 1);
  assert.equal(control._queryTimer, null);
});

test("native validity tracks the committed choice independently of draft text", () => {
  const control = CreateControl({ Required: true });
  const input = {
    value: "unmatched",
    setCustomValidity(message) {
      this.message = message;
    },
  };
  control.SyncValidity(input);
  assert.ok(input.message && input.required);
  control.props.Value = 17;
  control.Render();
  input.value = "";
  control.SyncValidity(input);
  assert.equal(input.message, "");
  assert.equal(input.required, false);
  input.value = "Fireball";
  control.SyncValidity(input);
  assert.equal(input.required, true);
  control.props.Disabled = true;
  control.Render();
  assert.equal(Press(control, "ArrowDown"), false);
  assert.equal(control.state.Open, false);
});

test("reset defers one notification per uncanceled event, resolves current options, and removes listeners and timers", async () => {
  const changes = [];
  const control = CreateControl({ Value: 17, OnChange: (...args) => changes.push(args) });
  const form = new EventTarget();
  const ownerDocument = new EventTarget();
  const input = { ownerDocument, form, isConnected: true, value: "", setCustomValidity() {}, getAttribute: () => null };
  control.vnode = { dom: { querySelector: () => input } };
  control.SetState = (state) => Object.assign(control.state, state);
  control.ComponentOnMount();
  control.props.Value = "Ice";
  control.Render();
  form.dispatchEvent(new Event("reset"));
  assert.equal(changes.length, 0);
  await Wait(10);
  assert.deepEqual(changes, [[17, options[1]]]);
  form.addEventListener("reset", (event) => event.preventDefault(), { once: true });
  form.dispatchEvent(new Event("reset", { cancelable: true }));
  await Wait(10);
  assert.equal(changes.length, 1);
  control.props.Options = ["Ice"];
  form.dispatchEvent(new Event("reset"));
  await Wait(10);
  assert.deepEqual(changes.at(-1), ["", null]);
  input.form = new EventTarget();
  control.SyncDom();
  form.dispatchEvent(new Event("reset"));
  assert.equal(control._resetTimers.size, 0);
  input.form.dispatchEvent(new Event("reset"));
  assert.equal(control._resetTimers.size, 1);
  control.ComponentOnUnmount();
  input.form.dispatchEvent(new Event("reset"));
  await Wait(10);
  assert.equal(control._resetTimers.size, 0);
  assert.equal(changes.length, 2);
});
