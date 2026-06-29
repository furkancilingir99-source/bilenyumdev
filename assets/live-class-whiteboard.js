(function (global) {
  'use strict';

  var TEACHER_ID = 'teacher';
  var BG_COLOR = '#10162F';

  function uid() {
    return 'st' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function roundRectTop(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }
  function clip(ctx, text, maxW) {
    if (ctx.measureText(text).width <= maxW) return text;
    while (text.length > 1 && ctx.measureText(text + '…').width > maxW) text = text.slice(0, -1);
    return text + '…';
  }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function createWhiteboardState() {
    return {
      isWhiteboardActive: false,
      permission: 'selected_raised_hand_student_can_draw',
      selectedStudentId: null,
      selectedTool: 'pen',
      selectedColor: '#FF2DAA',
      selectedWidth: 3,
      selectedOpacity: 1,
      eraserRadius: 18,
      strokes: [],
      currentStroke: null,
      undoStack: [],
      redoStack: [],
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      background: null
    };
  }

  function smoothStroke(ctx, points, stroke) {
    if (!points.length) return;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = stroke.opacity;
    if (stroke.tool === 'highlighter') ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = stroke.tool === 'eraser' ? BG_COLOR : stroke.color;
    ctx.lineWidth = stroke.width;

    if (points.length === 1) {
      ctx.beginPath();
      ctx.arc(points[0].x, points[0].y, stroke.width / 2, 0, Math.PI * 2);
      ctx.fillStyle = stroke.tool === 'eraser' ? BG_COLOR : stroke.color;
      ctx.fill();
      ctx.restore();
      return;
    }

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (var i = 1; i < points.length - 1; i++) {
      var midX = (points[i].x + points[i + 1].x) / 2;
      var midY = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
    }
    var last = points[points.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
    ctx.restore();
  }

  function createTeacherDemoStrokes(w, h) {
    return [{
      id: uid(),
      authorId: TEACHER_ID,
      authorName: 'Furkan Çilingir',
      points: [
        { x: w * 0.08, y: h * 0.22, pressure: 0.5, timestamp: 0 },
        { x: w * 0.42, y: h * 0.22, pressure: 0.5, timestamp: 1 }
      ],
      color: '#3B82FF',
      width: 4,
      opacity: 1,
      tool: 'pen',
      pointerType: 'mouse',
      createdAt: '00:00:00',
      isDeleted: false,
      visibility: 'everyone'
    }, {
      id: uid(),
      authorId: TEACHER_ID,
      authorName: 'Furkan Çilingir',
      points: [
        { x: w * 0.08, y: h * 0.34, pressure: 0.4, timestamp: 2 },
        { x: w * 0.08, y: h * 0.38, pressure: 0.4, timestamp: 3 },
        { x: w * 0.22, y: h * 0.36, pressure: 0.4, timestamp: 4 }
      ],
      color: '#F8FAFC',
      width: 3,
      opacity: 1,
      tool: 'pen',
      pointerType: 'pen',
      createdAt: '00:00:00',
      isDeleted: false,
      visibility: 'everyone',
      isText: true,
      text: '2x + 5 = 15'
    }];
  }

  function generateMockStroke(authorId, authorName, w, h, color) {
    var sx = w * (0.2 + Math.random() * 0.5);
    var sy = h * (0.35 + Math.random() * 0.35);
    var points = [];
    for (var i = 0; i < 24; i++) {
      points.push({
        x: sx + i * (4 + Math.random() * 3),
        y: sy + Math.sin(i / 3) * 8 + Math.random() * 4,
        pressure: 0.3 + Math.random() * 0.6,
        timestamp: Date.now() + i
      });
    }
    return {
      id: uid(),
      authorId: authorId,
      authorName: authorName,
      points: points,
      color: color || '#22C55E',
      width: 2 + Math.random() * 2,
      opacity: 1,
      tool: 'pen',
      pointerType: 'pen',
      createdAt: new Date().toISOString(),
      isDeleted: false,
      visibility: 'everyone'
    };
  }

  function WhiteboardEngine(opts) {
    this.canvas = opts.canvas;
    this.wb = opts.wbState;
    this.ctx = null;
    this.getCanDraw = opts.getCanDraw;
    this.getCurrentStudentId = opts.getCurrentStudentId;
    this.getAuthorName = opts.getAuthorName;
    this.onComplete = opts.onStrokeComplete || function () {};
    this.onView = opts.onView || null;
    this.activePointerId = null;
    this.rafId = null;
  }

  WhiteboardEngine.prototype.resize = function () {
    if (!this.canvas) return;
    var wrap = this.canvas.parentElement;
    var w = wrap.clientWidth;
    var h = wrap.clientHeight;
    var dpr = window.devicePixelRatio || 1;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx = this.canvas.getContext('2d');
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.render();
  };

  WhiteboardEngine.prototype.render = function () {
    if (!this.ctx || !this.canvas) return;
    var w = this.canvas.clientWidth;
    var h = this.canvas.clientHeight;
    this.ctx.clearRect(0, 0, w, h);
    this.ctx.fillStyle = BG_COLOR;
    this.ctx.fillRect(0, 0, w, h);

    var self = this;
    this.ctx.save();
    this.ctx.translate(this.wb.offsetX || 0, this.wb.offsetY || 0);
    this.ctx.scale(this.wb.scale || 1, this.wb.scale || 1);
    if (this.wb.background) this._drawBackground(this.wb.background);
    this.wb.strokes.forEach(function (s) {
      if (!s.isDeleted) self._drawStroke(s);
    });
    if (this.wb.currentStroke) this._drawStroke(this.wb.currentStroke);
    this.ctx.restore();
  };

  WhiteboardEngine.prototype._drawBackground = function (bg) {
    var ctx = this.ctx;
    var w = bg.w, h = bg.h;
    // Sayfa gölgesi
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 10;
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, 0, 0, w, h, 10);
    ctx.fill();
    ctx.restore();

    if (bg.type !== 'document') return;

    // Üst başlık şeridi (Bilenyum marka)
    ctx.save();
    var grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, '#3e3a8e');
    grad.addColorStop(1, '#e6087b');
    ctx.fillStyle = grad;
    roundRectTop(ctx, 0, 0, w, 96, 10);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = '600 22px Plus Jakarta Sans, sans-serif';
    ctx.fillText('BİLENYUM · CANLI DERS', 44, 42);
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 34px Montserrat, sans-serif';
    ctx.fillText(clip(ctx, bg.title || 'Ders Materyali', w - 88, 34), 44, 78);
    ctx.restore();

    // Gövde — sahte içerik (paragraf satırları + figür kutusu + örnek)
    ctx.save();
    ctx.fillStyle = '#1f2433';
    ctx.font = '700 26px Plus Jakarta Sans, sans-serif';
    ctx.fillText('1. Konu Özeti', 44, 168);
    var lineW = [0.92, 0.86, 0.95, 0.7];
    for (var i = 0; i < lineW.length; i++) {
      ctx.fillStyle = 'rgba(40,40,60,0.16)';
      roundRect(ctx, 44, 196 + i * 30, (w - 88) * lineW[i], 12, 6);
      ctx.fill();
    }
    // Figür kutusu
    ctx.strokeStyle = 'rgba(62,58,142,0.4)';
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(62,58,142,0.06)';
    roundRect(ctx, 44, 340, w - 88, 220, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(62,58,142,0.45)';
    ctx.font = '600 20px Plus Jakarta Sans, sans-serif';
    ctx.fillText('Şekil 1 — Örnek grafik / çizim alanı', 64, 456);
    // Örnek soru
    ctx.fillStyle = '#1f2433';
    ctx.font = '700 26px Plus Jakarta Sans, sans-serif';
    ctx.fillText('2. Örnek Soru', 44, 624);
    ctx.fillStyle = '#3e3a8e';
    ctx.font = '600 24px Plus Jakarta Sans, sans-serif';
    ctx.fillText('3x + 5 = 20  →  x = ?', 44, 664);
    var lineW2 = [0.8, 0.9, 0.55];
    for (var j = 0; j < lineW2.length; j++) {
      ctx.fillStyle = 'rgba(40,40,60,0.16)';
      roundRect(ctx, 44, 696 + j * 30, (w - 88) * lineW2[j], 12, 6);
      ctx.fill();
    }
    ctx.restore();
  };

  WhiteboardEngine.prototype._drawStroke = function (stroke) {
    if (stroke.isText && stroke.text) {
      this.ctx.save();
      this.ctx.font = '22px Plus Jakarta Sans, sans-serif';
      this.ctx.fillStyle = stroke.color;
      this.ctx.fillText(stroke.text, stroke.points[0].x, stroke.points[0].y);
      this.ctx.restore();
      return;
    }
    smoothStroke(this.ctx, stroke.points, stroke);
  };

  WhiteboardEngine.prototype._pointFromEvent = function (e) {
    var r = this.canvas.getBoundingClientRect();
    var pressure = typeof e.pressure === 'number' && e.pressure > 0 ? e.pressure : 0.5;
    var s = this.wb.scale || 1;
    return {
      x: (e.clientX - r.left - (this.wb.offsetX || 0)) / s,
      y: (e.clientY - r.top - (this.wb.offsetY || 0)) / s,
      pressure: pressure,
      timestamp: Date.now()
    };
  };

  // Pan/zoom — sayfa görünümünü kaydırır/büyütür (tüm öğrenciler aynısını görür)
  WhiteboardEngine.prototype.panBy = function (dx, dy) {
    this.wb.offsetX = (this.wb.offsetX || 0) + dx;
    this.wb.offsetY = (this.wb.offsetY || 0) + dy;
    this.render();
  };
  WhiteboardEngine.prototype.zoomBy = function (factor, cx, cy) {
    if (!this.canvas) return;
    if (cx == null) cx = this.canvas.clientWidth / 2;
    if (cy == null) cy = this.canvas.clientHeight / 2;
    var s = this.wb.scale || 1;
    var ns = clamp(s * factor, 0.2, 6);
    var wx = (cx - (this.wb.offsetX || 0)) / s;
    var wy = (cy - (this.wb.offsetY || 0)) / s;
    this.wb.scale = ns;
    this.wb.offsetX = cx - wx * ns;
    this.wb.offsetY = cy - wy * ns;
    this.render();
  };
  WhiteboardEngine.prototype.fitPage = function () {
    if (!this.canvas || !this.wb.background) return;
    var cw = this.canvas.clientWidth, ch = this.canvas.clientHeight;
    var bg = this.wb.background, m = 24;
    var s = Math.min((cw - m * 2) / bg.w, (ch - m * 2) / bg.h);
    s = clamp(s, 0.2, 6);
    this.wb.scale = s;
    this.wb.offsetX = (cw - bg.w * s) / 2;
    this.wb.offsetY = Math.max(m, (ch - bg.h * s) / 2);
    this.render();
  };
  WhiteboardEngine.prototype.zoomPercent = function () {
    return Math.round((this.wb.scale || 1) * 100);
  };

  WhiteboardEngine.prototype._widthForPressure = function (base, pressure) {
    return Math.max(1, base * (0.45 + pressure * 0.9));
  };

  WhiteboardEngine.prototype._eraseAt = function (x, y, radius, studentId) {
    var changed = false;
    this.wb.strokes.forEach(function (s) {
      if (s.isDeleted || s.authorId !== studentId) return;
      for (var i = 0; i < s.points.length; i++) {
        var p = s.points[i];
        var dx = p.x - x;
        var dy = p.y - y;
        if (dx * dx + dy * dy <= radius * radius) {
          s.isDeleted = true;
          changed = true;
          break;
        }
      }
    });
    return changed;
  };

  WhiteboardEngine.prototype.bind = function () {
    var engine = this;
    if (!this.canvas) return;

    this.canvas.addEventListener('pointerdown', function (e) {
      // El imleci (pan) — çizim izni gerekmeden herkes görünümü kaydırabilir
      if (engine.wb.selectedTool === 'pointer') {
        e.preventDefault();
        try { engine.canvas.setPointerCapture(e.pointerId); } catch (err) {}
        engine.activePointerId = e.pointerId;
        engine._panning = { x: e.clientX, y: e.clientY, ox: engine.wb.offsetX || 0, oy: engine.wb.offsetY || 0 };
        engine.canvas.style.cursor = 'grabbing';
        return;
      }
      if (!engine.getCanDraw()) return;
      e.preventDefault();
      try { engine.canvas.setPointerCapture(e.pointerId); } catch (err) {}
      engine.activePointerId = e.pointerId;
      var pt = engine._pointFromEvent(e);
      var authorId = engine.getCurrentStudentId();

      if (engine.wb.selectedTool === 'eraser') {
        engine.wb.currentStroke = null;
        engine._eraseAt(pt.x, pt.y, (engine.wb.eraserRadius || 18) / (engine.wb.scale || 1), authorId);
        engine.render();
        return;
      }

      engine.wb.currentStroke = {
        id: uid(),
        authorId: authorId,
        authorName: engine.getAuthorName(authorId),
        points: [pt],
        color: engine.wb.selectedColor,
        width: engine._widthForPressure(engine.wb.selectedWidth, pt.pressure),
        opacity: engine.wb.selectedTool === 'highlighter' ? 0.45 : engine.wb.selectedOpacity,
        tool: engine.wb.selectedTool === 'eraser' ? 'eraser' : (engine.wb.selectedTool === 'highlighter' ? 'highlighter' : 'pen'),
        pointerType: e.pointerType || 'mouse',
        createdAt: new Date().toISOString(),
        isDeleted: false,
        visibility: 'everyone'
      };
      engine.wb.redoStack = [];
    });

    this.canvas.addEventListener('pointermove', function (e) {
      if (engine.activePointerId !== e.pointerId) return;
      e.preventDefault();

      if (engine._panning) {
        engine.wb.offsetX = engine._panning.ox + (e.clientX - engine._panning.x);
        engine.wb.offsetY = engine._panning.oy + (e.clientY - engine._panning.y);
        if (!engine.rafId) {
          engine.rafId = requestAnimationFrame(function () { engine.rafId = null; engine.render(); });
        }
        return;
      }

      var pt = engine._pointFromEvent(e);

      if (engine.wb.selectedTool === 'eraser') {
        if (engine._eraseAt(pt.x, pt.y, (engine.wb.eraserRadius || 18) / (engine.wb.scale || 1), engine.getCurrentStudentId())) {
          if (!engine.rafId) {
            engine.rafId = requestAnimationFrame(function () {
              engine.rafId = null;
              engine.render();
            });
          }
        }
        return;
      }

      if (!engine.wb.currentStroke) return;
      engine.wb.currentStroke.points.push(pt);
      engine.wb.currentStroke.width = engine._widthForPressure(engine.wb.selectedWidth, pt.pressure);
      if (!engine.rafId) {
        engine.rafId = requestAnimationFrame(function () {
          engine.rafId = null;
          engine.render();
        });
      }
    });

    function finish(e) {
      if (engine.activePointerId !== e.pointerId) return;
      try { engine.canvas.releasePointerCapture(e.pointerId); } catch (err) {}
      engine.activePointerId = null;

      if (engine._panning) {
        engine._panning = null;
        engine.canvas.style.cursor = 'grab';
        engine.render();
        return;
      }

      if (engine.wb.selectedTool === 'eraser') {
        engine.render();
        return;
      }

      if (!engine.wb.currentStroke) return;
      if (engine.wb.currentStroke.points.length >= 1) {
        engine.wb.strokes.push(engine.wb.currentStroke);
        engine.wb.undoStack.push(engine.wb.currentStroke.id);
      }
      engine.wb.currentStroke = null;
      engine.render();
      engine.onComplete();
    }

    this.canvas.addEventListener('pointerup', finish);
    this.canvas.addEventListener('pointercancel', finish);

    // Tekerlek ile yakınlaştır/uzaklaştır (imlece doğru)
    this.canvas.addEventListener('wheel', function (e) {
      if (!engine.wb.background) return;
      e.preventDefault();
      var r = engine.canvas.getBoundingClientRect();
      var factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      engine.zoomBy(factor, e.clientX - r.left, e.clientY - r.top);
      if (engine.onView) engine.onView();
    }, { passive: false });
  };

  WhiteboardEngine.prototype.undo = function (studentId) {
    for (var i = this.wb.strokes.length - 1; i >= 0; i--) {
      var s = this.wb.strokes[i];
      if (!s.isDeleted && s.authorId === studentId) {
        s.isDeleted = true;
        this.wb.redoStack.push(s.id);
        this.render();
        return true;
      }
    }
    return false;
  };

  WhiteboardEngine.prototype.redo = function (studentId) {
    if (!this.wb.redoStack.length) return false;
    var id = this.wb.redoStack.pop();
    var stroke = null;
    for (var i = 0; i < this.wb.strokes.length; i++) {
      if (this.wb.strokes[i].id === id) { stroke = this.wb.strokes[i]; break; }
    }
    if (stroke && stroke.authorId === studentId) {
      stroke.isDeleted = false;
      this.wb.undoStack.push(stroke.id);
      this.render();
      return true;
    }
    return false;
  };

  WhiteboardEngine.prototype.clearOwn = function (studentId) {
    var changed = false;
    this.wb.strokes.forEach(function (s) {
      if (s.authorId === studentId && s.authorId !== TEACHER_ID) {
        s.isDeleted = true;
        changed = true;
      }
    });
    this.wb.undoStack = [];
    this.wb.redoStack = [];
    if (changed) this.render();
    return changed;
  };

  WhiteboardEngine.prototype.clearStudentStrokes = function () {
    var changed = false;
    this.wb.strokes.forEach(function (s) {
      if (s.authorId !== TEACHER_ID) {
        s.isDeleted = true;
        changed = true;
      }
    });
    this.wb.undoStack = [];
    this.wb.redoStack = [];
    if (changed) this.render();
    return changed;
  };

  WhiteboardEngine.prototype.addStroke = function (stroke) {
    this.wb.strokes.push(stroke);
    this.render();
  };

  WhiteboardEngine.prototype.initTeacherDemo = function () {
    var w = this.canvas ? this.canvas.clientWidth : 800;
    var h = this.canvas ? this.canvas.clientHeight : 500;
    var demo = createTeacherDemoStrokes(w, h);
    demo.forEach(function (s) { this.wb.strokes.push(s); }, this);
    this.render();
  };

  global.LiveClassWhiteboard = {
    createWhiteboardState: createWhiteboardState,
    WhiteboardEngine: WhiteboardEngine,
    generateMockStroke: generateMockStroke,
    createTeacherDemoStrokes: createTeacherDemoStrokes,
    TEACHER_ID: TEACHER_ID
  };

})(typeof window !== 'undefined' ? window : this);
