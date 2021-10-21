/**
 * Copyright (C) 2021, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
export const setUnion = (s1, s2) => new Set([...s1, ...s2]);
export const setIntersection = (s1, s2) => new Set([...s1].filter((x) => s2.has(x)));
export const setDifference = (s1, s2) => new Set([...s1].filter((x) => !s2.has(x)));
