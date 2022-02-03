/**
 * Copyright (C) 2022, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */

/**
 * Returns the set of all items present in either of the inputs
 * @param {Set} s1
 * @param {Set} s2
 * @returns {Set}
 */
export const setUnion = (s1, s2) => new Set([...s1, ...s2]);

/**
 * Returns the set of all items present in both of the inputs
 * @param {Set} s1
 * @param {Set} s2
 * @returns {Set}
 */
export const setIntersection = (s1, s2) => new Set([...s1].filter((x) => s2.has(x)));

/**
 * Returns the set of all items present in the first input, but that are not in the second.
 * @param {Set} s1
 * @param {Set} s2
 * @returns {Set}
 */
export const setDifference = (s1, s2) => new Set([...s1].filter((x) => !s2.has(x)));
