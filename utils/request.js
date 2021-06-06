const https = require('https');
const http = require('http');
const { Observable } = require('rxjs');
const qs = require('querystring');
const fs = require('fs');

class Request {
  get(url, params = {}) {
    return new Observable(subscriber => {
      const h = url.indexOf('https') === 0 ? https : http;
      const options = url.indexOf('https') === 0 ?
        {
          ca: fs.readFileSync('/var/run/secrets/kubernetes.io/serviceaccount/ca.crt', {encoding: 'utf-8'}),
          headers: {
            'Authorization': `Bearer ${fs.readFileSync('/var/run/secrets/kubernetes.io/serviceaccount/token', {encoding: 'utf-8'})}`,
          }
        } :
        {};
      h.get(`${url}?${qs.stringify(params)}`, options, (res) => {
        const { statusCode } = res;
        if (statusCode < 200 || statusCode > 300) {
          subscriber.error(new Error(`Status: ${statusCode}`));
          subscriber.complete();
          res.resume();
          return;
        }
        res.setEncoding('utf-8');
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          subscriber.next(rawData);
          subscriber.complete();
        });
      }).on('error', err => {
        subscriber.error(err);
        subscriber.complete();
      });
    });
  }
}

exports.request = new Request();
