const version = "v1::"
const staticCacheName = `${version}static-resources`;


    self.addEventListener('install', function(event) {
        event.waitUntil(
            caches.open(staticCacheName).then(function(cache) {
                return cache.addAll([
                    './dist/index.html',
                    './dist/app.js',
                    './dist/style.css',
                    './dist/sw.js',
                ]).then( () => {
                    console.log('SW Install');
                })
            })
        )
    })

    self.addEventListener('activate', function (event) {
        event.waitUntil(
            caches
                .keys()
                .then((keys) => {
                    return Promise.all(
                        keys
                            .filter((key) => {
                                return !key.startsWith(version);
                            })
                            .map((key) => {
                                return caches.delete(key);
                            })
                    );
                })
                .then(() => {
                    console.log('SW Activated');
                })
        )
    });


    self.addEventListener('fetch', function(event) {
        var requestUrl = new URL(event.request.url);
        if (requestUrl.origin === location.origin) {
            if (requestUrl.pathname === '/') {
                event.respondWith(caches.match('./index.html'));
                return;
            }

            if (requestUrl.pathname === '/dist/style.css') {
                event.respondWith(caches.match('./dist/style.css'));
                return;
            }

            if (requestUrl.pathname === '/dist/app.js') {
                event.respondWith(caches.match('./dist/app.js'));
                return;
            }

            if (requestUrl.pathname === '/dist/sw.js') {
                event.respondWith(caches.match('./dist/sw.js'));
                return;
            }

        }
      });



