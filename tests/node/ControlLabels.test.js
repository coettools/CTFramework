import test from "node:test";
import assert from "node:assert/strict";
import { DialogComponent } from "../../src/components/Dialog.js";
import { ImageCarouselComponent } from "../../src/components/ImageCarousel.js";

test("dialog close labels are optional and can change while a dialog is open", () => {
  const dialog = new DialogComponent({ Open: true, Title: "Confirm" });
  assert.match(JSON.stringify(dialog.Render()), /Close dialog/);
  dialog.props = { ...dialog.props, CloseLabel: "Fechar", CloseAriaLabel: "Fechar janela" };
  const translated = JSON.stringify(dialog.Render());
  assert.match(translated, /Fechar janela/);
  assert.doesNotMatch(translated, /Close dialog/);
  assert.equal(dialog.props.Open, true);
});

test("carousel labels fall back independently and preserve selected images", () => {
  const control = new ImageCarouselComponent({ Images: [{ Src: "/1.png" }, { Src: "/2.png" }], InitialIndex: 1, Labels: { Count: (number, total) => `${number} de ${total}`, Next: "Seguinte", ShowImage: (number) => `Mostrar ${number}` } });
  const translated = JSON.stringify(control.Render());
  assert.match(translated, /2 de 2/);
  assert.match(translated, /Seguinte/);
  assert.match(translated, /Mostrar 1/);
  assert.match(translated, /Previous image/);
  control.props = { ...control.props, Labels: {} };
  assert.match(JSON.stringify(control.Render()), /2 of 2/);
  assert.equal(control.state.Index, 1);
  control.props = { ...control.props, Images: [], Labels: { NoImages: "Sem imagens", EmptyGallery: "Galeria vazia", ZeroImages: "Zero" } };
  const empty = JSON.stringify(control.Render());
  assert.match(empty, /Sem imagens/);
  assert.match(empty, /Galeria vazia/);
});
