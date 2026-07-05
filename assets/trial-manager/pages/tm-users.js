/**
 * Kullanıcılar ve yetkiler
 */
(function () {
  'use strict';

  var Store = window.TMStore;
  var U = window.TMUtils;
  if (!Store) return;

  var tbody = document.getElementById('tmUsersBody');

  function permSwitch(userId, field, checked) {
    var perms = {};
    perms[field] = checked;
    Store.updateUserPermissions(userId, perms);
  }

  function render() {
    if (!tbody) return;
    tbody.innerHTML = Store.getUsers().map(function (u) {
      return '<tr data-user="' + u.id + '">' +
        '<td>' + U.escapeHtml(U.fullName(u.firstName, u.lastName)) + '</td>' +
        '<td>' + U.escapeHtml(u.email) + '</td>' +
        '<td>' + u.role + '</td>' +
        switchCell(u, 'canView') +
        switchCell(u, 'canCreate') +
        switchCell(u, 'canEdit') +
        switchCell(u, 'canCancel') +
        switchCell(u, 'canExport') +
        '<td>' + (u.isActive ? 'Aktif' : 'Pasif') + '</td></tr>';
    }).join('');
    tbody.querySelectorAll('.tm-switch input').forEach(function (inp) {
      inp.addEventListener('change', function () {
        permSwitch(inp.getAttribute('data-user'), inp.getAttribute('data-field'), inp.checked);
      });
    });
    document.getElementById('tmUsersLoading').hidden = true;
    document.getElementById('tmUsersTableWrap').hidden = false;
  }

  function switchCell(u, field) {
    return '<td><label class="tm-switch"><input type="checkbox" data-user="' + u.id + '" data-field="' + field + '"' +
      (u[field] ? ' checked' : '') + '><span class="tm-switch-slider"></span></label></td>';
  }

  render();
})();
