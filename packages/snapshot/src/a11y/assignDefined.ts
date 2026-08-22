/** Merge defined fields from partial records; returns undefined when nothing was set. */
export function mergeDefinedParts<T extends object>(...parts: T[]): T | undefined {
  const merged = Object.assign({}, ...parts) as T;
  if (Object.keys(merged).length === 0) return undefined;
  return merged;
}

/** Copy `value` onto a new object when it is defined. */
export function withDefinedField<T extends object, K extends keyof T>(
  base: T,
  key: K,
  value: T[K] | undefined,
): T {
  if (value === undefined) return base;
  return { ...base, [key]: value };
}

/** Build an object from key/value pairs, omitting undefined values. */
export function fromDefinedEntries<T extends object>(
  entries: ReadonlyArray<readonly [keyof T, T[keyof T] | undefined]>,
): T {
  const result = {} as T;
  for (const [key, value] of entries) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}
