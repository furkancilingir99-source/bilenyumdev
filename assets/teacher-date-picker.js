/**
 * Tıklanarak gün / ay / yıl seçilen tarih alanı
 * window.TeacherDatePicker
 */
(function (global) {
  'use strict';

  var MONTH_NAMES = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  var MONTH_SHORT = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  var activePicker = null;

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  function parseISO(iso) {
    if (!iso) return null;
    var p = iso.split('-');
    return new Date(+p[0], +p[1] - 1, +p[2], 12, 0, 0);
  }

  function formatISO(d) {
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function daysInMonth(year, monthIndex) {
    return new Date(year, monthIndex + 1, 0).getDate();
  }

  function compareISO(a, b) {
    if (a === b) return 0;
    return a < b ? -1 : 1;
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function onGlobalClick(e) {
    if (!activePicker) return;
    if (e.target.closest('.tp-date-picker')) return;
    if (e.target.closest('.tp-date-popover')) return;
    activePicker.close();
  }

  function onGlobalReposition() {
    if (activePicker && activePicker.isOpen) activePicker._positionPopover();
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('click', onGlobalClick);
    window.addEventListener('resize', onGlobalReposition);
    window.addEventListener('scroll', onGlobalReposition, true);
  }

  function TeacherDatePicker(host, options) {
    if (!host) return;
    options = options || {};
    this.host = host;
    this.id = options.id || ('tdp-' + Math.random().toString(36).slice(2, 9));
    this.label = options.label || 'Tarih';
    this.min = options.min || '2026-03-10';
    this.max = options.max || '2026-06-29';
    this.value = options.value || this.max;
    this.onChange = typeof options.onChange === 'function' ? options.onChange : function () {};
    this.isOpen = false;
    this._popoverSlot = null;
    this._ensureInBounds();
    this._render();
    this._bind();
    this._syncSelects();
    this._updateTrigger();
  }

  TeacherDatePicker.prototype._ensureInBounds = function () {
    if (compareISO(this.value, this.min) < 0) this.value = this.min;
    if (compareISO(this.value, this.max) > 0) this.value = this.max;
  };

  TeacherDatePicker.prototype._parts = function () {
    var d = parseISO(this.value);
    return { year: d.getFullYear(), monthIndex: d.getMonth(), day: d.getDate() };
  };

  TeacherDatePicker.prototype._setParts = function (year, monthIndex, day, silent) {
    var maxDay = daysInMonth(year, monthIndex);
    if (day > maxDay) day = maxDay;
    if (day < 1) day = 1;

    var iso = formatISO(new Date(year, monthIndex, day, 12, 0, 0));
    if (compareISO(iso, this.min) < 0) iso = this.min;
    if (compareISO(iso, this.max) > 0) iso = this.max;

    var changed = iso !== this.value;
    this.value = iso;
    this._syncSelects();
    this._updateTrigger();
    if (changed && !silent) this.onChange(this.value);
  };

  TeacherDatePicker.prototype._render = function () {
    var minY = parseISO(this.min).getFullYear();
    var maxY = parseISO(this.max).getFullYear();
    var yearHtml = '';
    var y;
    for (y = minY; y <= maxY; y++) {
      yearHtml += '<option value="' + y + '">' + y + '</option>';
    }

    this.host.innerHTML =
      '<div class="tp-date-picker" id="' + escapeHtml(this.id) + '">' +
        '<button type="button" class="tp-date-trigger" aria-haspopup="dialog" aria-expanded="false" aria-label="' + escapeHtml(this.label) + ' seç">' +
          '<span class="tp-date-trigger-ico" aria-hidden="true">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
              '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>' +
            '</svg>' +
          '</span>' +
          '<span class="tp-date-trigger-text">' +
            '<span class="tp-date-part is-day" data-part="day">—</span>' +
            '<span class="tp-date-part-sep">·</span>' +
            '<span class="tp-date-part is-month" data-part="month">—</span>' +
            '<span class="tp-date-part-sep">·</span>' +
            '<span class="tp-date-part is-year" data-part="year">—</span>' +
          '</span>' +
          '<span class="tp-date-trigger-chevron" aria-hidden="true">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>' +
          '</span>' +
        '</button>' +
        '<div class="tp-date-popover" hidden role="dialog" aria-label="' + escapeHtml(this.label) + '">' +
          '<div class="tp-date-popover-head">' + escapeHtml(this.label) + '</div>' +
          '<div class="tp-date-popover-grid">' +
            '<div class="tp-date-popover-field">' +
              '<label class="tp-date-popover-label">Gün</label>' +
              '<div class="tp-date-select-wrap">' +
                '<select class="tp-date-select" data-part="day" aria-label="Gün"></select>' +
                '<span class="tp-date-select-chevron" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><polyline points="6 9 12 15 18 9"/></svg></span>' +
              '</div>' +
            '</div>' +
            '<div class="tp-date-popover-field">' +
              '<label class="tp-date-popover-label">Ay</label>' +
              '<div class="tp-date-select-wrap">' +
                '<select class="tp-date-select" data-part="month" aria-label="Ay"></select>' +
                '<span class="tp-date-select-chevron" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><polyline points="6 9 12 15 18 9"/></svg></span>' +
              '</div>' +
            '</div>' +
            '<div class="tp-date-popover-field">' +
              '<label class="tp-date-popover-label">Yıl</label>' +
              '<div class="tp-date-select-wrap">' +
                '<select class="tp-date-select" data-part="year" aria-label="Yıl">' + yearHtml + '</select>' +
                '<span class="tp-date-select-chevron" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><polyline points="6 9 12 15 18 9"/></svg></span>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    this.root = this.host.querySelector('.tp-date-picker');
    this.trigger = this.host.querySelector('.tp-date-trigger');
    this.popover = this.host.querySelector('.tp-date-popover');
    this.daySelect = this.host.querySelector('select[data-part="day"]');
    this.monthSelect = this.host.querySelector('select[data-part="month"]');
    this.yearSelect = this.host.querySelector('select[data-part="year"]');
    this.partDay = this.host.querySelector('.tp-date-part.is-day');
    this.partMonth = this.host.querySelector('.tp-date-part.is-month');
    this.partYear = this.host.querySelector('.tp-date-part.is-year');
    this._popoverSlot = document.createComment('tp-date-popover-slot');
    this.popover.parentNode.insertBefore(this._popoverSlot, this.popover);
  };

  TeacherDatePicker.prototype._monthBoundsForYear = function (year) {
    var minP = parseISO(this.min);
    var maxP = parseISO(this.max);
    var startM = 0;
    var endM = 11;
    if (year === minP.getFullYear()) startM = minP.getMonth();
    if (year === maxP.getFullYear()) endM = maxP.getMonth();
    return { startM: startM, endM: endM };
  };

  TeacherDatePicker.prototype._dayBoundsForYearMonth = function (year, monthIndex) {
    var minP = parseISO(this.min);
    var maxP = parseISO(this.max);
    var startD = 1;
    var endD = daysInMonth(year, monthIndex);
    if (year === minP.getFullYear() && monthIndex === minP.getMonth()) startD = minP.getDate();
    if (year === maxP.getFullYear() && monthIndex === maxP.getMonth()) endD = maxP.getDate();
    return { startD: startD, endD: endD };
  };

  TeacherDatePicker.prototype._rebuildMonthOptions = function () {
    if (!this.monthSelect || !this.yearSelect) return;
    var year = parseInt(this.yearSelect.value, 10);
    var bounds = this._monthBoundsForYear(year);
    var parts = this._parts();
    var html = '';
    var m;
    for (m = bounds.startM; m <= bounds.endM; m++) {
      html += '<option value="' + m + '">' + MONTH_NAMES[m] + '</option>';
    }
    this.monthSelect.innerHTML = html;
    var monthIndex = parts.monthIndex;
    if (year === parts.year) monthIndex = parts.monthIndex;
    if (monthIndex < bounds.startM) monthIndex = bounds.startM;
    if (monthIndex > bounds.endM) monthIndex = bounds.endM;
    this.monthSelect.value = String(monthIndex);
  };

  TeacherDatePicker.prototype._fillDayOptions = function () {
    if (!this.daySelect || !this.yearSelect || !this.monthSelect) return;
    var year = parseInt(this.yearSelect.value, 10);
    var monthIndex = parseInt(this.monthSelect.value, 10);
    var bounds = this._dayBoundsForYearMonth(year, monthIndex);
    var parts = this._parts();
    var html = '';
    var d;
    for (d = bounds.startD; d <= bounds.endD; d++) {
      html += '<option value="' + d + '">' + d + '</option>';
    }
    this.daySelect.innerHTML = html;
    var day = parts.day;
    if (year === parts.year && monthIndex === parts.monthIndex) day = parts.day;
    if (day < bounds.startD) day = bounds.startD;
    if (day > bounds.endD) day = bounds.endD;
    this.daySelect.value = String(day);
  };

  TeacherDatePicker.prototype._syncSelects = function () {
    var parts = this._parts();
    if (this.yearSelect) this.yearSelect.value = String(parts.year);
    this._rebuildMonthOptions();
    this._fillDayOptions();
  };

  TeacherDatePicker.prototype._updateTrigger = function () {
    var parts = this._parts();
    if (this.partDay) this.partDay.textContent = String(parts.day);
    if (this.partMonth) this.partMonth.textContent = MONTH_SHORT[parts.monthIndex];
    if (this.partYear) this.partYear.textContent = String(parts.year);
  };

  TeacherDatePicker.prototype._positionPopover = function () {
    if (!this.popover || !this.trigger) return;
    var rect = this.trigger.getBoundingClientRect();
    var width = Math.max(300, Math.min(320, rect.width));
    var margin = 8;
    var left = rect.left;
    var top = rect.bottom + margin;

    this.popover.style.position = 'fixed';
    this.popover.style.width = width + 'px';
    this.popover.style.left = left + 'px';
    this.popover.style.top = top + 'px';
    this.popover.style.right = 'auto';
    this.popover.style.bottom = 'auto';
    this.popover.style.zIndex = '1200';

    var popRect = this.popover.getBoundingClientRect();
    if (left + popRect.width > window.innerWidth - margin) {
      left = window.innerWidth - popRect.width - margin;
      this.popover.style.left = Math.max(margin, left) + 'px';
    }
    if (top + popRect.height > window.innerHeight - margin) {
      top = rect.top - popRect.height - margin;
      if (top < margin) top = margin;
      this.popover.style.top = top + 'px';
    }
  };

  TeacherDatePicker.prototype._mountPopover = function () {
    if (!this.popover || this.popover.parentNode === document.body) return;
    document.body.appendChild(this.popover);
  };

  TeacherDatePicker.prototype._restorePopover = function () {
    if (!this.popover || !this._popoverSlot || this.popover.parentNode !== document.body) return;
    this._popoverSlot.parentNode.insertBefore(this.popover, this._popoverSlot.nextSibling);
    this.popover.style.position = '';
    this.popover.style.left = '';
    this.popover.style.top = '';
    this.popover.style.width = '';
    this.popover.style.right = '';
    this.popover.style.bottom = '';
    this.popover.style.zIndex = '';
  };

  TeacherDatePicker.prototype.open = function () {
    if (!this.popover || this.isOpen) return;
    if (activePicker && activePicker !== this) activePicker.close();

    this.isOpen = true;
    this._mountPopover();
    this.popover.hidden = false;
    this._positionPopover();

    if (this.trigger) {
      this.trigger.classList.add('is-open');
      this.trigger.setAttribute('aria-expanded', 'true');
    }
    if (this.root) this.root.classList.add('is-open');
    activePicker = this;
  };

  TeacherDatePicker.prototype.close = function () {
    if (!this.popover || !this.isOpen) return;
    this.isOpen = false;
    this.popover.hidden = true;
    this._restorePopover();

    if (this.trigger) {
      this.trigger.classList.remove('is-open');
      this.trigger.setAttribute('aria-expanded', 'false');
    }
    if (this.root) this.root.classList.remove('is-open');
    if (activePicker === this) activePicker = null;
  };

  TeacherDatePicker.prototype.toggle = function () {
    if (this.isOpen) this.close();
    else this.open();
  };

  TeacherDatePicker.prototype.getValue = function () {
    return this.value;
  };

  TeacherDatePicker.prototype.setValue = function (iso, silent) {
    this.value = iso;
    this._ensureInBounds();
    this._syncSelects();
    this._updateTrigger();
    if (!silent) this.onChange(this.value);
  };

  TeacherDatePicker.prototype.setBounds = function (min, max) {
    if (min) this.min = min;
    if (max) this.max = max;
    this._ensureInBounds();
    this._syncSelects();
    this._updateTrigger();
  };

  TeacherDatePicker.prototype._bind = function () {
    var self = this;

    if (this.root) {
      this.root.addEventListener('click', function (e) { e.stopPropagation(); });
    }

    function focusSelect(target) {
      if (!target) return;
      target.focus();
      if (typeof target.showPicker === 'function') {
        try { target.showPicker(); } catch (err) { /* tarayıcı izin vermezse yoksay */ }
      }
    }

    if (this.trigger) {
      this.trigger.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        self.toggle();
      });

      this.trigger.querySelectorAll('.tp-date-part[data-part]').forEach(function (part) {
        part.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          var name = part.getAttribute('data-part');
          var target = name === 'day' ? self.daySelect : name === 'month' ? self.monthSelect : self.yearSelect;
          if (!self.isOpen) {
            self.open();
            window.requestAnimationFrame(function () {
              window.requestAnimationFrame(function () { focusSelect(target); });
            });
          } else {
            focusSelect(target);
          }
        });
      });
    }

    function onSelectChange() {
      var year = parseInt(self.yearSelect.value, 10);
      var monthIndex = parseInt(self.monthSelect.value, 10);
      var day = parseInt(self.daySelect.value, 10);
      self._setParts(year, monthIndex, day);
    }

    [this.daySelect, this.monthSelect, this.yearSelect].forEach(function (sel) {
      if (!sel) return;
      sel.addEventListener('mousedown', function (e) { e.stopPropagation(); });
      sel.addEventListener('click', function (e) { e.stopPropagation(); });
    });

    if (this.daySelect) this.daySelect.addEventListener('change', onSelectChange);
    if (this.monthSelect) {
      this.monthSelect.addEventListener('change', function () {
        self._fillDayOptions();
        onSelectChange();
      });
    }
    if (this.yearSelect) {
      this.yearSelect.addEventListener('change', function () {
        self._rebuildMonthOptions();
        self._fillDayOptions();
        onSelectChange();
      });
    }

    if (this.popover) {
      this.popover.addEventListener('click', function (e) { e.stopPropagation(); });
    }
  };

  TeacherDatePicker.formatDisplay = function (iso) {
    var d = parseISO(iso);
    if (!d) return '—';
    return d.getDate() + ' ' + MONTH_NAMES[d.getMonth()] + ' ' + d.getFullYear();
  };

  TeacherDatePicker.formatRange = function (from, to) {
    return TeacherDatePicker.formatDisplay(from) + ' — ' + TeacherDatePicker.formatDisplay(to);
  };

  TeacherDatePicker.compare = compareISO;
  TeacherDatePicker.closeActive = function () {
    if (activePicker) activePicker.close();
  };

  global.TeacherDatePicker = TeacherDatePicker;
})(typeof window !== 'undefined' ? window : global);
