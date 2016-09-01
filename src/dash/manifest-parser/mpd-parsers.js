const SECONDS_IN_YEAR = 365 * 24 * 60 * 60;
const SECONDS_IN_MONTH = 30 * 24 * 60 * 60;
const SECONDS_IN_DAY = 24 * 60 * 60;
const SECONDS_IN_HOUR = 60 * 60;
const SECONDS_IN_MINUTE = 60;

function parseInteger(value) {
  return parseInt(value, 10);
}

function parseDate(value) {
  return value === null || value === undefined ? null : new Date(value);
}

function parsePeriod(value) {
  // Period format: ISO 8601 (https://en.wikipedia.org/wiki/ISO_8601#Durations)
  // Regex to match and tokenize the period string. Human readable breakdown:
  // ^P                         // Prefixed with the identifier P (period.)
  //   (?: (\d+)Y)?             // Optional positive integer followed by Y.
  //   (?: (\d+)M)?             // Optional positive integer followed by M.
  //   (?: (\d+)D)?             // Optional positive integer followed by D.
  // T                          // Seperated by identifier T (time part.)
  //   (?: (\d+)H)?             // Optional positive integer followed by H.
  //   (?: (\d+)M)?             // Optional positive integer followed by M.
  //   (?: (\d+(?: .\d+)?)S)?   // Optional positive float followed by S.
  const regex = /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:.\d+)?)S)?/;
  let seconds = null;

  if (regex.test(value)) {
    const match = regex.exec(value);

    seconds = parseInt(match[1] || 0, 10) * SECONDS_IN_YEAR +
      parseInt(match[2] || 0, 10) * SECONDS_IN_MONTH +
      parseInt(match[3] || 0, 10) * SECONDS_IN_DAY +
      parseInt(match[4] || 0, 10) * SECONDS_IN_HOUR +
      parseInt(match[5] || 0, 10) * SECONDS_IN_MINUTE +
      parseFloat(match[6] || 0);
  } else {
    seconds = parseInt(value, 10);
  }

  return seconds;
}

export default {
  integer: parseInteger,
  date: parseDate,
  period: parsePeriod,
};
