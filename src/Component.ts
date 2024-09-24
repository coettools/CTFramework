import { CTFramework } from "./CTFramework";
import { VNode } from "./types";

// Component class representing a UI component with state and lifecycle management.
export class Component<P = {}, S = {}> {
  state: S;
  props: P;
  vnode: VNode | null = null;

  constructor(props: P) {
    this.props = props;
    this.state = {} as S;
  }

  // Set a new state and schedule a re-render if necessary.
  setState(newState: Partial<S>) {
    const prevState = this.state;
    this.state = { ...this.state, ...newState };

    // Schedule a re-render asynchronously.
    Promise.resolve().then(() => {
      if (this.vnode && this.shouldComponentUpdate(this.props, prevState)) {
        // Use CTFramework's rerender method to update the DOM
        CTFramework.rerender(this);
      }
    });
  }

  // Method to control whether a component should re-render.
  // Override this method in individual components if specific checks are needed.
  shouldComponentUpdate(nextProps: P, nextState: S) {
    return true; // Default behavior is to always re-render.
  }

  // Render method must be implemented by any class extending Component.
  render(): VNode {
    throw new Error(`Render method must be implemented in the component ${this.constructor.name}`);
  }

  // Lifecycle methods, which can be overridden by components.
  componentOnMount() {}
  componentOnUpdate(prevProps: P, prevState: S) {}
  componentOnUnmount() {}
  componentOnCatch(error: any, info: any) {}
}

// Memoization helper function for components.
// It prevents unnecessary re-renders by checking if the props have changed.
export function memo<P, S>(ComponentClass: new (props: P) => Component<P, S>): new (props: P) => Component<P, S> {
  return class MemoizedComponent extends Component<P, S> {
    shouldComponentUpdate(nextProps: P) {
      return shallowCompare(this.props, nextProps); // Use shallow comparison of props to prevent re-rendering.
    }

    // Forward the render method from the original component class
    render(): VNode {
      return new ComponentClass(this.props).render();
    }
  };
}

// A shallow comparison function to check if two objects are different.
function shallowCompare(obj1: any, obj2: any): boolean {
  for (const key in obj1) {
    if (obj1[key] !== obj2[key]) return true;
  }
  return false;
}
