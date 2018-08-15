import { SESSION_CODE_LENGTH } from './config';

const generateSessionId = (userSessionCode) => {
  let sessionCode = userSessionCode;
  if (userSessionCode === undefined) {
    console.warn('Generating random session id, not guaranteed to be unique.');
    sessionCode = [...Array(SESSION_CODE_LENGTH).keys()]
      .map(() => `${Math.floor(Math.random() * 10)}`)
      .join('');
  }

  return {
    sessionCode,
    sessionId: `bbcat-orchestration-${sessionCode}`,
  };
};

/**
 * Request a new session code.
 *
 * This implementation returns a randomly generated code and id.
 *
 * In practice, an API should be used to ensure the codes are unique.
 *
 * @returns {Promise<Object>}
 */
export const createSession = () => Promise.resolve(generateSessionId());

/**
 * Validate a session code and get the corresponding id.
 *
 * This implementation accepts all session codes and locally generates an ID.
 *
 * In practice, an API should be used to ensure the code has previously been registered.
 *
 * @returns {Promise<Object>}
 */
export const validateSession = sessionCode => Promise.resolve(
  Object.assign({ valid: true }, generateSessionId(sessionCode)),
);
