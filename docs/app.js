/* Niksnaks homepage: remote control, search and scaling.
   Plain ES5 so it also runs on older Tizen TVs. */
(function () {
  'use strict';

  var SEARCH_URL = 'https://duckduckgo.com/?kae=d&kl=nl-nl&k1=-1&q=';  // dark theme, Dutch results, no ads

  var KEY = {
    LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40, ENTER: 13,
    BACK: 10009, ESC: 27, SPACE: 32,
    IME_DONE: 65376, IME_CANCEL: 65385,
    L: 76, F6: 117
  };

  var stage = document.getElementById('stage');
  var form = document.getElementById('search');
  var input = document.getElementById('q');
  var hint = document.getElementById('search-hint');
  var tiles = [].slice.call(document.querySelectorAll('.tile'));

  // Grid: row 0 = search bar, row 1 = tiles
  var rows = [[form], tiles];
  var row = 0;
  var col = 0;
  var lastTileCol = 0;
  var editing = false;

  /* ---------- Scale the 1920x1080 stage to any screen ---------- */
  function fit() {
    var w = window.innerWidth;
    var h = window.innerHeight;
    var s = Math.min(w / 1920, h / 1080);
    var x = Math.round((w - 1920 * s) / 2);
    var y = Math.round((h - 1080 * s) / 2);
    var t = 'translate(' + x + 'px,' + y + 'px) scale(' + s + ')';
    stage.style.webkitTransform = t;
    stage.style.transform = t;
  }
  window.addEventListener('resize', fit);
  fit();

  /* ---------- Focus handling ---------- */
  function current() {
    return rows[row][col];
  }

  function select(r, c) {
    var prev = current();
    if (prev) prev.className = prev.className.replace(/\s*is-focused/g, '');
    row = r;
    col = Math.max(0, Math.min(c, rows[r].length - 1));
    if (row === 1) lastTileCol = col;
    var el = current();
    el.className += ' is-focused';
    if (el.tagName === 'A') el.focus();
    else if (document.activeElement && document.activeElement !== input) document.activeElement.blur();
    try { localStorage.setItem('nk-home-pos', row + ',' + col); } catch (e) {}
  }

  function startEditing() {
    editing = true;
    form.className += ' is-editing';
    hint.textContent = 'OK to search';
    input.focus();  // opens the TV keyboard
  }

  function stopEditing() {
    editing = false;
    form.className = form.className.replace(/\s*is-editing/g, '');
    hint.textContent = 'OK to type';
    if (document.activeElement === input) input.blur();
  }

  /* ---------- Search ---------- */
  function looksLikeUrl(text) {
    if (/\s/.test(text)) return false;
    if (/^https?:\/\//i.test(text)) return true;
    return /^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}(:\d+)?(\/.*)?$/i.test(text);
  }

  function go(text) {
    text = (text || '').replace(/^\s+|\s+$/g, '');
    if (!text) return;
    if (looksLikeUrl(text)) {
      location.href = /^https?:\/\//i.test(text) ? text : 'https://' + text;
    } else {
      location.href = SEARCH_URL + encodeURIComponent(text);
    }
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    go(input.value);
  });

  // Pointer / mouse support (Samsung pointer remote, or testing on a PC)
  input.addEventListener('focus', function () {
    if (row !== 0) select(0, 0);
    if (!editing) startEditing();
  });
  input.addEventListener('blur', function () {
    if (editing) stopEditing();
  });
  rows[0].concat(tiles).forEach(function (el) {
    el.addEventListener('mouseenter', function () {
      if (editing) return;
      if (el === form) select(0, 0);
      else select(1, tiles.indexOf(el));
    });
  });
  form.addEventListener('click', function () {
    if (!editing) startEditing();
  });
  // Keyboard Tab onto a tile
  tiles.forEach(function (t, i) {
    t.addEventListener('focus', function () {
      if (row !== 1 || col !== i) select(1, i);
    });
  });

  /* ---------- Remote keys ---------- */
  document.addEventListener('keydown', function (e) {
    var k = e.keyCode;

    // Ctrl+L / F6: jump to the search bar (like a browser address bar)
    if (k === KEY.F6 || (e.ctrlKey && k === KEY.L)) {
      e.preventDefault();
      if (!editing) { select(0, 0); startEditing(); }
      input.select();
      return;
    }

    if (editing) {
      if (k === KEY.ENTER || k === KEY.IME_DONE) {
        e.preventDefault();
        go(input.value);
      } else if (k === KEY.BACK || k === KEY.ESC || k === KEY.IME_CANCEL) {
        e.preventDefault();
        stopEditing();
      } else if (k === KEY.DOWN) {
        e.preventDefault();
        stopEditing();
        select(1, lastTileCol);
      }
      return;  // LEFT/RIGHT move the text cursor
    }

    switch (k) {
      case KEY.LEFT:
        e.preventDefault();
        if (row === 1 && col > 0) select(1, col - 1);
        break;
      case KEY.RIGHT:
        e.preventDefault();
        if (row === 1 && col < tiles.length - 1) select(1, col + 1);
        break;
      case KEY.UP:
        e.preventDefault();
        if (row === 1) select(0, 0);
        break;
      case KEY.DOWN:
        e.preventDefault();
        if (row === 0) select(1, lastTileCol);
        break;
      case KEY.ENTER:
      case KEY.SPACE:
        e.preventDefault();
        if (row === 0) startEditing();
        else location.href = current().href;
        break;
      // BACK on the homepage is left alone, so TizenBrew handles it.
      default:
        // Keyboard: just start typing to search
        if (e.key && e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
          e.preventDefault();
          select(0, 0);
          startEditing();
          input.value = e.key;
          try { input.setSelectionRange(1, 1); } catch (x) {}
        }
    }
  });

  /* ---------- Mouse cursor ----------
     The TV doesn't draw its pointer inside TizenBrew, so we draw our own. */
  var cursor = document.createElement('div');
  cursor.id = 'cursor';
  cursor.innerHTML = '<svg viewBox="0 0 24 24"><path d="M4 2.5v17.2l4.6-4.4 3 6.9 3.1-1.3-3-6.8h6.4z"/></svg>';
  document.body.appendChild(cursor);
  var cursorTimer = null;
  var cursorFrame = 0;
  var cx = 0;
  var cy = 0;
  document.addEventListener('mousemove', function (e) {
    cx = e.clientX;
    cy = e.clientY;
    if (!cursorFrame) {
      cursorFrame = requestAnimationFrame(function () {
        cursorFrame = 0;
        var t = 'translate(' + (cx - 6) + 'px,' + (cy - 4) + 'px)';
        cursor.style.webkitTransform = t;
        cursor.style.transform = t;
      });
    }
    if (document.documentElement.className.indexOf('has-cursor') === -1) document.documentElement.className += ' has-cursor';
    cursor.style.opacity = '1';
    clearTimeout(cursorTimer);
    cursorTimer = setTimeout(function () { cursor.style.opacity = '0'; }, 4000);
  });

  /* ---------- Input test panel (temporary) ----------
     Shows which mouse/keyboard events actually reach the page on the TV. */
  var probe = document.createElement('div');
  probe.id = 'probe';
  document.getElementById('stage').appendChild(probe);
  var counts = {};
  var lastKey = '-';
  var lastMouse = '-';
  var EVENTS = ['mousemove', 'mousedown', 'click', 'pointermove', 'pointerdown', 'wheel', 'touchstart'];
  function showProbe() {
    var parts = EVENTS.map(function (n) { return n + ' ' + (counts[n] || 0); });
    probe.textContent = 'Input test  |  key: ' + lastKey + '  |  mouse at: ' + lastMouse + '  |  ' + parts.join('  ');
  }
  EVENTS.forEach(function (n) {
    window.addEventListener(n, function (e) {
      counts[n] = (counts[n] || 0) + 1;
      if (e.clientX !== undefined) lastMouse = Math.round(e.clientX) + ',' + Math.round(e.clientY);
      showProbe();
    }, true);
  });
  window.addEventListener('keydown', function (e) {
    lastKey = e.keyCode + (e.key ? ' (' + e.key + ')' : '');
    showProbe();
  }, true);
  showProbe();

  /* ---------- Clock ---------- */
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function tick() {
    var d = new Date();
    document.getElementById('clock-time').textContent = pad(d.getHours()) + ':' + pad(d.getMinutes());
    var date = '';
    try {
      date = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
    } catch (e) {
      date = d.toDateString();
    }
    document.getElementById('clock-date').textContent = date;
  }
  tick();
  setInterval(tick, 15000);

  /* ---------- Pine silhouettes along the bottom ---------- */
  function drawForest() {
    var svg = document.getElementById('forest');
    var NS = 'http://www.w3.org/2000/svg';
    var seed = 7;
    function rand() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }

    function pine(x, base, h, w) {
      // Three stacked tiers plus a short trunk
      var p = '';
      for (var i = 0; i < 3; i++) {
        var top = base - h + i * h * 0.26;
        var bottom = base - h * 0.62 + i * h * 0.27;
        var half = w * (0.5 + i * 0.25);
        p += 'M' + x + ' ' + top + 'L' + (x + half) + ' ' + bottom + 'L' + (x - half) + ' ' + bottom + 'Z';
      }
      p += 'M' + (x - w * 0.08) + ' ' + base + 'h' + (w * 0.16) + 'v' + (-h * 0.2) + 'h' + (-w * 0.16) + 'Z';
      return p;
    }

    function layer(color, count, minH, maxH, base) {
      var d = '';
      for (var i = 0; i < count; i++) {
        var x = (i + 0.2 + rand() * 0.6) * (1920 / count);
        var h = minH + rand() * (maxH - minH);
        d += pine(x, base, h, h * 0.42);
      }
      var path = document.createElementNS(NS, 'path');
      path.setAttribute('d', d);
      path.setAttribute('fill', color);
      svg.appendChild(path);
    }

    layer('#222326', 26, 110, 190, 262);
    layer('#26272A', 18, 70, 130, 262);
  }
  drawForest();

  /* ---------- Start position ---------- */
  var start = [0, 0];
  try {
    var saved = (localStorage.getItem('nk-home-pos') || '').split(',');
    if (saved.length === 2) start = [Math.min(+saved[0], 1) || 0, +saved[1] || 0];
  } catch (e) {}
  select(start[0], start[1]);

  // Ctrl+L on another site sends you here with #search
  if (location.hash === '#search') {
    select(0, 0);
    startEditing();
    try { history.replaceState(null, '', location.pathname); } catch (e) {}
  }
})();
