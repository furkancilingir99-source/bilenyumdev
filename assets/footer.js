/* ---------------------------------------------------------------------------
 * Bilenyum footer.js — paylaşılan footer (tek kaynak)
 *
 * Her sayfa `<footer id="site-footer"></footer>` placeholder'ını koyar ve bu
 * scripti yükler. footer.js, içeriği outerHTML ile değiştirip tam footer'ı
 * inject eder.
 *
 * Aynı sayfaya giden hash linkleri otomatik olarak `#hash`'e indirgenir
 * (örn. index.html üzerindeyken `index.html#panel` → `#panel`).
 *
 *   <footer id="site-footer"></footer>
 *   <script src="assets/footer.js"></script>
 *
 * Bağımlılık yok.
 * ------------------------------------------------------------------------- */
(function () {
  'use strict';

  var FOOTER_HTML = '\
<footer class="sec sec-footer" id="footer">\
  <div class="sec-inner" style="padding-top: 24px; padding-bottom: 0;">\
    <div class="footer-grid">\
      <div class="footer-col">\
        <a class="logo" href="index.html"><img src="assets/bilenyum-logo-beyaz.svg" alt="Bilenyum" class="logo-img" /></a>\
        <p class="footer-tagline">Eğitimde Bilenyum Çağı.</p>\
        <div class="footer-social">\
          <a href="#" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772 4.915 4.915 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.247-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.218-1.79.465-2.428.254-.66.598-1.216 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm6.5-.25a1.25 1.25 0 0 0-2.5 0 1.25 1.25 0 0 0 2.5 0zM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"/></svg></a>\
          <a href="#" aria-label="Facebook"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9.198 21.5h4v-8.01h3.604l.396-3.98h-4V7.5a1 1 0 0 1 1-1h3v-4h-3a5 5 0 0 0-5 5v2.51h-2l-.396 3.98h2.396v8.01z"/></svg></a>\
          <a href="#" aria-label="YouTube"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.582 6.186a2.506 2.506 0 0 0-1.768-1.768C18.254 4 12 4 12 4s-6.254 0-7.814.418a2.506 2.506 0 0 0-1.768 1.768C2 7.746 2 12 2 12s0 4.254.418 5.814a2.506 2.506 0 0 0 1.768 1.768C5.746 20 12 20 12 20s6.254 0 7.814-.418a2.506 2.506 0 0 0 1.768-1.768C22 16.254 22 12 22 12s0-4.254-.418-5.814zM10 15.464V8.536L16 12l-6 3.464z"/></svg></a>\
          <a href="#" aria-label="LinkedIn"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.063 2.063 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></a>\
          <a href="#" aria-label="X"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/></svg></a>\
        </div>\
        <div class="footer-downloads">\
          <a href="#" class="footer-badge" aria-label="App Store\'dan indir">\
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.05 20.28c-.98.95-2.05.86-3.08.43-1.09-.45-2.09-.46-3.24 0-1.44.59-2.19.45-3.09-.46-4.99-5.32-4.27-13.5 1.4-13.84 1.27.08 2.16.74 2.9.79 1.11-.21 2.17-.79 3.34-.69 1.4.13 2.46.65 3.18 1.55-2.95 1.83-2.27 5.61.42 6.73-.6 1.81-1.38 3.6-2.83 5.5zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>\
            <span class="footer-badge-text"><small>İndir</small><strong>App Store</strong></span>\
          </a>\
          <a href="#" class="footer-badge" aria-label="Google Play\'den indir">\
            <svg viewBox="0 0 24 24" aria-hidden="true">\
              <path d="M3.5 1.7L13.4 12 3.5 22.3c-.3-.2-.5-.5-.5-.9V2.6c0-.4.2-.7.5-.9z" fill="#00D2FF"/>\
              <path d="M3.5 1.7l9.9 10.3-9.9 10.3c.2.1.5.1.7 0L20.3 13c.8-.5.8-1.5 0-2L4.2 1.7c-.2-.1-.5-.1-.7 0z" fill="#00B7C9" opacity="0.85"/>\
              <path d="M16.1 8.4L13.4 12l2.7 3.6 4.2-2.4c.7-.4.7-1.4 0-1.8l-4.2-2.4z" fill="#FFCE00"/>\
              <path d="M3.5 22.3l9.9-10.3-3 3-6.9 7.3z" fill="#F44336" opacity="0.85"/>\
              <path d="M3.5 1.7l9.9 10.3-3-3-6.9-7.3z" fill="#43A047" opacity="0.85"/>\
            </svg>\
            <span class="footer-badge-text"><small>İndir</small><strong>Google Play</strong></span>\
          </a>\
        </div>\
      </div>\
      <div class="footer-col">\
        <h4>Ürün</h4>\
        <a href="egitim-setleri.html">Eğitim Setleri</a>\
        <a href="index.html#panel">Öğrenci ve Veli Kontrol Merkezi</a>\
        <a href="index.html#yumi">Yumi</a>\
        <a href="#" data-trial-open>Ücretsiz Deneme Dersi</a>\
        <a href="egitim-modeli.html">Eğitim Modelimiz</a>\
      </div>\
      <div class="footer-col">\
        <h4>Şirket</h4>\
        <a href="kadromuz.html">Ekibimiz</a>\
        <a href="neden-biz.html">Neden Biz?</a>\
        <a href="blog.html">Blog</a>\
        <a href="kariyer.html">Kariyer</a>\
      </div>\
      <div class="footer-col">\
        <h4>Destek</h4>\
        <a href="iletisim.html">İletişim</a>\
        <a href="sss.html">SSS</a>\
        <a href="#">KVKK</a>\
      </div>\
    </div>\
    <div class="footer-bottom">\
      <span>© 2026 Bilenyum Eğitim Teknolojileri A.Ş. Tüm hakları saklıdır.</span>\
      <span>info@bilenyum.com · +90 850 000 00 00</span>\
    </div>\
  </div>\
</footer>';

  function currentPage() {
    var path = location.pathname.split('/').pop();
    return path || 'index.html';
  }

  /* Aynı sayfaya işaret eden `<a href="x.html#y">` linklerini `#y`'ye indirger.
     Böylece kullanıcı tıkladığında sayfa yeniden yüklenmez, sadece anchor'a kayar. */
  function localizeAnchors(scope) {
    var page = currentPage();
    Array.prototype.forEach.call(scope.querySelectorAll('a[href*="#"]'), function (a) {
      var href = a.getAttribute('href') || '';
      var idx = href.indexOf('#');
      if (idx <= 0) return;
      var file = href.slice(0, idx);
      if (file === page) a.setAttribute('href', href.slice(idx));
    });
  }

  function inject() {
    var slot = document.getElementById('site-footer');
    if (!slot) return;
    var tmp = document.createElement('div');
    tmp.innerHTML = FOOTER_HTML;
    var footerEl = tmp.firstChild;
    if (!footerEl) return;
    localizeAnchors(footerEl);
    slot.replaceWith(footerEl);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }

  function loadDashboardSwitcher() {
    if (!document.querySelector('header.nav .nav-inner, nav.nav .nav-inner')) return;
    if (document.querySelector('.db-switch')) return;
    if (document.querySelector('script[src*="dashboard-switcher.js"]')) return;

    var script = document.createElement('script');
    script.src = 'assets/dashboard-switcher.js';
    script.onload = function () {
      if (window.DashboardSwitcher) window.DashboardSwitcher.mount();
    };
    document.body.appendChild(script);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadDashboardSwitcher);
  } else {
    loadDashboardSwitcher();
  }
})();
