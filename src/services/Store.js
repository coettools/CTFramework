export class Store {
  constructor(initialState = {}) {
    this.state = initialState;
    this.listeners = new Set();
  }

  GetState() {
    return this.state;
  }

  SetState(newState) {
    const nextState = typeof newState === "function" ? newState(this.state) : newState;

    if (nextState === null || nextState === undefined) {
      return this.state;
    }

    if (typeof nextState === "object" && !Array.isArray(nextState)) {
      this.state = { ...this.state, ...nextState };
    } else {
      this.state = nextState;
    }

    this.Notify();
    return this.state;
  }

  ReplaceState(newState = {}) {
    this.state = newState;
    this.Notify();
    return this.state;
  }

  Subscribe(listener) {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  Notify() {
    this.listeners.forEach((listener) => {
      listener(this.state);
    });
  }

  Destroy() {
    this.listeners.clear();
  }
}
