import { Component } from "./Component.js";
import { CreateComponent } from "./ComponentFactory.js";
import { CT } from "../CTFramework.js";

const html = CT.Html;

export class DataTableComponent extends Component {
  constructor(props) {
    super(props);
    this.state = { SearchTerm: "", CurrentPage: 1 };
  }

  GetCellValue(row, column) {
    return typeof column.Value === "function" ? column.Value(row) : row?.[column.Key];
  }

  GetSearchText(row) {
    return (this.props.Columns || [])
      .filter((column) => column.Searchable !== false)
      .map((column) => {
        const value = this.GetCellValue(row, column);
        return column.SearchText ? column.SearchText(row, value) : value;
      })
      .filter((value) => ["string", "number", "boolean"].includes(typeof value))
      .join(" ")
      .toLowerCase();
  }

  GetRowKey(row) {
    const rowKey = this.props.RowKey ?? "Id";
    return typeof rowKey === "function" ? rowKey(row) : row?.[rowKey];
  }

  ValidateKeys(items, getKey, name) {
    const keys = new Set();
    for (const item of items) {
      const key = getKey(item);
      if (!(typeof key === "string" && key.length > 0 || typeof key === "number" && Number.isFinite(key))) {
        throw new Error(`DataTable ${name} must provide a non-empty string or finite number for every item.`);
      }
      if (keys.has(key)) throw new Error(`DataTable ${name} must be unique. Duplicate: ${key}`);
      keys.add(key);
    }
  }

  GetFilteredRows() {
    const searchTerm = this.state.SearchTerm.trim().toLowerCase();
    const data = this.props.Data || [];

    return searchTerm ? data.filter((row) => this.GetSearchText(row).includes(searchTerm)) : data;
  }

  GetPageSize() {
    const pageSize = Number(this.props.PageSize);
    return Number.isInteger(pageSize) && pageSize > 0 ? pageSize : 10;
  }

  GetPageCount(rows) {
    return Math.max(1, Math.ceil(rows.length / this.GetPageSize()));
  }

  HandleSearch(event) {
    this.SetState({ SearchTerm: event.target.value, CurrentPage: 1 });
  }

  SetPage(currentPage) {
    const pageCount = this.GetPageCount(this.GetFilteredRows());
    this.SetState({ CurrentPage: Math.min(Math.max(currentPage, 1), pageCount) });
  }

  Render() {
    const { Columns = [], EmptyText = "No matching records.", SearchPlaceholder = "Search records" } = this.props;
    this.ValidateKeys(this.props.Data || [], (row) => this.GetRowKey(row), "RowKey (default: Id)");
    this.ValidateKeys(Columns, (column) => column.Key, "column Key");
    const filteredRows = this.GetFilteredRows();
    const pageCount = this.GetPageCount(filteredRows);
    const currentPage = Math.min(this.state.CurrentPage, pageCount);
    const start = (currentPage - 1) * this.GetPageSize();
    const rows = filteredRows.slice(start, start + this.GetPageSize());

    return html`
      <section class="ct-data-table">
        <div class="ct-data-table-toolbar">
          <label class="ct-data-table-search">
            <span>Search</span>
            <input type="search" ${CT.Attr("placeholder", SearchPlaceholder)} ${CT.Attr("value", this.state.SearchTerm)} ${CT.On("input", (event) => this.HandleSearch(event))}>
          </label>
          <span class="ct-status">${filteredRows.length} records</span>
        </div>
        <div class="ct-data-table-scroll">
          <table>
            <thead><tr>${Columns.map((column) => ({ ...html`<th scope="col">${column.Title ?? column.Key}</th>`, key: column.Key }))}</tr></thead>
            <tbody>
              ${rows.length
                ? rows.map((row) => ({ ...html`<tr>${Columns.map((column) => {
                    const value = this.GetCellValue(row, column);
                    return { ...html`<td>${column.Render ? column.Render(row, value) : value ?? ""}</td>`, key: column.Key };
                  })}</tr>`, key: this.GetRowKey(row) }))
                : html`<tr><td class="ct-data-table-empty" ${CT.Attr("colSpan", Math.max(1, Columns.length))}>${EmptyText}</td></tr>`}
            </tbody>
          </table>
        </div>
        <footer class="ct-data-table-pagination">
          <button type="button" class="ct-button-secondary" ${CT.Attr("disabled", currentPage <= 1)} ${CT.On("click", () => this.SetPage(currentPage - 1))}>Previous</button>
          <span>Page ${currentPage} of ${pageCount}</span>
          <button type="button" class="ct-button-secondary" ${CT.Attr("disabled", currentPage >= pageCount)} ${CT.On("click", () => this.SetPage(currentPage + 1))}>Next</button>
        </footer>
      </section>
    `;
  }
}

export const DataTable = (options = {}) => CreateComponent(DataTableComponent, options);
