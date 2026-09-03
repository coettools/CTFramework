import assert from "node:assert/strict";
import test from "node:test";
import { SideNavigation } from "../../src/Index.js";
import { SideNavigationComponent } from "../../src/components/SideNavigation.js";

test("SideNavigation shows every item and preserves the list through collapse cycles", () => {
  const options = {
    ActiveId: "services",
    Items: [{ Id: "overview", Label: "Overview" }, { Id: "services", Label: "Services" }]
  };
  assert.equal(SideNavigation(options).tag, SideNavigationComponent);
  const navigation = new SideNavigationComponent(options);
  navigation.SetState = (update) => { navigation.state = { ...navigation.state, ...update(navigation.state) }; };
  assert.deepEqual(navigation.state, { IsOpen: true });

  for (let cycle = 0; cycle < 3; cycle += 1) {
    const expanded = JSON.stringify(navigation.Render());
    assert.equal(expanded.match(/"Overview"/g)?.length, 1);
    assert.equal(expanded.match(/"Services"/g)?.length, 1);
    assert.equal(expanded.match(/ct-side-navigation-item is-active/g)?.length, 1);
    assert.doesNotMatch(expanded, /<input/);
    navigation.ToggleNavigation();
    assert.equal(navigation.state.IsOpen, false);
    assert.doesNotMatch(JSON.stringify(navigation.Render()), /ct-side-navigation-item/);
    navigation.ToggleNavigation();
  }
});

test("SideNavigation handles an empty list and updated parent items", () => {
  const navigation = new SideNavigationComponent({});
  assert.match(JSON.stringify(navigation.Render()), /No navigation items\./);
  navigation.props = { ActiveId: "settings", Items: [{ Id: "settings", Label: "Settings" }] };
  const rendered = JSON.stringify(navigation.Render());
  assert.match(rendered, /"Settings"/);
  assert.match(rendered, /ct-side-navigation-item is-active/);
  assert.doesNotMatch(rendered, /No navigation items/);
});
