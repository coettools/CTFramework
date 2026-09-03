import { CTFramework } from "../CTFramework.js";
import { CloneState } from "../html/RenderNodes.js";

export class Component {
  constructor(props = {}) {
    this.props = props;
    this.state = {};
    this.vnode = null;
  }

  SetState(newState) {
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

    Promise.resolve().then(() => {
      CTFramework.ScheduleComponentUpdate(this, prevProps, prevState);
    });
  }

  ForceUpdate() {
    const prevProps = this.props;
    const prevState = CloneState(this.state);

    Promise.resolve().then(() => {
      CTFramework.ScheduleUpdate(() => {
        CTFramework.Rerender(this, prevProps, prevState);
      });
    });
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
