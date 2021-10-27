/**
 * Copyright (C) 2021, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import config from 'config';

/**
 * Takes an array of integers 0-9, and returns a new array including the original digits with the
 * additional check digits added to the end.
 *
 * @param {Array<Number>} originalDigits
 * @param {Number} numCheckDigits
 * @param {Number} offset
 */
const addCheckDigits = (originalDigits, numCheckDigits, offset) => {
  // This algorithm creates a simple checksum of all previous digits (including any check digits),
  // adds the constant offset, and calculates the remainder from dividing by 10 so that the result
  // is a single digit integer between 0 and 9.
  const digits = [...originalDigits];
  for (let i = 0; i < numCheckDigits; i += 1) {
    let sum = offset;
    digits.forEach((d) => {
      sum += d;
    });
    digits.push(Math.floor(sum % 10));
  }

  return digits;
};

const generateSessionId = (userSessionCode) => {
  let sessionCode = userSessionCode;
  if (userSessionCode === undefined) {
    const numCheckDigits = config.SESSION_CODE_CHECK_DIGITS;
    const numDigits = config.SESSION_CODE_LENGTH - numCheckDigits;
    const offset = config.LOCAL_SESSION_CODE_CHECK_DIGIT_OFFSET;

    const digits = [...Array(numDigits).keys()]
      .map(() => Math.floor(Math.random() * 10));

    sessionCode = addCheckDigits(digits, numCheckDigits, offset).join('');
  }

  return {
    sessionCode,
    sessionId: `${config.LOCAL_SESSION_ID_PREFIX}-${sessionCode}`,
  };
};

/**
 * Check if the given code is valid as a locally generated session code.
 *
 * @param {string} sessionCode
 */
const isValidLocalSessionCode = (sessionCode) => {
  if (!config.USE_FALLBACK_SESSION_CODES) {
    return false;
  }

  const numCheckDigits = config.SESSION_CODE_CHECK_DIGITS;
  const numDigits = config.SESSION_CODE_LENGTH - numCheckDigits;
  const offset = config.LOCAL_SESSION_CODE_CHECK_DIGIT_OFFSET;

  // parse digits to numbers
  let digits;
  try {
    digits = sessionCode.split('').map((d) => parseInt(d, 10));
  } catch (e) {
    return false;
  }

  // take only the non-check part of the code and regenerate the check digits
  const testDigits = digits.slice(0, numDigits);
  const checkedSessionCode = addCheckDigits(testDigits, numCheckDigits, offset).join('');

  // check they are the same
  return checkedSessionCode === sessionCode;
};

/**
 * Request a new session code.
 *
 * Depending on the configuration, generates a random code and session-id locally, or requests it
 * from the session-id-service.
 *
 * @returns {Promise<Object>}
 */
export const createSession = () => {
  if (!config.VALIDATE_SESSION_IDS) {
    return Promise.resolve(generateSessionId());
  }

  return window.fetch(`${config.SESSION_ID_URL}/session`, { method: 'POST' })
    .then((response) => {
      if (!response.ok) {
        if (config.USE_FALLBACK_SESSION_CODES) {
          return generateSessionId();
        }
        throw new Error('Failed to create a session on the server and local fallback disabled.');
      }

      return response.json();
    })
    .then(({ sessionCode, sessionId }) => ({
      sessionCode,
      sessionId,
    }));
};

/**
 * Validate a session code and get the corresponding id.
 *
 * Depending on configuration, may either accept all session codes and locally generate an ID, or
 * use the session-id-service to validate the session code and return the session id.
 *
 * @returns {Promise<Object>} - { valid, sessionCode, sessionId }
 */
export const validateSession = (sessionCode) => {
  if (!config.VALIDATE_SESSION_IDS) {
    if (!isValidLocalSessionCode(sessionCode)) {
      return Promise.resolve({ valid: false });
    }
    return Promise.resolve({ valid: true, ...generateSessionId(sessionCode) });
  }

  return window.fetch(`${config.SESSION_ID_URL}/session/${sessionCode}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error('Could not validate the session.');
      }

      return response.json();
    })
    .then((result) => {
      if (result.sessionCode !== sessionCode) {
        throw new Error('Could not validate the session code, invalid session code returned.');
      }

      return {
        sessionCode,
        sessionId: result.sessionId,
        valid: !!result.valid,
      };
    });
};
