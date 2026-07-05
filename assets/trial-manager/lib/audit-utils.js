/**
 * AuditLog yardımcıları
 */
(function (global) {
  'use strict';

  function nowIso() {
    return new Date().toISOString();
  }

  function appendAudit(store, entry) {
    if (!store || !store.auditLogs) return null;
    var id = 'AUD-' + String(store.auditLogs.length + 1).padStart(5, '0');
    var log = {
      id: id,
      entityType: entry.entityType,
      entityId: entry.entityId,
      action: entry.action,
      description: entry.description || '',
      reason: entry.reason || undefined,
      previousValue: entry.previousValue,
      newValue: entry.newValue,
      createdByUserId: entry.createdByUserId || 'user-manager-1',
      createdAt: entry.createdAt || nowIso()
    };
    store.auditLogs.unshift(log);
    return log;
  }

  function getByEntity(store, entityType, entityId) {
    if (!store) return [];
    return store.auditLogs.filter(function (l) {
      return l.entityType === entityType && l.entityId === entityId;
    });
  }

  global.TMAuditUtils = {
    append: appendAudit,
    getByEntity: getByEntity,
    nowIso: nowIso
  };
})(typeof window !== 'undefined' ? window : this);
