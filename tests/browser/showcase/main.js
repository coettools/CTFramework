import CT, { Route, Router, Store } from "../../../src/Index.js";
import { App } from "./App.js";

const appStore = new Store({
  count: 3,
  notes: ["Keep production code in src", "Keep tests outside src"]
});

const appRouter = new Router([
  Route("/", "home"),
  Route("/notes", "notes"),
  Route("/dom", "dom"),
  Route("/utilities", "utilities"),
  Route("/components", "components")
]);

CT(() => {
  const appElement = CT("#app").Get();

  if (!appElement) {
    throw new Error("Showcase app element was not found.");
  }

  CT.Mount(
    App,
    appElement,
    {
      router: appRouter,
      store: appStore
    }
  );
});
