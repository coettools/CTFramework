export const Required = (value) => {
  return value !== null && value !== undefined && String(value).trim() !== "";
};

export const MaxLength = (value, length) => {
  return String(value ?? "").length <= length;
};
