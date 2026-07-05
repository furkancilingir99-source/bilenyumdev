/**
 * Mevcut kullanıcı yetki kontrolü — Deneme Dersi Yöneticisi veri kaynağı sınırları
 */
(function (global) {
  'use strict';

  var ENTITY_CREATE_ACTIONS = {
    createTeacher: true,
    createParent: true,
    createStudent: true,
    deleteTeacher: true,
    deleteParent: true,
    deleteStudent: true
  };

  var PROFILE_EDIT_ACTIONS = {
    editTeacherProfile: true,
    editTeacherAvailability: true
  };

  function user() {
    return global.TMStore ? global.TMStore.getCurrentUser() : null;
  }

  function isSuperAdmin(u) {
    return u && u.role === 'super_admin';
  }

  function isTrialManager(u) {
    return u && u.role === 'trial_lesson_manager';
  }

  function can(action) {
    var u = user();
    if (!u || !u.isActive) return false;
    if (isSuperAdmin(u)) return true;

    if (isTrialManager(u)) {
      if (ENTITY_CREATE_ACTIONS[action] || PROFILE_EDIT_ACTIONS[action]) return false;
      if (action === 'editApplicationContact' || action === 'editApplicationStudent') return u.canEdit;
      if (action === 'editTeacherOperational') return u.canEdit;
    }

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

    disableIfNoPermission('#tmSimulateRequest, #tmRequestsSimulate', 'create', undefined, scope);
    disableIfNoPermission('#tmResetMock', 'edit', undefined, scope);
    disableIfNoPermission('#tmTeachersCreate', 'createTeacher', 'Öğretmen kaydı Ana Admin Panel\'den gelir', scope);
    disableIfNoPermission('#tmParentsCreate', 'createParent', 'Veli kaydı başvuru formundan gelir', scope);
    disableIfNoPermission('#tmStudentsCreate', 'createStudent', 'Öğrenci kaydı başvuru formundan gelir', scope);
    disableIfNoPermission('[data-tm-require="create"]', 'create', undefined, scope);
    disableIfNoPermission('[data-tm-require="edit"]', 'edit', undefined, scope);
    disableIfNoPermission('[data-tm-require="cancel"]', 'cancel', undefined, scope);
    disableIfNoPermission('[data-tm-require="edit-application-contact"]', 'editApplicationContact', undefined, scope);
    disableIfNoPermission('[data-tm-require="edit-application-student"]', 'editApplicationStudent', undefined, scope);
    disableIfNoPermission('[data-tm-require="edit-teacher-operational"]', 'editTeacherOperational', undefined, scope);

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
