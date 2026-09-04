import assert from "node:assert/strict";
import test from "node:test";

import { Accordion, Alert, ApplicationLayout, DataTable, Dropdown, Tooltip } from "../../src/Index.js";
import { AccordionComponent } from "../../src/components/Accordion.js";
import { DataTableComponent } from "../../src/components/DataTable.js";
import { DropdownComponent } from "../../src/components/Dropdown.js";
import { TooltipComponent } from "../../src/components/Tooltip.js";

test("component factories return a renderable component node", () => {
  assert.equal(Accordion({ Items: [] }).tag, AccordionComponent);
  assert.equal(DataTable({ Data: [] }).tag, DataTableComponent);
  assert.equal(Dropdown({ Options: [] }).tag, DropdownComponent);
});

test("DataTable filters rows and calculates stable page counts", () => {
  const table = new DataTableComponent({
    Data: [
      { Name: "Gateway", Status: "Ready" },
      { Name: "Archive", Status: "Warning" },
      { Name: "Relay", Status: "Ready" }
    ],
    PageSize: 2,
    Columns: [{ Key: "Name" }, { Key: "Status" }]
  });

  assert.equal(table.GetPageCount(table.GetFilteredRows()), 2);

  table.state.SearchTerm = "ready";

  assert.deepEqual(table.GetFilteredRows().map((row) => row.Name), ["Gateway", "Relay"]);
  assert.equal(table.GetPageCount(table.GetFilteredRows()), 1);
});

test("Dropdown resolves object and primitive options", () => {
  const dropdown = new DropdownComponent({});

  assert.equal(dropdown.GetOptionValue({ Value: "production", Label: "Production" }), "production");
  assert.equal(dropdown.GetOptionLabel({ Value: "production", Label: "Production" }), "Production");
  assert.equal(dropdown.GetOptionValue("development"), "development");
  assert.equal(dropdown.GetOptionLabel("development"), "development");
});

test("Tooltip renders its content and supporting text", () => {
  const tooltip = Tooltip({ Content: "Control", Text: "Helpful description", Position: "right" });

  assert.equal(tooltip.tag, TooltipComponent);
  const template = JSON.stringify(new TooltipComponent(tooltip.props).Render());
  assert.match(template, /ct-tooltip-right/);
  assert.match(template, /Helpful description/);
  assert.match(template, /Control/);
});

test("ApplicationLayout provides named layout regions", () => {
  const layout = ApplicationLayout({ Header: "Header", SideNavigation: "Navigation", Content: "Content", Footer: "Footer" });
  const template = JSON.stringify(layout);

  assert.match(template, /ct-application-layout-header/);
  assert.match(template, /ct-application-layout-navigation/);
  assert.match(template, /ct-application-layout-content/);
  assert.match(template, /ct-application-layout-footer/);
});

test("Accordion writes an explicit ARIA expanded state", () => {
  const accordion = new AccordionComponent({ Items: [{ Id: "details", Title: "Details", Content: "Content" }] });
  const template = JSON.stringify(accordion.Render());

  assert.match(template, /\"name\":\"aria-expanded\",\"value\":\"false\"/);
});

test("DataTable searches column values and explicit display labels, not hidden fields", () => {
  const table = new DataTableComponent({
    Data: [{ Id: 0, Name: "Gateway", Secret: "hidden", Status: 1 }],
    Columns: [
      { Key: "Name", Value: (row) => `Service ${row.Name}` },
      { Key: "Status", SearchText: (row, value) => value === 1 ? "Ready" : "Offline" },
      { Key: "Secret", Searchable: false }
    ]
  });
  for (const term of ["service", "ready", "GATEWAY"]) {
    table.state.SearchTerm = term;
    assert.equal(table.GetFilteredRows().length, 1);
  }
  for (const term of ["hidden", "0", "1"]) {
    table.state.SearchTerm = term;
    assert.equal(table.GetFilteredRows().length, 0);
  }
});

test("DataTable requires stable unique row and column keys including numeric zero", () => {
  const table = new DataTableComponent({ Data: [{ Id: 0 }], Columns: [{ Key: "Id" }] });
  assert.doesNotThrow(() => table.Render());
  assert.equal(table.GetRowKey({ Id: 0 }), 0);
  table.props = { Data: [{ Name: "A" }], RowKey: "Name" };
  assert.doesNotThrow(() => table.Render());
  table.props.RowKey = (row) => row.Name;
  assert.equal(table.GetRowKey({ Name: "B" }), "B");
  for (const key of [undefined, null, "", NaN, {}, false]) {
    table.props = { Data: [{ Id: key }] };
    assert.throws(() => table.Render(), /RowKey/);
  }
  table.props = { Data: [{ Id: "A" }, { Id: "A" }] };
  assert.throws(() => table.Render(), /Duplicate: A/);
  table.props = { Data: [], Columns: [{ Key: "Name" }, { Key: "Name" }] };
  assert.throws(() => table.Render(), /column Key.*Duplicate/);
});

test("Accordion uses stable item keys and validates missing or duplicate IDs", () => {
  const accordion = new AccordionComponent({ Items: [{ Id: 0, Title: "Zero" }] });
  const first = JSON.stringify(accordion.Render());
  assert.match(first, /"key":0/);
  assert.match(first, /aria-controls/);
  assert.match(first, /aria-labelledby/);
  assert.match(first, /ct-accordion-heading/);
  assert.equal(JSON.stringify(accordion.Render()), first);
  assert.notEqual(JSON.stringify(new AccordionComponent(accordion.props).Render()), first);
  accordion.props = { Items: [{ Id: "A" }, { Id: "A" }] };
  assert.throws(() => accordion.Render(), /Duplicate/);
  accordion.props = { Items: [{}] };
  assert.throws(() => accordion.Render(), /require/);
});

test("Dropdown exposes native form options and defaults", () => {
  const template = JSON.stringify(new DropdownComponent({ Name: "Environment", Required: true, Disabled: true }).Render());
  assert.match(template, /"name":"name","value":"Environment"/);
  assert.match(template, /"name":"required","value":true/);
  assert.match(template, /"name":"disabled","value":true/);
});

test("Dropdown reset waits past microtasks and cancels pending work on unmount", async () => {
  const changes = [];
  const dropdown = new DropdownComponent({ Value: "initial", Options: ["initial", "changed"], OnChange: (value) => changes.push(value) });
  const form = {};
  dropdown._select = { form, value: "changed", options: [{ value: "initial" }, { value: "changed" }] };
  const event = { target: form, defaultPrevented: false };
  dropdown._onReset(event);
  await Promise.resolve();
  assert.deepEqual(changes, [], "A microtask can run before a trusted reset's default action");
  dropdown._select.value = "initial";
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.deepEqual(changes, ["initial"]);

  dropdown._onReset(event);
  await Promise.resolve();
  event.defaultPrevented = true;
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.deepEqual(changes, ["initial"], "A later reset listener can cancel the default action");

  dropdown._onReset({ target: form, defaultPrevented: false });
  dropdown.ComponentOnUnmount();
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.equal(dropdown._resetTimers.size, 0);
  assert.deepEqual(changes, ["initial"]);
});

test("large multi-open accordions do not create excessive region landmarks", () => {
  const accordion = new AccordionComponent({ Multiple: true, Items: Array.from({ length: 7 }, (_, index) => ({ Id: index, Title: `Item ${index}` })) });
  assert.match(JSON.stringify(accordion.Render()), /"name":"role","value":"group"/);
  assert.doesNotMatch(JSON.stringify(accordion.Render()), /"value":"region"/);
});

test("Alert uses polite status unless urgent or explicitly overridden", () => {
  assert.match(JSON.stringify(Alert({ Type: "success" })), /"name":"role","value":"status"/);
  assert.match(JSON.stringify(Alert({ Type: "danger" })), /"name":"role","value":"alert"/);
  assert.match(JSON.stringify(Alert({ Live: "off" })), /"name":"role","value":null/);
  assert.match(JSON.stringify(Alert({ Type: "danger", Live: "polite" })), /"name":"role","value":"status"/);
  assert.throws(() => Alert({ Live: "invalid" }), /Live/);
});
