/**
 * Form modal — öğretmen seçimi, saat değiştirme vb.
 */
(function (global) {
  'use strict';

  var overlay = null;

  function ensure() {
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.className = 'tm-form-overlay';
    overlay.id = 'tmFormDialog';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML =
      '<div class="tm-form-dialog" role="dialog" aria-modal="true">' +
        '<header class="tm-form-head"><h2 class="tm-form-title" data-fd-title></h2></header>' +
        '<form class="tm-form-body" data-fd-form></form>' +
        '<footer class="tm-form-foot">' +
          '<button type="button" class="tm-btn tm-btn--ghost" data-fd-cancel>İptal</button>' +
          '<button type="submit" class="tm-btn tm-btn--primary" data-fd-submit form="tmFormInner">Kaydet</button>' +
        '</footer>' +
      '</div>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay || e.target.closest('[data-fd-cancel]')) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) close();
    });
    return overlay;
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('tm-drawer-open');
  }

  function fieldHtml(f) {
    var id = 'tmfd_' + f.name;
    if (f.type === 'select') {
      var opts = (f.options || []).map(function (o) {
        var val = typeof o === 'object' ? o.value : o;
        var lab = typeof o === 'object' ? o.label : o;
        var sel = f.value === val ? ' selected' : '';
        return '<option value="' + String(val).replace(/"/g, '&quot;') + '"' + sel + '>' + lab + '</option>';
      }).join('');
      return '<label class="tm-form-field" for="' + id + '">' + f.label +
        '<select class="tm-dg-control" id="' + id + '" name="' + f.name + '"' + (f.required !== false ? ' required' : '') + '>' + opts + '</select></label>';
    }
    if (f.type === 'textarea') {
      return '<label class="tm-form-field" for="' + id + '">' + f.label +
        '<textarea class="tm-dg-control" id="' + id + '" name="' + f.name + '" rows="' + (f.rows || 3) + '"' +
        (f.required !== false ? ' required' : '') + '>' +
        (f.value || '') + '</textarea></label>';
    }
    if (f.type === 'checkbox') {
      return '<label class="tm-form-field tm-form-check" for="' + id + '">' +
        '<input type="checkbox" id="' + id + '" name="' + f.name + '"' + (f.value ? ' checked' : '') + '> ' +
        f.label + '</label>';
    }
    return '<label class="tm-form-field" for="' + id + '">' + f.label +
      '<input class="tm-dg-control" type="' + (f.type || 'text') + '" id="' + id + '" name="' + f.name + '" value="' +
      (f.value || '').replace(/"/g, '&quot;') + '"' + (f.required !== false ? ' required' : '') + '></label>';
  }

  function open(opts) {
    var el = ensure();
    opts = opts || {};
    el.querySelector('[data-fd-title]').textContent = opts.title || 'Form';
    var form = el.querySelector('[data-fd-form]');
    form.id = 'tmFormInner';
    form.innerHTML = (opts.description ? '<p class="tm-form-desc">' + opts.description + '</p>' : '') +
      (opts.fields || []).map(fieldHtml).join('');
    el.querySelector('[data-fd-submit]').textContent = opts.submitLabel || 'Kaydet';
    form.onsubmit = function (e) {
      e.preventDefault();
      var data = {};
      (opts.fields || []).forEach(function (f) {
        var inp = form.querySelector('[name="' + f.name + '"]');
        if (inp) data[f.name] = inp.type === 'checkbox' ? inp.checked : inp.value;
      });
      close();
      if (opts.onSubmit) opts.onSubmit(data);
    };
    el.classList.add('is-open');
    el.setAttribute('aria-hidden', 'false');
    document.body.classList.add('tm-drawer-open');
    var first = form.querySelector('input, select, textarea');
    if (first) first.focus();
  }

  global.TMFormDialog = { open: open, close: close };
})(typeof window !== 'undefined' ? window : this);
