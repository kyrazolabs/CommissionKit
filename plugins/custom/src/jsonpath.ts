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
  let i = 0;

  while (i < path.length) {
    if (path[i] === ".") {
      i++;
      continue;
    }

    let propName = "";

    if (path[i] === "[" && path[i + 1] === '"') {
      // Bracket-escaped property name: ["prop.with.dots"] or ["prop.with.dots"][0]
      const closeQuote = path.indexOf('"]', i + 2);
      if (closeQuote !== -1) {
        propName = path.slice(i + 2, closeQuote);
        i = closeQuote + 2;
      }
    } else {
      // Regular property name
      let end = i;
      while (end < path.length && path[end] !== "." && path[end] !== "[") {
        end++;
      }
      if (end > i) {
        propName = path.slice(i, end);
      }
      i = end;
    }

    // Check for array index suffix: [0]
    if (i < path.length && path[i] === "[" && path[i + 1] !== '"') {
      const closeBracket = path.indexOf("]", i);
      if (closeBracket !== -1) {
        const bracketContent = path.slice(i + 1, closeBracket);
        const num = Number(bracketContent);
        if (!isNaN(num) && bracketContent === String(num)) {
          propName += `[${num}]`;
          i = closeBracket + 1;
        }
      }
    }

    if (propName) parts.push(propName);
  }

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
