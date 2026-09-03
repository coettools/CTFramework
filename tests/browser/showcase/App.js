import CT, {
  Accordion,
  Alert,
  Badge,
  Card,
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
  Toast
} from "../../../src/Index.js";

const html = CT.Html;

const CodeExample = ({ code }) => html`<pre class="ct-code-snippet"><code>${code}</code></pre>`;
const UsageExample = ({ code }) => html`<section class="showcase-example"><h3>Usage</h3>${CodeExample({ code })}</section>`;

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
            borderColor: nextIsActive ? "var(--ct-color-green)" : "var(--ct-color-border)",
            backgroundColor: nextIsActive ? "var(--ct-color-navy-light)" : "var(--ct-color-navy)"
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
      { Id: "accordion", Title: "Accordion", Content: CodeExample({ code: 'Accordion({ Items: [{ Id: "details", Title: "Details", Content: html`<p>Content</p>` }] })' }) },
      { Id: "side-navigation", Title: "SideNavigation", Content: CodeExample({ code: 'SideNavigation({ Items, ActiveId, Searchable: true, OnNavigate })' }) },
      { Id: "card", Title: "Card", Content: CodeExample({ code: 'Card({ Title: "Deployment", Content: html`<p>Ready</p>` })' }) },
      { Id: "alert", Title: "Alert", Content: CodeExample({ code: 'Alert({ Title: "Ready", Message: "All services available.", Type: "success" })' }) },
      { Id: "dropdown", Title: "Dropdown", Content: CodeExample({ code: 'Dropdown({ Id: "environment", Options, Value, OnChange })' }) },
      { Id: "data-table", Title: "DataTable + Badge", Content: CodeExample({ code: 'DataTable({ Data, Columns: [{ Key: "Status", Render: (row, value) => Badge({ Text: value, Type: "success" }) }] })' }) },
      { Id: "badge", Title: "Badge", Content: CodeExample({ code: 'Badge({ Text: "Ready", Type: "success" })' }) },
      { Id: "dialog", Title: "Dialog", Content: CodeExample({ code: 'Dialog({ Open: this.state.isDialogOpen, Title: "Confirm", Content, OnClose })' }) },
      { Id: "popup-window", Title: "PopupWindow", Content: CodeExample({ code: 'PopupWindow({ Open, Position: "bottom-right", Title: "Output", Content, OnClose })' }) },
      { Id: "toast", Title: "Toast", Content: CodeExample({ code: 'Toast({ Visible, Title: "Saved", Message: "Changes are available.", Type: "success", OnClose })' }) },
      { Id: "fallback", Title: "FallbackView", Content: CodeExample({ code: 'FallbackView({ Title: "Page not found", Message: "Choose another route.", OnAction: () => router.Navigate("/") })' }) }
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
            code: 'class App extends Component {\n  Render() {\n    return html`<button ${CT.On("click", () => this.SetState({ count: this.state.count + 1 }))}>${this.state.count}</button>`;\n  }\n}'
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
            code: 'const values = GetFormValues(event.target);\nstore.SetState((state) => ({\n  notes: [...state.notes, values.note]\n}));'
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
            code: 'CT("#dom-box")\n  .ToggleClass("is-active", true)\n  .Attr("data-last-update", timestamp)\n  .Text("Updated");'
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
            code: 'const id = Guid();\nconst isValid = Required(value) && MaxLength(value, 16);\nconst response = await httpClient.Get(url);'
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
              Searchable: true,
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
