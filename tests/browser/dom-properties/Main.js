const variant = new URLSearchParams(location.search);
const { default: CT, Component, GetFormValues } = await import(variant.has("source") ? "../../../src/Index.js" : variant.has("debug") ? "../../../dist/ctframework.bundle.js" : "../../../dist/ctframework.bundle.min.js");
const html = CT.Html;
const mount = document.querySelector("#app");
const Assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const Frame = async () => {
  await new Promise(requestAnimationFrame);
  await new Promise(requestAnimationFrame);
};

const Update = async (app, state) => {
  app.SetState(state);
  await Frame();
};

const Check = async (name, run) => {
  await run();
  const item = document.createElement("li");
  item.textContent = `${name}: passed`;
  document.querySelector("#checks").append(item);
};

class Associations extends Component {
  constructor() {
    super();
    this.state = { Owner: "first", List: "list-first", Name: "Ada", Attribute: "form", Submitted: "None" };
  }

  Submit = (event) => {
    event.preventDefault();
    this.SetState({ Submitted: `${event.currentTarget.id}: ${JSON.stringify(GetFormValues(event.currentTarget))}` });
  };

  Render() {
    return html`<section class="ct-panel">
      <form id="first" ${CT.On("submit", this.Submit)}>
        <label>Inside first form<input id="inside" name="Inside" value="Nested" ${CT.Attr("form", this.state.Owner)} /></label>
      </form>
      <form id="second" ${CT.On("submit", this.Submit)}></form>
      <label for="associated">Associated name</label>
      <input
        id="associated"
        name="Name"
        ${CT.Attr(this.state.Attribute, this.state.Owner)}
        ${CT.Attr("list", this.state.List)}
        ${CT.Attr("value", this.state.Name)}
        ${CT.On("input", (event) => this.SetState({ Name: event.currentTarget.value }))}
      />
      <label
        >Region<select id="associated-select" name="Region" ${CT.Attr("form", this.state.Owner)}>
          <option value="north">North</option>
        </select></label
      >
      <label>Notes<textarea id="associated-textarea" name="Notes" ${CT.Attr("form", this.state.Owner)}>Notes</textarea></label>
      <output id="associated-output" ${CT.Attr("form", this.state.Owner)}>Output</output>
      <fieldset id="associated-fieldset" ${CT.Attr("form", this.state.Owner)}><legend>Associated group</legend></fieldset>
      <object id="associated-object" ${CT.Attr("form", this.state.Owner)}></object>
      <datalist id="list-first"><option value="Ada"></option></datalist>
      <datalist id="list-second"><option value="Grace"></option></datalist>
      <button id="submit" type="submit" ${CT.Attr("form", this.state.Owner)}>Submit associated form</button>
      <button id="change-owner" type="button" ${CT.On("click", () => this.SetState({ Owner: this.state.Owner === "first" ? "second" : "first" }))}>Change owner</button>
      <button id="remove-owner" type="button" ${CT.On("click", () => this.SetState({ Owner: null }))}>Remove owner</button>
      <p id="owner">Owner: ${this.state.Owner ?? "None"}</p>
      <p id="submitted">${this.state.Submitted}</p>
    </section>`;
  }
}

class WritableProperties extends Component {
  constructor() {
    super();
    this.state = { Value: "Ada", Title: "Initial", TabIndex: 2, Checked: true, Disabled: true, Text: "Initial text" };
  }

  Render() {
    return html`<section>
      <input id="writable" ${CT.Attr("value", this.state.Value)} ${CT.Attr("title", this.state.Title)} ${CT.Attr("tabIndex", this.state.TabIndex)} ${CT.Attr("disabled", this.state.Disabled)} />
      <input id="checkable" type="checkbox" ${CT.Attr("checked", this.state.Checked)} />
      <span id="writable-text" ${CT.Attr("textContent", this.state.Text)}></span>
    </section>`;
  }
}

try {
  const app = new Associations();
  CT.Mount(app, mount);
  const input = mount.querySelector("#associated");
  const controls = [...mount.querySelectorAll("#inside, #associated, #associated-select, #associated-textarea, #associated-output, #associated-fieldset, #associated-object, #submit")];

  await Check("Form association mounts without a recovery view", () => {
    Assert(input && !mount.querySelector(".ct-fallback"), mount.querySelector("pre")?.textContent || "Associated input missing");
    Assert(controls.length === 8 && controls.every((control) => control.form === mount.querySelector("#first")), "A form-associated control has the wrong owner");
    Assert(input.labels[0].textContent === "Associated name", "Native label association failed");
    Assert(GetFormValues(mount.querySelector("#first")).Name === "Ada", "The external input is missing from form data");
  });

  await Check("Changing form owner retains identity, focus and form data", async () => {
    input.focus();
    await Update(app, { Owner: "second", Name: "Grace" });
    Assert(mount.querySelector("#associated") === input && document.activeElement === input && input.value === "Grace", "Owner update replaced the input or lost its value/focus");
    Assert(
      controls.every((control) => control.form === mount.querySelector("#second")),
      "A changed owner was not reflected",
    );
    Assert(!("Name" in GetFormValues(mount.querySelector("#first"))) && GetFormValues(mount.querySelector("#second")).Name === "Grace", "Form data did not follow the changed owner");
  });

  await Check("Removing form association restores the ancestor or no owner", async () => {
    for (const owner of [null, false, undefined]) {
      await Update(app, { Owner: owner });
      Assert(
        controls.every((control) => !control.hasAttribute("form")),
        "Removed association left an attribute behind",
      );
      Assert(controls[0].form === mount.querySelector("#first") && controls.slice(1).every((control) => control.form === null), "Removed association did not restore native ownership");
      Assert(!("Name" in GetFormValues(mount.querySelector("#second"))), "An unowned input remained in form data");
      await Update(app, { Owner: "second" });
    }

    await Update(app, { Owner: "missing" });
    Assert(
      controls.every((control) => control.form === null),
      "A missing explicit owner should not select the ancestor",
    );
  });

  await Check("Changing the attribute name clears the previous association", async () => {
    await Update(app, { Owner: "first", Attribute: "data-owner" });
    Assert(input.form === null && !input.hasAttribute("form") && input.getAttribute("data-owner") === "first", "Changing the binding name retained form ownership");
    await Update(app, { Attribute: "form" });
    Assert(input.form === mount.querySelector("#first") && !input.hasAttribute("data-owner"), "Changing back retained the obsolete attribute");
  });

  await Check("Datalist association sets, changes and removes through attributes", async () => {
    Assert(input.list === mount.querySelector("#list-first"), "Initial datalist association failed");
    await Update(app, { List: "list-second" });
    Assert(input.list === mount.querySelector("#list-second"), "Changed datalist association failed");
    for (const list of [null, false, undefined]) {
      await Update(app, { List: list });
      Assert(input.list === null && !input.hasAttribute("list"), "Removed datalist association remained");
      await Update(app, { List: "list-first" });
    }
  });

  CT.Unmount(mount);
  const writable = new WritableProperties();
  CT.Mount(writable, mount);
  await Check("Writable properties still set, change and reset", async () => {
    const field = mount.querySelector("#writable");
    const checkbox = mount.querySelector("#checkable");
    Assert(field.value === "Ada" && field.title === "Initial" && field.tabIndex === 2 && field.disabled && checkbox.checked, "Initial writable properties failed");
    await Update(writable, { Value: "Grace", Title: "Changed", TabIndex: 4, Checked: false, Disabled: false, Text: "Changed text" });
    Assert(
      mount.querySelector("#writable") === field &&
        field.value === "Grace" &&
        field.title === "Changed" &&
        field.tabIndex === 4 &&
        !field.disabled &&
        !checkbox.checked &&
        mount.querySelector("#writable-text").textContent === "Changed text",
      "Writable property update failed",
    );
    await Update(writable, { Value: null, Title: null, TabIndex: null });
    Assert(field.value === "" && field.title === "" && field.tabIndex === 0 && !field.hasAttribute("tabindex") && mount.querySelector("#writable-text").textContent === "Changed text", "Existing property reset behavior changed");
  });

  CT.Unmount(mount);
  await Check("Invalid writable setters still reach component error handling", async () => {
    const errors = [];
    class RejectingProperty extends Component {
      constructor() {
        super();
        this.state = { Start: 1 };
      }

      ComponentOnCatch(error) {
        errors.push(error);
      }

      Render() {
        return html`<input type="text" value="Ada" ${CT.Attr("selectionStart", this.state.Start)} />`;
      }
    }

    const rejecting = new RejectingProperty();
    CT.Mount(rejecting, mount);
    Assert(mount.firstElementChild.selectionStart === 1, "Writable selection setter was skipped");
    mount.firstElementChild.type = "number";
    await Update(rejecting, { Start: null });
    Assert(errors[0]?.name === "InvalidStateError" && mount.querySelector(".ct-fallback"), "An invalid setter reset was swallowed");
    CT.Unmount(mount);

    class InvalidFileList extends Component {
      ComponentOnCatch(error) {
        errors.push(error);
      }

      Render() {
        return html`<input type="file" ${CT.Attr("files", "invalid")} />`;
      }
    }

    CT.Mount(new InvalidFileList(), mount);
    Assert(errors.length === 2 && errors[1] instanceof TypeError && mount.querySelector(".ct-fallback"), "An invalid native setter was converted to an attribute");
  });

  CT.Unmount(mount);
  CT.Mount(new Associations(), mount);
  document.querySelector("#result").textContent = "7 checks passed. Type a name, change the owner and submit with the button or keyboard.";
  document.body.dataset.result = "passed";
} catch (error) {
  document.querySelector("#result").textContent = `FAILED: ${error.message}`;
  document.body.dataset.result = "failed";
  console.error(error);
}
