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

  function disableIfNoPermission(selector, action, label) {
    document.querySelectorAll(selector).forEach(function (el) {
      if (!can(action)) {
        el.disabled = true;
        el.setAttribute('aria-disabled', 'true');
        el.title = label || 'Bu işlem için yetkiniz yok';
        el.classList.add('is-perm-disabled');
      }
    });
  }

  function applyPageChrome() {
    var u = user();
    if (!u) return;

    document.body.classList.toggle('tm-viewer-mode', u.role === 'viewer');

    disableIfNoPermission('#tmSimulateRequest, #tmRequestsSimulate', 'create');
    disableIfNoPermission('#tmResetMock', 'edit');
    disableIfNoPermission('#tmPlanSave', 'create');
    disableIfNoPermission('[data-tm-require="create"]', 'create');
    disableIfNoPermission('[data-tm-require="edit"]', 'edit');
    disableIfNoPermission('[data-tm-require="cancel"]', 'cancel');

    document.querySelectorAll('[data-tm-export]').forEach(function (el) {
      if (!can('export')) {
        el.disabled = true;
        el.title = 'Dışa aktarma yetkiniz yok';
      }
    });

    var banner = document.getElementById('tmViewerBanner');
    if (u.role === 'viewer') {
      if (!banner) {
        banner = document.createElement('div');
        banner.id = 'tmViewerBanner';
        banner.className = 'tm-viewer-banner';
        banner.setAttribute('role', 'status');
        var main = document.querySelector('.tm-admin-main');
        if (main) main.insertBefore(banner, main.firstChild);
      }
      banner.textContent = 'Gözlemci modu: kayıt oluşturamaz veya düzenleyemezsiniz. Dışa aktarım ve görüntüleme açıktır.';
    } else if (banner) {
      banner.remove();
    }

    if (global.TMAppShell && global.TMAppShell.refreshHudProfile) {
      global.TMAppShell.refreshHudProfile();
    }
  }

  global.TMPermissions = {
    can: can,
    guard: guard,
    user: user,
    applyPageChrome: applyPageChrome
  };
})(typeof window !== 'undefined' ? window : this);
