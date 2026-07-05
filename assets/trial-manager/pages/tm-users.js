/**
 * Kullanıcılar ve yetkiler
 */
(function () {
  'use strict';

  var Api = window.TMApi;
  var Store = (window.TMBridge && window.TMBridge.store()) || window.TMStore;
  var U = window.TMUtils;
  var SL = window.TMStatusLabels;
  var Perms = window.TMPermissions;
  var Drawer = window.TMDetailDrawer;
  var Export = window.TMExportUtils;
  if (!Api && !Store) return;

  function getUsers() {
    return Api && Api.getUsers ? Api.getUsers() : Store.getUsers();
  }

  function getCurrentUser() {
    return Api && Api.getCurrentUser ? Api.getCurrentUser() : Store.getCurrentUser();
  }

  function getAuditLogs() {
    return Api && Api.getAuditLogs ? Api.getAuditLogs() : Store.getAuditLogs();
  }

  var tbody = document.getElementById('tmUsersBody');
  var exportBtn = document.getElementById('tmUsersExport');

  function roleLabel(role) {
    return SL && SL.userRoleLabel ? SL.userRoleLabel(role) : role;
  }

  function permLabel(on) {
    return on ? '<span class="tm-badge tm-badge--green">Evet</span>' : '<span class="tm-badge tm-badge--muted">Hayır</span>';
  }

  function canEditUsers() {
    return !Perms || Perms.can('edit');
  }

  function permSwitch(userId, field, checked) {
    if (!canEditUsers()) {
      if (Perms) Perms.guard('edit');
      render();
      return;
    }
    var target = getUsers().find(function (u) { return u.id === userId; });
    if (!target || target.role === 'super_admin') {
      U.notifyError('Bu kullanıcının yetkileri değiştirilemez.');
      render();
      return;
    }
    var current = getCurrentUser();
    if (current && current.id === userId) {
      U.notifyError('Kendi yetkilerinizi buradan değiştiremezsiniz.');
      render();
      return;
    }
    var perms = {};
    perms[field] = checked;
    if (Api && Api.updateUserPermissions) Api.updateUserPermissions(userId, perms);
    else Store.updateUserPermissions(userId, perms);
    U.notifySuccess('Yetki güncellendi.');
    if (window.TMOnSessionChange) window.TMOnSessionChange();
  }

  function switchToUser(userId) {
    var res = Api && Api.switchCurrentUser ? Api.switchCurrentUser(userId) : Store.switchCurrentUser(userId);
    if (!res.ok) {
      U.notifyError(res.error || 'Kullanıcı değiştirilemedi.');
      return;
    }
    U.notifySuccess('Oturum kullanıcısı: ' + res.user.firstName + ' ' + res.user.lastName);
    if (Perms && Perms.applyPageChrome) Perms.applyPageChrome();
    if (window.TMAppShell && window.TMAppShell.refreshSidebarBadges) window.TMAppShell.refreshSidebarBadges();
    if (window.TMOnSessionChange) window.TMOnSessionChange();
    render();
  }

  function userAuditRows(userId) {
    return getAuditLogs().filter(function (l) { return l.createdByUserId === userId; }).slice(0, 50);
  }

  function openDetail(u) {
    if (!Drawer) return;
    var current = getCurrentUser();
    var isSelf = current && current.id === u.id;
    Drawer.open({
      title: U.fullName(u.firstName, u.lastName),
      subtitle: roleLabel(u.role) + ' · ' + u.email,
      tabs: [{ label: 'Yetkiler' }, { label: 'Denetim geçmişi' }],
      onTab: function (idx, body) {
        if (idx === 0) {
          body.innerHTML =
            '<div class="tm-detail-grid">' +
            '<div><div class="tm-detail-cell-label">Rol</div><div class="tm-detail-cell-value">' + U.escapeHtml(roleLabel(u.role)) + '</div></div>' +
            '<div><div class="tm-detail-cell-label">Durum</div><div class="tm-detail-cell-value">' + (u.isActive ? 'Aktif' : 'Pasif') + '</div></div>' +
            '<div><div class="tm-detail-cell-label">Görüntüle</div><div class="tm-detail-cell-value">' + permLabel(u.canView) + '</div></div>' +
            '<div><div class="tm-detail-cell-label">Oluştur</div><div class="tm-detail-cell-value">' + permLabel(u.canCreate) + '</div></div>' +
            '<div><div class="tm-detail-cell-label">Düzenle</div><div class="tm-detail-cell-value">' + permLabel(u.canEdit) + '</div></div>' +
            '<div><div class="tm-detail-cell-label">İptal</div><div class="tm-detail-cell-value">' + permLabel(u.canCancel) + '</div></div>' +
            '<div><div class="tm-detail-cell-label">Dışa aktar</div><div class="tm-detail-cell-value">' + permLabel(u.canExport) + '</div></div>' +
            '</div>' +
            (!isSelf
              ? '<div class="tm-detail-actions" style="margin-top:12px"><button type="button" class="tm-btn tm-btn--primary tm-btn--sm" data-switch-user="' + u.id + '">Bu kullanıcı olarak geç</button></div>'
              : '<p class="tm-empty" style="margin-top:12px">Şu an bu kullanıcı ile oturumdasınız.</p>');
          body.querySelector('[data-switch-user]') && body.querySelector('[data-switch-user]').addEventListener('click', function () {
            switchToUser(u.id);
          });
        } else {
          var logs = userAuditRows(u.id);
          body.innerHTML = logs.length
            ? '<table class="tm-inner-table"><thead><tr><th>Tarih</th><th>Varlık</th><th>İşlem</th><th>Açıklama</th></tr></thead><tbody>' +
              logs.map(function (l) {
                return '<tr><td>' + U.formatDateTime(l.createdAt) + '</td><td>' + U.escapeHtml(SL.auditEntityLabel(l.entityType)) +
                  '</td><td>' + U.escapeHtml(SL.auditActionLabel(l.action)) + '</td><td>' + U.escapeHtml(l.description) + '</td></tr>';
              }).join('') + '</tbody></table>'
            : '<p class="tm-empty">Bu kullanıcıya ait denetim kaydı yok.</p>';
        }
      }
    });
  }

  function render() {
    if (!tbody) return;
    var loading = document.getElementById('tmUsersLoading');
    var wrap = document.getElementById('tmUsersTableWrap');
    try {
      var editable = canEditUsers();
      tbody.innerHTML = getUsers().map(function (u) {
        var locked = u.role === 'super_admin' || !editable;
        var current = getCurrentUser();
        var isCurrent = current && current.id === u.id;
        return '<tr data-user="' + u.id + '" style="cursor:pointer">' +
          '<td>' + U.escapeHtml(U.fullName(u.firstName, u.lastName)) + (isCurrent ? ' <span class="tm-badge tm-badge--blue">Aktif oturum</span>' : '') + '</td>' +
          '<td>' + U.escapeHtml(u.email) + '</td>' +
          '<td>' + U.escapeHtml(roleLabel(u.role)) + '</td>' +
          switchCell(u, 'canView', locked) +
          switchCell(u, 'canCreate', locked) +
          switchCell(u, 'canEdit', locked) +
          switchCell(u, 'canCancel', locked) +
          switchCell(u, 'canExport', locked) +
          '<td>' + (u.isActive ? 'Aktif' : 'Pasif') + '</td>' +
          '<td><button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-detail="' + u.id + '">Detay</button></td></tr>';
      }).join('');
      tbody.querySelectorAll('.tm-switch').forEach(function (lab) {
        lab.addEventListener('click', function (e) { e.stopPropagation(); });
      });
      tbody.querySelectorAll('.tm-switch input').forEach(function (inp) {
        inp.addEventListener('change', function (e) {
          e.stopPropagation();
          permSwitch(inp.getAttribute('data-user'), inp.getAttribute('data-field'), inp.checked);
        });
      });
      tbody.querySelectorAll('[data-detail]').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          var u = getUsers().find(function (x) { return x.id === btn.getAttribute('data-detail'); });
          if (u) openDetail(u);
        });
      });
      tbody.querySelectorAll('tr[data-user]').forEach(function (tr) {
        tr.addEventListener('click', function (e) {
          if (e.target.closest('button, label, input')) return;
          var u = getUsers().find(function (x) { return x.id === tr.getAttribute('data-user'); });
          if (u) openDetail(u);
        });
      });
      if (loading) loading.hidden = true;
      if (wrap) wrap.hidden = false;
    } catch (err) {
      if (loading) { loading.hidden = false; loading.textContent = 'Liste yüklenemedi: ' + err.message; }
      console.error(err);
    }
  }

  function switchCell(u, field, locked) {
    return '<td><label class="tm-switch"><input type="checkbox" data-user="' + u.id + '" data-field="' + field + '"' +
      (u[field] ? ' checked' : '') + (locked ? ' disabled' : '') + '><span class="tm-switch-slider"></span></label></td>';
  }

  if (exportBtn && Export) {
    exportBtn.addEventListener('click', function () {
      if (Perms && !Perms.guard('export')) return;
      Export.exportTable('kullanicilar.csv', getUsers(), [
        { key: 'firstName', label: 'Ad' },
        { key: 'lastName', label: 'Soyad' },
        { key: 'email', label: 'E-posta' },
        { key: 'role', label: 'Rol', value: function (u) { return roleLabel(u.role); } },
        { key: 'canView', label: 'Görüntüle' },
        { key: 'canCreate', label: 'Oluştur' },
        { key: 'canEdit', label: 'Düzenle' },
        { key: 'canCancel', label: 'İptal' },
        { key: 'canExport', label: 'Dışa aktar' },
        { key: 'isActive', label: 'Aktif' }
      ]);
    });
  }

  render();
  window.TMOnSessionChange = render;
})();
