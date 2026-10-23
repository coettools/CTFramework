import { Component } from "../components/Component.js";

export const CreateTextNode = (value) => {
  return {
    tag: "text",
    props: { nodeValue: String(value) },
    children: [],
    key: null,
    dom: null,
  };
};

export const NormalizeNodes = (children, results = []) => {
  for (const child of children) {
    if (Array.isArray(child)) {
      NormalizeNodes(child, results);
      continue;
    }

    if (child === null || child === undefined || child === false || child === true) {
      continue;
    }

    results.push(NormalizeNode(child));
  }

  return results;
};

export const NormalizeNode = (node) => {
  if (node === null || node === undefined || node === false || node === true) {
    return CreateTextNode("");
  }

  if (typeof node === "string" || typeof node === "number") return CreateTextNode(node);
  if (node instanceof Component) {
    throw new TypeError("Use CT.View({ Component: Child, Props }) for a managed child, not a Component instance or a manual Render() call.");
  }
  if (typeof node !== "object" || (typeof node.tag !== "string" && typeof node.tag !== "function")) {
    throw new TypeError("Render and template children must be text or CTFramework views. Use CT.View for a child Component.");
  }

  return node;
};

export const IsTextNode = (node) => node?.tag === "text";
export const IsClassComponent = (tag) => typeof tag === "function" && tag.prototype instanceof Component;
export const IsFunctionalComponent = (tag) => typeof tag === "function" && !IsClassComponent(tag);

export const CloneState = (state) => {
  if (!state || typeof state !== "object") {
    return state;
  }

  return Array.isArray(state) ? state.slice() : { ...state };
};
