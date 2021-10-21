/**
 * Copyright (C) 2021, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import config from 'config';

const generateSessionId = (userSessionCode) => {
  let sessionCode = userSessionCode;
  if (userSessionCode === undefined) {
    const numCheckDigits = config.SESSION_CODE_CHECK_DIGITS;
    const numDigits = config.SESSION_CODE_LENGTH - numCheckDigits;

    const digits = [...Array(numDigits).keys()]
      .map(() => Math.floor(Math.random() * 10));

    // TODO - copied from generate-session-code in session-id-service
    // should be shared module and directly imported
    for (let i = 0; i < numCheckDigits; i += 1) {
      let sum = config.LOCAL_SESSION_CODE_CHECK_DIGIT_OFFSET;
      // offset is 0 in server-generated check sums
      digits.forEach((d) => {
        sum += d;
      });
      digits.push(Math.floor(sum % 10));
    }

    sessionCode = digits.join('');
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

  // parse digits to numbers
  let digits;
  try {
    digits = sessionCode.split('').map((d) => parseInt(d, 10));
  } catch (e) {
    return false;
  }

  // take only the non-check part of the code
  const testDigits = digits.slice(0, numDigits);

  // generate the full code including check digits
  // TODO: copied code again, should be a function
  for (let i = 0; i < numCheckDigits; i += 1) {
    let sum = config.LOCAL_SESSION_CODE_CHECK_DIGIT_OFFSET;
    testDigits.forEach((d) => {
      sum += d;
    });
    testDigits.push(Math.floor(sum % 10));
  }

  // check they are the same
  return testDigits.join('') === sessionCode;
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
