import mockAudio from './../../audio';

// Exports request url-to-response mappings. The responses are of responseType
// arraybuffer where the buffer contains encoded audio.
// mapping.url
//   - The mocked url of the resource.
// mapping.response
//   - The mocked response to a request at the corresponding url.

const mappingSuccess1 = {
  url: 'arraybuffer/success/1',
  response: {
    status: 200,
    contentType: 'audio/mpeg',
    response: mockAudio[0],
  },
}

const mappingSuccess2 = {
  url: 'arraybuffer/success/2',
  response: {
    status: 200,
    contentType: 'audio/mpeg',
    response: mockAudio[1],
  },
}

const mappingSuccess3 = {
  url: 'arraybuffer/success/3',
  response: {
    status: 304,
    contentType: 'audio/mpeg',
    response: mockAudio[2],
  },
}

const mappingError = {
  url: 'arraybuffer/failure',
  response: {
    status: 404,
    contentType: 'text/html; charset=iso-8859-1',
    response: '404 Not Found',
    statusText: '404 Not Found',
  },
}

export default [
  mappingSuccess1,
  mappingSuccess2,
  mappingSuccess3,
  mappingError,
]
