import assert from "node:assert/strict";
import test from "node:test";

import { Route, Router } from "../../src/Index.js";

test("Router normalizes paths", () => {
  assert.equal(Router.NormalizePath("notes"), "/notes");
  assert.equal(Router.NormalizePath("/notes/"), "/notes");
  assert.equal(Router.NormalizePath("#/notes"), "/notes");
  assert.equal(Router.ToHashPath("/notes"), "#/notes");
});

test("Router resolves routes and notifies listeners with history routing", (testContext) => {
  const originalWindow = globalThis.window;
  const mockWindow = createWindowMock({ pathname: "/start/" });

  globalThis.window = mockWindow;

  testContext.after(() => {
    if (originalWindow === undefined) {
      delete globalThis.window;
      return;
    }

    globalThis.window = originalWindow;
  });

  const appRouter = new Router([Route("/", "home"), Route("/notes", "notes"), Route("*", "missing")], { UseHashRouting: false });
  let notifiedPath = "";
  let notifiedRoute = null;

  const unsubscribe = appRouter.Subscribe((currentPath, resolvedRoute) => {
    notifiedPath = currentPath;
    notifiedRoute = resolvedRoute;
  });

  assert.equal(appRouter.currentPath, "/start");
  assert.equal(appRouter.Resolve().component, "missing");

  appRouter.Navigate("/notes/");

  assert.equal(mockWindow.location.pathname, "/notes");
  assert.equal(notifiedPath, "/notes");
  assert.equal(notifiedRoute.component, "notes");

  unsubscribe();
  appRouter.Destroy();
});

test("Router uses hash routing by default", (testContext) => {
  const originalWindow = globalThis.window;
  const mockWindow = createWindowMock({
    origin: "null",
    pathname: "/index.html",
    protocol: "file:"
  });

  globalThis.window = mockWindow;

  testContext.after(() => {
    if (originalWindow === undefined) {
      delete globalThis.window;
      return;
    }

    globalThis.window = originalWindow;
  });

  const appRouter = new Router([Route("/", "home"), Route("/docs", "docs")]);

  assert.equal(appRouter.useHashRouting, true);

  appRouter.Navigate("/docs");

  assert.equal(mockWindow.location.hash, "#/docs");

  appRouter.HandleHashChange();

  assert.equal(appRouter.currentPath, "/docs");
  assert.equal(appRouter.Resolve().component, "docs");

  appRouter.Destroy();
});

const createWindowMock = ({
  origin = "http://localhost",
  pathname = "/",
  protocol = "http:"
} = {}) => {
  const listeners = new Map();

  const location = {
    origin,
    pathname,
    protocol,
    hash: "",
    get href() {
      return `${this.origin}${this.pathname}${this.hash}`;
    },
    replace(nextUrl) {
      const parsedUrl = new URL(nextUrl);
      this.pathname = parsedUrl.pathname;
      this.hash = parsedUrl.hash;
    }
  };

  return {
    location,
    history: {
      pushState(state, title, nextPath) {
        location.pathname = String(nextPath);
      },
      replaceState(state, title, nextPath) {
        location.pathname = String(nextPath);
      }
    },
    addEventListener(eventType, handler) {
      listeners.set(eventType, handler);
    },
    removeEventListener(eventType, handler) {
      if (listeners.get(eventType) === handler) {
        listeners.delete(eventType);
      }
    }
  };
};
