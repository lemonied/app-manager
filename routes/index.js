const express = require('express');
const router = express.Router();
const { catchError, concatMap, map } = require('rxjs/operators');
const { request } = require('../utils/request');
const { of, throwError, zip } = require('rxjs');

router.get('/', function (req, res) {
  res.render('index', {
    title: 'App Manager',
  });
});
router.get('/applications', function(req, res, next) {
  request.get(`https://${process.env.KUBERNETES_SERVICE_HOST}:${process.env.KUBERNETES_SERVICE_PORT_HTTPS}/api/v1/namespaces/applications/configmaps`).pipe(
    concatMap(result => {
      let items = [];
      try {
        items = JSON.parse(result).items;
      } catch (e) {
        // Error
      }
      // 'doc-vue.applications.svc.cluster.local';
      items = items.map(v => v.data).filter(v => v.type === 'module');
      return of(items);
    }),
    catchError(error => {
      res.status(500);
      res.send(error);
      return throwError(error);
    }),
  ).subscribe(result => {
    res.send(result);
  });
});

router.get('/modules', function(req, res, next) {
  request.get(`https://${process.env.KUBERNETES_SERVICE_HOST}:${process.env.KUBERNETES_SERVICE_PORT_HTTPS}/api/v1/namespaces/applications/configmaps`).pipe(
    concatMap(result => {
      let items = [];
      try {
        items = JSON.parse(result).items;
      } catch (e) {
        // Error
      }
      items = items.map(v => v.data).filter(v => v.type === 'module');
      return zip(...items.map(v => {
        return request.get(`http://${v.service}.applications.svc.cluster.local/${v.remote}`).pipe(
          catchError(err => {
            return of('');
          }),
        );
      })).pipe(
        map(results => {
          return results.join('');
        }),
      );
    }),
    catchError(error => {
      res.status(500);
      res.send(error);
      return throwError(error);
    }),
  ).subscribe(result => {
    res.header({
      'Content-Type': 'application/javascript',
    });
    res.send(result);
  });
});

module.exports = router;
