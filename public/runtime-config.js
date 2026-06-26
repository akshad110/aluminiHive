window.__ALUMINIHIVE_API_URL__ = "";

(function () {
  var base = window.__ALUMINIHIVE_API_URL__;
  var host = window.location.hostname;

  if (!base && host.indexOf('-frontend') !== -1 && host.endsWith('.onrender.com')) {
    base = window.location.protocol + '//' + host.replace('-frontend', '-backend');
    window.__ALUMINIHIVE_API_URL__ = base;
  }

  if (!base) return;

  var originalFetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    if (typeof input === 'string' && input.indexOf('/api/') === 0) {
      input = base + input;
    }
    return originalFetch(input, init);
  };
})();
