const variant = new URLSearchParams(location.search);
const { default: CT, Component, Combobox, Dialog, GetFormValues } = await import(variant.has("source") ? "../../../src/Index.js" : variant.has("debug") ? "../../../dist/ctframework.bundle.js" : "../../../dist/ctframework.bundle.min.js");
const html = CT.Html;
const mount = document.querySelector("#app");
const options = [
  { Value: "wild", Label: "Wildfire", Group: "Spells", Keywords: ["projectile"] },
  { Value: 17, Label: "Fireball", Group: "Spells", Keywords: ["projectile"] },
  { Value: "locked", Label: "Fire wall", Group: "Spells", Disabled: true },
  { Value: "arrow", Label: "Fire arrow", Group: "Attacks", Keywords: ["projectile"] },
  "Ice",
];
const catalog = [...options, ...Array.from({ length: 4995 }, (_, index) => `Skill ${index + 1}`)];
const Wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const Frame = async () => {
  await new Promise(requestAnimationFrame);
  await new Promise(requestAnimationFrame);
};

const Assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const Check = async (name, run) => {
  await run();
  const item = document.createElement("li");
  item.textContent = name;
  document.querySelector("#checks").append(item);
};

const Press = (input, key) => input.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
const Type = (input, value) => {
  input.focus();
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
};

const Active = (input) => document.getElementById(input.getAttribute("aria-activedescendant"));
const RichRow = (option) => html`<strong class="rich-label">${option.Label ?? option}</strong>`;

class Example extends Component {
  constructor() {
    super();
    this.state = { Value: 17, Options: catalog, Disabled: false, Changes: 0, Submitted: "", DialogOpen: false, DialogValue: "" };
  }

  Render() {
    return html`<section>
      <form
        ${CT.On("submit", (event) => {
          event.preventDefault();
          this.SetState({ Submitted: JSON.stringify(GetFormValues(event.currentTarget)) });
        })}
      >
        ${Combobox({
          Id: "skill",
          Name: "Skill",
          Label: "Skill",
          Required: true,
          Value: this.state.Value,
          Options: this.state.Options,
          MaxVisible: 5,
          Disabled: this.state.Disabled,
          Filter: this.state.Filter,
          RenderOption: this.state.RenderOption ?? RichRow,
          OnChange: (value, option) => {
            this._lastOption = option;
            this.SetState({ Value: value, Changes: this.state.Changes + 1 });
          },
        })}
        <button type="submit">Submit</button>
        <button type="reset">Reset</button>
      </form>
      <p>Selected value: <output id="value">${String(this.state.Value)}</output></p>
      <p>Changes: <output>${this.state.Changes}</output></p>
      <p>Submitted fields: <output>${this.state.Submitted}</output></p>
      <button id="disable" type="button" ${CT.On("click", () => this.SetState({ Disabled: !this.state.Disabled }))}>${this.state.Disabled ? "Enable field" : "Disable field"}</button>
      <button id="show-dialog" type="button" ${CT.On("click", () => this.SetState({ DialogOpen: true }))}>Open dialog</button>
      ${Dialog({
        Open: this.state.DialogOpen,
        Title: "Choose a skill",
        OnClose: () => this.SetState({ DialogOpen: false }),
        Content: Combobox({ Label: "Dialog skill", Value: this.state.DialogValue, Options: catalog, OnChange: (value) => this.SetState({ DialogValue: value }) }),
      })}
    </section>`;
  }
}

try {
  const app = new Example();
  CT.Mount(app, mount);
  const input = mount.querySelector("#skill");
  const root = input.closest(".ct-combobox");
  const form = input.form;
  const list = document.getElementById(input.getAttribute("aria-controls"));
  const Rows = () => [...list.querySelectorAll('[role="option"]')];
  const Update = async (next) => {
    app.SetState(next);
    await Frame();
  };

  await Check("Focus, label, selected value and capped results", async () => {
    input.focus();
    Assert(input.labels[0].textContent === "Skill" && input.value === "Fireball", "Missing associated label or initial value");
    Assert(input.getAttribute("aria-expanded") === "false" && list.getClientRects().length === 0, "Focus opened the popup");
    root.querySelector(".ct-combobox-toggle").click();
    await Frame();
    Assert(document.activeElement === input && Active(input)?.textContent.includes("Fireball"), "Opening lost focus or active choice");
    Assert(Rows().length === 5 && root.querySelector(".ct-combobox-more").textContent.includes("4995"), "Incorrect render cap or remaining count");
    Assert(
      Rows().some((row) => row.matches('[aria-selected="true"]') && row.querySelector(".rich-label")),
      "Rich selected row missing",
    );
    Assert(GetFormValues(form).Skill === "17", "Submitted label instead of selected value");
  });

  await Check("Debounced multiword search, rank, group labels and announcement", async () => {
    Type(input, "p");
    Type(input, "proj");
    Type(input, "PROJ fire");
    await Wait(140);
    await Frame();
    Assert(input === mount.querySelector("#skill") && document.activeElement === input && input.value === "PROJ fire", "Typing lost focus, identity or draft");
    Assert(
      Rows()
        .map((row) => row.textContent.trim())
        .join("|") === "Fireball|Wildfire|Fire arrow",
      "Unexpected filtered order",
    );
    const groups = [...list.querySelectorAll('[role="group"]')];
    Assert(groups.map((group) => document.getElementById(group.getAttribute("aria-labelledby")).textContent).join("|") === "Spells|Attacks", "Broken group names");
    Assert(root.querySelector('[role="status"]').textContent === "3 results", "Incorrect live count");
    Assert(GetFormValues(form).Skill === "17", "Draft leaked into form");
    Press(input, "Escape");
    await Frame();
    Assert(input.value === "Fireball" && !Active(input) && !app.state.Changes, "Escape changed the selection or retained draft");
  });

  await Check("Keyboard selection, disabled rows, repeated opens and native form data", async () => {
    Press(input, "ArrowDown");
    Press(input, "ArrowDown");
    Press(input, "ArrowDown");
    await Frame();
    Assert(Active(input).textContent.trim() === "Fire arrow", "Navigation landed on a disabled row or heading");
    Press(input, "End");
    Press(input, "Home");
    Press(input, "ArrowDown");
    Press(input, "ArrowDown");
    Press(input, "Enter");
    await Frame();
    Assert(input.value === "Fire arrow" && app._lastOption === options[3] && app.state.Changes === 1 && document.activeElement === input, "Selection event, focus or label failed");
    form.requestSubmit();
    await Frame();
    Assert(app.state.Submitted === '{"Skill":"arrow"}', "Native submit failed");
    Type(input, "");
    Assert(form.checkValidity(), "A blank draft invalidated the committed choice");
    Assert(Press(input, "Tab"), "Tab prevented native focus movement");
    form.querySelector('[type="submit"]').focus();
    await Frame();
    Assert(input.value === "Fire arrow" && input.getAttribute("aria-expanded") === "false", "Tab failed to restore the label");
    Type(input, "unselected");
    form.querySelector('[type="submit"]').focus();
    await Frame();
    Assert(input.value === "Fire arrow" && app.state.Changes === 1, "Blur committed the draft");
  });

  await Check("Clear, required validation, disabled omission and deferred native reset", async () => {
    root.querySelector(".ct-combobox-clear").click();
    await Frame();
    Assert(app._lastOption === null && app.state.Value === "" && app.state.Changes === 2 && document.activeElement === input, "Clear did not commit once and focus the input");
    Assert(input.validity.valueMissing && !form.checkValidity(), "Empty selection passed required validation");
    Type(input, "unmatched");
    Assert(!form.checkValidity() && GetFormValues(form).Skill === "", "Free text bypassed required validation");
    await Wait(140);
    await Frame();
    Assert(root.querySelector(".ct-combobox-empty").textContent === "No matches" && !Active(input), "Missing empty-state feedback");
    await Update({ Disabled: true });
    Assert(input.disabled && form.checkValidity() && !Object.hasOwn(GetFormValues(form), "Skill"), "Disabled control participated in the form");
    await Update({ Disabled: false });
    form.addEventListener("reset", (event) => event.preventDefault(), { once: true });
    form.reset();
    await Wait(20);
    Assert(app.state.Changes === 2, "Canceled reset changed the field");
    form.querySelector('[type="reset"]').click();
    await Wait(20);
    await Frame();
    Assert(input.value === "Fireball" && GetFormValues(form).Skill === "17" && app.state.Changes === 3, "Reset failed to restore the mounted choice once");
    await Update({ Value: "locked" });
    Assert(form.checkValidity() && GetFormValues(form).Skill === "locked" && input.value === "Fire wall", "Parent-selected disabled option lost its committed value");
    await Update({ Value: 17 });
  });

  await Check("Replacement preserves active choice and removes invalid selection silently", async () => {
    input.focus();
    Press(input, "ArrowUp");
    await Frame();
    Assert(Active(input).textContent.trim() === "Ice", "ArrowUp failed to open at the last enabled visible choice");
    await Update({ Options: ["One", "Two", "Three", "Four", "Five", "Ice"] });
    Assert(Active(input)?.textContent.trim() === "Ice" && Rows().length === 5, "Replacement lost the active choice or exceeded the cap");
    Assert(input.value === "" && GetFormValues(form).Skill === "" && app.state.Changes === 3, "Missing selection remained valid or fired a change");
  });

  await Check("Custom matching and display-only rows support pointer selection", async () => {
    await Update({
      Options: options,
      Filter: (option, query) => !query || option === "Ice",
      RenderOption: (option) => (option === "Ice" ? html`<span>${html`<button type="button">Nested action</button>`}</span>` : RichRow(option)),
    });
    Type(input, "cold");
    await Wait(140);
    await Frame();
    Assert(Rows().length === 1 && Rows()[0].textContent.trim() === "Ice" && !list.querySelector("button"), "Invalid custom content became interactive or custom matching failed");
    const row = Rows()[0];
    const allowed = row.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true, pointerType: "touch", button: 0 }));
    Assert(!allowed && document.activeElement === input, "Pointer press allowed focus to leave the input");
    row.click();
    await Frame();
    Assert(input.value === "Ice" && GetFormValues(form).Skill === "Ice" && document.activeElement === input, "Pointer selection failed");
  });

  await Check("Native modal contains its popup and keeps input focus on dismissal", async () => {
    mount.querySelector("#show-dialog").focus();
    mount.querySelector("#show-dialog").click();
    await Frame();
    const dialog = mount.querySelector("dialog");
    const field = dialog.querySelector('[role="combobox"]');
    field.focus();
    Press(field, "ArrowDown");
    await Frame();
    Assert(dialog.matches(":modal") && dialog.contains(Active(field)) && document.activeElement === field, "Popup or focus escaped the modal");
    Assert(!Press(field, "Escape"), "Open popup did not consume Escape");
    await Frame();
    Assert(dialog.open && !Active(field) && document.activeElement === field, "Escape closed modal or moved focus");
    dialog.querySelector("button").click();
    await Frame();
    Assert(!dialog.open && document.activeElement === mount.querySelector("#show-dialog"), "Dialog failed to restore focus");
  });

  CT.Unmount(mount);
  CT.Mount(new Example(), mount);
  document.body.dataset.result = "passed";
  document.querySelector("#result").textContent = `${document.querySelector("#checks").children.length} checks passed. The form is ready for keyboard and touch checks.`;
} catch (error) {
  document.body.dataset.result = "failed";
  document.querySelector("#result").textContent = `Failed: ${error.message}`;
  console.error(error);
}
