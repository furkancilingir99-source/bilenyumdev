/* ---------------------------------------------------------------------------
 * Bilenyum homework-whiteboard.js — Ödev çözüm tahtası
 * ------------------------------------------------------------------------- */
(function (global) {
  'use strict';

  var SOLVE_W = 920;
  var SOLVE_H = 560;
  var LAYER_W = 960;
  var LAYER_H = 2400;
  var MAX_UNDO = 40;
  var ZOOM_LEVELS = (function () {
    var levels = [];
    var p;
    for (p = 50; p <= 250; p += 10) {
      levels.push(p / 100);
    }
    return levels;
  })();
  var ZOOM_MIN = ZOOM_LEVELS[0];
  var ZOOM_MAX = ZOOM_LEVELS[ZOOM_LEVELS.length - 1];
  var PEN_SIZE_MIN = 1;
  var PEN_SIZE_MAX = 16;
  var ERASER_SIZE_MIN = 10;
  var ERASER_SIZE_MAX = 96;

  /* Zarif kalem imleci — 24×24 SVG, uç (3, 21) */
  var PEN_CURSOR = 'url("assets/cursors/pencil-cursor.svg") 3 21, crosshair';

  var PEN_COLORS = [
    { c: '#000000', label: 'Siyah' },
    { c: '#9b0050', label: 'Pembe' },
    { c: '#004080', label: 'Mavi' },
    { c: '#7a5800', label: 'Sarı' },
    { c: '#0d5c2e', label: 'Yeşil' },
    { c: '#9a3a00', label: 'Turuncu' },
    { c: '#4a1890', label: 'Mor' },
    { c: '#2d3748', label: 'Gri' }
  ];

  var TOOL_ICONS = {
    pan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 11.5V9a2 2 0 0 0-4 0v3"/><path d="M14 10V5a2 2 0 0 0-4 0v8"/><path d="M10 9.5V4a2 2 0 0 0-4 0v12"/><path d="M18 11.5a2 2 0 0 1 4 0V12a6 6 0 0 1-6 6h-2a5 5 0 0 1-5-5v-2"/></svg>',
    pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
    shape: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><circle cx="12" cy="12" r="3"/></svg>',
    eraser: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 12 5 5"/></svg>',
    clear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>',
    undo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10h10a5 5 0 0 1 5 5v0a5 5 0 0 1-5 5H5"/><path d="M3 10l4-4"/><path d="M3 10l4 4"/></svg>',
    redo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10H11a5 5 0 0 0-5 5v0a5 5 0 0 0 5 5h8"/><path d="M21 10l-4-4"/><path d="M21 10l-4 4"/></svg>',
    zoomIn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>',
    zoomOut: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>'
  };

  function mount(root, opts) {
    if (!root) return null;
    opts = opts || {};

    var viewport = root.querySelector('#hwBoardViewport');
    var layer = root.querySelector('#hwBoardLayer');
    var canvas = root.querySelector('#hwDrawCanvas');
    var toolbar = root.querySelector('#hwBoardToolbar');
    var zoomLabel = null;
    if (!viewport || !layer || !canvas || !toolbar) return null;

    var ctx = canvas.getContext('2d', { alpha: true });
    var boardW = SOLVE_W;
    var boardH = SOLVE_H;
    var canvasOrigin = { x: 0, y: 0 };

    function resizeCanvas(w, h) {
      boardW = w;
      boardH = h;
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
    }

    resizeCanvas(SOLVE_W, SOLVE_H);

    var tool = 'pen';
    var shapeKind = 'line';
    var panX = 40;
    var panY = 40;
    var zoom = 0.72;
    var drawing = false;
    var panning = false;
    var lastPan = null;
    var strokeStart = null;
    var lastInkPoint = null;
    var undoStack = [];
    var redoStack = [];
    var questionStates = {};
    var activeQuestion = 0;
    var penColor = opts.penColor || '#000000';
    var penSize = opts.penSize || 2;
    var eraserSize = 28;
    var penPopoverOpen = false;
    var shapePopoverOpen = false;
    var eraserPopoverOpen = false;
    var penWrap = null;
    var penPopover = null;
    var penSwatch = null;
    var penSizeSlider = null;
    var penSizePreview = null;
    var shapeWrap = null;
    var shapePopover = null;
    var eraserWrap = null;
    var eraserPopover = null;
    var eraserSizeSlider = null;
    var eraserSizePreview = null;
    var CANVAS_BG = null;

    function updateViewportCursor() {
      viewport.classList.remove('is-tool-pen', 'is-tool-eraser', 'is-tool-pan', 'is-tool-shape', 'is-panning');
      if (tool === 'pen' || tool === 'eraser' || tool === 'pan' || tool === 'shape') {
        viewport.classList.add('is-tool-' + tool);
      }
      if (panning) viewport.classList.add('is-panning');

      if (tool === 'eraser') {
        viewport.style.cursor = getEraserCursorUrl(eraserSize);
      } else if (tool === 'pan') {
        viewport.style.cursor = panning ? 'grabbing' : 'grab';
      } else if (tool === 'pen') {
        viewport.style.cursor = PEN_CURSOR;
      } else if (tool === 'shape') {
        viewport.style.cursor = 'crosshair';
      } else {
        viewport.style.cursor = '';
      }
    }

    var eraserCursorCache = {};
    function getEraserCursorUrl(size) {
      var radius = Math.max(4, Math.min(44, Math.round(size / 2)));
      var pad = 3;
      var canvasSize = (radius + pad) * 2;
      var key = canvasSize + ':' + radius;
      if (!eraserCursorCache[key]) {
        var scratch = document.createElement('canvas');
        scratch.width = canvasSize;
        scratch.height = canvasSize;
        var scratchCtx = scratch.getContext('2d');
        scratchCtx.lineWidth = 1.5;
        scratchCtx.beginPath();
        scratchCtx.arc(canvasSize / 2, canvasSize / 2, radius, 0, Math.PI * 2);
        scratchCtx.fillStyle = 'rgba(255, 255, 255, 0.88)';
        scratchCtx.fill();
        scratchCtx.strokeStyle = '#1a1538';
        scratchCtx.stroke();
        eraserCursorCache[key] = scratch.toDataURL('image/png');
      }
      var hotspot = canvasSize / 2;
      return 'url(' + eraserCursorCache[key] + ') ' + hotspot + ' ' + hotspot + ', cell';
    }

    function resetCtxState() {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }

    function clearCanvas() {
      resetCtxState();
      ctx.clearRect(0, 0, boardW, boardH);
    }

    function pushUndo() {
      try {
        undoStack.push(ctx.getImageData(0, 0, boardW, boardH));
        if (undoStack.length > MAX_UNDO) undoStack.shift();
        redoStack.length = 0;
        updateUndoButtons();
      } catch (e) {}
    }

    function restore(data) {
      if (!data) {
        clearCanvas();
        return;
      }
      ctx.putImageData(data, 0, 0);
      resetCtxState();
    }

    function preparePenStroke() {
      resetCtxState();
      ctx.fillStyle = penColor;
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }

    function prepareEraserStroke() {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,1)';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.lineWidth = eraserSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }

    function stampEraserDot(x, y, radius) {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,1)';
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function stampEraserInk(from, to, radius) {
      if (!from) {
        stampEraserDot(to.x, to.y, radius);
        return;
      }
      var dx = to.x - from.x;
      var dy = to.y - from.y;
      var dist = Math.hypot(dx, dy);
      if (dist < 0.25) {
        stampEraserDot(to.x, to.y, radius);
        return;
      }
      var step = Math.max(1, radius * 0.4);
      var count = Math.ceil(dist / step);
      for (var i = 0; i <= count; i++) {
        var t = i / count;
        stampEraserDot(from.x + dx * t, from.y + dy * t, radius);
      }
    }

    function stampDot(x, y, radius, color) {
      resetCtxState();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    function stampInk(from, to, radius, color) {
      if (!from) {
        stampDot(to.x, to.y, radius, color);
        return;
      }
      var dx = to.x - from.x;
      var dy = to.y - from.y;
      var dist = Math.hypot(dx, dy);
      if (dist < 0.25) {
        stampDot(to.x, to.y, radius, color);
        return;
      }
      var step = Math.max(1, radius * 0.4);
      var count = Math.ceil(dist / step);
      for (var i = 0; i <= count; i++) {
        var t = i / count;
        stampDot(from.x + dx * t, from.y + dy * t, radius, color);
      }
    }

    function offsetWithin(el, ancestor) {
      var x = 0;
      var y = 0;
      var node = el;
      while (node && node !== ancestor) {
        x += node.offsetLeft;
        y += node.offsetTop;
        node = node.offsetParent;
      }
      return node === ancestor ? { x: x, y: y } : null;
    }

    function offsetTopWithin(el, ancestor) {
      var pos = offsetWithin(el, ancestor);
      return pos ? pos.y : 0;
    }

    function syncOutsideNav() {
      var prev = root.querySelector('[data-asm-prev]');
      if (!prev || !prev.classList.contains('asm-hw-nav-outside')) return;
      var cluster = root.querySelector('#hwSheetCluster');
      var anchor = root.querySelector('.asm-hw-options-row');
      var next = root.querySelector('[data-asm-next]');
      if (!cluster || !anchor || !next) return;
      var top = offsetTopWithin(anchor, cluster) + Math.max(0, (anchor.offsetHeight - prev.offsetHeight) / 2);
      prev.style.top = top + 'px';
      next.style.top = top + 'px';
    }

    function positionRailPopover(wrap, popover) {
      if (!wrap || !popover) return;
      var isSideRail = toolbar.classList.contains('asm-hw-board-toolbar--rail');
      if (!isSideRail) return;
      var rect = wrap.getBoundingClientRect();
      popover.style.position = 'fixed';
      popover.style.left = Math.round(rect.right + 10) + 'px';
      popover.style.top = Math.round(rect.top) + 'px';
      popover.style.zIndex = '500';
    }

    function resetPopoverPosition(popover) {
      if (!popover) return;
      popover.style.position = '';
      popover.style.left = '';
      popover.style.top = '';
      popover.style.zIndex = '';
    }

    function repositionOpenPopovers() {
      if (penPopoverOpen && penWrap && penPopover) positionRailPopover(penWrap, penPopover);
      if (shapePopoverOpen && shapeWrap && shapePopover) positionRailPopover(shapeWrap, shapePopover);
      if (eraserPopoverOpen && eraserWrap && eraserPopover) positionRailPopover(eraserWrap, eraserPopover);
    }

    function mountRailDrag(toolbarEl, viewportEl, gripEl) {
      if (!toolbarEl || !viewportEl || !gripEl || !toolbarEl.classList.contains('asm-hw-board-toolbar--float')) return;
      var dragging = false;
      var startX = 0;
      var startY = 0;
      var origLeft = 0;
      var origTop = 0;

      function clampRail(left, top) {
        var vp = viewportEl.getBoundingClientRect();
        var tb = toolbarEl.getBoundingClientRect();
        var w = tb.width || toolbarEl.offsetWidth || 80;
        var h = tb.height || toolbarEl.offsetHeight || 200;
        var maxLeft = Math.max(8, vp.width - w - 8);
        var maxTop = Math.max(8, vp.height - h - 8);
        return {
          left: Math.min(maxLeft, Math.max(8, left)),
          top: Math.min(maxTop, Math.max(8, top))
        };
      }

      function setRailPosition(left, top) {
        var pos = clampRail(left, top);
        toolbarEl.style.left = pos.left + 'px';
        toolbarEl.style.top = pos.top + 'px';
        toolbarEl.style.transform = 'none';
        repositionOpenPopovers();
      }

      gripEl.addEventListener('pointerdown', function (e) {
        if (e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        dragging = true;
        toolbarEl.classList.add('is-dragging');
        var vp = viewportEl.getBoundingClientRect();
        var tb = toolbarEl.getBoundingClientRect();
        startX = e.clientX;
        startY = e.clientY;
        origLeft = tb.left - vp.left;
        origTop = tb.top - vp.top;
        toolbarEl.style.transform = 'none';
        try { gripEl.setPointerCapture(e.pointerId); } catch (err) {}
      });

      gripEl.addEventListener('pointermove', function (e) {
        if (!dragging) return;
        setRailPosition(origLeft + (e.clientX - startX), origTop + (e.clientY - startY));
      });

      function endDrag(e) {
        if (!dragging) return;
        dragging = false;
        toolbarEl.classList.remove('is-dragging');
        try { if (e && e.pointerId != null) gripEl.releasePointerCapture(e.pointerId); } catch (err) {}
      }

      gripEl.addEventListener('pointerup', endDrag);
      gripEl.addEventListener('pointercancel', endDrag);
    }

    function syncLayout() {
      var solveZone = root.querySelector('#hwSolveZone');
      if (!solveZone || !canvas) return;

      var pos = offsetWithin(solveZone, layer);
      if (!pos) return;

      var regionW = solveZone.offsetWidth || SOLVE_W;
      var regionH = Math.max(SOLVE_H, solveZone.offsetHeight || SOLVE_H);
      var ox = pos.x;
      var oy = pos.y;

      if (boardW !== regionW || boardH !== regionH) {
        var prev = null;
        try { prev = ctx.getImageData(0, 0, boardW, boardH); } catch (e) {}
        resizeCanvas(regionW, regionH);
        if (prev) {
          ctx.putImageData(prev, 0, 0);
          resetCtxState();
        }
      }

      canvas.style.left = ox + 'px';
      canvas.style.top = oy + 'px';
      canvasOrigin.x = ox;
      canvasOrigin.y = oy;
      syncOutsideNav();
    }

    function layerToCanvas(p) {
      return { x: p.x - canvasOrigin.x, y: p.y - canvasOrigin.y };
    }

    function isInsideCanvas(p) {
      var c = layerToCanvas(p);
      return c.x >= 0 && c.y >= 0 && c.x <= boardW && c.y <= boardH;
    }

    function updateTransform() {
      layer.style.transform = 'translate(' + panX + 'px,' + panY + 'px) scale(' + zoom + ')';
      if (zoomLabel) zoomLabel.textContent = Math.round(zoom * 100) + '%';
    }

    function updateUndoButtons() {
      toolbar.querySelectorAll('[data-action="undo"]').forEach(function (b) {
        b.disabled = undoStack.length === 0;
      });
      toolbar.querySelectorAll('[data-action="redo"]').forEach(function (b) {
        b.disabled = redoStack.length === 0;
      });
    }

    function updatePenUI() {
      if (penSwatch) penSwatch.style.background = penColor;
      if (penSizeSlider) penSizeSlider.value = String(penSize);
      if (penSizePreview) {
        var dot = Math.max(4, penSize + 2);
        penSizePreview.style.width = dot + 'px';
        penSizePreview.style.height = dot + 'px';
        penSizePreview.style.background = penColor;
      }
      if (!penPopover) return;
      penPopover.querySelectorAll('[data-pen-color]').forEach(function (btn) {
        btn.classList.toggle('is-active', btn.getAttribute('data-pen-color') === penColor);
      });
    }

    function setPenSize(next) {
      penSize = Math.min(PEN_SIZE_MAX, Math.max(PEN_SIZE_MIN, Math.round(next)));
      updatePenUI();
    }

    function closePenPopover() {
      penPopoverOpen = false;
      if (penPopover) {
        penPopover.hidden = true;
        resetPopoverPosition(penPopover);
      }
      if (penWrap) penWrap.classList.remove('is-open');
    }

    function closeShapePopover() {
      shapePopoverOpen = false;
      if (shapePopover) {
        shapePopover.hidden = true;
        resetPopoverPosition(shapePopover);
      }
      if (shapeWrap) shapeWrap.classList.remove('is-open');
    }

    function closeEraserPopover() {
      eraserPopoverOpen = false;
      if (eraserPopover) {
        eraserPopover.hidden = true;
        resetPopoverPosition(eraserPopover);
      }
      if (eraserWrap) eraserWrap.classList.remove('is-open');
    }

    function closeOtherPopovers(active) {
      if (active !== 'pen') closePenPopover();
      if (active !== 'shape') closeShapePopover();
      if (active !== 'eraser') closeEraserPopover();
    }

    function setPenPopover(open) {
      if (open) closeOtherPopovers('pen');
      penPopoverOpen = open;
      if (penPopover) {
        penPopover.hidden = !open;
        if (open) positionRailPopover(penWrap, penPopover);
        else resetPopoverPosition(penPopover);
      }
      if (penWrap) penWrap.classList.toggle('is-open', open);
    }

    function updateShapeUI() {
      if (!shapePopover) return;
      shapePopover.querySelectorAll('[data-shape]').forEach(function (btn) {
        btn.classList.toggle('is-active', btn.getAttribute('data-shape') === shapeKind);
      });
    }

    function setShapePopover(open) {
      if (open) closeOtherPopovers('shape');
      shapePopoverOpen = open;
      if (shapePopover) {
        shapePopover.hidden = !open;
        if (open) positionRailPopover(shapeWrap, shapePopover);
        else resetPopoverPosition(shapePopover);
      }
      if (shapeWrap) shapeWrap.classList.toggle('is-open', open);
    }

    function updateEraserUI() {
      if (eraserSizeSlider) eraserSizeSlider.value = String(eraserSize);
      if (eraserSizePreview) {
        var dot = Math.max(8, Math.round(eraserSize * 0.38));
        eraserSizePreview.style.width = dot + 'px';
        eraserSizePreview.style.height = dot + 'px';
      }
    }

    function setEraserSize(next) {
      eraserSize = Math.min(ERASER_SIZE_MAX, Math.max(ERASER_SIZE_MIN, Math.round(next)));
      updateEraserUI();
      if (tool === 'eraser') updateViewportCursor();
    }

    function setEraserPopover(open) {
      if (open) closeOtherPopovers('eraser');
      eraserPopoverOpen = open;
      if (eraserPopover) {
        eraserPopover.hidden = !open;
        if (open) positionRailPopover(eraserWrap, eraserPopover);
        else resetPopoverPosition(eraserPopover);
      }
      if (eraserWrap) eraserWrap.classList.toggle('is-open', open);
    }

    function setTool(next) {
      tool = next;
      toolbar.querySelectorAll('[data-tool]').forEach(function (btn) {
        btn.classList.toggle('is-active', btn.getAttribute('data-tool') === tool);
      });
      if (tool !== 'pen') closePenPopover();
      if (tool !== 'shape') closeShapePopover();
      if (tool !== 'eraser') closeEraserPopover();
      updateViewportCursor();
    }

    function screenToWorld(clientX, clientY) {
      var rect = viewport.getBoundingClientRect();
      return {
        x: (clientX - rect.left - panX) / zoom,
        y: (clientY - rect.top - panY) / zoom
      };
    }

    function strokeRegularPolygon(from, to, sides, rotation) {
      var x1 = from.x;
      var y1 = from.y;
      var x2 = to.x;
      var y2 = to.y;
      var cx = (x1 + x2) / 2;
      var cy = (y1 + y2) / 2;
      var rx = Math.abs(x2 - x1) / 2 || 1;
      var ry = Math.abs(y2 - y1) / 2 || 1;
      var rot = rotation != null ? rotation : -Math.PI / 2;
      ctx.beginPath();
      for (var i = 0; i < sides; i++) {
        var angle = rot + (i * 2 * Math.PI / sides);
        var px = cx + rx * Math.cos(angle);
        var py = cy + ry * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }

    function strokeTriangle(from, to, kind) {
      var x1 = Math.min(from.x, to.x);
      var y1 = Math.min(from.y, to.y);
      var x2 = Math.max(from.x, to.x);
      var y2 = Math.max(from.y, to.y);
      var w = x2 - x1 || 1;
      var h = y2 - y1 || 1;
      ctx.beginPath();
      if (kind === 'right') {
        ctx.moveTo(x1, y2);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x1, y1);
      } else if (kind === 'obtuse') {
        ctx.moveTo(x1 + w * 0.12, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x1, y2);
      } else {
        ctx.moveTo(x1 + w / 2, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x1, y2);
      }
      ctx.closePath();
      ctx.stroke();
    }

    function drawShapePreview(from, to) {
      restore(undoStack.length ? undoStack[undoStack.length - 1] : null);
      ctx.save();
      resetCtxState();
      ctx.strokeStyle = penColor;
      ctx.lineWidth = Math.max(penSize + 1, 3);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (shapeKind === 'line') {
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
      } else if (shapeKind === 'rect') {
        ctx.strokeRect(from.x, from.y, to.x - from.x, to.y - from.y);
      } else if (shapeKind === 'circle') {
        var rx = Math.abs(to.x - from.x) / 2;
        var ry = Math.abs(to.y - from.y) / 2;
        var cx = from.x + (to.x - from.x) / 2;
        var cy = from.y + (to.y - from.y) / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx || 1, ry || 1, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (shapeKind === 'triangle-right') {
        strokeTriangle(from, to, 'right');
      } else if (shapeKind === 'triangle-acute') {
        strokeTriangle(from, to, 'acute');
      } else if (shapeKind === 'triangle-obtuse') {
        strokeTriangle(from, to, 'obtuse');
      } else if (shapeKind === 'pentagon') {
        strokeRegularPolygon(from, to, 5, -Math.PI / 2);
      } else if (shapeKind === 'hexagon') {
        strokeRegularPolygon(from, to, 6, 0);
      }
      ctx.restore();
    }

    function onPointerDown(e) {
      if (e.target.closest('.asm-hw-sheet-interactive, .asm-hw-sheet-foot, .asm-hw-confirm-answer, button, a, input, label')) {
        return;
      }
      if (e.button === 1 || tool === 'pan') {
        panning = true;
        lastPan = { x: e.clientX, y: e.clientY };
        updateViewportCursor();
        viewport.setPointerCapture(e.pointerId);
        return;
      }
      if (tool === 'pen' || tool === 'eraser' || tool === 'shape') {
        var layerPoint = screenToWorld(e.clientX, e.clientY);
        if (!isInsideCanvas(layerPoint)) return;
        var p = layerToCanvas(layerPoint);
        drawing = true;
        strokeStart = p;
        pushUndo();
        if (tool === 'pen') {
          preparePenStroke();
          stampDot(strokeStart.x, strokeStart.y, penSize / 2, penColor);
          lastInkPoint = { x: strokeStart.x, y: strokeStart.y };
        } else if (tool === 'eraser') {
          stampEraserDot(strokeStart.x, strokeStart.y, eraserSize / 2);
          lastInkPoint = { x: strokeStart.x, y: strokeStart.y };
        } else {
          lastInkPoint = null;
        }
        viewport.setPointerCapture(e.pointerId);
      }
    }

    function onPointerMove(e) {
      if (panning && lastPan) {
        panX += e.clientX - lastPan.x;
        panY += e.clientY - lastPan.y;
        lastPan = { x: e.clientX, y: e.clientY };
        updateTransform();
        return;
      }
      if (!drawing) return;
      var layerPoint = screenToWorld(e.clientX, e.clientY);
      var p = layerToCanvas(layerPoint);
      if (tool === 'pen') {
        stampInk(lastInkPoint, p, penSize / 2, penColor);
        lastInkPoint = { x: p.x, y: p.y };
      } else if (tool === 'eraser') {
        stampEraserInk(lastInkPoint, p, eraserSize / 2);
        lastInkPoint = { x: p.x, y: p.y };
      } else if (tool === 'shape' && strokeStart) {
        drawShapePreview(strokeStart, p);
      }
    }

    function onPointerUp(e) {
      if (panning) {
        panning = false;
        lastPan = null;
        updateViewportCursor();
        try { viewport.releasePointerCapture(e.pointerId); } catch (err) {}
        return;
      }
      if (drawing) {
        drawing = false;
        resetCtxState();
        strokeStart = null;
        lastInkPoint = null;
        try { viewport.releasePointerCapture(e.pointerId); } catch (err) {}
        saveQuestionState(activeQuestion);
      }
    }

    function nearestZoomIndex(value) {
      var best = 0;
      var bestDiff = Math.abs(value - ZOOM_LEVELS[0]);
      for (var i = 1; i < ZOOM_LEVELS.length; i++) {
        var diff = Math.abs(value - ZOOM_LEVELS[i]);
        if (diff < bestDiff) {
          best = i;
          bestDiff = diff;
        }
      }
      return best;
    }

    function bestFitZoomLevel() {
      syncSheetWidth();
      var sheet = root.querySelector('#hwQuestionSheet');
      var rect = viewport.getBoundingClientRect();
      var sheetW = sheet ? sheet.offsetWidth || LAYER_W : LAYER_W;
      var fit = Math.min(1, Math.max(ZOOM_MIN, (rect.width - 12) / sheetW));
      var chosen = ZOOM_LEVELS[0];
      for (var i = 0; i < ZOOM_LEVELS.length; i++) {
        if (ZOOM_LEVELS[i] <= fit + 0.0001) chosen = ZOOM_LEVELS[i];
        else break;
      }
      return chosen;
    }

    function applyZoomAt(newZoom, cx, cy) {
      newZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, newZoom));
      if (Math.abs(newZoom - zoom) < 0.0001) return;
      var before = screenToWorld(cx, cy);
      zoom = newZoom;
      var rect = viewport.getBoundingClientRect();
      panX = cx - rect.left - before.x * zoom;
      panY = cy - rect.top - before.y * zoom;
      updateTransform();
    }

    function stepZoom(direction, cx, cy) {
      var idx = nearestZoomIndex(zoom);
      var next = Math.max(0, Math.min(ZOOM_LEVELS.length - 1, idx + direction));
      applyZoomAt(ZOOM_LEVELS[next], cx, cy);
    }

    function zoomAt(factor, cx, cy) {
      stepZoom(factor >= 1 ? 1 : -1, cx, cy);
    }

    function fitView() {
      var rect = viewport.getBoundingClientRect();
      var scaleX = (rect.width - 48) / LAYER_W;
      var scaleY = (rect.height - 48) / LAYER_H;
      zoom = Math.min(1, Math.max(ZOOM_MIN, Math.min(scaleX, scaleY)));
      panX = (rect.width - LAYER_W * zoom) / 2;
      panY = 24;
      updateTransform();
    }

    function syncSheetWidth() {
      var sheet = root.querySelector('#hwQuestionSheet');
      if (!sheet || !viewport) return;
      var w = Math.max(480, viewport.clientWidth - 12);
      sheet.style.width = w + 'px';
    }

    function focusSheet() {
      syncSheetWidth();
      syncLayout();
      var sheet = root.querySelector('#hwQuestionSheet');
      var rect = viewport.getBoundingClientRect();
      var sheetW = sheet ? sheet.offsetWidth || LAYER_W : LAYER_W;
      zoom = bestFitZoomLevel();
      panX = Math.max(6, (rect.width - sheetW * zoom) / 2);
      panY = 8;
      updateTransform();
    }

    function saveQuestionState(qi) {
      try {
        questionStates[qi] = ctx.getImageData(0, 0, boardW, boardH);
      } catch (e) {}
    }

    function loadQuestionState(qi) {
      activeQuestion = qi;
      undoStack.length = 0;
      redoStack.length = 0;
      syncLayout();
      var data = questionStates[qi];
      if (data && (data.width !== boardW || data.height !== boardH)) data = null;
      restore(data || null);
      updateUndoButtons();
    }

    function clearBoard() {
      if (!window.confirm('Tahtadaki tüm çizimleri temizlemek istediğine emin misin?')) return;
      pushUndo();
      clearCanvas();
      saveQuestionState(activeQuestion);
    }

    function buildEraserPopover() {
      return '<div class="asm-hw-eraser-popover" id="hwEraserPopover" hidden role="dialog" aria-label="Silgi ayarları">' +
        '<span class="asm-hw-pen-popover-label">Kalınlık</span>' +
        '<div class="asm-hw-pen-size-slider-wrap">' +
          '<span class="asm-hw-eraser-size-preview" id="hwEraserSizePreview" aria-hidden="true"></span>' +
          '<input type="range" class="asm-hw-pen-size-slider asm-hw-eraser-size-slider" id="hwEraserSizeSlider" min="' + ERASER_SIZE_MIN + '" max="' + ERASER_SIZE_MAX + '" step="1" value="' + eraserSize + '" aria-label="Silgi kalınlığı" aria-valuemin="' + ERASER_SIZE_MIN + '" aria-valuemax="' + ERASER_SIZE_MAX + '" />' +
          '<div class="asm-hw-pen-size-labels">' +
            '<span>Küçük</span><span>Büyük</span>' +
          '</div>' +
        '</div>' +
      '</div>';
    }

    function buildShapePopover() {
      var shapes = [
        { id: 'line', label: 'Çizgi', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="5" y1="19" x2="19" y2="5"/></svg>' },
        { id: 'rect', label: 'Kare', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="5" y="5" width="14" height="14" rx="1"/></svg>' },
        { id: 'circle', label: 'Daire', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="7"/></svg>' },
        { id: 'triangle-right', label: 'Dik Üçgen', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><polygon points="5,19 19,19 5,5"/></svg>' },
        { id: 'triangle-acute', label: 'Dar Açılı Üçgen', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><polygon points="12,4 20,20 4,20"/></svg>' },
        { id: 'triangle-obtuse', label: 'Geniş Açılı Üçgen', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><polygon points="7,5 21,20 3,20"/></svg>' },
        { id: 'pentagon', label: 'Beşgen', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><polygon points="12,3 21,9 18,20 6,20 3,9"/></svg>' },
        { id: 'hexagon', label: 'Altıgen', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><polygon points="12,3 20,8 20,16 12,21 4,16 4,8"/></svg>' }
      ];
      var items = shapes.map(function (s) {
        var active = s.id === shapeKind ? ' is-active' : '';
        return '<button type="button" class="asm-hw-shape-option' + active + '" data-shape="' + s.id + '">' +
          s.icon + '<span>' + s.label + '</span></button>';
      }).join('');
      return '<div class="asm-hw-shape-popover" id="hwShapePopover" hidden role="dialog" aria-label="Şekil seçimi">' +
        '<span class="asm-hw-pen-popover-label">Şekil türü</span>' +
        '<div class="asm-hw-shape-options">' + items + '</div>' +
      '</div>';
    }

    function buildPenPopover() {
      var colors = PEN_COLORS.map(function (item) {
        return '<button type="button" class="asm-hw-pen-color" data-pen-color="' + item.c + '" title="' + item.label + '" aria-label="' + item.label + '" style="--swatch:' + item.c + '"></button>';
      }).join('');
      return '<div class="asm-hw-pen-popover" id="hwPenPopover" hidden role="dialog" aria-label="Kalem ayarları">' +
        '<div class="asm-hw-pen-popover-section">' +
          '<span class="asm-hw-pen-popover-label">Renk</span>' +
          '<div class="asm-hw-pen-colors">' + colors + '</div>' +
        '</div>' +
        '<div class="asm-hw-pen-popover-section">' +
          '<span class="asm-hw-pen-popover-label">Kalınlık</span>' +
          '<div class="asm-hw-pen-size-slider-wrap">' +
            '<span class="asm-hw-pen-size-preview" id="hwPenSizePreview" aria-hidden="true"></span>' +
            '<input type="range" class="asm-hw-pen-size-slider" id="hwPenSizeSlider" min="' + PEN_SIZE_MIN + '" max="' + PEN_SIZE_MAX + '" step="1" value="' + penSize + '" aria-label="Kalem kalınlığı" aria-valuemin="' + PEN_SIZE_MIN + '" aria-valuemax="' + PEN_SIZE_MAX + '" />' +
            '<div class="asm-hw-pen-size-labels">' +
              '<span>İnce</span><span>Kalın</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    }

    toolbar.innerHTML =
      '<button type="button" class="asm-hw-rail-grip" id="hwRailGrip" aria-label="Araç menüsünü taşı" title="Menüyü taşı">' +
        '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="9" cy="6" r="1.4"/><circle cx="15" cy="6" r="1.4"/><circle cx="9" cy="12" r="1.4"/><circle cx="15" cy="12" r="1.4"/><circle cx="9" cy="18" r="1.4"/><circle cx="15" cy="18" r="1.4"/></svg>' +
      '</button>' +
      '<div class="asm-hw-toolbar-rail">' +
        '<div class="asm-hw-toolbar-group asm-hw-toolbar-group--draw">' +
          '<button type="button" class="asm-hw-tool asm-hw-tool--primary" data-tool="pan" title="Kaydır" aria-label="Kaydır">' + TOOL_ICONS.pan + '<span>Kaydır</span></button>' +
          '<div class="asm-hw-pen-wrap" id="hwPenWrap">' +
            '<button type="button" class="asm-hw-tool asm-hw-tool--primary is-active" data-tool="pen" id="hwPenBtn" title="Kalem" aria-label="Kalem">' +
              TOOL_ICONS.pen +
              '<span>Kalem</span>' +
              '<span class="asm-hw-pen-swatch" id="hwPenSwatch" aria-hidden="true"></span>' +
            '</button>' +
            buildPenPopover() +
          '</div>' +
          '<div class="asm-hw-shape-wrap" id="hwShapeWrap">' +
            '<button type="button" class="asm-hw-tool asm-hw-tool--primary" data-tool="shape" id="hwShapeBtn" title="Şekil" aria-label="Şekil">' +
              TOOL_ICONS.shape + '<span>Şekil</span>' +
            '</button>' +
            buildShapePopover() +
          '</div>' +
          '<div class="asm-hw-eraser-wrap" id="hwEraserWrap">' +
            '<button type="button" class="asm-hw-tool asm-hw-tool--primary" data-tool="eraser" id="hwEraserBtn" title="Silgi" aria-label="Silgi">' +
              TOOL_ICONS.eraser + '<span>Silgi</span>' +
            '</button>' +
            buildEraserPopover() +
          '</div>' +
        '</div>' +
        '<div class="asm-hw-toolbar-divider" aria-hidden="true"></div>' +
        '<div class="asm-hw-toolbar-group asm-hw-toolbar-group--clear">' +
          '<button type="button" class="asm-hw-tool asm-hw-tool--compact" data-action="clear" title="Temizle" aria-label="Temizle">' + TOOL_ICONS.clear + '<span>Temizle</span></button>' +
        '</div>' +
        '<div class="asm-hw-toolbar-group asm-hw-toolbar-group--history">' +
          '<button type="button" class="asm-hw-tool asm-hw-tool--compact" data-action="undo" title="Geri Al" aria-label="Geri Al" disabled>' + TOOL_ICONS.undo + '<span>Geri Al</span></button>' +
          '<button type="button" class="asm-hw-tool asm-hw-tool--compact" data-action="redo" title="İleri Al" aria-label="İleri Al" disabled>' + TOOL_ICONS.redo + '<span>İleri Al</span></button>' +
        '</div>' +
        '<div class="asm-hw-toolbar-divider" aria-hidden="true"></div>' +
        '<div class="asm-hw-toolbar-group asm-hw-toolbar-group--zoom">' +
          '<button type="button" class="asm-hw-tool asm-hw-tool--compact" data-action="zoom-out" title="Uzaklaştır" aria-label="Uzaklaştır">' + TOOL_ICONS.zoomOut + '<span>Uzaklaştır</span></button>' +
          '<button type="button" class="asm-hw-tool asm-hw-tool--compact" data-action="zoom-in" title="Yakınlaştır" aria-label="Yakınlaştır">' + TOOL_ICONS.zoomIn + '<span>Yakınlaştır</span></button>' +
          '<span class="asm-hw-zoom-label" id="hwZoomLabel" aria-live="polite">100%</span>' +
          '<button type="button" class="asm-hw-tool asm-hw-tool-hint asm-hw-tool--compact" title="Soru görselinin ve çözüm alanının üzerine çizebilir, tahtayı kaydırabilir ve yakınlaştırabilirsin." aria-label="Tahta ipucu">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><line x1="12" y1="10" x2="12" y2="16"/><line x1="12" y1="7" x2="12.01" y2="7"/></svg>' +
          '</button>' +
        '</div>' +
      '</div>';

    penWrap = toolbar.querySelector('#hwPenWrap');
    penPopover = toolbar.querySelector('#hwPenPopover');
    penSwatch = toolbar.querySelector('#hwPenSwatch');
    penSizeSlider = toolbar.querySelector('#hwPenSizeSlider');
    penSizePreview = toolbar.querySelector('#hwPenSizePreview');
    shapeWrap = toolbar.querySelector('#hwShapeWrap');
    shapePopover = toolbar.querySelector('#hwShapePopover');
    eraserWrap = toolbar.querySelector('#hwEraserWrap');
    eraserPopover = toolbar.querySelector('#hwEraserPopover');
    eraserSizeSlider = toolbar.querySelector('#hwEraserSizeSlider');
    eraserSizePreview = toolbar.querySelector('#hwEraserSizePreview');
    zoomLabel = toolbar.querySelector('#hwZoomLabel');

    mountRailDrag(toolbar, viewport, toolbar.querySelector('#hwRailGrip'));

    toolbar.addEventListener('click', function (e) {
      var colorBtn = e.target.closest('[data-pen-color]');
      if (colorBtn) {
        penColor = colorBtn.getAttribute('data-pen-color');
        updatePenUI();
        setTool('pen');
        return;
      }

      var shapeBtn = e.target.closest('[data-shape]');
      if (shapeBtn) {
        shapeKind = shapeBtn.getAttribute('data-shape');
        updateShapeUI();
        setTool('shape');
        return;
      }

      var shapeMainBtn = e.target.closest('#hwShapeBtn');
      if (shapeMainBtn) {
        e.stopPropagation();
        if (tool === 'shape') {
          setShapePopover(!shapePopoverOpen);
        } else {
          setTool('shape');
          setShapePopover(true);
        }
        return;
      }

      var eraserMainBtn = e.target.closest('#hwEraserBtn');
      if (eraserMainBtn) {
        e.stopPropagation();
        if (tool === 'eraser') {
          setEraserPopover(!eraserPopoverOpen);
        } else {
          setTool('eraser');
          setEraserPopover(true);
        }
        return;
      }

      var penBtn = e.target.closest('#hwPenBtn');
      if (penBtn) {
        e.stopPropagation();
        if (tool === 'pen') {
          setPenPopover(!penPopoverOpen);
        } else {
          setTool('pen');
          setPenPopover(true);
        }
        return;
      }

      var toolBtn = e.target.closest('[data-tool]');
      if (toolBtn) {
        setTool(toolBtn.getAttribute('data-tool'));
        return;
      }
      var action = e.target.closest('[data-action]');
      if (!action) return;
      var act = action.getAttribute('data-action');
      if (act === 'clear') clearBoard();
      if (act === 'undo' && undoStack.length) {
        redoStack.push(ctx.getImageData(0, 0, boardW, boardH));
        restore(undoStack.pop());
        updateUndoButtons();
        saveQuestionState(activeQuestion);
      }
      if (act === 'redo' && redoStack.length) {
        undoStack.push(ctx.getImageData(0, 0, boardW, boardH));
        restore(redoStack.pop());
        updateUndoButtons();
        saveQuestionState(activeQuestion);
      }
      if (act === 'zoom-in') stepZoom(1, viewport.clientWidth / 2, viewport.clientHeight / 2);
      if (act === 'zoom-out') stepZoom(-1, viewport.clientWidth / 2, viewport.clientHeight / 2);
    });

    if (penSizeSlider) {
      penSizeSlider.addEventListener('input', function () {
        setPenSize(parseInt(penSizeSlider.value, 10));
        setTool('pen');
      });
    }

    if (eraserSizeSlider) {
      eraserSizeSlider.addEventListener('input', function () {
        setEraserSize(parseInt(eraserSizeSlider.value, 10));
        setTool('eraser');
      });
    }

    document.addEventListener('click', function (e) {
      if (penPopoverOpen && penWrap && !penWrap.contains(e.target)) closePenPopover();
      if (shapePopoverOpen && shapeWrap && !shapeWrap.contains(e.target)) closeShapePopover();
      if (eraserPopoverOpen && eraserWrap && !eraserWrap.contains(e.target)) closeEraserPopover();
    });

    viewport.addEventListener('pointerdown', onPointerDown);
    viewport.addEventListener('pointermove', onPointerMove);
    viewport.addEventListener('pointerup', onPointerUp);
    viewport.addEventListener('pointercancel', onPointerUp);
    viewport.addEventListener('wheel', function (e) {
      e.preventDefault();
      zoomAt(e.deltaY < 0 ? 1.1 : 0.9, e.clientX, e.clientY);
    }, { passive: false });

    function onResize() {
      syncSheetWidth();
      syncLayout();
      focusSheet();
      repositionOpenPopovers();
    }

    window.addEventListener('resize', onResize);

    clearCanvas();
    updatePenUI();
    updateEraserUI();
    updateShapeUI();
    setTool('pen');
    focusSheet();

    return {
      setQuestionIndex: function (qi, prevQi) {
        if (prevQi != null) saveQuestionState(prevQi);
        loadQuestionState(qi);
        requestAnimationFrame(function () {
          syncLayout();
          focusSheet();
        });
      },
      setPenColor: function (c) { penColor = c; updatePenUI(); },
      setPenSize: function (s) { setPenSize(s); },
      setEraserSize: function (s) { setEraserSize(s); },
      syncLayout: syncLayout,
      fitView: fitView,
      focusSheet: focusSheet,
      destroy: function () {
        window.removeEventListener('resize', onResize);
      }
    };
  }

  global.BilenyumHomeworkBoard = { mount: mount };
})(typeof window !== 'undefined' ? window : this);
