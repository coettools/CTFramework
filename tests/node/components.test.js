import assert from "node:assert/strict";
import test from "node:test";

import { Accordion, ApplicationLayout, DataTable, Dropdown, Tooltip } from "../../src/Index.js";
import { AccordionComponent } from "../../src/components/Accordion.js";
import { DataTableComponent } from "../../src/components/DataTable.js";
import { DropdownComponent } from "../../src/components/Dropdown.js";

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
    PageSize: 2
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

  assert.equal(tooltip.tag, "ct-template");
  assert.match(tooltip.props.strings.join(""), /ct-tooltip/);
  assert.equal(tooltip.props.values[0], "Control");
  assert.equal(tooltip.props.values[1].props.values[0].value, "ct-tooltip-content ct-tooltip-right");
  assert.equal(tooltip.props.values[1].props.values[1], "Helpful description");
});

test("ApplicationLayout provides named layout regions", () => {
  const layout = ApplicationLayout({ Header: "Header", SideNavigation: "Navigation", Content: "Content", Footer: "Footer" });
  const template = JSON.stringify(layout);

  assert.match(template, /ct-application-layout-header/);
  assert.match(template, /ct-application-layout-navigation/);
  assert.match(template, /ct-application-layout-content/);
  assert.match(template, /ct-application-layout-footer/);
});
