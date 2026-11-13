import assert from "node:assert/strict";
import test from "node:test";
import { CT } from "../../src/CTFramework.js";
import { Card } from "../../src/components/Card.js";

test("Card titles use the requested heading level, with h2 as the default", () => {
  for (let level = 1; level <= 6; level++) {
    const card = Card({ Title: "Section title", HeadingLevel: level });
    const header = card.props.values.find((value) => value?.tag === "ct-template");
    assert.equal(header.props.values[0].tag, `h${level}`);
    assert.equal(header.props.values[0].children[0].props.nodeValue, "Section title");
  }

  const card = Card({ Title: "Default" });
  assert.equal(card.props.values[0].props.values[0].tag, "h2");
  for (const level of [0, 7, 2.5, "3", null]) assert.throws(() => Card({ HeadingLevel: level }), /HeadingLevel/);
});

test("Card header actions work with a title or on their own", () => {
  const actions = CT.Html`<button type="button">Edit</button>`;
  const header = Card({ Title: "Title", Actions: actions }).props.values[0];
  assert.equal(header.props.values[1].props.values[0], actions);
  assert.equal(Card({ Actions: actions }).props.values[0].props.values[0], null);
  assert.equal(Card().props.values[0], null);
});
