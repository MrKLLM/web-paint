/*!
 * WebPaint.js - 网页绘画标注插件
 * 功能：画笔 / 荧光笔 / 箭头 / 矩形 / 文字标注 / 橡皮擦 / 撤销重做 / 清空 / 导出图片 / 可拖动工具栏
 * 特点：单文件零依赖（导出整页时按需加载 html2canvas），浮层不影响页面交互
 * 用法：const wp = new WebPaint(); wp.enable();
 */
(function (global, factory) {
  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory();
  } else {
    global.WebPaint = factory();
  }
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  var DEFAULTS = {
    zIndex: 999990,          // 画布层级
    color: '#e5484d',        // 默认颜色
    size: 4,                 // 默认线宽
    tool: 'pen',             // 默认工具 pen|highlighter|arrow|rect|text|eraser
    toolbar: true,           // 是否显示内置工具栏
    hotkeys: true,           // Ctrl+Z / Ctrl+Y 快捷键
    autoEnable: false,       // 初始化后立即进入标注模式
    presetColors: ['#e5484d', '#ff8c00', '#f5c518', '#30a46c', '#0091ff', '#8e4ec6', '#1c2024', '#ffffff'],
    html2canvasUrl: 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js'
  };

  var ICONS = {
    pen: '<svg viewBox="0 0 24 24"><path d="M3 21l3.5-1 12-12a2.1 2.1 0 0 0-3-3l-12 12L3 21z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    highlighter: '<svg viewBox="0 0 24 24"><path d="M9 15l-4 4H3v-2l4-4m2 2l9-9a1.8 1.8 0 0 0-2.5-2.5l-9 9m2 2l-2.5-2.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><path d="M4 22h16" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity=".45"/></svg>',
    drag: '<svg viewBox="0 0 24 24"><circle cx="9" cy="6" r="1.6" fill="currentColor"/><circle cx="15" cy="6" r="1.6" fill="currentColor"/><circle cx="9" cy="12" r="1.6" fill="currentColor"/><circle cx="15" cy="12" r="1.6" fill="currentColor"/><circle cx="9" cy="18" r="1.6" fill="currentColor"/><circle cx="15" cy="18" r="1.6" fill="currentColor"/></svg>',
    arrow: '<svg viewBox="0 0 24 24"><path d="M5 19L17 7M17 7h-7M17 7v7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    rect: '<svg viewBox="0 0 24 24"><rect x="4" y="6" width="16" height="12" rx="1.5" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    text: '<svg viewBox="0 0 24 24"><path d="M5 6V4h14v2M12 4v16m-3 0h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    eraser: '<svg viewBox="0 0 24 24"><path d="M7 20h13M6.5 19.5l-3-3a2 2 0 0 1 0-2.8l8.2-8.2a2 2 0 0 1 2.8 0l4 4a2 2 0 0 1 0 2.8L11 19.8a2 2 0 0 1-1.4.6H8a2 2 0 0 1-1.5-.9z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    undo: '<svg viewBox="0 0 24 24"><path d="M8 5L3 10l5 5M3 10h11a6 6 0 0 1 0 12h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    redo: '<svg viewBox="0 0 24 24"><path d="M16 5l5 5-5 5M21 10H10a6 6 0 0 0 0 12h4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    clear: '<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V5h6v2m-8 0l1 13h8l1-13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    save: '<svg viewBox="0 0 24 24"><path d="M12 3v11m0 0l-4-4m4 4l4-4M4 17v3h16v-3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    brush: '<svg viewBox="0 0 24 24"><path d="M3 21l3.5-1 12-12a2.1 2.1 0 0 0-3-3l-12 12L3 21z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>'
  };

  var CSS = [
    '.wp-ui{--wp-bg:#fff;--wp-fg:#3a3f45;--wp-line:#e4e7eb;--wp-accent:#0091ff;box-sizing:border-box;font-family:-apple-system,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;}',
    '.wp-ui *{box-sizing:border-box;}',
    '.wp-toolbar{position:fixed;top:50%;right:16px;transform:translateY(-50%);display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px 8px;background:var(--wp-bg);border:1px solid var(--wp-line);border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,.14);user-select:none;max-height:92vh;overflow-y:auto;overflow-x:hidden;}',
    '.wp-drag{width:38px;height:20px;display:flex;align-items:center;justify-content:center;color:#b6bdc6;cursor:grab;flex:0 0 auto;touch-action:none;border-radius:6px;}',
    '.wp-drag:hover{background:#f0f3f6;color:#8a929c;}',
    '.wp-drag:active{cursor:grabbing;}',
    '.wp-drag svg{width:16px;height:16px;pointer-events:none;}',
    '.wp-btn{width:38px;height:38px;display:flex;align-items:center;justify-content:center;border:none;border-radius:10px;background:transparent;color:var(--wp-fg);cursor:pointer;padding:0;flex:0 0 auto;}',
    '.wp-btn svg{width:20px;height:20px;display:block;}',
    '.wp-btn:hover{background:#f0f3f6;}',
    '.wp-btn.wp-active{background:var(--wp-accent);color:#fff;}',
    '.wp-btn:disabled{opacity:.35;cursor:default;background:transparent;}',
    '.wp-sep{width:26px;height:1px;background:var(--wp-line);margin:3px 0;flex:0 0 auto;}',
    '.wp-colors{display:grid;grid-template-columns:repeat(2,18px);gap:6px;padding:2px;}',
    '.wp-swatch{width:18px;height:18px;border-radius:50%;border:2px solid rgba(0,0,0,.12);cursor:pointer;padding:0;}',
    '.wp-swatch.wp-active{outline:2px solid var(--wp-accent);outline-offset:1px;}',
    '.wp-color-input{width:38px;height:24px;border:1px solid var(--wp-line);border-radius:6px;padding:1px;background:#fff;cursor:pointer;}',
    '.wp-size{writing-mode:vertical-lr;direction:rtl;height:70px;width:22px;accent-color:var(--wp-accent);cursor:pointer;}',
    '.wp-size-dot{border-radius:50%;background:var(--wp-fg);margin:2px auto;flex:0 0 auto;}',
    '.wp-fab{position:fixed;right:16px;bottom:20px;width:48px;height:48px;border-radius:50%;border:none;background:var(--wp-accent);color:#fff;box-shadow:0 6px 20px rgba(0,145,255,.4);cursor:pointer;display:flex;align-items:center;justify-content:center;}',
    '.wp-fab svg{width:22px;height:22px;}',
    '.wp-text-editor{position:absolute;min-width:120px;min-height:1.4em;padding:4px 6px;border:1.5px dashed var(--wp-accent);border-radius:4px;background:rgba(255,255,255,.6);outline:none;resize:none;overflow:hidden;line-height:1.35;font-family:inherit;}',
    '.wp-toast{position:fixed;left:50%;top:24px;transform:translateX(-50%);background:rgba(28,32,36,.9);color:#fff;font-size:13px;padding:8px 16px;border-radius:8px;z-index:2147483647;transition:opacity .3s;}',
    '@media (max-width:768px){.wp-toolbar{top:auto;right:8px;left:8px;bottom:12px;transform:none;flex-direction:row;max-height:none;max-width:none;overflow-x:auto;overflow-y:hidden;padding:8px 10px;gap:4px;}.wp-sep{width:1px;height:26px;margin:0 3px;}.wp-colors{grid-template-columns:repeat(4,18px);}.wp-size{writing-mode:horizontal-tb;direction:ltr;width:70px;height:22px;}.wp-drag{width:20px;height:38px;}}'
  ].join('\n');

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function WebPaint(options) {
    this.opts = Object.assign({}, DEFAULTS, options || {});
    this.tool = this.opts.tool;
    this.color = this.opts.color;
    this.size = this.opts.size;
    this.objects = [];      // 已提交的绘制对象（矢量数据，缩放/重绘不失真）
    this.undoStack = [];    // 操作栈
    this.redoStack = [];
    this.enabled = false;
    this._drawing = null;   // 正在绘制的对象
    this._destroyed = false;
    this._listeners = [];
    this._init();
  }

  WebPaint.prototype = {

    /* ================= 初始化 ================= */

    _init: function () {
      this._injectStyle();
      this._createCanvas();
      if (this.opts.toolbar) this._createToolbar();
      this._bindGlobal();
      this._resize();
      if (this.opts.autoEnable) this.enable(); else this.disable();
    },

    _injectStyle: function () {
      if (document.getElementById('wp-style')) return;
      var s = el('style'); s.id = 'wp-style'; s.textContent = CSS;
      document.head.appendChild(s);
    },

    _createCanvas: function () {
      var c = el('canvas');
      c.setAttribute('data-wp-canvas', '');
      c.style.cssText = 'position:absolute;left:0;top:0;z-index:' + this.opts.zIndex +
        ';pointer-events:none;touch-action:none;';
      document.body.appendChild(c);
      this.canvas = c;
      this.ctx = c.getContext('2d');
      this._bindCanvasEvents();
    },

    _bindGlobal: function () {
      var self = this;
      this._on(window, 'resize', function () { self._resize(); });
      // 监听页面高度变化（内容动态增减）
      if (typeof ResizeObserver !== 'undefined') {
        this._ro = new ResizeObserver(function () { self._resize(); });
        this._ro.observe(document.body);
      }
      if (this.opts.hotkeys) {
        this._on(document, 'keydown', function (e) {
          if (!self.enabled) return;
          var t = e.target;
          if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
          var ctrl = e.ctrlKey || e.metaKey;
          if (ctrl && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) { e.preventDefault(); self.undo(); }
          else if ((ctrl && (e.key === 'y' || e.key === 'Y')) || (ctrl && e.shiftKey && (e.key === 'z' || e.key === 'Z'))) { e.preventDefault(); self.redo(); }
        });
      }
    },

    _on: function (target, type, fn, opts) {
      target.addEventListener(type, fn, opts);
      this._listeners.push([target, type, fn, opts]);
    },

    /* ================= 尺寸 / 响应式 ================= */

    _resize: function () {
      if (this._destroyed) return;
      var doc = document.documentElement;
      var w = Math.max(doc.scrollWidth, doc.clientWidth);
      var h = Math.max(doc.scrollHeight, doc.clientHeight);
      var dpr = window.devicePixelRatio || 1;
      if (this._w === w && this._h === h && this._dpr === dpr) return;
      this._w = w; this._h = h; this._dpr = dpr;
      this.canvas.style.width = w + 'px';
      this.canvas.style.height = h + 'px';
      this.canvas.width = Math.round(w * dpr);
      this.canvas.height = Math.round(h * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this._redraw();
    },

    /* ================= 绘制事件 ================= */

    _bindCanvasEvents: function () {
      var self = this, c = this.canvas;
      c.addEventListener('pointerdown', function (e) {
        if (!self.enabled || e.button !== 0) return;
        e.preventDefault();
        c.setPointerCapture(e.pointerId);
        var p = self._pos(e);
        if (self.tool === 'text') { self._startTextEditor(p.x, p.y); return; }
        var base = { color: self.color, size: self.size };
        if (self.tool === 'pen') self._drawing = { type: 'pen', color: base.color, size: base.size, points: [p] };
        else if (self.tool === 'highlighter') self._drawing = { type: 'highlighter', color: base.color, size: Math.max(base.size * 4, 14), points: [p] };
        else if (self.tool === 'eraser') self._drawing = { type: 'eraser', size: Math.max(base.size * 5, 16), points: [p] };
        else if (self.tool === 'rect') self._drawing = { type: 'rect', color: base.color, size: base.size, x1: p.x, y1: p.y, x2: p.x, y2: p.y };
        else if (self.tool === 'arrow') self._drawing = { type: 'arrow', color: base.color, size: base.size, x1: p.x, y1: p.y, x2: p.x, y2: p.y };
      });
      c.addEventListener('pointermove', function (e) {
        if (!self._drawing) return;
        e.preventDefault();
        var p = self._pos(e), d = self._drawing;
        if (d.points) {
          d.points.push(p);
          if (d.type === 'highlighter') {
            // 荧光笔是半透明的：必须整条重画，否则分段叠加会颜色深浅不一
            self._redraw();
            self._drawObject(self.ctx, d);
          } else {
            // 笔迹/橡皮增量绘制，避免整层重绘卡顿
            self._drawObject(self.ctx, d, d.points.length - 2);
          }
        } else {
          d.x2 = p.x; d.y2 = p.y;
          self._redraw();
          self._drawObject(self.ctx, d);
        }
      });
      var end = function (e) {
        if (!self._drawing) return;
        var d = self._drawing; self._drawing = null;
        if (d.points && d.points.length < 2) {
          d.points.push({ x: d.points[0].x + 0.1, y: d.points[0].y + 0.1 });
        }
        if (d.type === 'rect' || d.type === 'arrow') {
          if (Math.abs(d.x2 - d.x1) < 3 && Math.abs(d.y2 - d.y1) < 3) { self._redraw(); return; }
        }
        self._commit(d);
      };
      c.addEventListener('pointerup', end);
      c.addEventListener('pointercancel', end);
    },

    _pos: function (e) {
      // 画布铺满整个文档，页面坐标即画布坐标（滚动后标注仍贴合内容）
      return { x: e.pageX, y: e.pageY };
    },

    /* ================= 对象渲染 ================= */

    _redraw: function () {
      var ctx = this.ctx;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.restore();
      for (var i = 0; i < this.objects.length; i++) this._drawObject(ctx, this.objects[i]);
    },

    _drawObject: function (ctx, o, fromIndex) {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      switch (o.type) {
        case 'pen':
        case 'eraser':
        case 'highlighter':
          if (o.type === 'eraser') { ctx.globalCompositeOperation = 'destination-out'; ctx.strokeStyle = 'rgba(0,0,0,1)'; }
          else ctx.strokeStyle = o.color;
          if (o.type === 'highlighter') {
            ctx.globalAlpha = 0.35;             // 半透明荧光效果
            ctx.globalCompositeOperation = 'multiply'; // 与文字叠加更像真实荧光笔
            ctx.lineCap = 'butt';               // 平头笔帽
          }
          ctx.lineWidth = o.size;
          ctx.beginPath();
          var pts = o.points, start = Math.max(0, fromIndex || 0);
          ctx.moveTo(pts[start].x, pts[start].y);
          for (var i = start + 1; i < pts.length; i++) {
            var prev = pts[i - 1], cur = pts[i];
            // 二次贝塞尔平滑
            ctx.quadraticCurveTo(prev.x, prev.y, (prev.x + cur.x) / 2, (prev.y + cur.y) / 2);
          }
          ctx.stroke();
          break;
        case 'rect':
          ctx.strokeStyle = o.color;
          ctx.lineWidth = o.size;
          ctx.strokeRect(Math.min(o.x1, o.x2), Math.min(o.y1, o.y2), Math.abs(o.x2 - o.x1), Math.abs(o.y2 - o.y1));
          break;
        case 'arrow':
          this._drawArrow(ctx, o);
          break;
        case 'text':
          ctx.fillStyle = o.color;
          ctx.font = o.fontSize + 'px ' + (o.fontFamily || 'sans-serif');
          ctx.textBaseline = 'top';
          var lines = String(o.text).split('\n');
          for (var j = 0; j < lines.length; j++) {
            ctx.fillText(lines[j], o.x, o.y + j * o.fontSize * 1.35);
          }
          break;
      }
      ctx.restore();
    },

    _drawArrow: function (ctx, o) {
      var x1 = o.x1, y1 = o.y1, x2 = o.x2, y2 = o.y2;
      var angle = Math.atan2(y2 - y1, x2 - x1);
      var headLen = Math.max(o.size * 3.2, 12);
      ctx.strokeStyle = o.color;
      ctx.fillStyle = o.color;
      ctx.lineWidth = o.size;
      // 主干（略缩短，避免盖住箭头尖）
      var bx = x2 - headLen * 0.7 * Math.cos(angle);
      var by = y2 - headLen * 0.7 * Math.sin(angle);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(bx, by);
      ctx.stroke();
      // 箭头三角
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 7), y2 - headLen * Math.sin(angle - Math.PI / 7));
      ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 7), y2 - headLen * Math.sin(angle + Math.PI / 7));
      ctx.closePath();
      ctx.fill();
    },

    /* ================= 文字标注 ================= */

    _startTextEditor: function (x, y) {
      var self = this;
      if (this._textEditor) { this._commitTextEditor(); return; }
      var fontSize = Math.max(14, this.size * 4);
      var ta = el('textarea', 'wp-ui wp-text-editor');
      ta.rows = 1;
      ta.placeholder = '输入文字，Esc 取消';
      ta.style.cssText += 'left:' + x + 'px;top:' + (y - 4) + 'px;z-index:' + (this.opts.zIndex + 2) +
        ';font-size:' + fontSize + 'px;color:' + this.color + ';';
      document.body.appendChild(ta);
      this._textEditor = { ta: ta, x: x, y: y, fontSize: fontSize, color: this.color };
      setTimeout(function () { ta.focus(); }, 0);
      var autoGrow = function () {
        ta.style.height = 'auto';
        ta.style.height = ta.scrollHeight + 'px';
        ta.style.width = 'auto';
        ta.style.width = Math.max(120, ta.scrollWidth + 8) + 'px';
      };
      ta.addEventListener('input', autoGrow);
      ta.addEventListener('keydown', function (e) {
        e.stopPropagation();
        if (e.key === 'Escape') { self._removeTextEditor(); }
        else if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); self._commitTextEditor(); }
      });
      ta.addEventListener('blur', function () { self._commitTextEditor(); });
    },

    _commitTextEditor: function () {
      var ed = this._textEditor;
      if (!ed) return;
      var text = ed.ta.value.replace(/\s+$/, '');
      this._removeTextEditor();
      if (!text) return;
      this._commit({ type: 'text', x: ed.x + 7, y: ed.y + 2, text: text, color: ed.color, fontSize: ed.fontSize });
    },

    _removeTextEditor: function () {
      if (!this._textEditor) return;
      var ta = this._textEditor.ta;
      this._textEditor = null;
      if (ta.parentNode) ta.parentNode.removeChild(ta);
    },

    /* ================= 历史记录 ================= */

    _commit: function (obj) {
      this.objects.push(obj);
      this.undoStack.push({ kind: 'add', obj: obj });
      this.redoStack.length = 0;
      this._redraw();
      this._syncToolbar();
      this._emit('change');
    },

    undo: function () {
      var a = this.undoStack.pop();
      if (!a) return this;
      if (a.kind === 'add') {
        var i = this.objects.indexOf(a.obj);
        if (i > -1) this.objects.splice(i, 1);
      } else if (a.kind === 'clear') {
        this.objects = a.prev.slice();
      }
      this.redoStack.push(a);
      this._redraw();
      this._syncToolbar();
      this._emit('change');
      return this;
    },

    redo: function () {
      var a = this.redoStack.pop();
      if (!a) return this;
      if (a.kind === 'add') this.objects.push(a.obj);
      else if (a.kind === 'clear') this.objects.length = 0;
      this.undoStack.push(a);
      this._redraw();
      this._syncToolbar();
      this._emit('change');
      return this;
    },

    clear: function () {
      if (!this.objects.length) return this;
      this.undoStack.push({ kind: 'clear', prev: this.objects.slice() });
      this.redoStack.length = 0;
      this.objects.length = 0;
      this._redraw();
      this._syncToolbar();
      this._emit('change');
      return this;
    },

    /* ================= 公共 API ================= */

    enable: function () {
      this.enabled = true;
      this.canvas.style.pointerEvents = 'auto';
      this.canvas.style.cursor = 'crosshair';
      if (this._toolbar) this._toolbar.style.display = '';
      if (this._fab) this._fab.style.display = 'none';
      this._emit('enable');
      return this;
    },

    disable: function () {
      // 浏览模式：画布穿透，不影响页面原有交互；已绘制内容仍然可见
      this.enabled = false;
      this._drawing = null;
      this._removeTextEditor();
      this.canvas.style.pointerEvents = 'none';
      if (this._toolbar) this._toolbar.style.display = 'none';
      if (this._fab && this.opts.toolbar) this._fab.style.display = '';
      this._emit('disable');
      return this;
    },

    toggle: function () { return this.enabled ? this.disable() : this.enable(); },

    setTool: function (tool) {
      if (['pen', 'highlighter', 'arrow', 'rect', 'text', 'eraser'].indexOf(tool) === -1) return this;
      this.tool = tool;
      this._syncToolbar();
      this._emit('toolchange', tool);
      return this;
    },

    setColor: function (color) { this.color = color; this._syncToolbar(); return this; },
    setSize: function (size) { this.size = Math.max(1, +size || 1); this._syncToolbar(); return this; },

    canUndo: function () { return this.undoStack.length > 0; },
    canRedo: function () { return this.redoStack.length > 0; },

    /** 获取标注矢量数据（可持久化） */
    getData: function () { return JSON.parse(JSON.stringify(this.objects)); },
    /** 载入标注数据 */
    loadData: function (data) {
      this.objects = Array.isArray(data) ? JSON.parse(JSON.stringify(data)) : [];
      this.undoStack.length = 0; this.redoStack.length = 0;
      this._redraw(); this._syncToolbar();
      return this;
    },

    /**
     * 导出图片
     * mode: 'page'  整个页面 + 标注（需联网加载 html2canvas）
     *       'layer' 仅透明标注层
     * 返回 Promise<dataURL>；download !== false 时自动下载
     */
    exportImage: function (opts) {
      opts = opts || {};
      var mode = opts.mode || 'page';
      var self = this;
      var run = mode === 'layer' ? Promise.resolve(this._exportLayer()) : this._exportPage();
      return run.then(function (dataUrl) {
        if (opts.download !== false) {
          var a = el('a');
          a.href = dataUrl;
          a.download = opts.filename || ('webpaint-' + Date.now() + '.png');
          a.click();
        }
        return dataUrl;
      });
    },

    _exportLayer: function () {
      return this.canvas.toDataURL('image/png');
    },

    _exportPage: function () {
      var self = this;
      return this._loadHtml2Canvas().then(function (h2c) {
        self._toast('正在生成图片…');
        return h2c(document.body, {
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#ffffff',
          scale: Math.min(window.devicePixelRatio || 1, 2),
          ignoreElements: function (node) {
            return node.classList && node.classList.contains('wp-ui');
          }
        }).then(function (canvas) {
          self._toast('导出成功 ✔', 1500);
          return canvas.toDataURL('image/png');
        });
      }).catch(function (err) {
        // CDN 不可用等情况：降级导出透明标注层
        self._toast('整页截图不可用，已导出标注图层', 2500);
        console.warn('[WebPaint] html2canvas 加载/渲染失败，降级导出标注层：', err);
        return self._exportLayer();
      });
    },

    _loadHtml2Canvas: function () {
      if (window.html2canvas) return Promise.resolve(window.html2canvas);
      if (this._h2cPromise) return this._h2cPromise;
      var url = this.opts.html2canvasUrl;
      this._h2cPromise = new Promise(function (resolve, reject) {
        var s = el('script');
        s.src = url;
        s.onload = function () { window.html2canvas ? resolve(window.html2canvas) : reject(new Error('html2canvas missing')); };
        s.onerror = function () { reject(new Error('failed to load ' + url)); };
        document.head.appendChild(s);
        setTimeout(function () { reject(new Error('html2canvas load timeout')); }, 15000);
      });
      return this._h2cPromise;
    },

    /** 事件订阅：change / enable / disable / toolchange */
    on: function (type, fn) {
      this._events = this._events || {};
      (this._events[type] = this._events[type] || []).push(fn);
      return this;
    },
    off: function (type, fn) {
      var arr = this._events && this._events[type];
      if (arr) {
        var i = arr.indexOf(fn);
        if (i > -1) arr.splice(i, 1);
      }
      return this;
    },
    _emit: function (type, payload) {
      var arr = this._events && this._events[type];
      if (arr) arr.slice().forEach(function (fn) { try { fn(payload); } catch (e) { console.error(e); } });
    },

    destroy: function () {
      this._destroyed = true;
      this.disable();
      this._listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2], l[3]); });
      this._listeners.length = 0;
      if (this._ro) this._ro.disconnect();
      [this.canvas, this._toolbar, this._fab].forEach(function (n) {
        if (n && n.parentNode) n.parentNode.removeChild(n);
      });
      this.objects.length = 0;
    },

    /* ================= 内置工具栏 ================= */

    _createToolbar: function () {
      var self = this;
      var bar = el('div', 'wp-ui wp-toolbar');
      bar.style.zIndex = this.opts.zIndex + 1;
      bar.setAttribute('data-html2canvas-ignore', '');

      // 拖动手柄：按住可将工具栏移动到任意位置
      var handle = el('div', 'wp-drag', ICONS.drag);
      handle.title = '按住拖动工具栏';
      this._bindToolbarDrag(bar, handle);
      bar.appendChild(handle);

      var tools = [
        ['pen', '画笔'], ['highlighter', '荧光笔'], ['arrow', '箭头'], ['rect', '矩形框'], ['text', '文字标注'], ['eraser', '橡皮擦']
      ];
      this._toolBtns = {};
      tools.forEach(function (t) {
        var b = el('button', 'wp-btn', ICONS[t[0]]);
        b.title = t[1];
        b.addEventListener('click', function () { self.setTool(t[0]); });
        self._toolBtns[t[0]] = b;
        bar.appendChild(b);
      });

      bar.appendChild(el('div', 'wp-sep'));

      // 颜色
      var colors = el('div', 'wp-colors');
      this._swatches = [];
      this.opts.presetColors.forEach(function (c) {
        var s = el('button', 'wp-swatch');
        s.style.background = c;
        s.title = c;
        s.setAttribute('data-color', c.toLowerCase());
        s.addEventListener('click', function () { self.setColor(c); });
        self._swatches.push(s);
        colors.appendChild(s);
      });
      bar.appendChild(colors);
      var colorInput = el('input', 'wp-color-input');
      colorInput.type = 'color';
      colorInput.value = this.color;
      colorInput.title = '自定义颜色';
      colorInput.addEventListener('input', function () { self.setColor(colorInput.value); });
      this._colorInput = colorInput;
      bar.appendChild(colorInput);

      bar.appendChild(el('div', 'wp-sep'));

      // 粗细
      var size = el('input', 'wp-size');
      size.type = 'range'; size.min = '1'; size.max = '24'; size.step = '1';
      size.value = this.size;
      size.title = '画笔粗细';
      size.addEventListener('input', function () { self.setSize(size.value); });
      this._sizeInput = size;
      bar.appendChild(size);
      this._sizeDot = el('div', 'wp-size-dot');
      bar.appendChild(this._sizeDot);

      bar.appendChild(el('div', 'wp-sep'));

      var acts = [
        ['undo', '撤销 (Ctrl+Z)', function () { self.undo(); }],
        ['redo', '重做 (Ctrl+Y)', function () { self.redo(); }],
        ['clear', '清空画布', function () { self.clear(); }],
        ['save', '导出为图片', function () { self.exportImage(); }],
        ['close', '退出标注（浏览页面）', function () { self.disable(); }]
      ];
      this._actBtns = {};
      acts.forEach(function (a) {
        var b = el('button', 'wp-btn', ICONS[a[0]]);
        b.title = a[1];
        b.addEventListener('click', a[2]);
        self._actBtns[a[0]] = b;
        bar.appendChild(b);
      });

      document.body.appendChild(bar);
      this._toolbar = bar;

      // 悬浮球：浏览模式下点击可回到标注模式
      var fab = el('button', 'wp-ui wp-fab', ICONS.brush);
      fab.title = '开始标注';
      fab.style.zIndex = this.opts.zIndex + 1;
      fab.setAttribute('data-html2canvas-ignore', '');
      fab.addEventListener('click', function () { self.enable(); });
      document.body.appendChild(fab);
      this._fab = fab;

      this._syncToolbar();
    },

    _bindToolbarDrag: function (bar, handle) {
      var self = this, sx, sy, ox, oy, dragging = false;
      handle.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        e.stopPropagation();
        dragging = true;
        handle.setPointerCapture(e.pointerId);
        var r = bar.getBoundingClientRect();
        // 首次拖动时把 right/transform 定位换算成 left/top，之后自由移动
        bar.style.left = r.left + 'px';
        bar.style.top = r.top + 'px';
        bar.style.right = 'auto';
        bar.style.bottom = 'auto';
        bar.style.transform = 'none';
        sx = e.clientX; sy = e.clientY;
        ox = r.left; oy = r.top;
      });
      handle.addEventListener('pointermove', function (e) {
        if (!dragging) return;
        var r = bar.getBoundingClientRect();
        var x = ox + (e.clientX - sx);
        var y = oy + (e.clientY - sy);
        // 限制在视口内，至少留 8px 边距
        x = Math.max(8, Math.min(x, window.innerWidth - r.width - 8));
        y = Math.max(8, Math.min(y, window.innerHeight - r.height - 8));
        bar.style.left = x + 'px';
        bar.style.top = y + 'px';
        self._barMoved = true;
      });
      var up = function (e) { dragging = false; };
      handle.addEventListener('pointerup', up);
      handle.addEventListener('pointercancel', up);
      // 窗口缩放后确保工具栏仍在视口内
      this._on(window, 'resize', function () {
        if (!self._barMoved) return;
        var r = bar.getBoundingClientRect();
        var x = Math.max(8, Math.min(r.left, window.innerWidth - r.width - 8));
        var y = Math.max(8, Math.min(r.top, window.innerHeight - r.height - 8));
        bar.style.left = x + 'px';
        bar.style.top = y + 'px';
      });
    },

    _syncToolbar: function () {
      if (!this._toolbar) return;
      var self = this;
      Object.keys(this._toolBtns).forEach(function (k) {
        self._toolBtns[k].classList.toggle('wp-active', self.tool === k);
      });
      this._swatches.forEach(function (s) {
        s.classList.toggle('wp-active', s.getAttribute('data-color') === String(self.color).toLowerCase());
      });
      if (this._colorInput && /^#([0-9a-f]{6})$/i.test(this.color)) this._colorInput.value = this.color;
      if (this._sizeInput) this._sizeInput.value = this.size;
      if (this._sizeDot) {
        var d = Math.min(this.size, 18);
        this._sizeDot.style.width = d + 'px';
        this._sizeDot.style.height = d + 'px';
      }
      this._actBtns.undo.disabled = !this.canUndo();
      this._actBtns.redo.disabled = !this.canRedo();
      this._actBtns.clear.disabled = !this.objects.length;
    },

    _toast: function (msg, duration) {
      var self = this;
      if (this._toastEl && this._toastEl.parentNode) this._toastEl.parentNode.removeChild(this._toastEl);
      clearTimeout(this._toastTimer);
      var t = el('div', 'wp-ui wp-toast', msg);
      t.setAttribute('data-html2canvas-ignore', '');
      document.body.appendChild(t);
      this._toastEl = t;
      this._toastTimer = setTimeout(function () {
        t.style.opacity = '0';
        setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 350);
      }, duration || 2000);
    }
  };

  return WebPaint;
});
