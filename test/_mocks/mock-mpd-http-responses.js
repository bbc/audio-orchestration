import mockMpds from './mock-mpds';

export default [{
  url: 'mpd/success/1',
  response: {
    status: 200,
    contentType: 'text/xml; charset=iso-8859-1',
    response: mockMpds[0].text,
  },
}, {
  url: 'mpd/success/2',
  response: {
    status: 304,
    contentType: 'text/xml; charset=iso-8859-1',
    response: mockMpds[1].text,
  },
}, {
  url: 'mpd/failure',
  response: {
    status: 404,
    contentType: 'text/html; charset=iso-8859-1',
    response: '404 Not Found',
    statusText: '404 Not Found',
  },
}];
