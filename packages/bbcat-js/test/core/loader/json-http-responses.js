// Exports request url-to-response mappings.
// mapping.url
//   - The mocked url of the resource.
// mapping.response
//   - The mocked response to a request at the corresponding url.

const mappingSuccess1 = {
  url: 'json/success/1',
  response: {
    status: 200,
    contentType: 'application/json',
    response: { success: '1' },
  },
};

const mappingSuccess2 = {
  url: 'json/success/2',
  response: {
    status: 200,
    contentType: 'application/json',
    response: { success: '2' },
  },
};

const mappingSuccess3 = {
  url: 'json/success/3',
  response: {
    status: 304,
    contentType: 'application/json',
    response: { success: '3' },
  },
};

const mappingError = {
  url: 'json/failure',
  response: {
    status: 404,
    contentType: 'text/html; charset=iso-8859-1',
    response: '404 Not Found',
    statusText: '404 Not Found',
  },
};

export default [
  mappingSuccess1,
  mappingSuccess2,
  mappingSuccess3,
  mappingError,
];
