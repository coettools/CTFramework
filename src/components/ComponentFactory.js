export const CreateComponent = (component, props = {}) => {
  return {
    tag: component,
    props,
    children: [],
    key: props.Key ?? null,
    dom: null
  };
};
