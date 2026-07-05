/**
 * Kullanıcılar ve yetkiler
 */
(function () {
  'use strict';

  var Store = window.TMStore;
  var U = window.TMUtils;
  var Perms = window.TMPermissions;
  if (!Store) return;

  var tbody = document.getElementById('tmUsersBody');

  function canEditUsers() {
    return !Perms || Perms.can('edit');
  }

  function permSwitch(userId, field, checked) {
    if (!canEditUsers()) {
      if (Perms) Perms.guard('edit');
      render();
      return;
    }
    var target = Store.getUsers().find(function (u) { return u.id === userId; });
    if (!target || target.role === 'super_admin') {
      U.notifyError('Bu kullanıcının yetkileri değiştirilemez.');
      render();
      return;
    }
    var current = Store.getCurrentUser();
    if (current && current.id === userId) {
      U.notifyError('Kendi yetkilerinizi buradan değiştiremezsiniz.');
      render();
      return;
    }
    var perms = {};
    perms[field] = checked;
    Store.updateUserPermissions(userId, perms);
    U.notifySuccess('Yetki güncellendi.');
  }

  function render() {
    if (!tbody) return;
    var loading = document.getElementById('tmUsersLoading');
    var wrap = document.getElementById('tmUsersTableWrap');
    try {
    var editable = canEditUsers();
    tbody.innerHTML = Store.getUsers().map(function (u) {
      var locked = u.role === 'super_admin' || !editable;
      return '<tr data-user="' + u.id + '">' +
        '<td>' + U.escapeHtml(U.fullName(u.firstName, u.lastName)) + '</td>' +
        '<td>' + U.escapeHtml(u.email) + '</td>' +
        '<td>' + u.role + '</td>' +
        switchCell(u, 'canView', locked) +
        switchCell(u, 'canCreate', locked) +
        switchCell(u, 'canEdit', locked) +
        switchCell(u, 'canCancel', locked) +
        switchCell(u, 'canExport', locked) +
        '<td>' + (u.isActive ? 'Aktif' : 'Pasif') + '</td></tr>';
    }).join('');
    tbody.querySelectorAll('.tm-switch input').forEach(function (inp) {
      inp.addEventListener('change', function () {
        permSwitch(inp.getAttribute('data-user'), inp.getAttribute('data-field'), inp.checked);
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

  render();
})();
