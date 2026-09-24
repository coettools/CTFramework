import { IsClassComponent } from "../html/RenderNodes.js";

export const CreateComponent = (component, props = {}) => {
  return {
    tag: component,
    props,
    children: [],
    key: props.Key ?? null,
    dom: null,
  };
};

export const View = ({ Component, Props = {}, Key = null } = {}) => {
  if (!IsClassComponent(Component)) throw new TypeError("CT.View Component must be a Component class.");
  if (!Props || typeof Props !== "object" || Array.isArray(Props)) {
    throw new TypeError("CT.View Props must be an object.");
  }

  return { ...CreateComponent(Component, Props), key: Key };
};
