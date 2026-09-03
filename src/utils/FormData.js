export const GetFormValues = (formElement) => {
  const values = {};
  const formData = new FormData(formElement);

  for (const [name, value] of formData.entries()) {
    if (!(name in values)) {
      values[name] = value;
      continue;
    }

    if (!Array.isArray(values[name])) {
      values[name] = [values[name]];
    }

    values[name].push(value);
  }

  return values;
};
