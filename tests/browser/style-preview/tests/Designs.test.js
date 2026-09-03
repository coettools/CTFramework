import assert from "node:assert/strict";
import test from "node:test";
import { Accents, Designs, DescribeDesign, MatchDesign, Shapes, Surfaces } from "../Designs.js";

test("design choices have unique identifiers and labels", () => {
  for (const choices of [Surfaces, Accents, Shapes, Designs]) {
    assert.equal(new Set(choices.map((choice) => choice.Id)).size, choices.length);
    assert.ok(choices.every((choice) => choice.Name));
  }
});

test("every direction resolves to valid surface, accent, and shape choices", () => {
  for (const design of Designs) {
    assert.ok(Surfaces.some((surface) => surface.Id === design.Surface));
    assert.ok(Accents.some((accent) => accent.Id === design.Accent));
    assert.ok(Shapes.some((shape) => shape.Id === design.Shape));
    assert.equal(MatchDesign(design)?.Id, design.Id);
  }
});

test("all mixed combinations have complete descriptions", () => {
  for (const surface of Surfaces) {
    for (const accent of Accents) {
      for (const shape of Shapes) {
        const selection = { Surface: surface.Id, Accent: accent.Id, Shape: shape.Id };
        assert.equal(DescribeDesign(selection), `${surface.Name} / ${accent.Name} / ${shape.Name}`);
      }
    }
  }
});

test("custom combinations are not incorrectly named after a preset", () => {
  assert.equal(MatchDesign({ Surface: "split", Accent: "amber", Shape: "soft" }), undefined);
});
