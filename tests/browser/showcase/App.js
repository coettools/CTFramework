import CT, {
  Accordion,
  ApplicationLayout,
  Alert,
  Badge,
  Card,
  CodeBlock,
  Component,
  DataTable,
  Dialog,
  Dropdown,
  FallbackView,
  GetFormValues,
  Guid,
  HttpClient,
  MaxLength,
  PopupWindow,
  Required,
  SideNavigation,
  Toast,
  Tooltip
} from "../../../src/Index.js";

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
      activeSystemArea: "runtime",
      isDialogOpen: false,
      isPopupOpen: false,
      isToastVisible: false
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
          notes: [...storeState.notes, note]
        }));

        event.target.reset();
        CT("#note-input").Get()?.focus();
      },
      removeNote: (index) => {
        this.props.store.SetState((storeState) => ({
          notes: storeState.notes.filter((note, noteIndex) => noteIndex !== index)
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
            backgroundColor: nextIsActive ? "var(--ct-color-surface-raised)" : "var(--ct-color-surface)"
          })
          .Text(`Helper update: ${timestamp}`);
      },
      runGuidAndValidators: () => {
        const sampleValue = "CTFramework";
        const id = Guid();
        const isRequired = Required(sampleValue);
        const isValidLength = MaxLength(sampleValue, 16);

        this.SetState({
          utilityResult: `Guid: ${id} | Required: ${isRequired} | MaxLength(16): ${isValidLength}`
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
      closeToast: () => this.SetState({ isToastVisible: false })
    };

    this.componentData = [
      { Name: "Gateway", Status: "Ready", Owner: "Systems" },
      { Name: "Archive", Status: "Warning", Owner: "Operations" },
      { Name: "Relay", Status: "Ready", Owner: "Communications" },
      { Name: "Indexer", Status: "Offline", Owner: "Systems" },
      { Name: "Console", Status: "Ready", Owner: "Operations" },
      { Name: "Bridge", Status: "Warning", Owner: "Communications" }
    ];

    this.componentColumns = [
      { Key: "Name", Title: "Component" },
      { Key: "Owner", Title: "Owner" },
      {
        Key: "Status",
        Title: "Status",
        Render: (row, value) => Badge({ Text: value, Type: value === "Ready" ? "success" : value === "Warning" ? "warning" : "danger" })
      }
    ];

    this.componentExamples = [
      { Id: "application-layout", Title: "ApplicationLayout", Content: CodeBlock({ Title: "ApplicationLayout", Code: "ApplicationLayout({\n  Header: html`<strong>Operations</strong>`,\n  SideNavigation: SideNavigation({\n    Title: \"Workspace\",\n    Items: navigationItems\n  }),\n  Content: html`<section><h1>Overview</h1></section>`\n});" }) },
      { Id: "accordion", Title: "Accordion", Content: CodeBlock({ Title: "Accordion", Code: "Accordion({\n  OpenIds: [\"details\"],\n  Items: [\n    {\n      Id: \"details\",\n      Title: \"Details\",\n      Content: html`<p>Deployment information.</p>`\n    }\n  ]\n});" }) },
      { Id: "alert", Title: "Alert", Content: CodeBlock({ Title: "Alert", Code: "Alert({\n  Title: \"Saved\",\n  Message: \"Changes are available.\",\n  Type: \"success\"\n});" }) },
      { Id: "badge", Title: "Badge", Content: CodeBlock({ Title: "Badge", Code: "Badge({\n  Text: \"Ready\",\n  Type: \"success\"\n});" }) },
      { Id: "card", Title: "Card", Content: CodeBlock({ Title: "Card", Code: "Card({\n  Title: \"Deployment\",\n  Content: html`<p>Ready</p>`,\n  Footer: html`<button type=\"button\">Open</button>`\n});" }) },
      { Id: "code-block", Title: "CodeBlock", Content: CodeBlock({ Title: "CodeBlock", Code: "CodeBlock({\n  Title: \"Helpers.js\",\n  Language: \"javascript\",\n  Code: \"const Add = (left, right) => left + right;\",\n  LineNumbers: true,\n  Wrap: false,\n  Copy: true\n});" }) },
      { Id: "data-table", Title: "DataTable", Content: CodeBlock({ Title: "DataTable", Code: "DataTable({\n  Data: records,\n  PageSize: 10,\n  Columns: [\n    { Key: \"Name\", Title: \"Name\" },\n    {\n      Key: \"Status\",\n      Title: \"Status\",\n      Render: (row, value) => Badge({\n        Text: value,\n        Type: \"success\"\n      })\n    }\n  ]\n});" }) },
      { Id: "dialog", Title: "Dialog", Content: CodeBlock({ Title: "Dialog", Code: "Dialog({\n  Open: this.state.IsOpen,\n  Title: \"Confirm\",\n  Content: html`<p>Save these changes?</p>`,\n  OnClose: () => this.SetState({ IsOpen: false })\n});" }) },
      { Id: "dropdown", Title: "Dropdown", Content: CodeBlock({ Title: "Dropdown", Code: "Dropdown({\n  Id: \"environment\",\n  Label: \"Environment\",\n  Value: this.state.Environment,\n  Options: [\n    { Value: \"development\", Label: \"Development\" },\n    { Value: \"production\", Label: \"Production\" }\n  ],\n  OnChange: (value) => this.SetState({ Environment: value })\n});" }) },
      { Id: "fallback-view", Title: "FallbackView", Content: CodeBlock({ Title: "FallbackView", Code: "FallbackView({\n  Title: \"Page not found\",\n  OnAction: () => router.Navigate(\"/\")\n});" }) },
      { Id: "popup-window", Title: "PopupWindow", Content: CodeBlock({ Title: "PopupWindow", Code: "PopupWindow({\n  Open: this.state.IsPopupOpen,\n  Position: \"bottom-right\",\n  Title: \"Output\",\n  Content: html`<p>Build complete.</p>`,\n  OnClose: () => this.SetState({ IsPopupOpen: false })\n});" }) },
      { Id: "side-navigation", Title: "SideNavigation", Content: CodeBlock({ Title: "SideNavigation", Code: "SideNavigation({\n  Title: \"Workspace\",\n  ActiveId: this.state.ActiveId,\n  Items: [\n    { Id: \"overview\", Label: \"Overview\" },\n    { Id: \"settings\", Label: \"Settings\" }\n  ],\n  OnNavigate: (item) => this.SetState({ ActiveId: item.Id })\n});" }) },
      { Id: "tooltip", Title: "Tooltip", Content: CodeBlock({ Title: "Tooltip", Code: "Tooltip({\n  Text: \"Save the current changes\",\n  Position: \"top\",\n  Content: html`<button type=\"button\">Save</button>`\n});" }) },
      { Id: "toast", Title: "Toast", Content: CodeBlock({ Title: "Toast", Code: "Toast({\n  Visible: this.state.IsToastVisible,\n  Title: \"Saved\",\n  Message: \"Changes are available.\",\n  Type: \"success\",\n  OnClose: () => this.SetState({ IsToastVisible: false })\n});" }) }
    ];

    this.views = {
      navigation: () => {
        const navigationItems = [
          { path: "/", label: "Counter" },
          { path: "/notes", label: "Notes" },
          { path: "/dom", label: "DOM" },
          { path: "/utilities", label: "Utilities" },
          { path: "/components", label: "Components" }
        ];

        return html`
          <nav class="top-nav">
            ${navigationItems.map(
              (item) => html`
                <button
                  type="button"
                  ${CT.Attr("className", this.state.currentPath === item.path ? "nav-link ct-button-success" : "nav-link ct-button-secondary")}
                  ${CT.On("click", () => this.actions.setPath(item.path))}
                >${item.label}</button>
              `
            )}
          </nav>
        `;
      },
      home: () => html`
        <section class="ct-panel">
          ${PanelHeading({
            title: "Component state",
            body: "A small class component can own state updates without bringing in a large framework runtime."
          })}
          <div class="stats-grid">
            ${StatCard({ label: "Current count", value: this.state.count })}
            ${StatCard({ label: "Saved notes", value: this.state.notes.length })}
          </div>
          <div class="button-row">
            <button type="button" ${CT.On("click", () => this.actions.incrementCount(1))}>Increment</button>
            <button type="button" class="ct-button-secondary" ${CT.On("click", () => this.actions.incrementCount(-1))}>Decrement</button>
          </div>
          ${UsageExample({
            Code: "class App extends Component {\n  constructor(props) {\n    super(props);\n    this.state = { Count: 0 };\n  }\n\n  Increase() {\n    this.SetState((state) => ({ Count: state.Count + 1 }));\n  }\n\n  Render() {\n    return html`\n      <button type=\"button\" ${CT.On(\"click\", () => this.Increase())}>\n        ${this.state.Count}\n      </button>\n    `;\n  }\n}"
          })}
        </section>
      `,
      notes: () => html`
        <section class="ct-panel">
          ${PanelHeading({
            title: "Store + form helpers",
            body: "This view uses the small Store and GetFormValues helper to keep form logic plain and easy to trace."
          })}
          <form class="note-form" ${CT.On("submit", this.actions.addNote)}>
            <input id="note-input" name="note" type="text" placeholder="Add a note">
            <button type="submit">Add note</button>
          </form>
          <ul class="notes-list">
            ${this.state.notes.map(
              (note, index) => html`
                <li class="note-item">
                  <span>${note}</span>
                  <button type="button" class="ct-button-secondary ct-error" ${CT.On("click", () => this.actions.removeNote(index))}>Remove</button>
                </li>
              `
            )}
          </ul>
          ${UsageExample({
            Code: 'const values = GetFormValues(event.target);\nstore.SetState((state) => ({\n  notes: [...state.notes, values.note]\n}));'
          })}
        </section>
      `,
      dom: () => html`
        <section class="ct-panel">
          ${PanelHeading({
            title: "CT helper layer",
            body: "Direct DOM helpers are there when a full component rerender would be overkill."
          })}
          <div id="dom-box" class="dom-box">Helper target</div>
          <button type="button" ${CT.On("click", this.actions.toggleDomBox)}>
            Run DOM helper update
          </button>
          ${UsageExample({
            Code: 'CT("#dom-box")\n  .ToggleClass("is-active", true)\n  .Attr("data-last-update", timestamp)\n  .Text("Updated");'
          })}
        </section>
      `,
      utilities: () => html`
        <section class="ct-panel">
          ${PanelHeading({
            title: "Utilities + HTTP",
            body: "Guid, Required, MaxLength and HttpClient run here without any external service dependency."
          })}
          <div class="button-row">
            <button type="button" ${CT.On("click", this.actions.runGuidAndValidators)}>
              Run Guid + validators
            </button>
            <button type="button" class="ct-button-secondary" ${CT.On("click", this.actions.runHttpClient)}>
              Run HttpClient.Get
            </button>
          </div>
          <p class="utility-result">${this.state.utilityResult}</p>
          ${UsageExample({
            Code: 'const id = Guid();\nconst isValid = Required(value) && MaxLength(value, 16);\nconst response = await httpClient.Get(url);'
          })}
        </section>
      `,
      components: () => html`
        <section class="ct-panel component-showcase">
          ${PanelHeading({
            title: "CTFramework components",
            body: "Every component below is production code, uses the default CTFramework CSS, and remains configurable through plain JavaScript objects."
          })}
          <div class="component-layout">
            ${SideNavigation({
              Title: "System areas",
              ActiveId: this.state.activeSystemArea,
              Items: [
                { Id: "runtime", Label: "Runtime" },
                { Id: "services", Label: "Services" },
                { Id: "operations", Label: "Operations" }
              ],
              OnNavigate: this.actions.selectSystemArea
            })}
            <div class="component-main">
              ${Card({
                Title: "Deployment controls",
                Content: html`
                  <div class="component-card-content">
                    ${Alert({ Title: "Default styles active", Message: "This screen uses CTFramework CSS without its own component theme.", Type: "success" })}
                    ${Dropdown({
                      Id: "environment-select",
                      Label: "Environment",
                      Placeholder: "Choose an environment",
                      Value: this.state.selectedEnvironment,
                      Options: [
                        { Value: "development", Label: "Development" },
                        { Value: "staging", Label: "Staging" },
                        { Value: "production", Label: "Production" }
                      ],
                      OnChange: this.actions.selectEnvironment
                    })}
                    <p class="ct-status">${this.state.selectedEnvironment || "No environment selected"}</p>
                  </div>
                `,
                Footer: html`
                  <div class="button-row">
                    <button type="button" ${CT.On("click", this.actions.openDialog)}>Open dialog</button>
                    <button type="button" class="ct-button-secondary" ${CT.On("click", this.actions.togglePopup)}>Toggle window</button>
                    <button type="button" class="ct-button-success" ${CT.On("click", this.actions.showToast)}>Show toast</button>
                    ${Tooltip({ Text: "A reusable hover hint.", Content: html`<button type="button" class="ct-button-secondary">Hover for help</button>` })}
                  </div>
                `
              })}
              ${DataTable({ Data: this.componentData, Columns: this.componentColumns, PageSize: 3 })}
            </div>
          </div>
          <section class="component-examples">
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
              { Label: "Confirm", ClassName: "ct-button-success", OnClick: this.actions.closeDialog }
            ]
          })}
          ${PopupWindow({
            Open: this.state.isPopupOpen,
            Position: "bottom-right",
            Title: "Runtime window",
            Content: html`<p class="ct-muted">A non-blocking popup window can remain visible while the page is usable.</p>`,
            OnClose: this.actions.togglePopup
          })}
          ${Toast({
            Visible: this.state.isToastVisible,
            Title: "Deployment queued",
            Message: "The toast is controlled by the parent component state.",
            Type: "success",
            OnClose: this.actions.closeToast
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
          OnAction: () => this.props.router.Navigate("/")
          });
      },
      app: () => html`
        <main class="ct-shell showcase-shell">
          <header class="ct-panel hero">
            <p class="ct-eyebrow">CTFramework</p>
            <h1>Raw JavaScript components without the framework weight</h1>
            <p class="hero-copy ct-muted">
              This showcase stays outside src so the framework can stay production-clean while still proving the runtime works.
            </p>
          </header>
          ${this.views.navigation()}
          ${this.views.current()}
        </main>
      `
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
