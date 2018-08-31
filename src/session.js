import {
  SESSION_CODE_LENGTH,
  VALIDATE_SESSION_IDS,
  SESSION_ID_URL,
} from './config';

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
 * Depending on the configuration, generates a random code and session-id locally, or requests it
 * from the session-id-service.
 *
 * @returns {Promise<Object>}
 */
export const createSession = () => {
  if (!VALIDATE_SESSION_IDS) {
    return Promise.resolve(generateSessionId());
  }

  return fetch(`${SESSION_ID_URL}/session`, { method: 'POST' })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Failed to create a session on the server.');
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
  if (!VALIDATE_SESSION_IDS) {
    return Promise.resolve(Object.assign({ valid: true }, generateSessionId(sessionCode)));
  }

  return fetch(`${SESSION_ID_URL}/session/${sessionCode}`)
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
