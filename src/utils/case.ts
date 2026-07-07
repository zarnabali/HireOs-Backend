function toSnakeKey(key: string) {
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

export function toSnakeCaseObject<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => toSnakeCaseObject(item)) as T;
  }

  if (!value || typeof value !== 'object' || value instanceof Date) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entryValue]) => [toSnakeKey(key), toSnakeCaseObject(entryValue)])
  ) as T;
}
