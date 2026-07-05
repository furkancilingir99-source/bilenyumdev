/**
 * Mevcut kullanıcı yetki kontrolü
 */
(function (global) {
  'use strict';

  function user() {
    return global.TMStore ? global.TMStore.getCurrentUser() : null;
  }

  function can(action) {
    var u = user();
    if (!u || !u.isActive) return false;
    if (u.role === 'super_admin') return true;
    if (action === 'view') return u.canView;
    if (action === 'create') return u.canCreate;
    if (action === 'edit') return u.canEdit;
    if (action === 'cancel') return u.canCancel;
    if (action === 'export') return u.canExport;
    return false;
  }

  function guard(action, onDenied) {
    if (can(action)) return true;
    if (global.TMToast) global.TMToast.error('Bu işlem için yetkiniz yok.');
    else if (onDenied) onDenied();
    return false;
  }

  global.TMPermissions = { can: can, guard: guard, user: user };
})(typeof window !== 'undefined' ? window : this);
