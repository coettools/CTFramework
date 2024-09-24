import { Component } from "./Component";
import { VNode } from "./types";

export function createElement(tag: string | ((props: any) => VNode) | (new (props: any) => Component<any, any>), props: any, ...children: (VNode | string)[]): VNode {
  props = props || {};
  console.log("Creating element:", tag, props, children);

  return {
    tag,
    props: { ...props },
    children: children.flat(),
    key: props?.key || null,
  };
}

export class CTFramework {
  static eventHandlers: { [key: string]: Function } = {}; // Store event handlers by their unique event ID.
  static pendingUpdates: Function[] = []; // Queue for pending updates to be processed.

  // Render a component into a DOM container.
  static render<P = {}, S = {}>(component: Component<P, S>, container: HTMLElement) {
    const vnode = component.render(); // Generate the initial virtual node from the component's render method.
    vnode.component = component;
    component.vnode = vnode;
    const dom = CTFramework.createDom(vnode); // Create the actual DOM element from the virtual node.
    container.appendChild(dom); // Attach it to the container.
    CTFramework.onMount(vnode); // Trigger the component's mount lifecycle.
  }

  // Schedule updates to be processed in the next animation frame for better performance.
  static scheduleUpdate(updateFn: Function) {
    CTFramework.pendingUpdates.push(updateFn);
    if (CTFramework.pendingUpdates.length === 1) {
      requestAnimationFrame(CTFramework.processUpdates);
    }
  }

  // Process all pending updates from the queue.
  static processUpdates() {
    while (CTFramework.pendingUpdates.length) {
      const updateFn = CTFramework.pendingUpdates.shift();
      updateFn && updateFn();
    }
  }

  // Re-render a component and update the DOM only if necessary.
  static rerender<P = {}, S = {}>(component: Component<P, S>) {
    if (!component.vnode) return;

    const oldVNode = component.vnode;

    if (!component.shouldComponentUpdate(component.props, component.state)) {
      return; // Skip re-render if shouldComponentUpdate returns false.
    }

    const newVNode = component.render(); // Render the updated virtual node.
    newVNode.component = component;

    const updatedDom = CTFramework.updateDom(oldVNode, newVNode); // Update the DOM.

    // Replace the DOM node if necessary.
    if (typeof oldVNode !== "string" && updatedDom !== oldVNode.dom && oldVNode.dom) {
      oldVNode.dom?.parentNode?.replaceChild(updatedDom, oldVNode.dom as Node);
    }

    component.vnode = newVNode; // Store the new virtual node in the component.
    component.componentOnUpdate(component.props, component.state); // Trigger the update lifecycle.
  }

  // Create a DOM node from a virtual node.
  static createDom(vnode: VNode | string | number): HTMLElement | Text {
    if (typeof vnode === "string" || typeof vnode === "number") {
      return document.createTextNode(String(vnode)); // Convert numbers to text nodes as well.
    }

    if (typeof vnode.tag === "function") {
      // Handle functional or class-based components.
      const ComponentClass = vnode.tag as new (props: any) => Component<any, any>;
      const component = new ComponentClass(vnode.props);
      const componentVNode = component.render();
      componentVNode.component = component;
      vnode.component = component;
      component.vnode = componentVNode;
      const dom = CTFramework.createDom(componentVNode);
      vnode.dom = dom;
      component.componentOnMount();
      return dom;
    }

    const element = document.createElement(vnode.tag as string); // Create a DOM element for the tag.
    vnode.dom = element;

    // Event delegation: Attach a click-event attribute and store the event handler.
    // Check if the vnode has an onClick prop before adding the event handler
    if (vnode.props && vnode.props.onClick) {
      const oldEventId = element.getAttribute("click-event");
      if (oldEventId && CTFramework.eventHandlers[oldEventId]) {
        console.log("delete old event");
        delete CTFramework.eventHandlers[oldEventId]; // Remove the old handler
      }

      // Only add the event listener and ID if the component has a click event
      element.setAttribute("click-event", guid());
      CTFramework.eventHandlers[element.getAttribute("click-event") as string] = vnode.props.onClick;
    }

    // Set properties and styles.
    CTFramework.updateDomProperties(element, {}, vnode.props);

    // Recursively create DOM for child nodes.
    vnode.children.forEach((child) => {
      const childDom = CTFramework.createDom(child);
      element.appendChild(childDom);
    });

    return element;
  }

  // Update the DOM by comparing the old and new virtual nodes.
  static updateDom(oldVNode: VNode | string, newVNode: VNode | string): HTMLElement | Text {
    // Handle text nodes
    if (typeof oldVNode === "string" || typeof newVNode === "string") {
      const newTextContent = (typeof newVNode === "string" ? newVNode : "") || "";
      if (oldVNode !== newTextContent) {
        return document.createTextNode(newTextContent);
      }
      return typeof oldVNode === "string" ? document.createTextNode(oldVNode) : ((oldVNode as VNode).dom as Text);
    }

    // Static node check remains
    if (oldVNode.isStatic) {
      newVNode.dom = oldVNode.dom;
      newVNode.component = oldVNode.component;
      return newVNode.dom as HTMLElement;
    }

    // Replace node if tag is different
    if (oldVNode.tag !== newVNode.tag) {
      const newDom = CTFramework.createDom(newVNode);
      if (oldVNode.dom && oldVNode.dom.parentNode) {
        oldVNode.dom.parentNode.replaceChild(newDom, oldVNode.dom);
      }
      return newDom;
    }

    const dom = oldVNode.dom as HTMLElement;
    newVNode.dom = dom;

    // **Ensure text content is updated**:
    // If we're dealing with text inside an element (like <h1>)
    if (newVNode.children.length === 1 && typeof newVNode.children[0] === "string") {
      if (dom.textContent !== newVNode.children[0]) {
        dom.textContent = newVNode.children[0] as string; // Update text directly
      }
    }

    // Update properties even if children haven't changed
    CTFramework.updateDomProperties(dom, oldVNode.props, newVNode.props);

    // Handle children updates (only if they exist)
    const oldChildren = oldVNode.children || [];
    const newChildren = newVNode.children || [];

    if (oldChildren.length === 0 && newChildren.length === 0) {
      return CTFramework.createDom(newVNode);
    }

    const oldChildrenMap = new Map<string, VNode>();

    // Map old children by keys if any
    oldChildren.forEach((child) => {
      if (child && typeof child !== "string" && child.key) {
        oldChildrenMap.set(child.key as string, child); // **Track children by key**
      }
    });

    // **Iterate through new children**
    newChildren.forEach((newChild, i) => {
      if (typeof newChild === "string") {
        const newTextContent = newChild || "";
        const oldChild = oldChildren[i];
        if (typeof oldChild === "string" && oldChild !== newTextContent) {
          // **Update text content if needed**
          dom.childNodes[i].textContent = newTextContent;
        } else if (dom.childNodes[i]) {
          dom.replaceChild(document.createTextNode(newTextContent), dom.childNodes[i]);
        } else {
          dom.appendChild(document.createTextNode(newTextContent));
        }
      } else {
        const key = (newChild as VNode).key as string | undefined;
        const oldChild = key ? oldChildrenMap.get(key) : oldChildren[i]; // **Look for matching old child by key or index**

        if (oldChild) {
          // **Update the DOM for the matching child**
          const updatedChildDom = CTFramework.updateDom(oldChild, newChild);
          if (dom.childNodes[i] !== updatedChildDom) {
            dom.replaceChild(updatedChildDom, dom.childNodes[i]);
          }
          if (key) oldChildrenMap.delete(key); // **Remove key from map once updated**
        } else {
          // **If no matching old child, create a new DOM node**
          const newChildDom = CTFramework.createDom(newChild);
          dom.appendChild(newChildDom);
        }
      }
    });

    // **Remove old children that are no longer present**
    oldChildrenMap.forEach((oldChild) => {
      if (oldChild.dom && dom.contains(oldChild.dom)) {
        dom.removeChild(oldChild.dom); // **Remove old DOM elements that are no longer in newVNode**
      }
    });

    return dom;
  }

  // Update the properties and styles of a DOM element.
  static updateDomProperties(dom: HTMLElement, oldProps: any = {}, newProps: any = {}) {
    const changes = CTFramework.getPropChanges(oldProps, newProps);

    // Check if click-event exists on the DOM element, otherwise create one
    let eventId = dom.getAttribute("click-event") ?? "";

    changes.forEach(({ name, value }: { name: string; value: any }) => {
      if (name === "style") {
        CTFramework.updateStyle(dom, oldProps.style, newProps.style);
      } else if (name.startsWith("on")) {
        const eventType = name.toLowerCase().substring(2);

        // Remove the old event listener from CTFramework.eventHandlers using click-event
        if (CTFramework.eventHandlers[eventId]) {
          console.log(`Removing old event listener for ${eventType}`, eventId, CTFramework.eventHandlers[eventId]);
          delete CTFramework.eventHandlers[eventId]; // Remove from event handlers map
        }

        // Add the new event listener in CTFramework.eventHandlers using click-event
        if (value && typeof value === "function") {
          console.log(`Adding new event listener for ${eventType}`, eventId, value);
          CTFramework.eventHandlers[eventId] = value; // Update the event handler in the map
        }
      } else if (name === "textContent") {
        dom.textContent = value;
      } else if (name in dom) {
        (dom as any)[name] = value;
      } else {
        dom.setAttribute(name, value);
      }
    });
  }

  // Get the differences between the old and new props for efficient updates.
  static getPropChanges(oldProps: any, newProps: any): { name: string; value: any }[] {
    const changes: { name: string; value: any }[] = [];
    for (const name in newProps) {
      if (newProps[name] !== oldProps[name]) {
        changes.push({ name, value: newProps[name] });
      }
    }
    return changes;
  }

  // Add the missing updateStyle function.
  static updateStyle(dom: HTMLElement, oldStyle: any = {}, newStyle: any = {}) {
    // If styles are provided as a string, update the style attribute.
    if (typeof oldStyle === "string" || typeof newStyle === "string") {
      dom.setAttribute("style", newStyle || "");
    } else {
      // Remove old styles not present in the new styles.
      Object.keys(oldStyle).forEach((key) => {
        if (!(key in newStyle)) {
          dom.style[key as any] = "";
        }
      });

      // Apply new styles.
      Object.keys(newStyle).forEach((key) => {
        if (oldStyle[key] !== newStyle[key]) {
          dom.style[key as any] = newStyle[key];
        }
      });
    }
  }

  // Helper method to handle the component mount lifecycle.
  static onMount(vnode: VNode) {
    if (typeof vnode === "string") return;

    if (vnode.component) {
      vnode.component.componentOnMount(); // Trigger component mount lifecycle.
    }

    vnode.children.forEach((child) => CTFramework.onMount(child as VNode));
  }

  // Helper method to handle the component unmount lifecycle.
  static onUnmount(vnode: VNode) {
    if (typeof vnode === "string") return;

    if (vnode.component) {
      vnode.component.componentOnUnmount(); // Trigger component unmount lifecycle.
    }

    vnode.children.forEach((child) => CTFramework.onUnmount(child as VNode));
  }
}

function guid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Event delegation: A single event listener handles all click events.
document.addEventListener("click", (event) => {
  let target = event.target as HTMLElement;
  while (target && !target.hasAttribute("click-event")) {
    target = target.parentElement!;
  }
  if (target) {
    const handler = CTFramework.eventHandlers[target.getAttribute("click-event") as string];
    handler && handler(event);
  }
});
