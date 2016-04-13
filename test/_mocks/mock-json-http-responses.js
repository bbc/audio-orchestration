export default [{
  url: 'json/success/1',
  response: {
    status: 200,
    contentType: 'application/json',
    response: { success: '1' },
  },
}, {
  url: 'json/success/2',
  response: {
    status: 200,
    contentType: 'application/json',
    response: { success: '2' },
  },
}, {
  url: 'json/success/3',
  response: {
    status: 304,
    contentType: 'application/json',
    response: { success: '3' },
  },
}, {
  url: 'json/failure',
  response: {
    status: 404,
    contentType: 'text/html; charset=iso-8859-1',
    response: '404 Not Found',
    statusText: '404 Not Found',
  },
}]
