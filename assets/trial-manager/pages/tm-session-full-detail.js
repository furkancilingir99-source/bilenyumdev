/**
 * Tam sayfa ders detayı
 */
(function () {
  'use strict';

  var Store = window.TMStore;
  var U = window.TMUtils;
  var SL = window.TMStatusLabels;
  var Detail = window.TMSessionDetail;
  var id = U.qs('id');
  if (!Store || !id) return;

  var root = document.getElementById('tmFullDetail');
  var tabs = Detail && Detail.tabLabels ? Detail.tabLabels : ['Özet', 'Katılımcılar', 'Online Link', 'İletişim', 'Katılım', 'Geçmiş'];
  var active = parseInt(U.qs('tab') || '0', 10) || 0;

  function sessionDetails() {
    return Store.getSessionWithDetails(id);
  }

  function refreshHeader(d) {
    var titleEl = document.querySelector('#tmFullDetail .tm-admin-header-title');
    var metaEl = document.querySelector('#tmFullDetail .tm-admin-header-meta');
    if (!d || !titleEl) return;
    titleEl.textContent = d.lessonType.name + ' · ' + U.formatDateKey(d.session.date);
    if (metaEl) {
      metaEl.textContent = d.session.startTime + ' – ' + d.session.endTime + ' · ' + SL.sessionLabel(d.session.status);
    }
  }

  function render() {
    var d = sessionDetails();
    if (!d || !root) return;

    root.innerHTML =
      '<div class="tm-admin-header">' +
        '<div class="tm-admin-header-main">' +
          '<h1 class="tm-admin-header-title">' + U.escapeHtml(d.lessonType.name) + ' · ' + U.formatDateKey(d.session.date) + '</h1>' +
          '<p class="tm-admin-header-meta">' + d.session.startTime + ' – ' + d.session.endTime + ' · ' + SL.sessionLabel(d.session.status) + '</p>' +
        '</div>' +
        '<div class="tm-admin-header-actions">' +
          '<button type="button" class="tm-btn tm-btn--ghost" id="tmOpenDrawer">Drawer\'da aç</button>' +
          '<a class="tm-btn tm-btn--ghost" href="deneme-dersi-yoneticisi-planlanmis-dersler.html">← Listeye dön</a>' +
        '</div>' +
      '</div>' +
      '<nav class="tm-drawer-tabs" id="tmFullTabs">' + tabs.map(function (t, i) {
        return '<button type="button" class="tm-drawer-tab' + (i === active ? ' is-active' : '') + '" data-i="' + i + '">' + t + '</button>';
      }).join('') + '</nav>' +
      '<div id="tmFullBody" class="tm-panel" style="padding:20px;margin-top:12px"></div>';

    document.getElementById('tmOpenDrawer').addEventListener('click', function () {
      if (Detail) Detail.open(id, active);
    });
    document.getElementById('tmFullTabs').querySelectorAll('[data-i]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        active = parseInt(btn.getAttribute('data-i'), 10);
        document.getElementById('tmFullTabs').querySelectorAll('.tm-drawer-tab').forEach(function (b, i) {
          b.classList.toggle('is-active', i === active);
        });
        paintBody();
      });
    });
    paintBody();
  }

  function paintBody() {
    var body = document.getElementById('tmFullBody');
    if (!body) return;
    var d = sessionDetails();
    refreshHeader(d);
    if (Detail && Detail.renderTabAt) {
      Detail.renderTabAt(body, id, active);
    } else {
      body.innerHTML = '<p class="tm-empty">Detay modülü yüklenemedi.</p>';
    }
    if (window.TMPermissions && window.TMPermissions.applyPageChrome) {
      window.TMPermissions.applyPageChrome(body);
    }
  }

  window.TMOnSessionChange = function () {
    refreshHeader(sessionDetails());
    paintBody();
  };

  render();
})();
