import assert from "node:assert/strict";
import test from "node:test";
import { Route, Router } from "../../src/Index.js";

const CreateWindowMock = (context, pathname = "/") => {
  const originalWindow = globalThis.window;
  const listeners = new Map();
  const entries = [new URL(pathname, "https://example.test")];
  let position = 0;
  const mock = {
    get location() {
      return entries[position];
    },
    history: {
      pushState(_, _2, path) {
        entries.splice(++position, entries.length, new URL(path, entries[position - 1]));
      },
      replaceState(_, _2, path) {
        entries[position] = new URL(path, entries[position]);
      },
      back() {
        if (position > 0) {
          position--;
          listeners.get("popstate")?.();
        }
      },
      forward() {
        if (position < entries.length - 1) {
          position++;
          listeners.get("popstate")?.();
        }
      },
    },
    addEventListener(name, handler) {
      listeners.set(name, handler);
    },
    removeEventListener(name, handler) {
      if (listeners.get(name) === handler) listeners.delete(name);
    },
    listeners,
    entries,
  };
  globalThis.window = mock;
  context.after(() => {
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
  });

  return mock;
};

test("Router normalizes clean paths and ignores query/fragment when matching", () => {
  assert.equal(Router.NormalizePath("notes/"), "/notes");
  assert.equal(Router.NormalizePath("/notes?sort=new#heading"), "/notes");
  assert.equal(Router.NormalizePath("/one/../two"), "/two");
  assert.equal(Router.NormalizePath(), "/");
  for (const path of ["#/notes", "//external.test", "https://external.test", "javascript:alert(1)", "/\\external", "/a\nb"]) {
    assert.throws(() => Router.NormalizePath(path), /application path/);
  }

  assert.equal(Router.ToHashPath, undefined);
  assert.equal(Router.ShouldUseHashRouting, undefined);
});

test("Router uses browser history, preserves query strings, and handles Back/Forward", (context) => {
  const browser = CreateWindowMock(context, "/start");
  const router = new Router([Route("/notes", "notes"), Route("*", "missing")]);
  const changes = [];
  const unsubscribe = router.Subscribe((path, route) => changes.push([path, route.component]));
  assert.equal(router.Resolve().component, "missing");
  router.Navigate("/notes?sort=new#heading");
  assert.equal(browser.location.pathname, "/notes");
  assert.equal(browser.location.search, "?sort=new");
  assert.equal(browser.location.hash, "#heading");
  router.Navigate("/notes?sort=new#heading");
  assert.equal(changes.length, 1);
  router.Navigate("/notes?sort=old");
  assert.equal(changes.length, 2);
  browser.history.back();
  assert.equal(browser.location.search, "?sort=new");
  browser.history.back();
  assert.equal(router.currentPath, "/start");
  browser.history.forward();
  assert.deepEqual(changes.at(-1), ["/notes", "notes"]);
  const count = browser.entries.length;
  router.Replace("/missing");
  assert.equal(browser.entries.length, count);
  assert.equal(router.Resolve().component, "missing");
  unsubscribe();
  router.Destroy();
  assert.equal(browser.listeners.size, 0);
  assert.equal(router.listeners.size, 0);
});

test("Router keeps subfolder paths inside BasePath and resolves direct loads", (context) => {
  const browser = CreateWindowMock(context, "/guide/settings/?q=one");
  const router = new Router([Route("/", "home"), Route("/settings", "settings"), Route("*", "missing")], { BasePath: "/guide/" });
  assert.equal(router.GetCurrentPath(), "/settings");
  assert.equal(router.Resolve().component, "settings");
  router.Navigate("/");
  assert.equal(browser.location.pathname, "/guide/");
  router.Navigate("../settings");
  assert.equal(browser.location.pathname, "/guide/settings");
  browser.history.pushState({}, "", "/guide-other/settings");
  router.HandlePopState();
  assert.equal(router.currentPath, null);
  assert.equal(router.Resolve().component, "missing");
  router.Destroy();
});

test("Router does not navigate invalid or external destinations", (context) => {
  const browser = CreateWindowMock(context);
  const router = new Router();
  for (const path of ["//external.test/", "https://external.test/", "#/notes"]) {
    assert.throws(() => router.Navigate(path), /application path/);
    assert.throws(() => router.Replace(path), /application path/);
  }

  assert.equal(browser.entries.length, 1);
  assert.equal(router.Resolve(), null);
  router.Destroy();
});

test("Router resolves named parameters after literal paths and before the fallback", (context) => {
  CreateWindowMock(context, "/business/abc/edit");
  const dynamic = Route("/business/:Id/edit", "edit");
  const router = new Router([Route("*", "missing"), dynamic, Route("/business/new/edit", "new")]);
  assert.equal(router.Resolve(), dynamic);
  assert.deepEqual(router.GetParameters(), { Id: "abc" });
  assert.equal(router.Resolve("/business/new/edit").component, "new");
  assert.deepEqual(router.GetParameters("/business/new/edit"), {});
  router.Navigate("/business/Horta%20Town/edit?mode=full#heading");
  assert.deepEqual(router.GetParameters(), { Id: "Horta Town" });
  assert.equal(router.Resolve("/business/abc/edit/extra").component, "missing");
  assert.deepEqual(router.GetParameters("/unknown"), {});
  router.Destroy();
});

test("Router decodes each parameter once, rejects malformed segments, and supports BasePath", (context) => {
  const browser = CreateWindowMock(context, "/app/islands/Faial/businesses/Caf%C3%A9");
  const router = new Router([Route("/islands/:Island/businesses/:Name", "business"), Route("*", "missing")], { BasePath: "/app" });
  assert.deepEqual(router.GetParameters(), { Island: "Faial", Name: "Caf\u00e9" });
  for (const value of ["", "%", "%ZZ", "%E0%A4", "%2F", "%5C", "%00", "%1F", "%7F"]) {
    assert.equal(router.Resolve(`/islands/Faial/businesses/${value}`).component, "missing");
  }

  assert.deepEqual(router.GetParameters("/islands/Faial/businesses/%252F"), { Island: "Faial", Name: "%2F" });
  browser.history.pushState({}, "", "/outside");
  router.HandlePopState();
  assert.deepEqual(router.GetParameters(), {});
  router.Destroy();
});

test("Router parameter names are unique identifiers and cannot mutate object prototypes", (context) => {
  CreateWindowMock(context);
  const router = new Router([Route("/:__proto__/:constructor", "safe")]);
  const parameters = router.GetParameters("/one/two");
  assert.equal(Object.getPrototypeOf(parameters), Object.prototype);
  assert.equal(parameters.__proto__, "one");
  assert.equal(parameters.constructor, "two");
  for (const path of ["/:Id/:Id", "/:", "/:bad-name", "/:1Id"]) {
    router.routes = [Route(path, "invalid")];
    assert.throws(() => router.Resolve("/one/two"), /unique names/);
  }

  router.Destroy();
});
