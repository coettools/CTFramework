import { Component } from "./Component";
export type VNode = {
    tag: string | ((props: any) => VNode) | (new (props: any) => Component<any, any>);
    props: {
        [key: string]: any;
    };
    children: (VNode | string)[];
    isStatic?: boolean;
    component?: Component<any, any>;
    dom?: HTMLElement | Text;
    key?: string;
};
