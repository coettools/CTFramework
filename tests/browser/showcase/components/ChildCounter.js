import CT, { Component } from "../../../../src/Index.js";

const html = CT.Html;

export class ChildCounter extends Component {
  constructor(props) {
    super(props);
    this.state = { Count: 0 };
  }

  Render() {
    return html`<section>
      <h3>Managed child component</h3>
      <p>Parent count: ${this.props.ParentCount}. Updating it keeps this child's count.</p>
      <button type="button" ${CT.On("click", () => this.SetState((state) => ({ Count: state.Count + 1 })))}>Child count: ${this.state.Count}</button>
    </section>`;
  }
}
