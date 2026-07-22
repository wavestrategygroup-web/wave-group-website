(function () {
  var app = document.getElementById('app');
  if (!app) return;

  var FADE_MS = 200;
  var isTransitioning = false;

  function isInternalPageLink(a) {
    if (!a || !a.getAttribute) return false;
    var href = a.getAttribute('href');
    if (!href) return false;
    if (a.target && a.target !== '' && a.target !== '_self') return false;
    if (a.hasAttribute('download')) return false;
    if (href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0) return false;
    if (href.indexOf('http://') === 0 || href.indexOf('https://') === 0) {
      // only treat as internal if it's actually this same origin
      try {
        var u = new URL(href, window.location.href);
        if (u.origin !== window.location.origin) return false;
        href = u.pathname + u.search + u.hash;
      } catch (e) {
        return false;
      }
    }
    if (href.charAt(0) === '#') return false; // pure same-page anchor, let browser handle it
    if (!/\.html(#.*)?$/.test(href)) return false;
    return href;
  }

  function extractAppContent(htmlText) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(htmlText, 'text/html');
    var newApp = doc.getElementById('app');
    var newTitle = doc.querySelector('title');
    return {
      appHTML: newApp ? newApp.innerHTML : null,
      title: newTitle ? newTitle.textContent : document.title
    };
  }

  function runScripts(container) {
    var scripts = container.querySelectorAll('script');
    scripts.forEach(function (oldScript) {
      var newScript = document.createElement('script');
      for (var i = 0; i < oldScript.attributes.length; i++) {
        var attr = oldScript.attributes[i];
        newScript.setAttribute(attr.name, attr.value);
      }
      newScript.textContent = oldScript.textContent;
      oldScript.parentNode.replaceChild(newScript, oldScript);
    });
  }

  function scrollToTargetOrTop(hash) {
    if (hash) {
      var id = hash.replace('#', '');
      var el = document.getElementById(id);
      if (el) {
        setTimeout(function () {
          el.scrollIntoView({ behavior: 'smooth' });
        }, 60);
        return;
      }
    }
    window.scrollTo(0, 0);
  }

  function navigate(href, pushHistory) {
    if (isTransitioning) return;
    isTransitioning = true;

    var urlObj;
    try {
      urlObj = new URL(href, window.location.href);
    } catch (e) {
      window.location.href = href;
      return;
    }
    var hash = urlObj.hash;

    app.style.opacity = '0';

    fetch(urlObj.pathname + urlObj.search, { credentials: 'same-origin' })
      .then(function (res) {
        if (!res.ok) throw new Error('Fetch failed: ' + res.status);
        return res.text();
      })
      .then(function (text) {
        var extracted = extractAppContent(text);
        if (!extracted.appHTML) throw new Error('No #app found in fetched page');

        setTimeout(function () {
          app.innerHTML = extracted.appHTML;
          document.title = extracted.title;
          runScripts(app);

          if (pushHistory) {
            window.history.pushState({ waveSpa: true }, '', urlObj.pathname + urlObj.search + hash);
          }

          scrollToTargetOrTop(hash);

          requestAnimationFrame(function () {
            app.style.opacity = '1';
          });
          isTransitioning = false;
        }, FADE_MS);
      })
      .catch(function () {
        // graceful fallback: real navigation, never leave the user stuck
        window.location.href = href;
      });
  }

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    var a = e.target.closest ? e.target.closest('a') : null;
    if (!a) return;

    var href = isInternalPageLink(a);
    if (!href) return;

    e.preventDefault();
    navigate(a.getAttribute('href'), true);
  });

  window.addEventListener('popstate', function () {
    navigate(window.location.pathname + window.location.search + window.location.hash, false);
  });
})();
