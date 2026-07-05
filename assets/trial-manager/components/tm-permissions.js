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

  function disableIfNoPermission(selector, action, label, root) {
    var scope = root || document;
    scope.querySelectorAll(selector).forEach(function (el) {
      if (!can(action)) {
        if (el.tagName === 'A') {
          el.setAttribute('aria-disabled', 'true');
          el.setAttribute('tabindex', '-1');
        } else {
          el.disabled = true;
          el.setAttribute('aria-disabled', 'true');
        }
        el.title = label || 'Bu işlem için yetkiniz yok';
        el.classList.add('is-perm-disabled');
      } else {
        el.classList.remove('is-perm-disabled');
        if (el.getAttribute('data-tm-require')) {
          el.removeAttribute('aria-disabled');
          if (el.tagName === 'A') {
            el.removeAttribute('tabindex');
          } else if (!el.hasAttribute('data-force-disabled')) {
            el.disabled = false;
          }
        }
      }
    });
  }

  function applyPageChrome(root) {
    var u = user();
    if (!u) return;
    var scope = root || document;

    if (!root) {
      document.body.classList.toggle('tm-viewer-mode', u.role === 'viewer');
    }

    disableIfNoPermission('#tmSimulateRequest, #tmRequestsSimulate', 'create', scope);
    disableIfNoPermission('#tmResetMock', 'edit', undefined, scope);
    disableIfNoPermission('[data-tm-require="create"]', 'create', undefined, scope);
    disableIfNoPermission('[data-tm-require="edit"]', 'edit', undefined, scope);
    disableIfNoPermission('[data-tm-require="cancel"]', 'cancel', undefined, scope);

    scope.querySelectorAll('[data-tm-export]').forEach(function (el) {
      if (!can('export')) {
        el.disabled = true;
        el.title = 'Dışa aktarma yetkiniz yok';
        el.classList.add('is-perm-disabled');
      }
    });

    if (!root) {
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
  }

  global.TMPermissions = {
    can: can,
    guard: guard,
    user: user,
    applyPageChrome: applyPageChrome
  };
})(typeof window !== 'undefined' ? window : this);
