import { Component } from "../components/Component.js";

export const CreateTextNode = (value) => {
  return {
    tag: "text",
    props: { nodeValue: String(value) },
    children: [],
    key: null,
    dom: null
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

    results.push(typeof child === "string" || typeof child === "number" ? CreateTextNode(child) : child);
  }

  return results;
};

export const NormalizeNode = (node) => {
  if (node === null || node === undefined || node === false || node === true) {
    return CreateTextNode("");
  }

  return typeof node === "string" || typeof node === "number" ? CreateTextNode(node) : node;
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
