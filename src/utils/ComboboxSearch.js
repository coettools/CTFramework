export const IndexOptions = (options) => {
  if (options != null && !Array.isArray(options)) throw new TypeError("Combobox Options must be an array.");
  const entries = [];
  const byValue = new Map();
  const groups = new Map();

  for (const option of options ?? []) {
    const value = typeof option === "string" ? option : option?.Value;
    if (typeof value !== "string" && !Number.isFinite(value)) continue;
    const key = String(value);
    const label = typeof option === "string" ? option : option.Label;
    if (!key.trim() || typeof label !== "string" || !label.trim() || byValue.has(key)) continue;

    const group = String(option.Group ?? "");
    const keywords = Array.isArray(option.Keywords) ? option.Keywords.join(" ") : (option.Keywords ?? "");
    const text = `${label} ${keywords}`.toLowerCase();
    const entry = { option, value, key, label, group, disabled: Boolean(option.Disabled), text, words: text.split(/[^\p{L}\p{M}\p{N}]+/u), index: entries.length };
    entries.push(entry);
    byValue.set(key, entry);
    if (!groups.has(group)) groups.set(group, groups.size);
  }

  return { entries, byValue, groups };
};

export const FindOptions = (index, query, filter, maxVisible = 50, retainedKey = null) => {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const ranks = Array.from({ length: terms.length + 1 }, () => []);
  let total = 0;
  for (const entry of index.entries) {
    let rank = 0;
    if (filter) {
      if (!filter(entry.option, query)) continue;
    } else {
      if (!terms.every((term) => entry.text.includes(term))) continue;
      for (const term of terms) {
        if (entry.words.some((word) => word.startsWith(term))) rank++;
      }
    }

    ranks[rank].push(entry);
    total++;
  }

  const limit = Number.isFinite(maxVisible) && maxVisible >= 1 ? Math.floor(maxVisible) : 50;
  const matches = ranks.reverse().flat();
  const visible = matches.slice(0, limit);
  const retained = index.byValue.get(retainedKey);
  if (limit && retained && !retained.disabled && !visible.includes(retained) && matches.includes(retained)) {
    // On replacement, keep the active descendant in the capped DOM.
    visible[visible.length - 1] = retained;
  }

  const byGroup = new Map();
  for (const entry of visible) {
    if (!byGroup.has(entry.group)) byGroup.set(entry.group, []);
    byGroup.get(entry.group).push(entry);
  }

  const groups = [...byGroup].sort(([first], [second]) => index.groups.get(first) - index.groups.get(second));
  const enabled = groups.flatMap(([, entries]) => entries.filter((entry) => !entry.disabled));

  return { groups, enabled, total, remaining: total - visible.length };
};
