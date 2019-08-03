/* eslint-disable func-names */
/* eslint-disable no-restricted-globals */
import firebase from 'firebase';

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
            resolve(null);
          }
        );
      } else {
        resolve(null);
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

self.addEventListener('fetch', (event) => {
  const requestProcessor = (idToken) => {
    let req = event.request;

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
      try {
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
      } catch (e) {
        console.log(e);
      }
    }
    return fetch(req).catch(console.log);
  };

  event.respondWith(
    getIdToken()
      .then(requestProcessor, requestProcessor)
      .catch(console.log)
  );
});

const CACHE = 'cache-update-and-refresh-v1';

const urlsToCache = [
  '/index.html',
  // '/service-worker.js',
  '/bundle.js',
  '/src/manifest.json',
  '/src/icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(urlsToCache)));
});

self.addEventListener('push', (event) => {
  console.log(event);
});

self.addEventListener('offline', (event) => {
  event.respondWith(
    caches
      .open(CACHE)
      .then((cache) => cache.match(event.request).then((matching) => matching || Promise.reject('no-match')))
  );
});

// self.addEventListener('sync', function(event) {
//   if (event.tag == 'myFirstSync') {
//     event.waitUntil(doSomeStuff());
//   }
// });

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE];

  event.waitUntil(
    //   caches.keys().then((cacheNames) =>
    //     Promise.all(
    //       cacheNames.map((cacheName) => {
    //         if (cacheWhitelist.indexOf(cacheName) === -1) {
    //           return caches.delete(cacheName);
    //         }
    //       })
    //     )
    //   )
    clients.claim()
  );
});
