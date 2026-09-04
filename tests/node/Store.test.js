import assert from "node:assert/strict";
import test from "node:test";

import { Store } from "../../src/Index.js";

test("Store merges state updates and notifies subscribers", () => {
  const appStore = new Store({
    count: 0,
    title: "CTFramework"
  });

  let receivedState = null;

  const unsubscribe = appStore.Subscribe((state) => {
    receivedState = state;
  });

  const updatedState = appStore.SetState((currentState) => ({
    count: currentState.count + 1
  }));

  assert.deepEqual(updatedState, {
    count: 1,
    title: "CTFramework"
  });
  assert.deepEqual(receivedState, updatedState);

  unsubscribe();
  appStore.Destroy();
});

test("Store can replace the full state object", () => {
  const appStore = new Store({
    count: 2,
    mode: "draft"
  });

  const replacedState = appStore.ReplaceState({
    count: 8,
    mode: "ready"
  });

  assert.deepEqual(replacedState, {
    count: 8,
    mode: "ready"
  });
  assert.deepEqual(appStore.GetState(), replacedState);
});
