import { Component } from "./Component";

// VNode structure, representing a virtual DOM node.
export type VNode = {
  // tag can now be a string, a functional component, or a class-based component.
  tag: string | ((props: any) => VNode) | (new (props: any) => Component<any, any>);
  props: { [key: string]: any }; // Props for the element or component.
  children: (VNode | string)[]; // Children of this virtual node, either VNodes or text.
  isStatic?: boolean; // Indicates if the component is static (won't update).
  component?: Component<any, any>; // Reference to the associated component, if any.
  dom?: HTMLElement | Text; // Reference to the actual DOM node.
  key?: string; // Optional key for keyed reconciliation.
};
