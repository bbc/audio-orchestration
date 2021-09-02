export const setUnion = (s1, s2) => new Set([...s1, ...s2]);
export const setIntersection = (s1, s2) => new Set([...s1].filter((x) => s2.has(x)));
export const setDifference = (s1, s2) => new Set([...s1].filter((x) => !s2.has(x)));
