import { CT, CTFramework } from "./CTFramework.js";
import { IsClassComponent } from "./html/RenderNodes.js";

export const Start = async (options = {}) => {
  let target = null;

  try {
    await new Promise((resolve) => CTFramework.Ready(resolve));

    if (!options || typeof options !== "object" || Array.isArray(options)) {
      throw new TypeError("CT.Start expects an options object with App and Target.");
    }

    const element = CTFramework.ResolveElement(options.Target ?? "#app");
    if (!element) throw new Error("CT.Start could not find the target element.");
    target = element;

    const { App, Props = {} } = options;
    if (!IsClassComponent(App)) throw new TypeError("CT.Start App must be a Component class.");
    if (!Props || typeof Props !== "object" || Array.isArray(Props)) {
      throw new TypeError("CT.Start Props must be an object.");
    }

    return CT.Mount(App, target, Props);
  } catch (error) {
    console.error("CT.Start failed.", error);
    if (!target) return null;

    try {
      CT.Unmount(target);
    } catch (cleanupError) {
      console.error("CT.Start cleanup failed.", cleanupError);
    }

    try {
      CTFramework.EnsureDefaultStyles();
      const fallback = CTFramework.CreateErrorFallbackDom(error);
      target.replaceChildren(fallback);

      return fallback;
    } catch (fallbackError) {
      console.error("CT.Start could not display its fallback.", fallbackError);

      return null;
    }
  }
};
