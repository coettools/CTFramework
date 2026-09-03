import assert from "node:assert/strict";
import test from "node:test";

import { Accordion, DataTable, Dropdown } from "../../src/Index.js";
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
