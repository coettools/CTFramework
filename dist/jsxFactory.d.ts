import { VNode } from "./types";
/**
 * JSX factory function to convert JSX into VNode objects.
 * Used automatically by TypeScript during JSX compilation.
 *
 * @param tag The HTML tag, functional component, or class-based component.
 * @param props The properties (attributes) to pass to the tag or component.
 * @param children The children of the element or component.
 * @returns A VNode object representing the DOM structure.
 */
export declare function jsx(tag: string | ((props: any) => VNode) | (new (props: any) => any), props: any, ...children: (VNode | string)[]): VNode;
