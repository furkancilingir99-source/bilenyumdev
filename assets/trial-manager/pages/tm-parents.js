/**
 * Veli iletişim ve başvuru takibi
 */
(function () {
  'use strict';

  var Store = (window.TMBridge && window.TMBridge.store()) || window.TMStore;
  var U = window.TMUtils;
  var SL = window.TMStatusLabels;
  var Export = window.TMExportUtils;
  var Perms = window.TMPermissions;
  if (!Store) return;

  var tbody = document.getElementById('tmParentsBody');
  var cardsEl = document.getElementById('tmParentsCards');
  var searchInput = document.getElementById('tmParentsSearch');
  var countEl = document.getElementById('tmParentsCount');
  var paginationEl = document.getElementById('tmParentsPagination');
  var pageSizeSelect = document.getElementById('tmParentsPageSize');
  var exportBtn = document.getElementById('tmParentsExport');
  var page = 1;

  var EYE_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>';

  function parentCode(id) {
    var m = String(id || '').match(/(\d+)\s*$/);
    return 'trialparent-' + (m ? m[1].padStart(4, '0') : '0000');
  }
  function studentCode(st) {
    var m = String((st && st.id) || '').match(/(\d+)\s*$/);
    return 'trialstudent-' + (m ? m[1].padStart(4, '0') : '0000');
  }
  // Rezervasyon görünen kodu — mümkünse talebin REZTRIAL kodu, değilse rezervasyondan türetilir.
  function reservationCode(r) {
    if (r.requestId && Store.getReservationCode) {
      var c = Store.getReservationCode(r.requestId);
      if (c) return c;
    }
    var s = r.sessionId ? Store.getSessionById(r.sessionId) : null;
    var dateKey = (s && s.date) ? s.date : (r.createdAt ? String(r.createdAt).slice(0, 10) : '');
    var compact = dateKey ? dateKey.replace(/-/g, '') : '00000000';
    var m = String(r.id).match(/(\d+)\s*$/);
    return 'REZTRIAL-' + compact + '-' + (m ? m[1].padStart(4, '0') : '0000');
  }

  function detailBtn(id) {
    return '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost tm-btn--icon" data-detail="' + id + '" title="Detay" aria-label="Detay">' + EYE_ICON + '</button>';
  }

  // Veliye bağlı öğrenciler — kayıttan birebir çekilir (öğrenci sırası tüm sütunlarda aynı).
  function parentStudents(pa) {
    return (pa.studentIds || []).map(function (id) { return Store.getStudentById(id); }).filter(Boolean);
  }
  // Her öğrenci için bir satır — çok öğrencili velilerde ID/Ad/Sınıf sütunları hizalı kalsın.
  function stackCell(students, fn) {
    if (!students.length) return '—';
    return students.map(function (st) {
      return '<div class="tm-stack-line">' + fn(st) + '</div>';
    }).join('');
  }
  function studentIdCell(students) {
    return stackCell(students, function (st) { return '<code class="tm-res-code-cell">' + U.escapeHtml(studentCode(st)) + '</code>'; });
  }
  function studentNameCell(students) {
    return stackCell(students, function (st) { return U.escapeHtml(U.fullName(st.firstName, st.lastName)); });
  }
  function studentGradeCell(students) {
    return stackCell(students, function (st) { return U.escapeHtml(st.grade || '—'); });
  }

  function contactStatusBadge(status) {
    if (status === 'positive') return '<span class="tm-badge tm-badge--green">Olumlu</span>';
    if (status === 'negative') return '<span class="tm-badge tm-badge--red">Olumsuz</span>';
    if (status === 'unreachable') return '<span class="tm-badge tm-badge--orange">Ulaşılamadı</span>';
    return '<span class="tm-badge tm-badge--muted">Görüşülmedi</span>';
  }
  // İletişim kaydının sonucundan (result) iletişim durumunu türet (eski seed kayıtları için).
  function resultToContact(result) {
    if (result === 'reached' || result === 'approved') return 'positive';
    if (result === 'declined' || result === 'rejected') return 'negative';
    if (result === 'unreachable' || result === 'call_again') return 'unreachable';
    return null;
  }
  // İletişimi kuran kullanıcı — ad + rol.
  function contactByCell(userId) {
    var u = (Store.getUsers ? Store.getUsers() : []).find(function (x) { return x.id === userId; });
    if (!u) return '<span class="tm-comm-by-name">Sistem</span>';
    var role = (SL.USER_ROLE && SL.USER_ROLE[u.role]) || '';
    return '<span class="tm-comm-by-name">' + U.escapeHtml(U.fullName(u.firstName, u.lastName)) + '</span>' +
      (role ? '<span class="tm-comm-by-role">' + U.escapeHtml(role) + '</span>' : '');
  }

  // Bu veliye ait talep id kümesi — telefon eşleşmesi + rezervasyonların requestId'si üzerinden.
  function parentRequestIds(parent, reservations) {
    var ids = {};
    (reservations || []).forEach(function (r) { if (r.requestId) ids[r.requestId] = true; });
    (Store.getRequests ? Store.getRequests() : []).forEach(function (rq) {
      if ((rq.parentPhone && rq.parentPhone === parent.phone) || (rq.parentEmail && parent.email && rq.parentEmail === parent.email)) {
        ids[rq.id] = true;
      }
    });
    return ids;
  }

  // Rezervasyonun bağlı olduğu dersin durumu — İptal / Tamamlandı / Onaylandı.
  function lessonStatusFor(r, session) {
    if (r.status === 'cancelled') return 'cancelled';
    if (session && session.status === 'cancelled') return 'cancelled';
    if (session && session.status === 'completed') return 'completed';
    if (r.status === 'attended' || r.status === 'no_show') return 'completed';
    return 'confirmed';
  }

  function infoCell(label, value) {
    return '<div><div class="tm-detail-cell-label">' + label + '</div><div class="tm-detail-cell-value">' + value + '</div></div>';
  }
  function assignmentBadge(done) {
    return done
      ? '<span class="tm-badge tm-badge--green">Yapıldı</span>'
      : '<span class="tm-badge tm-badge--orange">Yapılmadı</span>';
  }

  // Rezervasyon detay modalı — veli modalının üzerinde açılır (Öğrenciler sayfasıyla aynı içerik).
  function openInfoModal(title, bodyHtml) {
    var existing = document.getElementById('tmParentResModal');
    if (existing) existing.parentNode.removeChild(existing);
    var overlay = document.createElement('div');
    overlay.className = 'tm-crit-overlay is-open';
    overlay.id = 'tmParentResModal';
    overlay.style.zIndex = '9600';
    overlay.innerHTML =
      '<div class="tm-crit-dialog" role="dialog" aria-modal="true">' +
        '<header class="tm-crit-head"><h2 class="tm-crit-title">' + title + '</h2></header>' +
        '<div class="tm-crit-body">' + bodyHtml + '</div>' +
        '<footer class="tm-crit-foot"><button type="button" class="tm-btn tm-btn--primary" data-modal-close>Kapat</button></footer>' +
      '</div>';
    document.body.appendChild(overlay);
    function close() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); document.removeEventListener('keydown', onKey, true); }
    function onKey(e) { if (e.key === 'Escape') { e.stopPropagation(); close(); } }
    overlay.addEventListener('click', function (e) { if (e.target === overlay || e.target.closest('[data-modal-close]')) close(); });
    document.addEventListener('keydown', onKey, true);
  }

  // Rezervasyona tıklanınca: talebi varsa Rezervasyon Talepleri'ndeki KANONİK drawer'ı (tüm
  // bölümleriyle) aç. Bunun için veli modalı kapatılır (drawer, modalın altında konumlanır).
  // Talep yoksa (nadiren) rezervasyonun kendi verisinden türeyen yerel detay modalını göster.
  function viewReservation(reservationId) {
    var r = Store.getReservationById(reservationId);
    if (!r) return;
    var RequestDrawer = window.TMRequestDrawer;
    if (RequestDrawer && r.requestId && Store.getRequestById(r.requestId)) {
      var pm = document.getElementById('tmParentModal');
      if (pm && pm.__closeModal) pm.__closeModal();
      // "Geri Dön": rezervasyon drawer'ını kapat, veli modalını Rezervasyonlar sekmesinde yeniden aç.
      RequestDrawer.open(r.requestId, 0, { onBack: function () {
        if (window.TMDetailDrawer && window.TMDetailDrawer.close) window.TMDetailDrawer.close();
        var parent = Store.getParentById(r.parentId);
        if (parent) openDetail(parent, 1);
      } });
      return;
    }
    showReservationDetail(reservationId);
  }

  function showReservationDetail(reservationId) {
    var r = Store.getReservationById(reservationId);
    if (!r) return;
    var s = r.sessionId ? Store.getSessionById(r.sessionId) : null;
    var lt = s ? Store.getLessonTypeById(s.lessonTypeId) : (r.lessonTypeId ? Store.getLessonTypeById(r.lessonTypeId) : null);
    var req = r.requestId ? Store.getRequestById(r.requestId) : null;
    var st = r.studentId ? Store.getStudentById(r.studentId) : null;
    var pa = r.parentId ? Store.getParentById(r.parentId) : null;
    var lessonCode = (s && Store.getLessonCode) ? Store.getLessonCode(s) : (s ? s.id : '—');
    var talepTarihi = req && req.createdAt ? U.formatDateTime(req.createdAt) : (r.createdAt ? U.formatDateTime(r.createdAt) : '—');
    // İletişim/atama durumunu rezervasyon talebiyle aynı kaynaktan çek + kurala uy:
    // rezervasyon bir derse bağlıysa öğrenci atanmıştır, atama ise ancak olumlu iletişimde olur.
    var assigned = !!s;
    var contactStatus = req ? req.contactStatus : undefined;
    if (assigned && contactStatus !== 'positive') contactStatus = 'positive';
    var studentText = st ? (U.fullName(st.firstName, st.lastName) + ' · ' + studentCode(st) + ' · ' + (st.grade || '—')) : '—';
    var parentText = pa ? (U.fullName(pa.firstName, pa.lastName) + ' · ' + (pa.phone || '—')) : '—';
    var linkBadge = r.linkSent
      ? '<span class="tm-badge tm-badge--green">Gönderildi</span>'
      : '<span class="tm-badge tm-badge--muted">Gönderilmedi</span>';
    var body = '<div class="tm-detail-grid tm-detail-grid--modal">' +
      infoCell('Öğrenci', U.escapeHtml(studentText)) +
      infoCell('Veli', U.escapeHtml(parentText)) +
      infoCell('Talep tarihi', U.escapeHtml(talepTarihi)) +
      infoCell('Rezervasyon ID', '<code class="tm-res-code-cell">' + U.escapeHtml(reservationCode(r)) + '</code>') +
      infoCell('Atanan Ders', U.escapeHtml(lt ? lt.name : '—')) +
      infoCell('Ders ID', '<code class="tm-res-code-cell">' + U.escapeHtml(lessonCode) + '</code>') +
      infoCell('Ders Tarihi', U.escapeHtml(s ? U.formatDateKey(s.date) : '—')) +
      infoCell('Ders Saati', U.escapeHtml(s ? (s.startTime + '–' + s.endTime) : '—')) +
      infoCell('Sınıf', U.escapeHtml(s ? (s.gradeLevel || '—') : '—')) +
      infoCell('İletişim Durumu', contactStatusBadge(contactStatus)) +
      infoCell('Ders Ataması', assignmentBadge(assigned)) +
      infoCell('Ders Durumu', SL.sessionBadge(lessonStatusFor(r, s))) +
      infoCell('Link', linkBadge) +
    '</div>';
    openInfoModal('Rezervasyon Detayı', body);
  }

  function renderReservations(reservations) {
    if (!reservations.length) return '<p class="tm-empty">Rezervasyon yok.</p>';
    var rows = reservations.slice(0, 20).map(function (r) {
      var s = r.sessionId ? Store.getSessionById(r.sessionId) : null;
      var lt = s ? Store.getLessonTypeById(s.lessonTypeId) : (r.lessonTypeId ? Store.getLessonTypeById(r.lessonTypeId) : null);
      var lessonCode = s && Store.getLessonCode ? Store.getLessonCode(s) : '—';
      var resDate = r.createdAt ? U.formatDateKey(String(r.createdAt).slice(0, 10)) : '—';
      var assigned = lt ? lt.name : '—';
      if (s) assigned += ' · ' + U.formatDateKey(s.date) + ' ' + s.startTime;
      return '<tr data-res-open="' + r.id + '" style="cursor:pointer">' +
        '<td><code class="tm-res-code-cell">' + U.escapeHtml(reservationCode(r)) + '</code></td>' +
        '<td><code class="tm-res-code-cell">' + U.escapeHtml(lessonCode) + '</code></td>' +
        '<td>' + U.escapeHtml(resDate) + '</td>' +
        '<td>' + U.escapeHtml(assigned) + '</td>' +
        '<td>' + SL.sessionBadge(lessonStatusFor(r, s)) + '</td>' +
        '<td style="white-space:nowrap"><button type="button" class="tm-btn tm-btn--sm tm-btn--ghost tm-btn--icon" data-res-open="' + r.id + '" title="Detay" aria-label="Rezervasyon detayı" tabindex="-1">' + EYE_ICON + '</button></td>' +
        '</tr>';
    }).join('');
    return '<table class="tm-inner-table"><thead><tr><th>Rezervasyon ID</th><th>Ders ID</th><th>Rezervasyon Tarihi</th><th>Atanan Ders</th><th>Ders Durumu</th><th>İşlemler</th></tr></thead><tbody>' + rows + '</tbody></table>';
  }

  function renderCommHistory(parent, reservations) {
    var reqIds = parentRequestIds(parent, reservations);
    var resIds = {}; reservations.forEach(function (r) { resIds[r.id] = true; });
    // Yalnızca bu veliye ait kayıtlar: parentId / talep (requestId) / rezervasyon (reservationId).
    // sessionId ile filtrelemiyoruz; aynı ders başka velilerin kayıtlarını da içerebilir.
    var logs = Store.getCommunicationLogs().filter(function (l) {
      return l.parentId === parent.id ||
        (l.requestId && reqIds[l.requestId]) ||
        (l.reservationId && resIds[l.reservationId]);
    });
    if (!logs.length) return '<p class="tm-empty">İletişim kaydı yok.</p>';
    var rows = logs.map(function (l) {
      var hasTransition = l.contactTo !== undefined && l.contactTo !== null;
      var eski, yeni;
      if (hasTransition) {
        eski = contactStatusBadge(l.contactFrom === 'none' ? null : l.contactFrom);
        yeni = contactStatusBadge(l.contactTo);
      } else {
        var derived = resultToContact(l.result);
        eski = '<span class="tm-audit-none">—</span>';
        yeni = derived ? contactStatusBadge(derived) : '<span class="tm-audit-none">—</span>';
      }
      return '<tr><td>' + U.formatDateTime(l.createdAt) +
        '</td><td>' + contactByCell(l.createdByUserId) +
        '</td><td>' + eski + '</td><td>' + yeni +
        '</td><td>' + U.escapeHtml(l.summary || '') + '</td></tr>';
    }).join('');
    return '<table class="tm-inner-table"><thead><tr><th>Tarih</th><th>İletişim Kuran</th><th>Eski Durum</th><th>Yeni Durum</th><th>Özet</th></tr></thead><tbody>' + rows + '</tbody></table>';
  }

  function renderTab(idx, body, parent, students, reservations) {
    if (idx === 0) {
      var studentsHtml = students.length
        ? students.map(function (s) {
            return '<code class="tm-res-code-cell">' + U.escapeHtml(studentCode(s)) + '</code> ' +
              U.escapeHtml(U.fullName(s.firstName, s.lastName)) + ' · ' + U.escapeHtml(s.grade || '—');
          }).join('<br>')
        : '—';
      body.innerHTML =
        '<div class="tm-detail-grid">' +
          infoCell('Veli ID', '<code class="tm-res-code-cell">' + U.escapeHtml(parentCode(parent.id)) + '</code>') +
          infoCell('Ad soyad', U.escapeHtml(U.fullName(parent.firstName, parent.lastName))) +
          infoCell('Veli Telefonu', U.escapeHtml(parent.phone || '—')) +
          infoCell('Veli E-postası', U.escapeHtml(parent.email || '—')) +
          infoCell('Öğrenci(ler)', studentsHtml) +
          (parent.notes ? infoCell('İletişim notu', U.escapeHtml(parent.notes)) : '') +
        '</div>';
    } else if (idx === 1) {
      body.innerHTML = renderReservations(reservations);
      body.querySelectorAll('tr[data-res-open]').forEach(function (tr) {
        tr.addEventListener('click', function () {
          viewReservation(tr.getAttribute('data-res-open'));
        });
      });
    } else {
      body.innerHTML = renderCommHistory(parent, reservations);
    }
    if (Perms && Perms.applyPageChrome) Perms.applyPageChrome(body);
  }

  function openDetail(pa, activeTab) {
    if (!pa) return;
    var startTab = activeTab || 0;
    var parent = Store.getParentById(pa.id) || pa;
    var students = (parent.studentIds || []).map(function (id) { return Store.getStudentById(id); }).filter(Boolean);
    var reservations = Store.getReservationsForParent(parent.id);
    var tabs = ['İletişim', 'Rezervasyonlar', 'İletişim geçmişi'];

    var existing = document.getElementById('tmParentModal');
    if (existing) existing.parentNode.removeChild(existing);
    var overlay = document.createElement('div');
    overlay.className = 'tm-crit-overlay is-open';
    overlay.id = 'tmParentModal';
    overlay.innerHTML =
      '<div class="tm-crit-dialog tm-detail-modal" role="dialog" aria-modal="true" aria-label="Veli detayı">' +
        '<header class="tm-crit-head">' +
          '<div class="tm-detail-modal-titles">' +
            '<h2 class="tm-crit-title">' + U.escapeHtml(U.fullName(parent.firstName, parent.lastName)) + '</h2>' +
            '<p class="tm-detail-modal-sub">' + U.escapeHtml(parentCode(parent.id) + ' · ' + (parent.phone || '')) + '</p>' +
          '</div>' +
          '<button type="button" class="tm-drawer-close" data-modal-close aria-label="Kapat">&times;</button>' +
        '</header>' +
        '<nav class="tm-drawer-tabs">' + tabs.map(function (t, i) {
          return '<button type="button" class="tm-drawer-tab' + (i === startTab ? ' is-active' : '') + '" data-tab-idx="' + i + '">' + t + '</button>';
        }).join('') + '</nav>' +
        '<div class="tm-detail-modal-body" data-modal-body></div>' +
      '</div>';
    document.body.appendChild(overlay);

    var bodyEl = overlay.querySelector('[data-modal-body]');
    var tabsEl = overlay.querySelector('.tm-drawer-tabs');
    tabsEl.querySelectorAll('[data-tab-idx]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        tabsEl.querySelectorAll('.tm-drawer-tab').forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        renderTab(parseInt(btn.getAttribute('data-tab-idx'), 10), bodyEl, parent, students, reservations);
      });
    });

    function close() {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      document.removeEventListener('keydown', onKey);
    }
    overlay.__closeModal = close;
    function onKey(e) {
      // Üstte rezervasyon detay modalı açıksa Esc önce onu kapatsın, veli modalı kalsın.
      if (document.getElementById('tmParentResModal')) return;
      if (e.key === 'Escape') close();
    }
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay || e.target.closest('[data-modal-close]')) close();
    });
    document.addEventListener('keydown', onKey);

    renderTab(startTab, bodyEl, parent, students, reservations);
  }

  function filtered() {
    return U.filterSearch(Store.getParents(), searchInput ? searchInput.value : '', function (p) {
      return p.firstName + ' ' + p.lastName + ' ' + p.phone + ' ' + p.email + ' ' + parentCode(p.id);
    });
  }

  function rowHtml(pa) {
    var sts = parentStudents(pa);
    return '<tr data-id="' + pa.id + '" style="cursor:pointer">' +
      '<td><code class="tm-res-code-cell">' + U.escapeHtml(parentCode(pa.id)) + '</code></td>' +
      '<td>' + U.escapeHtml(U.fullName(pa.firstName, pa.lastName)) + '</td>' +
      '<td>' + U.escapeHtml(pa.phone || '—') + '</td>' +
      '<td>' + U.escapeHtml(pa.email || '—') + '</td>' +
      '<td>' + studentIdCell(sts) + '</td>' +
      '<td>' + studentNameCell(sts) + '</td>' +
      '<td>' + studentGradeCell(sts) + '</td>' +
      '<td style="white-space:nowrap">' + detailBtn(pa.id) + '</td></tr>';
  }

  function cardHtml(pa) {
    var sts = parentStudents(pa);
    return '<article class="tm-list-card" data-id="' + pa.id + '">' +
      '<div class="tm-list-card-head"><div><strong>' + U.escapeHtml(U.fullName(pa.firstName, pa.lastName)) + '</strong><code class="tm-res-code-cell">' + U.escapeHtml(parentCode(pa.id)) + '</code></div>' +
      detailBtn(pa.id) + '</div>' +
      '<div class="tm-list-card-body">' +
        '<div><span class="tm-list-card-label">Veli Telefonu</span> ' + U.escapeHtml(pa.phone || '—') + '</div>' +
        '<div><span class="tm-list-card-label">Veli E-postası</span> ' + U.escapeHtml(pa.email || '—') + '</div>' +
        '<div><span class="tm-list-card-label">Öğrenci ID</span> ' + studentIdCell(sts) + '</div>' +
        '<div><span class="tm-list-card-label">Öğrenci Adı</span> ' + studentNameCell(sts) + '</div>' +
        '<div><span class="tm-list-card-label">Sınıf</span> ' + studentGradeCell(sts) + '</div>' +
      '</div>' +
    '</article>';
  }

  function bindRowActions() {
    function openParent(id) { openDetail(Store.getParentById(id)); }
    [tbody, cardsEl].forEach(function (root) {
      if (!root) return;
      root.querySelectorAll('[data-detail]').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          openParent(btn.getAttribute('data-detail'));
        });
      });
      root.querySelectorAll('tr[data-id], .tm-list-card[data-id]').forEach(function (el) {
        el.addEventListener('click', function (e) {
          if (e.target.closest('button')) return;
          openParent(el.getAttribute('data-id'));
        });
      });
    });
  }

  function render() {
    if (!tbody) return;
    var loading = document.getElementById('tmParentsLoading');
    var wrap = document.getElementById('tmParentsTableWrap');
    try {
      var pageSize = parseInt(pageSizeSelect ? pageSizeSelect.value : '10', 10);
      var p = U.paginate(filtered(), page, pageSize);
      if (countEl) countEl.textContent = p.total + ' veli';
      tbody.innerHTML = p.items.map(rowHtml).join('');
      if (cardsEl) cardsEl.innerHTML = p.items.map(cardHtml).join('');
      U.renderPagination(paginationEl, p.page, p.pages, function (np) { page = np; render(); });
      bindRowActions();
      if (loading) loading.hidden = true;
      if (wrap) wrap.hidden = false;
      if (cardsEl) cardsEl.hidden = false;
      if (paginationEl) paginationEl.hidden = p.pages <= 1;
    } catch (err) {
      if (loading) { loading.hidden = false; loading.textContent = 'Liste yüklenemedi: ' + err.message; }
      console.error(err);
    }
  }

  if (searchInput) searchInput.addEventListener('input', U.debounce(function () { page = 1; render(); }, 200));
  if (pageSizeSelect) pageSizeSelect.addEventListener('change', function () { page = 1; render(); });
  if (exportBtn && Export) exportBtn.addEventListener('click', function () {
    if (Perms && !Perms.guard('export')) return;
    Export.exportTable('veliler.csv', filtered(), [
      { key: 'id', label: 'Veli ID', value: function (p) { return parentCode(p.id); } },
      { key: 'firstName', label: 'Ad' },
      { key: 'lastName', label: 'Soyad' },
      { key: 'phone', label: 'Veli Telefonu' },
      { key: 'email', label: 'Veli E-postası' }
    ]);
  });
  window.TMOnSessionChange = render;
  render();
  var openId = U.qs('id');
  if (openId) {
    var openPa = Store.getParentById(openId);
    if (openPa) openDetail(openPa);
  }
})();
