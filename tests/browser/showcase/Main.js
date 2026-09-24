import CT, { Route, Router, Store } from "../../../src/Index.js";
import { App } from "./App.js";

const appStore = new Store({
  count: 3,
  notes: ["Keep production code in src", "Keep tests outside src"],
});

const appRouter = new Router([Route("/", "home"), Route("/notes", "notes"), Route("/dom", "dom"), Route("/utilities", "utilities"), Route("/utilities/:Name", "utilities"), Route("/components", "components")], {
  BasePath: new URL(".", import.meta.url).pathname,
});

if (appRouter.currentPath === "/index.html") appRouter.Replace("/");

CT.Start({
  App,
  Target: "#app",
  Props: {
    router: appRouter,
    store: appStore,
  },
});
