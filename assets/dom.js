/* ---------------------------------------------------------------------------
 * Bilenyum dom.js — vanilla mikro-utility
 *
 * jQuery'nin en sık kullanılan 4 kolaylığını yerli API'ler üzerinden sağlar.
 * Boyut: ~1 KB, dependency yok.
 *
 *   $(sel, root?)         — tek element seç
 *   $$(sel, root?)        — array olarak liste döner ([... NodeList])
 *   on(el, ev, fn, opts?) — addEventListener kısa yolu (el array da olabilir)
 *   delegate(root, sel, ev, fn)
 *                         — event delegation: root içinde sel'e uyan
 *                           descendant'da ev olunca fn çağrılır (this = element)
 *
 * Tüm sayfalar `<head>` içinde yükler:
 *   <script src="assets/dom.js"></script>
 * tokens.css'den sonra, body'deki inline script'lerden önce.
 * ------------------------------------------------------------------------- */
(function (global) {
  'use strict';

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function $$(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function on(target, ev, fn, opts) {
    if (!target) return;
    if (target.length != null && typeof target !== 'string' && !target.addEventListener) {
      // NodeList / Array
      Array.prototype.forEach.call(target, function (el) {
        el.addEventListener(ev, fn, opts);
      });
    } else {
      target.addEventListener(ev, fn, opts);
    }
  }

  function delegate(root, sel, ev, fn) {
    if (!root) return;
    root.addEventListener(ev, function (e) {
      var t = e.target.closest(sel);
      if (t && root.contains(t)) {
        fn.call(t, e);
      }
    });
  }

  global.$ = $;
  global.$$ = $$;
  global.on = on;
  global.delegate = delegate;
})(typeof window !== 'undefined' ? window : this);
