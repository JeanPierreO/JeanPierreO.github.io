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
                ])
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
        )
    });


    self.addEventListener('fetch', function(event) {
        var requestUrl = new URL(event.request.url);
        if (requestUrl.origin === location.origin) {
            if (requestUrl.pathname === '/') {
                event.respondWith(caches.match('./dist/index.html'));
                return;
            }

            if (requestUrl.pathname === '/dist/style.css') {
                event.respondWith(caches.match('./dist/style.css'));
                return;
            }

            if (requestUrl.pathname === '/app.js') {
                event.respondWith(caches.match('./dist/app.js'));
                return;
            }

        }
      });



