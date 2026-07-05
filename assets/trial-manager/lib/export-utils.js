/**
 * CSV ve Excel (HTML tablo) dışa aktarım
 */
(function (global) {
  'use strict';

  function escapeCell(val) {
    var s = val == null ? '' : String(val);
    if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
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

  function downloadBlob(filename, blob) {
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

  function downloadCsv(filename, csvContent) {
    downloadBlob(filename, new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }));
  }

  function exportTable(filename, rows, columns) {
    downloadCsv(filename, toCsv(rows, columns));
  }

  function tableToHtml(title, rows, columns) {
    var head = columns.map(function (c) { return '<th>' + escapeHtml(c.label) + '</th>'; }).join('');
    var body = rows.map(function (row) {
      return '<tr>' + columns.map(function (c) {
        var v = typeof c.value === 'function' ? c.value(row) : row[c.key];
        return '<td>' + escapeHtml(v == null ? '' : v) + '</td>';
      }).join('') + '</tr>';
    }).join('');
    return '<h2>' + escapeHtml(title) + '</h2><table border="1"><thead><tr>' + head + '</tr></thead><tbody>' + body + '</tbody></table>';
  }

  function exportExcelWorkbook(filename, sheets) {
    var html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">' +
      '<head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets>';
    sheets.forEach(function (s, i) {
      html += '<x:ExcelWorksheet><x:Name>' + escapeHtml(s.name || ('Sayfa' + (i + 1))) + '</x:Name>' +
        '<x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet>';
    });
    html += '</x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body>';
    sheets.forEach(function (s) {
      html += tableToHtml(s.name || 'Veri', s.rows, s.columns);
      html += '<br/>';
    });
    html += '</body></html>';
    downloadBlob(filename.replace(/\.xlsx?$/i, '') + '.xls', new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' }));
  }

  function exportMultipleCsv(baseName, exports) {
    exports.forEach(function (item, i) {
      var name = item.filename || (baseName + '-' + (i + 1) + '.csv');
      exportTable(name, item.rows, item.columns);
    });
  }

  global.TMExportUtils = {
    toCsv: toCsv,
    downloadCsv: downloadCsv,
    exportTable: exportTable,
    exportExcelWorkbook: exportExcelWorkbook,
    exportMultipleCsv: exportMultipleCsv
  };
})(typeof window !== 'undefined' ? window : this);
