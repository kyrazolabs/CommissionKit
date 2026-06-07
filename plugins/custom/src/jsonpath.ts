export function jsonpathGet(obj: any, path: string): any {
  if (!path || !obj) return undefined;

  const parts = parsePath(path);
  let current = obj;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = resolvePart(current, part);
  }

  return current;
}

function parsePath(path: string): string[] {
  const parts: string[] = [];
  let current = "";
  let depth = 0;

  for (let i = 0; i < path.length; i++) {
    const ch = path[i];

    if (ch === "." && depth === 0) {
      if (current) parts.push(current);
      current = "";
    } else if (ch === "[") {
      depth++;
      current += ch;
    } else if (ch === "]") {
      depth--;
      current += ch;
    } else {
      current += ch;
    }
  }

  if (current) parts.push(current);
  return parts;
}

function resolvePart(obj: any, part: string): any {
  // Array index: items[0]
  const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
  if (arrayMatch) {
    const arr = obj[arrayMatch[1]];
    if (Array.isArray(arr)) return arr[Number(arrayMatch[2])];
    return undefined;
  }

  return obj?.[part];
}
