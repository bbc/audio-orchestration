export default class Loader {
  constructor(responseType) {
    this.__responseType = responseType || 'arraybuffer';
  }

  load(urls) {
    if (urls instanceof Array) {
      return this.__loadAll(urls);
    } else {
      return this.__loadOne(urls);
    }
  }

  __loadOne(url) {
    return this.__request(url);
  }

  __loadAll(urls) {
    return Promise.all(urls.map((url) => {
      return this.__loadOne(url);
    }));
  }

  __request(urls) {
    return new Promise(
      (resolve, reject) => {
        var request = new XMLHttpRequest();
        request.open('GET', urls, true);
        request.responseType = this.__responseType;

        request.addEventListener('load', function() {
          // Any correct response will enter this method including 403
          // (Forbidden), 404 (Not Found) etc. The only responses that
          // indicate true success are 200 (OK) and 304 (Not Modified).
          if (this.status === 200 || this.status === 304) {
            resolve(request.response);
          } else {
            reject(new Error(this.statusText));
          }
        });

        request.addEventListener('error', function() {
          // Transport error has occured.
          reject(new Error('Transport Error'));
        });

        request.send();
      }
    );
  }
}
