import CT, {
  Accordion,
  Alert,
  ApplicationLayout,
  Badge,
  Card,
  Chart,
  CodeBlock,
  Combobox,
  Component,
  DataTable,
  Dialog,
  Dropdown,
  FallbackView,
  GetFormValues,
  Guid,
  HttpClient,
  ImageCarousel,
  MaxLength,
  PopupWindow,
  PanZoomView,
  Popover,
  Required,
  SideNavigation,
  SplitLayout,
  Tabs,
  Toast,
  Tooltip,
} from "../../../src/Index.js";
import { CSharpCode } from "../../fixtures/CSharpCode.js";
import { CarouselImages } from "../../fixtures/CarouselImages.js";
import { ChildCounter } from "./components/ChildCounter.js";

const html = CT.Html;

const UsageExample = ({ Code }) => html`<section class="showcase-example">${CodeBlock({ Title: "Usage", Code })}</section>`;

const PanelHeading = ({ title, body }) => {
  return html`
    <header class="panel-heading">
      <h2>${title}</h2>
      <p>${body}</p>
    </header>
  `;
};

const StatCard = ({ label, value }) => {
  return html`
    <article class="stat-card">
      <span class="stat-label">${label}</span>
      <strong class="stat-value">${value}</strong>
    </article>
  `;
};

class TabsChartPanel extends Component {
  Render() {
    return html`<section>
      <h4>Completed tasks</h4>
      ${Chart({
        Title: "Completed tasks",
        ShowTitle: false,
        Type: "line",
        X: { Label: "Day" },
        Y: { Label: "Tasks", Min: 0 },
        Series: [
          {
            Id: "tasks",
            Label: "Completed",
            Points: [
              { X: 1, Y: 2 },
              { X: 2, Y: 4 },
              { X: 3, Y: 3 },
            ],
          },
        ],
      })}
    </section>`;
  }
}

class TabsDiagramPanel extends Component {
  constructor(props) {
    super(props);
    this.state = { Camera: null };
  }

  Render() {
    return html`<section>
      <h4>Process diagram</h4>
      <div style="height: 16rem">
        ${PanZoomView({
          Label: "Process diagram",
          Bounds: { MinX: -100, MinY: -70, MaxX: 100, MaxY: 70 },
          Camera: this.state.Camera,
          Content: html`<g>
            <circle cx="-40" cy="0" r="18" fill="var(--ct-color-accent)"></circle>
            <circle cx="40" cy="0" r="18" fill="var(--ct-color-success)"></circle>
            <line x1="-22" y1="0" x2="22" y2="0" stroke="currentColor"></line>
          </g>`,
          OnCameraChange: (camera) => this.SetState({ Camera: camera }),
        })}
      </div>
    </section>`;
  }
}

export class App extends Component {
  constructor(props) {
    super(props);

    const storeState = props.store.GetState();

    this.state = {
      currentPath: props.router.currentPath,
      count: storeState.count,
      notes: storeState.notes,
      utilityResult: "Run a utility demonstration.",
      selectedEnvironment: "",
      environmentDisabled: false,
      environmentResult: "Submit an environment to inspect the form values.",
      selectedResource: "",
      diagramCamera: null,
      diagramItem: "none",
      hiddenChartSeries: [],
      selectedTab: "overview",
      narrowTabs: false,
      activeSystemArea: "runtime",
      isDialogOpen: false,
      isPopupOpen: false,
      isToastVisible: false,
    };

    this.unsubscribeStore = null;
    this.unsubscribeRouter = null;
    this._httpClient = new HttpClient();

    this.actions = {
      setPath: (path) => this.props.router.Navigate(path),
      incrementCount: (step = 1) => {
        this.props.store.SetState((storeState) => ({ count: storeState.count + step }));
      },
      addNote: (event) => {
        event.preventDefault();

        const values = GetFormValues(event.target);
        const note = String(values.note ?? "").trim();

        if (!note) {
          return;
        }

        this.props.store.SetState((storeState) => ({
          notes: [...storeState.notes, note],
        }));

        event.target.reset();
        CT("#note-input").Get()?.focus();
      },
      removeNote: (index) => {
        this.props.store.SetState((storeState) => ({
          notes: storeState.notes.filter((_, noteIndex) => noteIndex !== index),
        }));
      },
      toggleDomBox: () => {
        const box = CT("#dom-box");
        const nextIsActive = !box.HasClass("is-active");
        const timestamp = new Date().toLocaleTimeString();

        box
          .ToggleClass("is-active", nextIsActive)
          .Attr("data-last-update", timestamp)
          .Css({
            borderColor: nextIsActive ? "var(--ct-color-success)" : "var(--ct-color-border)",
            backgroundColor: nextIsActive ? "var(--ct-color-surface-raised)" : "var(--ct-color-surface)",
          })
          .Text(`Helper update: ${timestamp}`);
      },
      runGuidAndValidators: () => {
        const sampleValue = "CTFramework";
        const id = Guid();
        const isRequired = Required(sampleValue);
        const isValidLength = MaxLength(sampleValue, 16);

        this.SetState({
          utilityResult: `Guid: ${id} | Required: ${isRequired} | MaxLength(16): ${isValidLength}`,
        });
      },
      runHttpClient: async () => {
        try {
          const response = await this._httpClient.Get("data:application/json,%7B%22source%22%3A%22CTFramework%20showcase%22%2C%22status%22%3A%22ok%22%7D");
          const result = await response.json();

          this.SetState({ utilityResult: `HttpClient.Get: ${result.source} (${result.status})` });
        } catch (error) {
          this.SetState({ utilityResult: `HttpClient error: ${error.message}` });
        }
      },
      selectEnvironment: (value) => this.SetState({ selectedEnvironment: value }),
      selectSystemArea: (item) => this.SetState({ activeSystemArea: item.Id }),
      openDialog: () => this.SetState({ isDialogOpen: true }),
      closeDialog: () => this.SetState({ isDialogOpen: false }),
      togglePopup: () => this.SetState((state) => ({ isPopupOpen: !state.isPopupOpen })),
      showToast: () => this.SetState({ isToastVisible: true }),
      closeToast: () => this.SetState({ isToastVisible: false }),
    };

    this.componentData = [
      { Name: "Gateway", Status: "Ready", Owner: "Systems" },
      { Name: "Archive", Status: "Warning", Owner: "Operations" },
      { Name: "Relay", Status: "Ready", Owner: "Communications" },
      { Name: "Indexer", Status: "Offline", Owner: "Systems" },
      { Name: "Console", Status: "Ready", Owner: "Operations" },
      { Name: "Bridge", Status: "Warning", Owner: "Communications" },
    ];

    this.componentColumns = [
      { Key: "Name", Title: "Component" },
      { Key: "Owner", Title: "Owner", Value: (row) => `${row.Owner} team` },
      {
        Key: "Status",
        Title: "Status",
        SearchText: (_, value) => `${value} service`,
        Render: (_, value) => Badge({ Text: `${value} service`, Type: value === "Ready" ? "success" : value === "Warning" ? "warning" : "danger" }),
      },
    ];

    this.componentExamples = [
      {
        Id: "chart",
        Title: "Chart",
        Content: CodeBlock({
          Title: "Usage",
          Code: [
            "Chart({",
            '  Title: "Completed jobs",',
            '  Type: "scatter",',
            "  Series: [{",
            '    Id: "queue", Label: "Queue A",',
            "    PointRadius: 5,",
            '    PointShape: "diamond",',
            "    Points: [{ X: 0, Y: 2 }, { X: 1, Y: 5 }]",
            "  }]",
            "});",
          ].join("\n"),
        }),
      },
      {
        Id: "tabs",
        Title: "Tabs",
        Content: CodeBlock({
          Title: "Usage",
          Code: [
            "Tabs({",
            '  Label: "Workspace sections",',
            '  Layout: "auto",',
            "  Columns: 2,",
            '  MinPanelWidth: "16rem",',
            "  ShowHeadings: false,",
            "  Items: [",
            '    { Id: "overview", Title: "Overview", Content: Card({ Title: "Overview", Content: html`<p>Work</p>` }) },',
            '    { Id: "notes", Title: "Notes", Content: Card({ Title: "Notes", Content: html`<p>Notes</p>` }) },',
            '    { Id: "chart", Title: "Chart", Span: "full", Content: CT.View({ Component: TabsChartPanel, Key: "chart" }) },',
            '    { Id: "diagram", Title: "Diagram", Span: "full", Content: CT.View({ Component: TabsDiagramPanel, Key: "diagram" }) }',
            "  ]",
            "});",
          ].join("\n"),
        }),
      },
      {
        Id: "split-layout",
        Title: "SplitLayout",
        Content: CodeBlock({
          Title: "Usage",
          Code: ["SplitLayout({", "  Side: html`<p>Summary</p>`,", "  Main: html`<p>Details</p>`,", '  Label: { Side: "Summary", Main: "Details" },', "  Sticky: true", "});"].join("\n"),
        }),
      },
      {
        Id: "popover",
        Title: "Popover",
        Content: CodeBlock({
          Title: "Usage",
          Code: ["Popover({", '  Label: "Record details",', '  Trigger: html`<button type="button">Inspect</button>`,', "  Content: html`<div><h3>Record</h3><p>Ready to review.</p></div>`,", '  Open: "hover"', "});"].join("\n"),
        }),
      },
      {
        Id: "combobox",
        Title: "Combobox",
        Content: CodeBlock({ Title: "Usage", Code: 'Combobox({\n  Label: "Resource",\n  Value: this.state.Resource,\n  Options: ["Copper", "Iron", "Silver"],\n  OnChange: (value) => this.SetState({ Resource: value })\n});' }),
      },
      {
        Id: "pan-zoom-view",
        Title: "PanZoomView",
        Content: CodeBlock({
          Title: "Usage",
          Code: 'PanZoomView({\n  Label: "Diagram",\n  Bounds: { MinX: -200, MinY: -100, MaxX: 200, MaxY: 100 },\n  Camera: this.state.Camera,\n  Content: html`<g><circle cx="0" cy="0" r="20" /></g>`,\n  OnCameraChange: (camera) => this.SetState({ Camera: camera })\n});',
        }),
      },
      {
        Id: "image-carousel",
        Title: "ImageCarousel",
        Content: CodeBlock({
          Title: "Usage",
          Code: 'ImageCarousel({\n  Label: "Project gallery",\n  Images: [\n    { Src: "./images/ridge.jpg", Alt: "Mountain ridges", Caption: "Northern ridge" },\n    { Src: "./images/coast.jpg", Alt: "Coast at dusk", Caption: "Coastal dusk" }\n  ],\n  Loop: true,\n  Fit: "contain",\n  OnChange: (index, image) => console.log(index, image.Caption)\n});',
        }),
      },
      {
        Id: "application-layout",
        Title: "ApplicationLayout",
        Content: CodeBlock({
          Title: "ApplicationLayout",
          Code: 'ApplicationLayout({\n  Header: html`<strong>Operations</strong>`,\n  SideNavigation: SideNavigation({\n    Title: "Workspace",\n    Items: navigationItems\n  }),\n  Content: html`<section><h1>Overview</h1></section>`\n});',
        }),
      },
      {
        Id: "accordion",
        Title: "Accordion",
        Content: CodeBlock({ Title: "Accordion", Code: 'Accordion({\n  OpenIds: ["details"],\n  Items: [\n    {\n      Id: "details",\n      Title: "Details",\n      Content: html`<p>Deployment information.</p>`\n    }\n  ]\n});' }),
      },
      { Id: "alert", Title: "Alert", Content: CodeBlock({ Title: "Alert", Code: 'Alert({\n  Title: "Saved",\n  Message: "Changes are available.",\n  Type: "success",\n  Live: "polite"\n});' }) },
      { Id: "badge", Title: "Badge", Content: CodeBlock({ Title: "Badge", Code: 'Badge({\n  Text: "Ready",\n  Type: "success"\n});' }) },
      {
        Id: "card",
        Title: "Card",
        Content: CodeBlock({
          Title: "Card",
          Code: ["Card({", '  Title: "Deployment",', "  HeadingLevel: 3,", '  Actions: html`<a href="#deployment-details">Details</a>`,', '  Content: html`<p id="deployment-details">Ready</p>`', "});"].join("\n"),
        }),
      },
      {
        Id: "code-block",
        Title: "CodeBlock",
        Content: html`<section>
          ${CodeBlock({ Title: "Usage", Code: 'CodeBlock({\n  Title: "Greeting.cs",\n  Language: "csharp",\n  Code: source,\n  LineNumbers: true,\n  Wrap: false,\n  Copy: true\n});' })}
          <div class="showcase-csharp">${CodeBlock({ Title: "Greeting.cs", Language: "csharp", Code: CSharpCode })}</div>
        </section>`,
      },
      {
        Id: "data-table",
        Title: "DataTable",
        Content: CodeBlock({
          Title: "DataTable",
          Code: 'const records = [\n  { Id: 1, Name: "Gateway", Status: 1, Reference: "gw" },\n  { Id: 2, Name: "Archive", Status: 0, Reference: "ar" }\n];\nconst StatusLabel = (value) => value === 1 ? "Ready" : "Offline";\n\nDataTable({\n  Data: records,\n  RowKey: (row) => row.Id,\n  PageSize: 10,\n  Columns: [\n    { Key: "Name", Title: "Name", Value: (row) => `Service ${row.Name}` },\n    {\n      Key: "Status",\n      Title: "Status",\n      SearchText: (row, value) => StatusLabel(value),\n      Render: (row, value) => Badge({ Text: StatusLabel(value) })\n    },\n    { Key: "Reference", Title: "Reference", Searchable: false }\n  ]\n});',
        }),
      },
      {
        Id: "dialog",
        Title: "Dialog",
        Content: CodeBlock({ Title: "Dialog", Code: 'Dialog({\n  Open: this.state.IsOpen,\n  Title: "Confirm",\n  Content: html`<p>Save these changes?</p>`,\n  OnClose: () => this.SetState({ IsOpen: false })\n});' }),
      },
      {
        Id: "dropdown",
        Title: "Dropdown",
        Content: CodeBlock({
          Title: "Dropdown",
          Code: 'return html`<form ${CT.On("submit", (event) => {\n  event.preventDefault();\n  console.log(GetFormValues(event.currentTarget));\n})}>\n  ${Dropdown({\n    Id: "environment",\n    Name: "Environment",\n    Label: "Environment",\n    Required: true,\n    Disabled: false,\n    Value: this.state.Environment,\n    Options: ["development", "production"],\n    OnChange: (value) => this.SetState({ Environment: value })\n  })}\n  <button type="submit">Submit</button>\n  <button type="reset">Reset</button>\n</form>`;',
        }),
      },
      { Id: "fallback-view", Title: "FallbackView", Content: CodeBlock({ Title: "FallbackView", Code: 'FallbackView({\n  Title: "Page not found",\n  OnAction: () => router.Navigate("/")\n});' }) },
      {
        Id: "popup-window",
        Title: "PopupWindow",
        Content: CodeBlock({
          Title: "PopupWindow",
          Code: 'PopupWindow({\n  Open: this.state.IsPopupOpen,\n  Position: "bottom-right",\n  Title: "Output",\n  Content: html`<p>Build complete.</p>`,\n  OnClose: () => this.SetState({ IsPopupOpen: false })\n});',
        }),
      },
      {
        Id: "side-navigation",
        Title: "SideNavigation",
        Content: CodeBlock({
          Title: "SideNavigation",
          Code: 'SideNavigation({\n  Title: "Workspace",\n  ActiveId: this.state.ActiveId,\n  Items: [\n    { Id: "overview", Label: "Overview" },\n    { Id: "settings", Label: "Settings" }\n  ],\n  OnNavigate: (item) => this.SetState({ ActiveId: item.Id })\n});',
        }),
      },
      {
        Id: "tooltip",
        Title: "Tooltip",
        Content: CodeBlock({ Title: "Tooltip", Code: 'Tooltip({\n  Text: "Save the current changes",\n  Position: "top",\n  ShowOnFocus: true,\n  Content: html`<button type="button">Save</button>`\n});' }),
      },
      {
        Id: "toast",
        Title: "Toast",
        Content: CodeBlock({
          Title: "Toast",
          Code: 'Toast({\n  Visible: this.state.IsToastVisible,\n  Title: "Saved",\n  Message: "Changes are available.",\n  Type: "success",\n  OnClose: () => this.SetState({ IsToastVisible: false })\n});',
        }),
      },
    ];

    this.views = {
      navigation: () => {
        const navigationItems = [
          { path: "/", label: "Counter" },
          { path: "/notes", label: "Notes" },
          { path: "/dom", label: "DOM" },
          { path: "/utilities", label: "Utilities" },
          { path: "/components", label: "Components" },
        ];

        return html`
          <nav class="top-nav">
            ${navigationItems.map(
              (item) => html`
                <button type="button" ${CT.Attr("className", this.state.currentPath === item.path ? "nav-link ct-button-success" : "nav-link ct-button-secondary")} ${CT.On("click", () => this.actions.setPath(item.path))}>
                  ${item.label}
                </button>
              `,
            )}
          </nav>
        `;
      },
      home: () => html`
        <section class="ct-panel">
          ${PanelHeading({
            title: "Component state",
            body: "A small class component can own state updates without bringing in a large framework runtime.",
          })}
          <div class="stats-grid">${StatCard({ label: "Current count", value: this.state.count })} ${StatCard({ label: "Saved notes", value: this.state.notes.length })}</div>
          ${CT.View({ Component: ChildCounter, Props: { ParentCount: this.state.count } })}
          ${UsageExample({ Code: 'CT.Start({ App, Target: "#app" });\n\n// Inside Render, include a managed child:\nCT.View({\n  Component: ChildCounter,\n  Props: { ParentCount: this.state.count }\n});' })}
          <div class="button-row">
            <button type="button" ${CT.On("click", () => this.actions.incrementCount(1))}>Increment</button>
            <button type="button" class="ct-button-secondary" ${CT.On("click", () => this.actions.incrementCount(-1))}>Decrement</button>
          </div>
          ${UsageExample({
            Code: 'class App extends Component {\n  constructor(props) {\n    super(props);\n    this.state = { Count: 0 };\n  }\n\n  Increase() {\n    this.SetState((state) => ({ Count: state.Count + 1 }));\n  }\n\n  Render() {\n    return html`\n      <button type="button" ${CT.On("click", () => this.Increase())}>\n        ${this.state.Count}\n      </button>\n    `;\n  }\n}',
          })}
        </section>
      `,
      notes: () => html`
        <section class="ct-panel">
          ${PanelHeading({
            title: "Store + form helpers",
            body: "This view uses the small Store and GetFormValues helper to keep form logic plain and easy to trace.",
          })}
          <form class="note-form" ${CT.On("submit", this.actions.addNote)}>
            <input id="note-input" name="note" type="text" placeholder="Add a note" />
            <button type="submit">Add note</button>
          </form>
          <ul class="notes-list">
            ${this.state.notes.map(
              (note, index) => html`
                <li class="note-item">
                  <span>${note}</span>
                  <button type="button" class="ct-button-secondary ct-error" ${CT.On("click", () => this.actions.removeNote(index))}>Remove</button>
                </li>
              `,
            )}
          </ul>
          ${UsageExample({
            Code: "const values = GetFormValues(event.target);\nstore.SetState((state) => ({\n  notes: [...state.notes, values.note]\n}));",
          })}
        </section>
      `,
      dom: () => html`
        <section class="ct-panel">
          ${PanelHeading({
            title: "CT helper layer",
            body: "Direct DOM helpers are there when a full component rerender would be overkill.",
          })}
          <div id="dom-box" class="dom-box">Helper target</div>
          <button type="button" ${CT.On("click", this.actions.toggleDomBox)}>Run DOM helper update</button>
          ${UsageExample({
            Code: 'CT("#dom-box")\n  .ToggleClass("is-active", true)\n  .Attr("data-last-update", timestamp)\n  .Text("Updated");',
          })}
        </section>
      `,
      utilities: () => html`
        <section class="ct-panel">
          ${PanelHeading({
            title: "Utilities + HTTP",
            body: "Guid, Required, MaxLength and HttpClient run here without any external service dependency.",
          })}
          <div class="button-row">
            <button type="button" ${CT.On("click", this.actions.runGuidAndValidators)}>Run Guid + validators</button>
            <button type="button" class="ct-button-secondary" ${CT.On("click", this.actions.runHttpClient)}>Run HttpClient.Get</button>
          </div>
          <p class="utility-result">${this.state.utilityResult}</p>
          <h3>Named URL parameters</h3>
          <button type="button" ${CT.On("click", () => this.props.router.Navigate("/utilities/Faial"))}>Open Faial route</button>
          <p role="status">Route parameters: ${JSON.stringify(this.props.router.GetParameters())}</p>
          ${UsageExample({
            Code: 'const router = new Router([Route("/utilities/:Name", UtilitiesPage)]);\nrouter.Navigate("/utilities/Faial");\nrouter.GetParameters(); // { Name: "Faial" }',
          })}
          ${UsageExample({
            Code: "const id = Guid();\nconst isValid = Required(value) && MaxLength(value, 16);\nconst response = await httpClient.Get(url);",
          })}
        </section>
      `,
      components: () => html`
        <section class="ct-panel component-showcase">
          ${PanelHeading({
            title: "CTFramework components",
            body: "Every component below is production code, uses the default CTFramework CSS, and remains configurable through plain JavaScript objects.",
          })}
          <div class="component-layout">
            ${SideNavigation({
              Title: "System areas",
              ActiveId: this.state.activeSystemArea,
              Items: [
                { Id: "runtime", Label: "Runtime" },
                { Id: "services", Label: "Services" },
                { Id: "operations", Label: "Operations" },
              ],
              OnNavigate: this.actions.selectSystemArea,
            })}
            <div class="component-main">
              ${Card({
                Title: "Deployment controls",
                HeadingLevel: 3,
                Actions: html` <button type="button" class="ct-button-secondary" ${CT.On("click", this.actions.openDialog)}>Review deployment</button> `,
                Content: html`
                  <div class="component-card-content">
                    ${Alert({ Title: "Default styles active", Message: "This screen uses CTFramework CSS without its own component theme.", Type: "success" })}
                    <form
                      ${CT.On("submit", (event) => {
                        event.preventDefault();
                        this.SetState({ environmentResult: JSON.stringify(GetFormValues(event.currentTarget)) });
                      })}
                    >
                      ${Dropdown({
                        Id: "environment-select",
                        Name: "Environment",
                        Required: true,
                        Disabled: this.state.environmentDisabled,
                        Label: "Environment",
                        Placeholder: "Choose an environment",
                        Value: this.state.selectedEnvironment,
                        Options: [
                          { Value: "development", Label: "Development" },
                          { Value: "staging", Label: "Staging" },
                          { Value: "production", Label: "Production" },
                        ],
                        OnChange: this.actions.selectEnvironment,
                      })}
                      <p class="ct-status">${this.state.selectedEnvironment || "No environment selected"}</p>
                      <div class="button-row">
                        <button type="submit">Read form values</button>
                        <button type="reset" class="ct-button-secondary">Reset environment</button>
                        <button type="button" class="ct-button-secondary" ${CT.On("click", () => this.SetState({ environmentDisabled: !this.state.environmentDisabled }))}>
                          ${this.state.environmentDisabled ? "Enable dropdown" : "Disable dropdown"}
                        </button>
                      </div>
                      <p class="ct-status">${this.state.environmentResult}</p>
                    </form>
                  </div>
                `,
                Footer: html`
                  <div class="button-row">
                    <button type="button" ${CT.On("click", this.actions.openDialog)}>Open dialog</button>
                    <button type="button" class="ct-button-secondary" ${CT.On("click", this.actions.togglePopup)}>Toggle window</button>
                    <button type="button" class="ct-button-success" ${CT.On("click", this.actions.showToast)}>Show toast</button>
                    ${Tooltip({ Text: "Hover or focus for help. Escape dismisses this hint.", Content: html`<button type="button" class="ct-button-secondary">Hover for help</button>` })}
                  </div>
                `,
              })}
              ${DataTable({ RowKey: "Name", Data: this.componentData, Columns: this.componentColumns, PageSize: 3 })}
            </div>
          </div>
          <section class="component-examples">
            <h3>Switch between panels as space changes</h3>
            <button type="button" ${CT.On("click", () => this.SetState({ narrowTabs: !this.state.narrowTabs }))}>${this.state.narrowTabs ? "Use full width" : "Use narrow width"}</button>
            <div
              ${CT.Attr("style", {
                width: this.state.narrowTabs ? "20rem" : "100%",
                maxWidth: "100%",
              })}
            >
              ${Tabs({
                Key: "showcase-tabs",
                Label: "Workspace sections",
                Layout: "auto",
                MinPanelWidth: "16rem",
                Columns: 2,
                ShowHeadings: false,
                Value: this.state.selectedTab,
                OnChange: (id) => this.SetState({ selectedTab: id }),
                Items: [
                  {
                    Id: "overview",
                    Title: "Overview",
                    Content: Card({
                      Title: "Overview",
                      HeadingLevel: 4,
                      Content: CT.View({
                        Component: ChildCounter,
                        Props: { ParentCount: this.state.count },
                        Key: "tabs-counter",
                      }),
                    }),
                  },
                  {
                    Id: "notes",
                    Title: "Notes",
                    Badge: this.state.notes.length,
                    Content: Card({
                      Title: "Notes",
                      HeadingLevel: 4,
                      Content: html`<p>There are ${this.state.notes.length} saved notes.</p>`,
                    }),
                  },
                  {
                    Id: "chart",
                    Title: "Chart",
                    Span: "full",
                    Content: CT.View({ Component: TabsChartPanel, Key: "tabs-chart" }),
                  },
                  {
                    Id: "diagram",
                    Title: "Diagram",
                    Span: "full",
                    Content: CT.View({ Component: TabsDiagramPanel, Key: "tabs-diagram" }),
                  },
                ],
              })}
            </div>
            <p role="status">Selected panel: ${this.state.selectedTab}</p>
            <h3>Keep an outline beside details</h3>
            ${ApplicationLayout({
              Header: html`<strong>Review workspace</strong>`,
              SideNavigation: SideNavigation({
                Title: "System areas",
                ActiveId: this.state.activeSystemArea,
                Items: [
                  { Id: "runtime", Label: "Runtime" },
                  { Id: "services", Label: "Services" },
                  { Id: "operations", Label: "Operations" },
                ],
                OnNavigate: this.actions.selectSystemArea,
              }),
              Content: html`<section>
                ${SplitLayout({
                  Label: { Side: "Outline", Main: "Review details" },
                  SideWidth: { Min: "12rem", Max: "18rem" },
                  StackBelow: "48rem",
                  Sticky: true,
                  Side: html`<section>
                    <h4>Outline</h4>
                    <ol>
                      ${Array.from({ length: 48 }, (_, index) => html`<li>Section ${index + 1}</li>`)}
                    </ol>
                  </section>`,
                  Main: html`<section>
                    <h4>Review details</h4>
                    ${Array.from({ length: 24 }, (_, index) => html`<p>Record ${index + 1}: review the current details.</p>`)}
                  </section>`,
                })}
              </section>`,
            })}
            <h3>Inspect chart values on two axes</h3>
            ${Chart({
              Title: "Completed jobs",
              Type: "line",
              X: { Label: "Time", Format: (value) => `${value}s` },
              Y: { Label: "Jobs", Min: 0, Format: (value) => `${value} jobs` },
              Y2: {
                Label: "Completion rate",
                Min: 0,
                Max: 100,
                Format: (value) => `${value}%`,
              },
              Series: [
                {
                  Id: "a",
                  Label: "Queue A",
                  Type: "area",
                  Points: [
                    { X: 0, Y: 2 },
                    { X: 1, Y: 5 },
                    { X: 2, Y: 3 },
                  ],
                },
                {
                  Id: "b",
                  Label: "Completion rate",
                  Type: "scatter",
                  Axis: "right",
                  PointRadius: 5,
                  PointShape: "diamond",
                  Points: [
                    { X: 0, Y: 25 },
                    { X: 1, Y: 50 },
                    { X: 2, Y: 75 },
                  ],
                },
                {
                  Id: "c",
                  Label: "Queue C",
                  Type: "line",
                  PointRadius: 4,
                  PointShape: "square",
                  Points: [
                    { X: 0, Y: 1 },
                    { X: 1, Y: null },
                    { X: 2, Y: 4 },
                  ],
                },
              ],
              Markers: [{ X: 1, Label: "Added worker" }],
              Hidden: this.state.hiddenChartSeries,
              OnToggleSeries: (id, visible) => this.SetState((state) => ({ hiddenChartSeries: visible ? state.hiddenChartSeries.filter((value) => value !== id) : [...state.hiddenChartSeries, id] })),
            })}
            <h3>Jobs by shift</h3>
            ${Chart({
              Title: "Jobs by shift",
              Type: "bar",
              Categories: ["Morning", "Afternoon", "Evening"],
              Y: { Label: "Jobs", Min: 0 },
              Series: [
                {
                  Id: "shifts",
                  Label: "Completed jobs",
                  Values: [12, 17, 9],
                  Colors: ["var(--ct-chart-1)", null, "var(--ct-chart-3)"],
                },
              ],
            })}
            <h3>Inspect details by hover, focus, or click</h3>
            ${Card({
              Title: "Records",
              HeadingLevel: 4,
              Content: html`<div style="max-height: 12rem; overflow: auto">
                <p>Scroll this card while the detail view is open.</p>
                ${Popover({
                  Label: "Record A details",
                  Trigger: html`<button type="button">Hover or focus on Record A</button>`,
                  Content: html`<div>
                    <h4>Record A</h4>
                    <p>Three updates are ready.</p>
                    <ul>
                      <li>Owner assigned</li>
                      <li>Review requested</li>
                    </ul>
                  </div>`,
                  Open: "hover",
                  Placement: "right",
                  Width: "20rem",
                })}
                ${Popover({
                  Label: "Record B details",
                  Trigger: html`<button type="button">Click for Record B</button>`,
                  Content: html`<div>
                    <h4>Record B</h4>
                    <p>Two notes are ready to read.</p>
                  </div>`,
                  Open: "click",
                  Placement: "bottom",
                })}
                ${Array.from({ length: 12 }, (_, index) => html`<p>Record note ${index + 1}</p>`)}
              </div>`,
            })}
            <h3>Search a long list</h3>
            ${Combobox({
              Id: "resource-search",
              Name: "Resource",
              Label: "Resource",
              Value: this.state.selectedResource,
              Options: [
                { Value: "iron", Label: "Iron ore", Group: "Metals", Keywords: ["mining"], Description: "Smelted into iron." },
                { Value: "copper", Label: "Copper ore", Group: "Metals", Keywords: ["mining"] },
                { Value: "oak", Label: "Oak timber", Group: "Wood", Disabled: true },
              ],
              OnChange: (value) => this.SetState({ selectedResource: value }),
            })}
            <p>Selected resource: ${this.state.selectedResource || "none"}</p>
            <h3>Pan and zoom a diagram</h3>
            ${PanZoomView({
              Label: "Resource diagram",
              Bounds: { MinX: -200, MinY: -100, MaxX: 200, MaxY: 100 },
              Camera: this.state.diagramCamera,
              Content: html`<g
                ><line x1="-100" y1="0" x2="100" y2="0" stroke="currentColor"></line>
                ${[-100, 0, 100].map((x) => html`<circle ${CT.Attr("cx", x)} cy="0" r="20" fill="var(--ct-color-accent)" role="button" tabindex="0" ${CT.Attr("aria-label", `Node ${x}`)} ${CT.Attr("data-ct-item", String(x))}></circle>`)}
              </g>`,
              OnCameraChange: (camera) => this.SetState({ diagramCamera: camera }),
              OnItemActivate: (id) => this.SetState({ diagramItem: id }),
            })}
            <p>Activated node: ${this.state.diagramItem}</p>
            <h3>Inspect a diagram node</h3>
            <div style="height: 20rem">
              ${PanZoomView({
                Label: "Popover diagram",
                Bounds: { MinX: -120, MinY: -80, MaxX: 120, MaxY: 80 },
                Content: html`<g>
                  <foreignObject x="-80" y="-30" width="160" height="60">
                    <div xmlns="http://www.w3.org/1999/xhtml">
                      ${Popover({
                        Label: "Diagram node details",
                        Trigger: html`<button type="button">Inspect node</button>`,
                        Content: html`<div>
                          <h4>Diagram node</h4>
                          <p>This node is part of the example diagram.</p>
                        </div>`,
                        Open: "hover",
                        Placement: "top",
                      })}
                    </div>
                  </foreignObject>
                </g>`,
              })}
            </div>
            <h3>Image gallery</h3>
            ${ImageCarousel({ Label: "Landscape gallery", Images: CarouselImages })}
            <h3>Usage snippets</h3>
            ${Accordion({ Items: this.componentExamples, OpenIds: ["accordion"], Multiple: true })}
          </section>
          ${Dialog({
            Open: this.state.isDialogOpen,
            Title: "Confirm deployment",
            Content: html`<p>Dialog actions are supplied as plain JavaScript objects.</p>`,
            OnClose: this.actions.closeDialog,
            Actions: [
              { Label: "Cancel", ClassName: "ct-button-secondary", OnClick: this.actions.closeDialog },
              { Label: "Confirm", ClassName: "ct-button-success", OnClick: this.actions.closeDialog },
            ],
          })}
          ${PopupWindow({
            Open: this.state.isPopupOpen,
            Position: "bottom-right",
            Title: "Runtime window",
            Content: html`<p class="ct-muted">A non-blocking popup window can remain visible while the page is usable.</p>`,
            OnClose: this.actions.togglePopup,
          })}
          ${Toast({
            Visible: this.state.isToastVisible,
            Title: "Deployment queued",
            Message: "The toast is controlled by the parent component state.",
            Type: "success",
            OnClose: this.actions.closeToast,
          })}
        </section>
      `,
      current: () => {
        const activeRoute = this.props.router.Resolve(this.state.currentPath);
        const activeView = activeRoute?.component;

        return activeView && this.views[activeView]
          ? this.views[activeView]()
          : FallbackView({
              Title: "Page not found",
              Message: `The route ${this.state.currentPath} is not available in this application.`,
              ActionLabel: "Return to dashboard",
              OnAction: () => this.props.router.Navigate("/"),
            });
      },
      app: () => html`
        <main class="ct-shell showcase-shell">
          <header class="ct-panel hero">
            <p class="ct-eyebrow">CTFramework</p>
            <h1>Raw JavaScript components without the framework weight</h1>
            <p class="hero-copy ct-muted">This showcase stays outside src so the framework can stay production-clean while still proving the runtime works.</p>
          </header>
          ${this.views.navigation()} ${this.views.current()}
        </main>
      `,
    };
  }

  ComponentOnMount() {
    this.unsubscribeStore = this.props.store.Subscribe((storeState) => {
      this.SetState({ count: storeState.count, notes: storeState.notes });
    });

    this.unsubscribeRouter = this.props.router.Subscribe((currentPath) => {
      this.SetState({ currentPath });
    });

    CT(".showcase-shell").Data("framework", "ready");
  }

  ComponentOnUnmount() {
    this.unsubscribeStore && this.unsubscribeStore();
    this.unsubscribeRouter && this.unsubscribeRouter();
  }

  Render() {
    return this.views.app();
  }
}
