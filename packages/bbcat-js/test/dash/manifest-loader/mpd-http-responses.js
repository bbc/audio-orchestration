import mockMpds from './../mpds';

// Exports request url-to-response mappings.
// mapping.url
//   - The mocked url of the resource.
// mapping.response
//   - The mocked response to a request at the corresponding url.

const mappingSuccess1 = {
  url: 'mpd/success/1',
  response: {
    status: 200,
    contentType: 'text/xml; charset=iso-8859-1',
    response: mockMpds[0].text,
  },
};

const mappingSuccess2 = {
  url: 'mpd/success/2',
  response: {
    status: 304,
    contentType: 'text/xml; charset=iso-8859-1',
    response: mockMpds[1].text,
  },
};

const mappingError = {
  url: 'mpd/error',
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
  mappingError,
];
