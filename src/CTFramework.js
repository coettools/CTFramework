import { Component } from "./components/Component.js";
import { Guid } from "./utils/Guid.js";
import {
  IsClassComponent,
  IsFunctionalComponent,
  IsTextNode,
  NormalizeNodes,
  NormalizeNode,
  CloneState
} from "./html/RenderNodes.js";

export const CreateTemplate = (strings, ...values) => {
  return {
    tag: "ct-template",
    props: { strings, values },
    children: [],
    templateChildren: [],
    key: null,
    dom: null
  };
};

const IsTemplateVNode = (vnode) => {
  return vnode?.tag === "ct-template";
};

const IsTemplateMarker = (value, type) => {
  return value?.__ctTemplateMarker === type;
};

export class CTSelection {
  constructor(target, scope = document) {
    this.elements = CTFramework.ResolveElements(target, scope);
  }

  get length() {
    return this.elements.length;
  }

  Get(index = 0) {
    return this.elements[index] || null;
  }

  Each(callback) {
    this.elements.forEach((element, index) => {
      callback(element, index);
    });

    return this;
  }

  Find(selector) {
    const elements = this.elements.flatMap((element) => CTFramework.FindAll(selector, element));
    return CT.CreateSelection(elements);
  }

  On(eventType, selectorOrHandler, handler) {
    this.Each((element) => {
      CTFramework.On(element, eventType, selectorOrHandler, handler);
    });

    return this;
  }

  Attr(name, value) {
    if (value === undefined) {
      return CTFramework.Attr(this.Get(), name);
    }

    return this.Each((element) => CTFramework.Attr(element, name, value));
  }

  Data(name, value) {
    if (value === undefined) {
      return CTFramework.Data(this.Get(), name);
    }

    return this.Each((element) => CTFramework.Data(element, name, value));
  }

  Css(propertyOrStyles, value) {
    if (typeof propertyOrStyles === "string" && value === undefined) {
      return CTFramework.Css(this.Get(), propertyOrStyles);
    }

    return this.Each((element) => CTFramework.Css(element, propertyOrStyles, value));
  }

  Html(value) {
    if (value === undefined) {
      return CTFramework.Html(this.Get());
    }

    return this.Each((element) => CTFramework.Html(element, value));
  }

  Text(value) {
    if (value === undefined) {
      return CTFramework.Text(this.Get());
    }

    return this.Each((element) => CTFramework.Text(element, value));
  }

  AddClass(className) {
    return this.Each((element) => CTFramework.AddClass(element, className));
  }

  RemoveClass(className) {
    return this.Each((element) => CTFramework.RemoveClass(element, className));
  }

  ToggleClass(className, force) {
    return this.Each((element) => CTFramework.ToggleClass(element, className, force));
  }

  HasClass(className) {
    return this.elements.some((element) => CTFramework.HasClass(element, className));
  }

  Remove() {
    return this.Each((element) => CTFramework.Remove(element));
  }
}

export class CTFramework {
  static DefaultStylesId = "ctframework-default-styles";
  static DefaultStylesUrl = null;
  static eventHandlers = {};
  static pendingUpdates = [];
  static queuedComponentUpdates = new Map();
  static supportedEvents = [
    "click",
    "dblclick",
    "input",
    "change",
    "submit",
    "keydown",
    "keyup",
    "keypress",
    "mousedown",
    "mouseup",
    "pointerdown",
    "pointerup",
    "focusin",
    "focusout",
    "contextmenu"
  ];
  static isEventDelegationReady = false;

  static Render(component, container) {
    if (!(component instanceof Component)) {
      throw new Error("CTFramework.Render expects a Component instance.");
    }

    container = CTFramework.ResolveTarget(container);

    if (!container) {
      throw new Error("CTFramework.Render could not find the mount element.");
    }

    CTFramework.EnsureDefaultStyles();
    CTFramework.InitializeEventDelegation();
    CTFramework.Unmount(container);
    container.textContent = "";

    component.__container = container;
    component.__disposed = false;
    container.__ctRootComponent = component;

    try {
      const vnode = NormalizeNode(component.Render());
      component.vnode = vnode;

      const dom = CTFramework.CreateDom(vnode);
      container.appendChild(dom);

      container.__ctRootComponent = component;
      container.__ctRootVNode = vnode;

      CTFramework.OnMount(vnode);
      component.ComponentOnMount();

      return dom;
    } catch (error) {
      return CTFramework.RenderErrorFallback(component, error);
    }
  }

  static Unmount(container) {
    if (!container?.__ctRootComponent) {
      return;
    }

    const component = container.__ctRootComponent;
    CTFramework.DisposeComponent(component);
    CTFramework.OnUnmount(container.__ctRootVNode);
    component.ComponentOnUnmount();
    container.textContent = "";

    delete container.__ctRootComponent;
    delete container.__ctRootVNode;
  }

  static ScheduleUpdate(updateFunction) {
    CTFramework.pendingUpdates.push(updateFunction);

    if (CTFramework.pendingUpdates.length === 1) {
      requestAnimationFrame(() => {
        CTFramework.ProcessUpdates();
      });
    }
  }

  static ScheduleComponentUpdate(component, prevProps = component.props, prevState = component.state, force = false) {
    if (!component?.vnode || component.__disposed) {
      return;
    }

    if (!CTFramework.queuedComponentUpdates.has(component)) {
      CTFramework.queuedComponentUpdates.set(component, { prevProps, prevState, force });
      CTFramework.ScheduleUpdate(() => {
        const queuedUpdate = CTFramework.queuedComponentUpdates.get(component);

        CTFramework.queuedComponentUpdates.delete(component);

        if (!queuedUpdate) {
          return;
        }

        CTFramework.Rerender(component, queuedUpdate.prevProps, queuedUpdate.prevState, queuedUpdate.force);
      });

      return;
    }

    const queuedUpdate = CTFramework.queuedComponentUpdates.get(component);

    if (!queuedUpdate) {
      return;
    }

    queuedUpdate.prevProps ??= prevProps;
    queuedUpdate.prevState ??= prevState;
    queuedUpdate.force ||= force;
  }

  static ProcessUpdates() {
    while (CTFramework.pendingUpdates.length) {
      const updateFunction = CTFramework.pendingUpdates.shift();
      updateFunction && updateFunction();
    }
  }

  static ShouldUpdate(component, prevProps, prevState, force = false) {
    const nextProps = component.props;
    const nextState = component.state;
    component.props = prevProps;
    component.state = prevState;
    try {
      return force || component.ShouldComponentUpdate(nextProps, nextState);
    } finally {
      component.props = nextProps;
      component.state = nextState;
    }
  }

  static Rerender(component, prevProps = component.props, prevState = component.state, force = false) {
    if (!component.vnode || component.__disposed) {
      return;
    }

    try {
      const oldVNode = component.vnode;

      if (!CTFramework.ShouldUpdate(component, prevProps, prevState, force)) {
        return;
      }

      const newVNode = NormalizeNode(component.Render());
      const updatedDom = CTFramework.UpdateDom(oldVNode, newVNode);

      if (updatedDom !== oldVNode.dom && oldVNode.dom?.parentNode) {
        oldVNode.dom.parentNode.replaceChild(updatedDom, oldVNode.dom);
        if (newVNode.__ctMountMode === "subtree") CTFramework.OnMountSubtree(newVNode);
        else CTFramework.OnMount(newVNode);
      }

      component.vnode = newVNode;
      if (component.__hostVNode?.component === component) {
        component.__hostVNode.renderedVNode = newVNode;
        component.__hostVNode.dom = updatedDom;
      }

      if (component.__container?.__ctRootComponent === component) {
        component.__container.__ctRootVNode = newVNode;
      }
      component.ComponentOnUpdate(prevProps, prevState);
    } catch (error) {
      CTFramework.RenderErrorFallback(component, error);
    }
  }

  static RenderErrorFallback(component, error) {
    try {
      component.ComponentOnCatch(error, { component: component.constructor.name });
    } catch {
      // The framework fallback still renders if an application's error hook fails.
    }

    const fallback = CTFramework.CreateErrorFallbackDom(error);
    const oldDom = component.vnode?.dom;

    const canReplaceOldDom = oldDom?.parentNode && (!component.__container || oldDom.parentNode === component.__container);

    if (canReplaceOldDom) {
      CTFramework.OnUnmount(component.vnode);
      oldDom.parentNode.replaceChild(fallback, oldDom);
    } else if (component.__container) {
      CTFramework.OnUnmount(component.vnode);
      component.__container.textContent = "";
      component.__container.appendChild(fallback);
    } else {
      CTFramework.OnUnmount(component.vnode);
    }

    const fallbackVNode = { tag: "ct-error", props: {}, children: [], dom: fallback };
    component.vnode = fallbackVNode;

    if (component.__hostVNode?.component === component) {
      component.__hostVNode.renderedVNode = fallbackVNode;
      component.__hostVNode.dom = fallback;
    }

    if (component.__container?.__ctRootComponent === component) {
      component.__container.__ctRootVNode = fallbackVNode;
    }

    return fallback;
  }

  static CreateErrorFallbackDom(error) {
    const section = document.createElement("section");
    section.className = "ct-fallback ct-fallback-error";
    section.setAttribute("role", "alert");

    const eyebrow = document.createElement("p");
    eyebrow.className = "ct-eyebrow";
    eyebrow.textContent = "CTFramework";

    const title = document.createElement("h1");
    title.textContent = "Something unexpected happened";

    const message = document.createElement("p");
    message.className = "ct-muted";
    message.textContent = "The current view could not be rendered. You can reload the page and continue working.";

    const detail = document.createElement("pre");
    detail.className = "ct-code-snippet";
    detail.textContent = error instanceof Error ? error.message : String(error);

    const reload = document.createElement("button");
    reload.type = "button";
    reload.textContent = "Reload page";
    reload.addEventListener("click", () => window.location.reload());

    section.append(eyebrow, title, message, detail, reload);
    return section;
  }

  static CreateDom(vnode) {
    delete vnode.__ctUnmounted;
    if (IsTextNode(vnode)) {
      const textNode = document.createTextNode(vnode.props.nodeValue);
      vnode.dom = textNode;
      return textNode;
    }

    if (IsTemplateVNode(vnode)) {
      return CTFramework.CreateTemplateDom(vnode);
    }

    if (IsFunctionalComponent(vnode.tag)) {
      const renderedVNode = NormalizeNode(vnode.tag({ ...vnode.props, children: vnode.children }));
      vnode.renderedVNode = renderedVNode;

      const dom = CTFramework.CreateDom(renderedVNode);
      vnode.dom = dom;

      return dom;
    }

    if (IsClassComponent(vnode.tag)) {
      const ComponentClass = vnode.tag;
      const component = vnode.component ?? new ComponentClass({ ...(vnode.props || {}), children: vnode.children });
      component.props = { ...(vnode.props || {}), children: vnode.children };
      component.__disposed = false;
      vnode.component = component;
      component.__hostVNode = vnode;

      try {
        const renderedVNode = NormalizeNode(component.Render());
        vnode.renderedVNode = renderedVNode;
        component.vnode = renderedVNode;
        const dom = CTFramework.CreateDom(renderedVNode);
        vnode.dom = dom;
        return dom;
      } catch (error) {
        return CTFramework.RenderErrorFallback(component, error);
      }
    }

    const element = document.createElement(vnode.tag);
    vnode.dom = element;

    CTFramework.UpdateDomProperties(element, {}, vnode.props);

    (vnode.children || []).forEach((child) => {
      element.appendChild(CTFramework.CreateDom(child));
    });

    return element;
  }

  static UpdateDom(oldVNode, newVNode) {
    if (oldVNode.tag !== newVNode.tag || oldVNode.key !== newVNode.key) {
      const newDom = CTFramework.CreateDom(newVNode);
      newVNode.__ctMountMode = "self";
      CTFramework.OnUnmount(oldVNode);
      return newDom;
    }
    if (IsTemplateVNode(oldVNode) || IsTemplateVNode(newVNode)) {
      if (IsTemplateVNode(oldVNode) && IsTemplateVNode(newVNode)) {
        return CTFramework.UpdateTemplateDom(oldVNode, newVNode);
      }

      const newDom = CTFramework.CreateDom(newVNode);
      newVNode.__ctMountMode = "self";
      CTFramework.OnUnmount(oldVNode);
      return newDom;
    }

    if (IsTextNode(oldVNode) && IsTextNode(newVNode)) {
      const textNode = oldVNode.dom;
      newVNode.dom = textNode;

      if (textNode.nodeValue !== newVNode.props.nodeValue) {
        textNode.nodeValue = newVNode.props.nodeValue;
      }

      return textNode;
    }

    if (oldVNode.isStatic) {
      newVNode.dom = oldVNode.dom;
      newVNode.component = oldVNode.component;
      newVNode.renderedVNode = oldVNode.renderedVNode;
      return newVNode.dom;
    }

    if (IsFunctionalComponent(newVNode.tag)) {
      return CTFramework.UpdateFunctionalComponent(oldVNode, newVNode);
    }

    if (IsClassComponent(newVNode.tag)) {
      return CTFramework.UpdateClassComponent(oldVNode, newVNode);
    }

    const dom = oldVNode.dom;
    newVNode.dom = dom;

    CTFramework.UpdateDomProperties(dom, oldVNode.props || {}, newVNode.props || {});
    CTFramework.UpdateChildren(dom, oldVNode.children || [], newVNode.children || []);

    return dom;
  }

  static UpdateFunctionalComponent(oldVNode, newVNode) {
    const oldRenderedVNode = oldVNode.renderedVNode;
    const newRenderedVNode = NormalizeNode(newVNode.tag({ ...newVNode.props, children: newVNode.children }));
    const updatedDom = CTFramework.UpdateDom(oldRenderedVNode, newRenderedVNode);

    newVNode.renderedVNode = newRenderedVNode;
    newVNode.dom = updatedDom;
    newVNode.__ctMountMode = "subtree";

    return updatedDom;
  }

  static UpdateClassComponent(oldVNode, newVNode) {
    const component = oldVNode.component;
    const queuedUpdate = CTFramework.queuedComponentUpdates.get(component);
    CTFramework.queuedComponentUpdates.delete(component);
    const prevProps = queuedUpdate?.prevProps ?? component.props;
    const prevState = queuedUpdate?.prevState ?? CloneState(component.state);

    component.props = { ...(newVNode.props || {}), children: newVNode.children };
    newVNode.component = component;
    component.__hostVNode = newVNode;
    newVNode.renderedVNode = oldVNode.renderedVNode;
    newVNode.dom = oldVNode.dom;

    try {
      if (!CTFramework.ShouldUpdate(component, prevProps, prevState, queuedUpdate?.force)) {
        component.vnode = oldVNode.renderedVNode;
        return oldVNode.dom;
      }

      const oldRenderedVNode = oldVNode.renderedVNode;
      const newRenderedVNode = NormalizeNode(component.Render());
      const updatedDom = CTFramework.UpdateDom(oldRenderedVNode, newRenderedVNode);

      newVNode.renderedVNode = newRenderedVNode;
      newVNode.dom = updatedDom;
      newVNode.__ctMountMode = "subtree";
      component.vnode = newRenderedVNode;
      component.ComponentOnUpdate(prevProps, prevState);

      return updatedDom;
    } catch (error) {
      return CTFramework.RenderErrorFallback(component, error);
    }
  }

  static ValidateKeys(children) {
    const keys = new Set();
    for (const child of children) {
      if (child.key === null || child.key === undefined) continue;
      if (keys.has(child.key)) throw new Error(`Duplicate child key: ${child.key}`);
      keys.add(child.key);
    }
  }

  static UpdateChildren(dom, oldChildren, newChildren, anchor = null) {
    CTFramework.ValidateKeys(newChildren);
    const keyed = new Map();
    const unkeyed = [];
    for (const child of oldChildren) {
      if (child.key !== null && child.key !== undefined) keyed.set(child.key, child);
      else unkeyed.push(child);
    }
    const remaining = new Set(oldChildren);
    let unkeyedIndex = 0;

    for (const child of newChildren) {
      const oldChild = child.key !== null && child.key !== undefined
        ? keyed.get(child.key) : unkeyed[unkeyedIndex++];
      if (oldChild) {
        remaining.delete(oldChild);
        const oldDom = oldChild.dom;
        const nextDom = CTFramework.UpdateDom(oldChild, child);
        if (nextDom !== oldDom) {
          if (oldDom?.parentNode === dom) dom.replaceChild(nextDom, oldDom);
          else if (nextDom.parentNode !== dom) dom.insertBefore(nextDom, anchor);
          if (child.__ctMountMode === "subtree") CTFramework.OnMountSubtree(child);
          else CTFramework.OnMount(child);
        }
      } else {
        dom.insertBefore(CTFramework.CreateDom(child), anchor);
        CTFramework.OnMount(child);
      }
      delete child.__ctMountMode;
    }

    for (const child of remaining) {
      CTFramework.OnUnmount(child);
      if (child.dom?.parentNode === dom) dom.removeChild(child.dom);
    }
    // Work backwards from the slot anchor so adjacent static content and other
    // slots stay in place. Move existing nodes without remounting components.
    let reference = anchor;
    for (let index = newChildren.length - 1; index >= 0; index--) {
      const node = newChildren[index].dom;
      if (node.nextSibling !== reference || node.parentNode !== dom) dom.insertBefore(node, reference);
      reference = node;
    }
  }

  static UpdateDomProperties(dom, oldProps = {}, newProps = {}) {
    const propertyChanges = CTFramework.GetPropChanges(oldProps, newProps);

    propertyChanges.forEach(({ name, oldValue, value }) => {
      if (name === "style") {
        CTFramework.UpdateStyle(dom, oldValue, value);
        return;
      }

      if (name.startsWith("on")) {
        CTFramework.UpdateEventHandler(dom, name, value);
        return;
      }

      if (value === undefined || value === null || value === false) {
        CTFramework.RemoveDomProperty(dom, name, oldValue);
        return;
      }

      CTFramework.SetDomProperty(dom, name, value);
    });
  }

  static GetPropChanges(oldProps = {}, newProps = {}) {
    const changes = [];
    const propertyNames = new Set([...Object.keys(oldProps), ...Object.keys(newProps)]);

    propertyNames.forEach((name) => {
      if (name === "key" || name === "children") {
        return;
      }

      if (oldProps[name] !== newProps[name]) {
        changes.push({
          name,
          oldValue: oldProps[name],
          value: newProps[name]
        });
      }
    });

    return changes;
  }

  static UpdateEventHandler(dom, name, value) {
    const eventType = CTFramework.NormalizeEventType(name.toLowerCase().substring(2));

    if (!CTFramework.supportedEvents.includes(eventType)) {
      return;
    }

    const eventId = CTFramework.EnsureEventId(dom);
    CTFramework.eventHandlers[eventId] ||= {};

    if (typeof value === "function") {
      CTFramework.eventHandlers[eventId][eventType] = value;
    } else if (CTFramework.eventHandlers[eventId]) {
      delete CTFramework.eventHandlers[eventId][eventType];
    }

    if (Object.keys(CTFramework.eventHandlers[eventId]).length === 0) {
      delete CTFramework.eventHandlers[eventId];
      dom.removeAttribute("data-ct-id");
    }
  }

  static EnsureEventId(dom) {
    let eventId = dom.getAttribute("data-ct-id");

    if (!eventId) {
      eventId = Guid();
      dom.setAttribute("data-ct-id", eventId);
    }

    return eventId;
  }

  static NormalizeEventType(eventType) {
    if (eventType === "focus") {
      return "focusin";
    }

    if (eventType === "blur") {
      return "focusout";
    }

    return eventType;
  }

  static SetDomProperty(dom, name, value) {
    if (name === "className") {
      dom.setAttribute("class", value);
      return;
    }

    if (name === "htmlFor") {
      dom.setAttribute("for", value);
      return;
    }

    if (name === "value") {
      dom.value = value ?? "";
      return;
    }

    if (name === "checked") {
      dom.checked = Boolean(value);
      return;
    }

    if (typeof value === "boolean") {
      if (value) {
        dom.setAttribute(name, "");
      } else {
        dom.removeAttribute(name);
      }

      return;
    }

    if (name in dom && name !== "list") {
      dom[name] = value;
      return;
    }

    dom.setAttribute(name, value);
  }

  static RemoveDomProperty(dom, name, oldValue) {
    if (name === "className") {
      dom.removeAttribute("class");
      return;
    }

    if (name === "htmlFor") {
      dom.removeAttribute("for");
      return;
    }

    if (name === "value") {
      dom.value = "";
      return;
    }

    if (name === "checked") {
      dom.checked = false;
      return;
    }

    if (name in dom && typeof oldValue !== "string" && typeof oldValue !== "object") {
      try {
        dom[name] = "";
      } catch {
        // Some native properties are read-only; their attribute can still be removed.
      }
    }

    // Reflected property setters may recreate an empty attribute.
    dom.removeAttribute(name);
  }

  static UpdateStyle(dom, oldStyle = {}, newStyle = {}) {
    if (typeof oldStyle === "string" || typeof newStyle === "string") {
      dom.setAttribute("style", newStyle || "");
      return;
    }

    Object.keys(oldStyle || {}).forEach((key) => {
      if (!(key in (newStyle || {}))) {
        dom.style[key] = "";
      }
    });

    Object.keys(newStyle || {}).forEach((key) => {
      if (oldStyle?.[key] !== newStyle[key]) {
        dom.style[key] = newStyle[key];
      }
    });
  }

  static CreateTemplateDom(vnode) {
    const { strings, values } = vnode.props;
    const template = document.createElement("template");
    let markup = "";

    strings.forEach((string, index) => {
      markup += string;

      if (index >= values.length) {
        return;
      }

      const value = values[index];

      if (IsTemplateMarker(value, "event")) {
        markup += `data-ct-template-event-${index}=""`;
        return;
      }

      if (IsTemplateMarker(value, "attribute")) {
        markup += `data-ct-template-attribute-${index}=""`;
        return;
      }

      markup += `<!--ct-slot-${index}-->`;
    });

    template.innerHTML = markup;

    const roots = Array.from(template.content.childNodes).filter(
      (node) => node.nodeType !== Node.TEXT_NODE || node.textContent.trim()
    );

    if (roots.length !== 1 || roots[0].nodeType !== Node.ELEMENT_NODE) {
      throw new Error(`CT.Html requires one root HTML element. Received: ${markup.trim()}`);
    }

    const root = roots[0];
    vnode.dom = root;
    vnode.templateChildren = [];
    vnode.templateSlots = [];
    vnode.templateBindingElements = [root, ...root.querySelectorAll("*")].filter((element) => {
      return Array.from(element.attributes).some((attribute) => attribute.name.startsWith("data-ct-template-"));
    });

    const slotWalker = document.createTreeWalker(root, NodeFilter.SHOW_COMMENT);
    const slots = [];
    let slot = slotWalker.nextNode();

    while (slot) {
      const slotMatch = slot.nodeValue?.match(/^ct-slot-(\d+)$/);

      if (slotMatch) {
        slots.push({ index: Number(slotMatch[1]), node: slot });
      }

      slot = slotWalker.nextNode();
    }

    slots.forEach(({ index, node }) => {
      const value = values[index];
      const children = NormalizeNodes([value]);
      CTFramework.ValidateKeys(children);
      const fragment = document.createDocumentFragment();

      children.forEach((child) => {
        const dom = CTFramework.CreateDom(child);
        vnode.templateChildren.push(child);
        fragment.appendChild(dom);
      });

      node.parentNode.insertBefore(fragment, node);
      vnode.templateSlots.push({ index, node, children });
    });

    // Select values depend on option children being present first.
    CTFramework.UpdateTemplateBindings(vnode.templateBindingElements, values);

    return root;
  }

  static UpdateTemplateDom(oldVNode, newVNode) {
    if (!CTFramework.TemplatesMatch(oldVNode, newVNode) || !oldVNode.templateSlots) {
      const newDom = CTFramework.CreateTemplateDom(newVNode);
      CTFramework.OnUnmount(oldVNode);
      newVNode.__ctMountMode = "self";
      return newDom;
    }

    const dom = oldVNode.dom;
    newVNode.dom = dom;
    newVNode.templateChildren = [];
    newVNode.templateSlots = [];
    newVNode.templateBindingElements = oldVNode.templateBindingElements;

    oldVNode.templateSlots.forEach((oldSlot) => {
      const children = NormalizeNodes([newVNode.props.values[oldSlot.index]]);
      CTFramework.UpdateTemplateSlot(oldSlot, children, newVNode);
      newVNode.templateSlots.push({ index: oldSlot.index, node: oldSlot.node, children });
    });

    CTFramework.UpdateTemplateBindings(newVNode.templateBindingElements, newVNode.props.values, oldVNode.props.values);

    return dom;
  }

  static TemplatesMatch(oldVNode, newVNode) {
    const oldStrings = oldVNode.props.strings;
    const newStrings = newVNode.props.strings;

    return oldStrings.length === newStrings.length && oldStrings.every((value, index) => value === newStrings[index]);
  }

  static UpdateTemplateBindings(elements, values, oldValues = []) {
    elements.forEach((element) => {
      Array.from(element.attributes).forEach((attribute) => {
        const eventMatch = attribute.name.match(/^data-ct-template-event-(\d+)$/);
        const attributeMatch = attribute.name.match(/^data-ct-template-attribute-(\d+)$/);

        if (eventMatch) {
          const index = Number(eventMatch[1]);
          const event = values[index];
          const oldEvent = oldValues[index];
          if (oldEvent && oldEvent.eventType !== event?.eventType) {
            CTFramework.UpdateEventHandler(element, `on${oldEvent.eventType}`, null);
          }
          if (event) CTFramework.UpdateEventHandler(element, `on${event.eventType}`, event.handler);
        }

        if (attributeMatch) {
          const index = Number(attributeMatch[1]);
          const attributeValue = values[index];
          const oldAttribute = oldValues[index];
          if (oldAttribute && oldAttribute.name !== attributeValue?.name) {
            CTFramework.RemoveDomProperty(element, oldAttribute.name, oldAttribute.value);
          }
          if (!attributeValue) return;
          const { name, value } = attributeValue;
          if (name === "style") CTFramework.UpdateStyle(element, oldAttribute?.value, value);
          else if (value === undefined || value === null || value === false) {
            CTFramework.RemoveDomProperty(element, name, oldAttribute?.value);
          } else CTFramework.SetDomProperty(element, name, value);
        }
      });
    });
  }

  static UpdateTemplateSlot(oldSlot, newChildren, newVNode) {
    CTFramework.UpdateChildren(oldSlot.node.parentNode, oldSlot.children, newChildren, oldSlot.node);
    newVNode.templateChildren.push(...newChildren);
  }

  static OnMount(vnode) {
    if (!vnode) {
      return;
    }

    if (IsClassComponent(vnode.tag)) {
      vnode.component?.ComponentOnMount();
      CTFramework.OnMount(vnode.renderedVNode);
      return;
    }

    if (IsFunctionalComponent(vnode.tag)) {
      CTFramework.OnMount(vnode.renderedVNode);
      return;
    }

    if (IsTextNode(vnode)) {
      return;
    }

    if (IsTemplateVNode(vnode)) {
      (vnode.templateChildren || []).forEach((child) => CTFramework.OnMount(child));
      return;
    }

    (vnode.children || []).forEach((child) => {
      CTFramework.OnMount(child);
    });
  }

  static OnUnmount(vnode) {
    if (!vnode || vnode.__ctUnmounted) {
      return;
    }
    vnode.__ctUnmounted = true;

    if (IsClassComponent(vnode.tag)) {
      CTFramework.DisposeComponent(vnode.component);
      CTFramework.OnUnmount(vnode.renderedVNode);
      vnode.component?.ComponentOnUnmount();
      return;
    }

    if (IsFunctionalComponent(vnode.tag)) {
      CTFramework.OnUnmount(vnode.renderedVNode);
      return;
    }

    if (IsTextNode(vnode)) {
      return;
    }

    if (IsTemplateVNode(vnode)) {
      (vnode.templateChildren || []).forEach((child) => CTFramework.OnUnmount(child));
      CTFramework.ClearTemplateEventHandlers(vnode.dom);
      return;
    }

    (vnode.children || []).forEach((child) => {
      CTFramework.OnUnmount(child);
    });

    if (vnode.dom instanceof Element) {
      const eventId = vnode.dom.getAttribute("data-ct-id");

      if (eventId && CTFramework.eventHandlers[eventId]) {
        delete CTFramework.eventHandlers[eventId];
      }
    }
  }

  static OnMountSubtree(vnode) {
    if (!vnode) {
      return;
    }

    if (IsClassComponent(vnode.tag) || IsFunctionalComponent(vnode.tag)) {
      CTFramework.OnMount(vnode.renderedVNode);
      return;
    }

    if (IsTextNode(vnode)) {
      return;
    }

    if (IsTemplateVNode(vnode)) {
      (vnode.templateChildren || []).forEach((child) => CTFramework.OnMount(child));
      return;
    }

    (vnode.children || []).forEach((child) => {
      CTFramework.OnMount(child);
    });
  }

  static DisposeComponent(component) {
    if (!component) return;
    component.__disposed = true;
    CTFramework.queuedComponentUpdates.delete(component);
    component.vnode = null;
    component.__hostVNode = null;
    component.__container = null;
  }

  static CreateDelegatedEvent(event, currentTarget) {
    return new Proxy(event, {
      get: (target, property) => {
        if (property === "currentTarget") return currentTarget;
        const value = Reflect.get(target, property, target);
        return typeof value === "function" ? value.bind(target) : value;
      },
      set: (target, property, value) => Reflect.set(target, property, value, target)
    });
  }

  static InitializeEventDelegation() {
    if (CTFramework.isEventDelegationReady) {
      return;
    }

    CTFramework.supportedEvents.forEach((eventType) => {
      document.addEventListener(eventType, (event) => {
        let target = event.target instanceof Element ? event.target : event.target?.parentElement;

        while (target instanceof Element) {
          const eventId = target.getAttribute("data-ct-id");
          const handler = eventId ? CTFramework.eventHandlers[eventId]?.[event.type] : null;

          if (handler) {
            handler(CTFramework.CreateDelegatedEvent(event, target));

            if (event.cancelBubble) {
              return;
            }
          }

          target = target.parentElement;
        }
      });
    });

    CTFramework.isEventDelegationReady = true;
  }

  static ClearTemplateEventHandlers(root) {
    if (!root?.querySelectorAll) {
      return;
    }

    [root, ...root.querySelectorAll("[data-ct-id]")].forEach((element) => {
      const eventId = element.getAttribute?.("data-ct-id");

      if (eventId) {
        delete CTFramework.eventHandlers[eventId];
      }
    });
  }

  static Find(selector, scope = document) {
    const root = CTFramework.ResolveTarget(scope);
    return root?.querySelector ? root.querySelector(selector) : null;
  }

  static FindAll(selector, scope = document) {
    const root = CTFramework.ResolveTarget(scope);
    return root?.querySelectorAll ? Array.from(root.querySelectorAll(selector)) : [];
  }

  static Closest(element, selector) {
    const target = CTFramework.ResolveElement(element);
    return target?.closest ? target.closest(selector) : null;
  }

  static Ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
      return;
    }

    callback();
  }

  static On(target, eventType, selectorOrHandler, handler) {
    const resolvedTarget = CTFramework.ResolveTarget(target);

    if (!resolvedTarget?.addEventListener) {
      return () => {};
    }

    if (typeof selectorOrHandler === "function") {
      resolvedTarget.addEventListener(eventType, selectorOrHandler);
      return () => {
        resolvedTarget.removeEventListener(eventType, selectorOrHandler);
      };
    }

    const delegatedHandler = (event) => {
      const matchedElement = event.target instanceof Element ? event.target.closest(selectorOrHandler) : null;

      if (!matchedElement) {
        return;
      }

      if (
        resolvedTarget !== document &&
        resolvedTarget !== window &&
        !resolvedTarget.contains(matchedElement)
      ) {
        return;
      }

      handler.call(matchedElement, event, matchedElement);
    };

    resolvedTarget.addEventListener(eventType, delegatedHandler);

    return () => {
      resolvedTarget.removeEventListener(eventType, delegatedHandler);
    };
  }

  static Off(target, eventType, handler, options) {
    const resolvedTarget = CTFramework.ResolveTarget(target);

    if (!resolvedTarget?.removeEventListener) {
      return;
    }

    resolvedTarget.removeEventListener(eventType, handler, options);
  }

  static Html(element, value) {
    const target = CTFramework.ResolveElement(element);

    if (!target) {
      return value === undefined ? "" : null;
    }

    if (value === undefined) {
      return target.innerHTML;
    }

    target.innerHTML = value ?? "";
    return target;
  }

  static Text(element, value) {
    const target = CTFramework.ResolveElement(element);

    if (!target) {
      return value === undefined ? "" : null;
    }

    if (value === undefined) {
      return target.textContent || "";
    }

    target.textContent = value ?? "";
    return target;
  }

  static Attr(element, name, value) {
    const target = CTFramework.ResolveElement(element);

    if (!target) {
      return value === undefined ? null : null;
    }

    if (value === undefined) {
      return target.getAttribute(name);
    }

    if (value === null || value === false) {
      target.removeAttribute(name);
      return target;
    }

    target.setAttribute(name, value === true ? "" : String(value));
    return target;
  }

  static Data(element, name, value) {
    const target = CTFramework.ResolveElement(element);

    if (!target) {
      return value === undefined ? undefined : null;
    }

    const dataKey = String(name).replace(/-([a-z])/g, (_, character) => character.toUpperCase());

    if (value === undefined) {
      return target.dataset[dataKey];
    }

    if (value === null) {
      delete target.dataset[dataKey];
      return target;
    }

    target.dataset[dataKey] = String(value);
    return target;
  }

  static Css(element, propertyOrStyles, value) {
    const target = CTFramework.ResolveElement(element);

    if (!target) {
      return value === undefined ? "" : null;
    }

    if (typeof propertyOrStyles === "string") {
      if (value === undefined) {
        if (propertyOrStyles.includes("-")) {
          return getComputedStyle(target).getPropertyValue(propertyOrStyles);
        }

        return target.style[propertyOrStyles] || getComputedStyle(target)[propertyOrStyles];
      }

      if (propertyOrStyles.includes("-")) {
        target.style.setProperty(propertyOrStyles, value ?? "");
      } else {
        target.style[propertyOrStyles] = value ?? "";
      }

      return target;
    }

    Object.keys(propertyOrStyles || {}).forEach((key) => {
      const styleValue = propertyOrStyles[key];

      if (key.includes("-")) {
        target.style.setProperty(key, styleValue ?? "");
      } else {
        target.style[key] = styleValue ?? "";
      }
    });

    return target;
  }

  static AddClass(element, className) {
    const target = CTFramework.ResolveElement(element);

    if (!target) {
      return null;
    }

    CTFramework.SplitClassNames(className).forEach((name) => {
      target.classList.add(name);
    });

    return target;
  }

  static RemoveClass(element, className) {
    const target = CTFramework.ResolveElement(element);

    if (!target) {
      return null;
    }

    CTFramework.SplitClassNames(className).forEach((name) => {
      target.classList.remove(name);
    });

    return target;
  }

  static ToggleClass(element, className, force) {
    const target = CTFramework.ResolveElement(element);

    if (!target) {
      return null;
    }

    CTFramework.SplitClassNames(className).forEach((name) => {
      if (force === undefined) {
        target.classList.toggle(name);
      } else {
        target.classList.toggle(name, force);
      }
    });

    return target;
  }

  static HasClass(element, className) {
    const target = CTFramework.ResolveElement(element);

    if (!target) {
      return false;
    }

    return target.classList.contains(className);
  }

  static Remove(element) {
    const target = CTFramework.ResolveElement(element);

    if (!target?.parentNode) {
      return null;
    }

    target.parentNode.removeChild(target);
    return target;
  }

  static ResolveTarget(target) {
    if (typeof target === "string") {
      return document.querySelector(target);
    }

    return target || null;
  }

  static ResolveElements(target, scope = document) {
    if (typeof target === "string") {
      return CTFramework.FindAll(target, scope);
    }

    if (target?.nodeType) {
      return [target];
    }

    if (target && typeof target[Symbol.iterator] === "function") {
      return Array.from(target).filter((element) => element?.nodeType);
    }

    return [];
  }

  static ResolveElement(target) {
    const resolvedTarget = CTFramework.ResolveTarget(target);
    return resolvedTarget instanceof Element ? resolvedTarget : null;
  }

  static SplitClassNames(className) {
    return String(className || "")
      .split(/\s+/)
      .map((value) => value.trim())
      .filter(Boolean);
  }

  static EnsureDefaultStyles() {
    if (typeof document === "undefined" || document.getElementById(CTFramework.DefaultStylesId)) {
      return;
    }

    const stylesheet = document.createElement("link");
    stylesheet.id = CTFramework.DefaultStylesId;
    stylesheet.rel = "stylesheet";
    stylesheet.href = CTFramework.DefaultStylesUrl || new URL("./styles/Default.css", import.meta.url).href;
    document.head.appendChild(stylesheet);
  }
}

export const CT = (target, scope) => {
  if (typeof target === "function") {
    CT.Ready(target);
    return;
  }

  return CT.CreateSelection(target, scope);
};

CT.CreateSelection = (target, scope) => new CTSelection(target, scope);
CT.Html = CreateTemplate;
CT.On = (eventType, handler) => ({ __ctTemplateMarker: "event", eventType, handler });
CT.Attr = (name, value) => ({ __ctTemplateMarker: "attribute", name, value });
CT.Ready = (callback) => CTFramework.Ready(callback);
CT.Mount = (component, container, props = {}) => {
  const componentInstance =
    typeof component === "function" && component.prototype instanceof Component
      ? new component(props)
      : component;

  return CTFramework.Render(componentInstance, container);
};
CT.Unmount = (container) => CTFramework.Unmount(CTFramework.ResolveTarget(container));
