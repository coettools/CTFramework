import CT, { Accordion, Alert, Badge, Card, CodeBlock, Component, DataTable, Dialog, Dropdown, PopupWindow, SideNavigation, Toast, Tooltip } from "../../../../dist/ctframework.bundle.min.js";

const html = CT.Html;
const Records = [
  { Name: "ApplicationLayout", Group: "Layout", Status: "Ready" },
  { Name: "SideNavigation", Group: "Navigation", Status: "Ready" },
  { Name: "DataTable", Group: "Data", Status: "Ready" },
  { Name: "Dropdown", Group: "Forms", Status: "Ready" },
  { Name: "Dialog", Group: "Feedback", Status: "Ready" },
  { Name: "Accordion", Group: "Content", Status: "Ready" }
];

export class WorkspacePreview extends Component {
  constructor(props) {
    super(props);
    this.state = { Count: 3, Environment: "", Section: "counter", DialogOpen: false, PopupOpen: false, ToastVisible: false };
  }

  GetId(name) {
    return `${this.props.Id}-${name}`;
  }

  Navigate(item) {
    this.SetState({ Section: item.Id });
    document.getElementById(this.GetId(item.Id))?.scrollIntoView({ block: "nearest" });
  }

  ChangeCount(amount) {
    this.SetState((state) => ({ Count: Math.max(0, state.Count + amount) }));
  }

  RenderCounter() {
    return Card({ Title: "Component state", Content: html`<div class="workspace-stack">
      <p class="workspace-help">A small component. Only its state changes.</p>
      <div class="workspace-stat"><span>Current count</span><strong aria-live="polite">${this.state.Count}</strong></div>
      <div class="workspace-actions"><button ${CT.On("click", () => this.ChangeCount(1))}>Increment</button><button class="ct-button-secondary" ${CT.Attr("disabled", this.state.Count === 0)} ${CT.On("click", () => this.ChangeCount(-1))}>Decrement</button></div>
    </div>` });
  }

  RenderSettings() {
    return Card({ Title: "Project settings", Content: html`<div class="workspace-stack">
      ${Dropdown({ Id: this.GetId("environment"), Label: "Environment", Value: this.state.Environment, Options: ["Development", "Staging", "Production"], OnChange: (value) => this.SetState({ Environment: value || "" }) })}
      <p class="workspace-help" aria-live="polite">Selected: ${this.state.Environment || "None"}</p>
      <div class="workspace-actions">${Tooltip({ Text: "Show a local notification", Position: "top", Content: html`<button ${CT.On("click", () => this.SetState({ ToastVisible: true }))}>Save settings</button>` })}<button class="ct-button-secondary" ${CT.On("click", () => this.SetState({ DialogOpen: true }))}>Open dialog</button></div>
    </div>` });
  }

  Render() {
    return html`<div class="workspace">
      <header class="workspace-header"><strong>coettools <span>/ workspace</span></strong>${Badge({ Text: "Local example" })}</header>
      <div class="workspace-measure"><div class="workspace-body">
        <div class="workspace-navigation">${SideNavigation({ Title: "On this page", ActiveId: this.state.Section, Items: [{ Id: "counter", Label: "Counter & settings" }, { Id: "table", Label: "Data table" }, { Id: "feedback", Label: "Feedback" }], OnNavigate: (item) => this.Navigate(item) })}</div>
        <div class="workspace-content">
          <header class="workspace-heading"><p class="workspace-eyebrow">Raw JavaScript components</p><h3>Tools for the work.</h3><p class="workspace-help">The same controls in every direction. Try the counter, search, and feedback.</p></header>
          <div class="workspace-controls" ${CT.Attr("id", this.GetId("counter"))}>${this.RenderCounter()}${this.RenderSettings()}</div>
          <section ${CT.Attr("id", this.GetId("table"))} aria-label="Components table">${DataTable({ RowKey: "Name", Data: Records, PageSize: 3, SearchPlaceholder: "Find a component...", Columns: [{ Key: "Name", Title: "Component" }, { Key: "Group", Title: "Group" }, { Key: "Status", Title: "Status", Render: (row, value) => Badge({ Text: value, Type: "success" }) }] })}</section>
          <section class="workspace-feedback" ${CT.Attr("id", this.GetId("feedback"))} aria-label="Feedback examples">
            <div class="workspace-statuses">${Badge({ Text: "Ready", Type: "success" })}${Badge({ Text: "Pending", Type: "warning" })}${Badge({ Text: "Failed", Type: "danger" })}<button class="ct-button-secondary" ${CT.On("click", () => this.SetState({ PopupOpen: true }))}>Open popup</button></div>
            ${Alert({ Title: "Preview only", Message: "No project settings are saved or published.", Type: "info" })}
            ${Accordion({ Items: [{ Id: "usage", Title: "Show the component code", Content: CodeBlock({ Code: 'Card({\n  Title: "Project settings",\n  Content: html`<p>Your content here.</p>`\n});' }) }] })}
          </section>
        </div>
      </div></div>
      ${Dialog({ Open: this.state.DialogOpen, Title: "Dialog preview", Content: html`<p>Check the backdrop, panel, and button colors. No project files will change.</p>`, OnClose: () => this.SetState({ DialogOpen: false }), Actions: [{ Label: "Back to preview", OnClick: () => this.SetState({ DialogOpen: false }) }] })}
      ${PopupWindow({ Open: this.state.PopupOpen, Title: "Popup preview", Content: "A smaller window using the same surfaces and accents.", Position: "bottom-right", OnClose: () => this.SetState({ PopupOpen: false }) })}
      ${Toast({ Visible: this.state.ToastVisible, Title: "Settings preview", Message: "This notification is local. Nothing has been saved.", Type: "success", OnClose: () => this.SetState({ ToastVisible: false }) })}
    </div>`;
  }
}
