import { CTFramework } from "../CTFramework.js";
import { CloneState } from "../html/RenderNodes.js";

export class Component {
  constructor(props = {}) {
    this.props = props;
    this.state = {};
    this.vnode = null;
  }

  SetState(newState) {
    if (this.__disposed) return;
    const prevProps = this.props;
    const prevState = CloneState(this.state);
    const nextState = typeof newState === "function" ? newState(CloneState(this.state), this.props) : newState;

    if (nextState === null || nextState === undefined) {
      return;
    }

    if (typeof nextState === "object" && !Array.isArray(nextState)) {
      this.state = { ...this.state, ...nextState };
    } else {
      this.state = nextState;
    }

    CTFramework.ScheduleComponentUpdate(this, prevProps, prevState);
  }

  ForceUpdate() {
    if (this.__disposed) return;
    const prevProps = this.props;
    const prevState = CloneState(this.state);

    CTFramework.ScheduleComponentUpdate(this, prevProps, prevState, true);
  }

  ShouldComponentUpdate(nextProps, nextState) {
    return true;
  }

  Render() {
    throw new Error(`Render method must be implemented in the component ${this.constructor.name}`);
  }

  ComponentOnMount() {}
  ComponentOnUpdate(prevProps, prevState) {}
  ComponentOnUnmount() {}
  ComponentOnCatch(error, info) {}
}
