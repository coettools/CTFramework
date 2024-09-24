import { VNode } from "./types";
export declare class Component<P = {}, S = {}> {
    state: S;
    props: P;
    vnode: VNode | null;
    constructor(props: P);
    setState(newState: Partial<S>): void;
    shouldComponentUpdate(nextProps: P, nextState: S): boolean;
    render(): VNode;
    componentOnMount(): void;
    componentOnUpdate(prevProps: P, prevState: S): void;
    componentOnUnmount(): void;
    componentOnCatch(error: any, info: any): void;
}
export declare function memo<P, S>(ComponentClass: new (props: P) => Component<P, S>): new (props: P) => Component<P, S>;
