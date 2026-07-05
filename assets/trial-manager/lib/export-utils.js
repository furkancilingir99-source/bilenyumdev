/**
 * CSV dışa aktarım
 */
(function (global) {
  'use strict';

  function escapeCell(val) {
    var s = val == null ? '' : String(val);
    if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function toCsv(rows, columns) {
    var lines = [];
    lines.push(columns.map(function (c) { return escapeCell(c.label); }).join(','));
    rows.forEach(function (row) {
      lines.push(columns.map(function (c) {
        var v = typeof c.value === 'function' ? c.value(row) : row[c.key];
        return escapeCell(v);
      }).join(','));
    });
    return '\uFEFF' + lines.join('\r\n');
  }

  function downloadCsv(filename, csvContent) {
    var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function exportTable(filename, rows, columns) {
    downloadCsv(filename, toCsv(rows, columns));
  }

  global.TMExportUtils = {
    toCsv: toCsv,
    downloadCsv: downloadCsv,
    exportTable: exportTable
  };
})(typeof window !== 'undefined' ? window : this);
