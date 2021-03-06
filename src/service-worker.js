/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable no-restricted-syntax */
/* eslint-disable func-names */
/* eslint-disable no-restricted-globals */
import firebase from 'firebase/app';
import uuid from 'uuid';
import Dexie from 'dexie';

const db = new Dexie('reqDB');

db.version(1).stores({
  request: 'id',
});

const CACHE = 'cache-update-and-refresh-v1';

const getIdToken = () => {
  return new Promise((resolve) => {
    const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
      unsubscribe();
      if (user) {
        user.getIdToken().then(
          (idToken) => {
            resolve(idToken);
          },
          () => {
            self.location = '/login';
          }
        );
      } else {
        self.location = '/login';
      }
    });
  });
};

const getOriginFromUrl = (url) => {
  const pathArray = url.split('/');
  const protocol = pathArray[0];
  const host = pathArray[2];
  return `${protocol}//${host}`;
};

function fromCache(request) {
  return caches.open(CACHE).then((cache) => cache.match(request).then((matching) => matching || {}));
}

function update(request) {
  return caches
    .open(CACHE)
    .then((cache) =>
      fetch(request).then((response) => cache.put(request, response.clone()).then(() => response))
    );
}

function refresh(response) {
  return self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      const message = {
        type: 'refresh',
        url: response.url,
        eTag: response.headers.get('ETag'),
      };
      client.postMessage(JSON.stringify(message));
    });
  });
}

const urlsToCache = [
  '/taskFlow/PT Root UI_Regular.woff2',
  '/taskFlow/PT Root UI_Regular.css',
  '/taskFlow/icon.png',
  '/taskFlow/manifest.json',
  '/taskFlow/index.js',
  '/taskFlow/service-worker.js',
  '/taskFlow/index.html',
];

self.addEventListener('fetch', (event) => {
  let req = event.request;
  console.log('----offline----1')
  if(self.navigator.onLine){
    const requestProcessor = (idToken) => {
      if (
        self.location.origin === getOriginFromUrl(event.request.url) &&
        (self.location.protocol === 'https:' || self.location.hostname === 'localhost') &&
        idToken
      ) {
        const headers = new Headers();
        for (const entry of req.headers.entries()) {
          headers.append(entry[0], entry[1]);
        }

        headers.append('Authorization', `Bearer ${idToken}`);
        req = new Request(req.url, {
          method: req.method,
          headers,
          mode: 'same-origin',
          credentials: req.credentials,
          cache: req.cache,
          redirect: req.redirect,
          referrer: req.referrer,
          body: req.body,
          bodyUsed: req.bodyUsed,
          context: req.context,
        });
      }
      return fetch(req);
    };

    if (req.url.includes('google')) {
      event.respondWith(
        getIdToken()
          .then(requestProcessor,requestProcessor)
      );
    } else {
      event.respondWith(fromCache(event.request));
      event.waitUntil(update(event.request).then(refresh));
    }
  } else {
    console.log('----offline----2')
    event.respondWith(new Promise(() => {}));
      const newReq =  {
          url: req.url,
          method: req.method,
          mode: 'same-origin',
          credentials: req.credentials,
          cache: req.cache,
          redirect: req.redirect,
          referrer: req.referrer,
          body: req.body,
          bodyUsed: req.bodyUsed,
          context: req.context,
        };
        db.transaction('rw', db.request, (e) => {
          e.db.request.add({id: uuid(), newReq});
        });
  }
});

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(urlsToCache)));
});

self.ononline = () => {
  db.transaction('rw', db.request, (e) => {
    e.db.request.each((request) => etch(request).catch(console.log));
  }).then(()=> {
    db.transaction('rw', db.request, (e) => {
      e.db.request.clear();
    });
  })
}

// self.addEventListener('offline', (event) => {
//   event.respondWith(
//     caches
//       .open(CACHE)
//       .then((cache) => cache.match(event.request).then((matching) => matching || Promise.reject('no-match')))
//   );
// });

// self.addEventListener('sync', function(event) {
//   if (event.tag == 'myFirstSync') {
//     event.waitUntil(doSomeStuff());
//   }
// });

// self.addEventListener('activate', () => {
// const cacheWhitelist = [CACHE];
// event.waitUntil(
//   caches.keys().then((cacheNames) =>
//     Promise.all(
//       cacheNames.map((cacheName) => {
//         if (cacheWhitelist.indexOf(cacheName) === -1) {
//           return caches.delete(cacheName);
//         }
//       })
//     )
//   )
// clients.claim()
// );
// });
