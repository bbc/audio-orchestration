export default class Loader {
  constructor(responseType) {
    this._responseType = responseType || 'arraybuffer';
  }

  load(urls) {
    return urls instanceof Array ?
      this._loadAll(urls) :
      this._loadOne(urls);
  }

  _loadOne(url) {
    return this._request(url);
  }

  _loadAll(urls) {
    return Promise.all(urls.map(this._loadOne));
  }

  _request(urls) {
    return new Promise(
      (resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open('GET', urls, true);
        request.responseType = this._responseType;

        request.addEventListener('load', function onLoadEvent() {
          // Any correct response will enter this method including 403
          // (Forbidden), 404 (Not Found) etc. The only responses that
          // indicate true success are 200 (OK) and 304 (Not Modified).
          if (this.status === 200 || this.status === 304) {
            resolve(request.response);
          } else {
            reject(new Error(this.statusText));
          }
        });

        request.addEventListener('error', () => {
          // Transport error has occured.
          reject(new Error('Transport error has occured.'));
        });

        request.send();
      }
    );
  }
}
