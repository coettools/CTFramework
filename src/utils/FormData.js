export const GetFormValues = (formElement) => {
  const values = {};
  const formData = new FormData(formElement);

  for (const [name, value] of formData.entries()) {
    if (!Object.hasOwn(values, name)) {
      Object.defineProperty(values, name, { value, writable: true, enumerable: true, configurable: true });
      continue;
    }

    if (!Array.isArray(values[name])) {
      values[name] = [values[name]];
    }

    values[name].push(value);
  }

  return values;
};
