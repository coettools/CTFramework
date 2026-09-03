export class Router {
  constructor(routes = [], options = {}) {
    this.routes = routes;
    this.useHashRouting = options.UseHashRouting ?? Router.ShouldUseHashRouting();
    this.currentPath = this.GetCurrentPath();
    this.listeners = new Set();
    this.HandlePopState = this.HandlePopState.bind(this);
    this.HandleHashChange = this.HandleHashChange.bind(this);

    if (this.useHashRouting) {
      window.addEventListener("hashchange", this.HandleHashChange);
      return;
    }

    window.addEventListener("popstate", this.HandlePopState);
  }

  HandlePopState() {
    this.currentPath = this.GetCurrentPath();
    this.Notify();
  }

  HandleHashChange() {
    this.currentPath = this.GetCurrentPath();
    this.Notify();
  }

  Navigate(path) {
    const nextPath = Router.NormalizePath(path);

    if (nextPath === this.currentPath) {
      return;
    }

    if (this.useHashRouting) {
      window.location.hash = Router.ToHashPath(nextPath);
      return;
    }

    window.history.pushState({}, "", nextPath);
    this.currentPath = nextPath;
    this.Notify();
  }

  Replace(path) {
    const nextPath = Router.NormalizePath(path);

    if (this.useHashRouting) {
      const nextHashPath = Router.ToHashPath(nextPath);

      if (window.location.hash !== nextHashPath) {
        const baseUrl = window.location.href.split("#")[0];
        window.location.replace(`${baseUrl}${nextHashPath}`);
        return;
      }

      this.currentPath = nextPath;
      this.Notify();
      return;
    }

    window.history.replaceState({}, "", nextPath);
    this.currentPath = nextPath;
    this.Notify();
  }

  Resolve(path = this.currentPath) {
    const currentPath = Router.NormalizePath(path);

    return (
      this.routes.find((route) => Router.NormalizePath(route.path) === currentPath) ||
      this.routes.find((route) => route.path === "*" || route.path === "/*") ||
      null
    );
  }

  Subscribe(listener) {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  Notify() {
    this.listeners.forEach((listener) => {
      listener(this.currentPath, this.Resolve(this.currentPath));
    });
  }

  Destroy() {
    if (this.useHashRouting) {
      window.removeEventListener("hashchange", this.HandleHashChange);
    } else {
      window.removeEventListener("popstate", this.HandlePopState);
    }

    this.listeners.clear();
  }

  GetCurrentPath() {
    if (this.useHashRouting) {
      return Router.NormalizePath(window.location.hash.replace(/^#/, "") || "/");
    }

    return Router.NormalizePath(window.location.pathname);
  }

  static NormalizePath(path = "/") {
    if (!path) {
      return "/";
    }

    let normalizedPath = String(path).trim();

    if (normalizedPath.startsWith("#")) {
      normalizedPath = normalizedPath.substring(1);
    }

    if (!normalizedPath.startsWith("/")) {
      normalizedPath = `/${normalizedPath}`;
    }

    if (normalizedPath.length > 1 && normalizedPath.endsWith("/")) {
      normalizedPath = normalizedPath.replace(/\/+$/, "");
    }

    return normalizedPath || "/";
  }

  static ToHashPath(path = "/") {
    return `#${Router.NormalizePath(path)}`;
  }

  static ShouldUseHashRouting() {
    return true;
  }
}
