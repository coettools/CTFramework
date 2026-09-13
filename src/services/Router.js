const ParsePath = (path = "/") => {
  const value = String(path || "/").trim();
  if (/^[a-z][a-z\d+.-]*:/i.test(value) || value.startsWith("//") ||
      value.startsWith("#") || /[\\\u0000-\u001f\u007f]/.test(value)) {
    throw new TypeError("Use an application path such as /settings.");
  }
  const url = new URL(value.startsWith("/") ? value : `/${value}`, "https://ctframework.invalid");
  if (url.pathname.startsWith("//")) throw new TypeError("Use an application path such as /settings.");
  url.pathname = url.pathname.replace(/\/+$/, "") || "/";
  return url;
};

export class Router {
  constructor(routes = [], options = {}) {
    this.routes = routes;
    this.basePath = Router.NormalizePath(options.BasePath);
    this.currentPath = this.GetCurrentPath();
    this.listeners = new Set();
    this.HandlePopState = this.HandlePopState.bind(this);
    window.addEventListener("popstate", this.HandlePopState);
  }

  HandlePopState() {
    this.currentPath = this.GetCurrentPath();
    this.Notify();
  }

  Navigate(path) {
    const url = ParsePath(path);
    const nextUrl = `${this.basePath === "/" ? "" : this.basePath}${url.pathname}${url.search}${url.hash}`;
    if (nextUrl === `${window.location.pathname}${window.location.search}${window.location.hash}`) return;
    window.history.pushState({}, "", nextUrl);
    this.currentPath = this.GetCurrentPath();
    this.Notify();
  }

  Replace(path) {
    const url = ParsePath(path);
    const nextUrl = `${this.basePath === "/" ? "" : this.basePath}${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState({}, "", nextUrl);
    this.currentPath = this.GetCurrentPath();
    this.Notify();
  }

  Resolve(path = this.currentPath) {
    const currentPath = path === null ? null : Router.NormalizePath(path);
    return this.routes.find((route) => !["*", "/*"].includes(route.path) &&
      Router.NormalizePath(route.path) === currentPath) ||
      this.routes.find((route) => route.path === "*" || route.path === "/*") || null;
  }

  Subscribe(listener) {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  Notify() {
    this.listeners.forEach((listener) => listener(this.currentPath, this.Resolve()));
  }

  Destroy() {
    window.removeEventListener("popstate", this.HandlePopState);
    this.listeners.clear();
  }

  GetCurrentPath() {
    const pathname = Router.NormalizePath(window.location.pathname);
    if (this.basePath === "/") return pathname;
    if (pathname === this.basePath) return "/";
    return pathname.startsWith(`${this.basePath}/`) ? pathname.slice(this.basePath.length) : null;
  }

  static NormalizePath(path = "/") {
    return ParsePath(path).pathname;
  }
}
