const Controls = 'button, a[href], input:not([type="hidden"]), select, textarea, summary, [tabindex], [contenteditable]:not([contenteditable="false"])';

export const GetPopoverTrigger = (host) => {
  const target = host.firstElementChild;
  if (host.childElementCount !== 1 || !target.matches(Controls) || target.querySelector(Controls)) return null;
  if (target.matches(':disabled, [hidden], [inert], input[type="hidden"]') || (target.tabIndex < 0 && (target.hasAttribute("tabindex") || !target.isContentEditable))) return null;

  return target;
};

const Write = (target, name, value) => {
  if (value === null) target.removeAttribute(name);
  else target.setAttribute(name, value);
};

const OriginalValue = (current, saved) => {
  if (!saved) return current;
  if (current === saved.applied) return saved.original;
  if (!saved.added || !current) return current;
  const ids = current.split(/\s+/);

  return ids.includes(saved.added) ? ids.filter((id) => id && id !== saved.added).join(" ") || null : current;
};

// Keep author-owned ID references and restore scalar attributes when ownership ends.
export class PopoverTriggerAttributes {
  constructor(target) {
    this.target = target;
    this._attributes = new Map();
  }

  Set(name, value, append = false) {
    const current = this.target.getAttribute(name);
    const saved = this._attributes.get(name);
    const original = OriginalValue(current, saved);
    const ids = append ? (original || "").split(/\s+/).filter(Boolean) : [];
    const applied = append ? [...new Set([...ids, value])].join(" ") : value;
    this._attributes.set(name, { original, applied, added: append && !ids.includes(value) ? value : null });
    if (current !== applied) Write(this.target, name, applied);
  }

  Restore(name) {
    const saved = this._attributes.get(name);
    if (!saved) return;
    const current = this.target.getAttribute(name);
    const original = OriginalValue(current, saved);
    if (current !== original) Write(this.target, name, original);
    this._attributes.delete(name);
  }

  Release() {
    for (const name of this._attributes.keys()) this.Restore(name);
  }
}
