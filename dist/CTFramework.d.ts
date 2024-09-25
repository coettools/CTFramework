import { Component } from "./Component";
import { VNode } from "./types";
export declare function createElement(tag: string | ((props: any) => VNode) | (new (props: any) => Component<any, any>), props: any, ...children: (VNode | string)[]): VNode;
export declare function Fragment(props: any): VNode[];
export declare class CTFramework {
    static eventHandlers: {
        [key: string]: Function;
    };
    static pendingUpdates: Function[];
    static render<P = {}, S = {}>(component: Component<P, S>, container: HTMLElement): void;
    static scheduleUpdate(updateFn: Function): void;
    static processUpdates(): void;
    static rerender<P = {}, S = {}>(component: Component<P, S>): void;
    static createDom(vnode: VNode | string | number): HTMLElement | Text;
    static updateDom(oldVNode: VNode | string, newVNode: VNode | string): HTMLElement | Text;
    static updateDomProperties(dom: HTMLElement, oldProps?: any, newProps?: any): void;
    static getPropChanges(oldProps: any, newProps: any): {
        name: string;
        value: any;
    }[];
    static updateStyle(dom: HTMLElement, oldStyle?: any, newStyle?: any): void;
    static onMount(vnode: VNode): void;
    static onUnmount(vnode: VNode): void;
}
