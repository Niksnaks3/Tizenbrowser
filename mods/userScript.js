// ==UserScript==
// @name         Niksnaks-browser
// @namespace    niksnaks
// @version      0.1.5
// @description  Ad blocking, TV remote navigation and dark mode. Injected by TizenBrew on every page.
// @match        *://*/*
// @run-at       document-start
// @grant        none
// ==/UserScript==
//
// The header above is only used when testing on a PC with Tampermonkey.
// Plain ES5 throughout, because older Tizen TVs run an old Chromium.

(function () {
  'use strict';

  if (window.__niksnaks) return;
  window.__niksnaks = true;

  /* =====================================================================
   * 1. CONFIG
   * ===================================================================== */

  // Must match "websiteURL" in package.json
  var HOME_URL = 'https://niksnaks3.github.io/Tizenbrowser/';
  var VERSION = '0.1.5';  // set by tools/release.py

  var KEY = {
    LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40, ENTER: 13,
    BACK: 10009, ESC: 27, BACKSPACE: 8,
    RED: 403, GREEN: 404, YELLOW: 405, BLUE: 406,
    IME_DONE: 65376, IME_CANCEL: 65385,
    // Keyboard
    TAB: 9, HOME: 36, L: 76, R: 82, F1: 112, F2: 113, F3: 114, F5: 116, F6: 117,
    BROWSER_BACK: 166, BROWSER_FORWARD: 167, BROWSER_REFRESH: 168, BROWSER_HOME: 172
  };

  // Ad, pop-under and tracker domains. Subdomains are matched too
  // ("doubleclick.net" also blocks "stats.g.doubleclick.net").
  var AD_DOMAINS = [
    // Google / Microsoft / Amazon ads and analytics
    'doubleclick.net', 'googlesyndication.com', 'googleadservices.com', 'google-analytics.com',
    'googletagmanager.com', 'googletagservices.com', 'adservice.google.com', 'adservice.google.nl',
    'googleoptimize.com', 'amazon-adsystem.com', 'bat.bing.com', 'clarity.ms', 'ads.msn.com',
    // Pop-under, push and streaming-site ad networks
    'popads.net', 'popcash.net', 'propellerads.com', 'propellerclick.com', 'onclickads.net',
    'onclkds.com', 'adcash.com', 'exoclick.com', 'exosrv.com', 'exdynsrv.com', 'magsrv.com',
    'realsrv.com', 'juicyads.com', 'trafficjunky.net', 'trafficjunky.com', 'trafficstars.com',
    'tsyndicate.com', 'hilltopads.net', 'hilltopads.com', 'adsterra.com', 'a-ads.com',
    'clickadu.com', 'mgid.com', 'adskeeper.co.uk', 'adskeeper.com', 'revcontent.com', 'zedo.com',
    'yllix.com', 'adspyglass.com', 'ad-maven.com', 'admaven.com', 'galaksion.com', 'clickaine.com',
    'bidvertiser.com', 'richads.com', 'evadav.com', 'notix.io', 'onesignal.com', 'pushengage.com',
    'monetag.com', 'llvpn.com', 'highperformanceformat.com', 'profitabledisplaynetwork.com', 'infolinks.com',
    'adf.ly', 'shorte.st', 'ouo.io', 'linkvertise.com', 'adblockanalytics.com',
    // Programmatic ad exchanges
    'adnxs.com', 'adsrvr.org', 'rubiconproject.com', 'pubmatic.com', 'openx.net', 'casalemedia.com',
    'criteo.com', 'criteo.net', 'taboola.com', 'outbrain.com', 'zemanta.com', 'smartadserver.com',
    'adform.net', 'yieldlab.net', 'teads.tv', 'sharethrough.com', '33across.com', 'bidswitch.net',
    'media.net', 'contextweb.com', 'lijit.com', 'sovrn.com', 'adroll.com', 'adition.com',
    'adhese.com', 'improvedigital.com', '360yield.com', 'adscale.de', 'smartclip.net',
    'spotxchange.com', 'springserve.com', 'lkqd.net', 'vidoomy.com', 'connatix.com', 'primis.tech',
    'aniview.com', 'adkernel.com', 'adtelligent.com', 'indexww.com', 'triplelift.com', '3lift.com',
    'yieldmo.com', 'gumgum.com', 'undertone.com', 'districtm.io', 'emxdgt.com', 'onetag-sys.com',
    'richaudience.com', 'seedtag.com', 'adyoulike.com', 'quantumdex.io', 'ad.gt', 'adgrx.com',
    'ezoic.net', 'pubmine.com', 'disqusads.com', 'carbonads.com', 'buysellads.com',
    // Measurement and trackers
    'moatads.com', 'adsafeprotected.com', 'doubleverify.com', 'scorecardresearch.com',
    'quantserve.com', 'quantcount.com', 'chartbeat.com', 'chartbeat.net', 'hotjar.com',
    'mouseflow.com', 'crazyegg.com', 'nr-data.net', 'mixpanel.com', 'histats.com',
    'statcounter.com', 'amung.us', 'mc.yandex.ru', 'an.yandex.ru', 'adfox.ru', 'counter.yadro.ru',
    'addthis.com', 'sharethis.com', 'bluekai.com', 'krxd.net', 'demdex.net', 'everesttech.net',
    'rlcdn.com', 'tapad.com', 'agkn.com', 'exelator.com', 'eyeota.net', 'crwdcntrl.net',
    'adsymptotic.com', 'id5-sync.com', 'liadm.com', 'mookie1.com', 'serving-sys.com', 'flashtalking.com'
  ];

  // Per-site tuning (build step 6). Keys match the site and its subdomains.
  //   css:   extra CSS for that site (e.g. 'div.banner{display:none!important}')
  //   dark:  'auto' | 'on' | 'off'   default dark mode for the site
  //   sweep: false to turn off the overlay remover if it hides something you need
  //   allow: domains that must never be blocked on this site
  //   focus: element the remote starts on when the page opens
  //   clickable: extra elements the remote can select
  //   then:  { 'clicked element': 'element to move to afterwards' }
  var SITE_RULES = {
    'wmovies.nl': {
      css: '', dark: 'off', sweep: true, allow: [],
      // Ring starts on the big play button, so OK plays straight away
      focus: '#play',
      // Buttons the site makes clickable with JavaScript only
      clickable: '#play, #controls .item, .bookmark, .servers li, .seasons li, #episodes li a',
      // After play / switching server, move into the video player
      then: { '#play': '#iframe', '.servers li': '#iframe' }
    },
    '777-foodstore.com': { css: '', dark: 'auto', sweep: true, allow: [] },
    'niksnaks.nl': { css: '', dark: 'auto', sweep: true, allow: [] },
    'duckduckgo.com': { css: '', dark: 'off', sweep: false, allow: [] }
  };

  // Generic ad containers. Kept narrow on purpose so normal page parts survive.
  var AD_CSS_SELECTORS = [
    'ins.adsbygoogle', '.adsbygoogle', '[id^="google_ads_"]', '[id^="div-gpt-ad"]',
    'iframe[id^="google_ads_iframe"]', '[data-ad-slot]', '[data-ad-client]', 'amp-ad', 'amp-embed',
    'iframe[src*="doubleclick.net"]', 'iframe[src*="googlesyndication"]', 'iframe[src*="exoclick"]',
    'iframe[src*="exosrv"]', 'iframe[src*="juicyads"]', 'iframe[src*="popads"]', 'iframe[src*="adsterra"]',
    'a[href*="doubleclick.net"]', 'div[id^="taboola-"]', '.trc_related_container', '.OUTBRAIN',
    '.ad-banner', '.ad-container', '.ad-wrapper', '.ad-slot', '.advertisement', '.adsbox',
    '.banner-ad', '.sponsored-ad', '#ad-banner', '[id^="ad-slot"]', '[class^="ad-unit"]'
  ];

  /* =====================================================================
   * 2. HELPERS
   * ===================================================================== */

  var IS_TOP = (function () { try { return window.top === window; } catch (e) { return false; } })();
  var HOST = location.hostname.toLowerCase().replace(/^www\./, '');
  var ON_HOME = location.href.indexOf(HOME_URL) === 0;
  var RULE = findRule(HOST);
  var BLOCK = {};
  var ALLOW = {};
  var blockedCount = 0;
  var navClick = false;  // true while our own remote "OK" press is clicking something

  AD_DOMAINS.forEach(function (d) { BLOCK[d] = true; });
  (RULE.allow || []).forEach(function (d) { ALLOW[d] = true; });

  function findRule(host) {
    var parts = host.split('.');
    for (var i = 0; i < parts.length - 1; i++) {
      var r = SITE_RULES[parts.slice(i).join('.')];
      if (r) return r;
    }
    return { css: '', dark: 'auto', sweep: true, allow: [] };
  }

  function matchSuffix(map, host) {
    var parts = host.split('.');
    for (var i = 0; i < parts.length - 1; i++) {
      if (map[parts.slice(i).join('.')]) return true;
    }
    return false;
  }

  function isAdHost(host) {
    if (!host) return false;
    host = host.toLowerCase();
    return matchSuffix(BLOCK, host) && !matchSuffix(ALLOW, host);
  }

  function hostOf(url) {
    if (!url || typeof url !== 'string') return '';
    if (/^(data|blob|about|javascript):/i.test(url)) return '';
    try { return new URL(url, location.href).hostname; } catch (e) { return ''; }
  }

  function isBlockedUrl(url) {
    if (url && typeof url === 'object' && url.href) url = url.href;  // URL objects
    return isAdHost(hostOf(String(url || '')));
  }

  function onReady(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  function addStyle(css) {
    var s = document.createElement('style');
    s.setAttribute('data-niksnaks', '');
    s.textContent = css;
    (function attach() {
      var parent = document.head || document.documentElement;
      if (parent) parent.appendChild(s);
      else setTimeout(attach, 10);
    })();
    return s;
  }

  function store(key, value) {
    try {
      if (value === undefined) return localStorage.getItem(key);
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch (e) {}
    return null;
  }

  function bump() {
    blockedCount++;
    if (bar) bar.count.lastChild.textContent = blockedCount + ' blocked';
  }

  function log() {
    try { console.log.apply(console, ['[Niksnaks]'].concat([].slice.call(arguments))); } catch (e) {}
  }

  /* =====================================================================
   * 3. REDIRECT GUARD — if we land on an ad domain, bounce straight back
   * ===================================================================== */

  if (isAdHost(location.hostname)) {
    try { window.stop(); } catch (e) {}
    if (IS_TOP) {
      // Loop guard: if we keep bouncing, go home instead
      var bounces = 0;
      try {
        var b = JSON.parse(sessionStorage.getItem('nk-bounce') || '{"n":0,"t":0}');
        bounces = Date.now() - b.t < 15000 ? b.n + 1 : 1;
        sessionStorage.setItem('nk-bounce', JSON.stringify({ n: bounces, t: Date.now() }));
      } catch (e) {}
      if (bounces <= 2 && history.length > 1) history.back();
      else location.replace(HOME_URL);
    }
    return;  // nothing else to do on an ad page
  }

  log('loaded on', location.hostname || location.href, ON_HOME ? '(homepage)' : '');

  /* =====================================================================
   * 4. POP-UP BLOCKER
   * ===================================================================== */

  function noop() {}
  function fakeWindow() {
    var w = {
      closed: false, opener: null, name: '',
      location: { href: 'about:blank', assign: noop, replace: noop, reload: noop },
      document: { write: noop, writeln: noop, open: noop, close: noop, body: null },
      close: function () { w.closed = true; },
      focus: noop, blur: noop, postMessage: noop, moveTo: noop, resizeTo: noop,
      addEventListener: noop, removeEventListener: noop
    };
    return w;
  }

  var lastPopupToast = 0;
  function popupBlocked(url) {
    bump();
    log('blocked pop-up', url || '');
    if (Date.now() - lastPopupToast > 4000) {
      lastPopupToast = Date.now();
      toast('Pop-up blocked');
    }
  }

  // A TV has no tabs, so every window.open is a pop-up or pop-under.
  try {
    window.open = function (url) {
      popupBlocked(url);
      return fakeWindow();
    };
  } catch (e) {}

  function closestAnchor(el) {
    while (el && el.nodeType === 1) {
      if (el.tagName === 'A' || el.tagName === 'AREA') return el;
      el = el.parentNode;
    }
    return null;
  }

  function opensNewWindow(a) {
    var t = (a.getAttribute('target') || '').toLowerCase();
    return t && t !== '_self' && t !== '_top' && t !== '_parent';
  }

  // Link clicks: drop ad links, keep real links in the same tab.
  window.addEventListener('click', function (e) {
    var a = closestAnchor(e.target);
    if (!a || !a.href) return;
    if (isBlockedUrl(a.href)) {
      e.preventDefault();
      e.stopImmediatePropagation();
      popupBlocked(a.href);
      return;
    }
    if (opensNewWindow(a)) {
      if (!e.isTrusted && !navClick) {
        // A script "clicked" a new-tab link for us: classic pop-under trick
        e.preventDefault();
        e.stopImmediatePropagation();
        popupBlocked(a.href);
      } else {
        a.setAttribute('target', '_self');
      }
    }
  }, true);

  // Scripts that build a hidden <a target=_blank> and call .click() on it
  try {
    var origAnchorClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      if (!navClick && (isBlockedUrl(this.href) || (opensNewWindow(this) && !document.contains(this)))) {
        popupBlocked(this.href);
        return;
      }
      return origAnchorClick.apply(this, arguments);
    };
  } catch (e) {}

  // Pop-under scripts often borrow window.open from a blank iframe
  try {
    var cwDesc = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, 'contentWindow');
    Object.defineProperty(HTMLIFrameElement.prototype, 'contentWindow', {
      configurable: true,
      enumerable: cwDesc.enumerable,
      get: function () {
        var w = cwDesc.get.call(this);
        try { if (w && w.open !== window.open) w.open = window.open; } catch (e) {}  // cross-origin: not reachable anyway
        return w;
      }
    });
  } catch (e) {}

  /* =====================================================================
   * 5. TRACKER / NETWORK BLOCK
   * ===================================================================== */

  if (window.fetch) {
    var origFetch = window.fetch;
    window.fetch = function (input) {
      var url = typeof input === 'string' ? input : (input && input.url);
      if (isBlockedUrl(url)) {
        bump();
        return Promise.reject(new TypeError('Failed to fetch'));
      }
      return origFetch.apply(this, arguments);
    };
  }

  try {
    var xhrOpen = XMLHttpRequest.prototype.open;
    var xhrSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function (method, url) {
      this.__nkBlocked = isBlockedUrl(url);
      return xhrOpen.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function () {
      if (this.__nkBlocked) {
        bump();
        var xhr = this;
        setTimeout(function () {
          try { xhr.dispatchEvent(new Event('error')); } catch (e) {}
          try { xhr.dispatchEvent(new Event('loadend')); } catch (e) {}
        }, 0);
        return;
      }
      return xhrSend.apply(this, arguments);
    };
  } catch (e) {}

  if (navigator.sendBeacon) {
    try {
      var origBeacon = navigator.sendBeacon.bind(navigator);
      navigator.sendBeacon = function (url) {
        if (isBlockedUrl(url)) { bump(); return true; }
        return origBeacon.apply(null, arguments);
      };
    } catch (e) {}
  }

  /* =====================================================================
   * 6. SCRIPT / IFRAME / PIXEL BLOCK
   * ===================================================================== */

  var SRC_TAGS = { SCRIPT: 1, IFRAME: 1, IMG: 1, EMBED: 1, SOURCE: 0 };

  function patchSrc(proto) {
    if (!proto) return;
    try {
      var d = Object.getOwnPropertyDescriptor(proto, 'src');
      if (!d || !d.set) return;
      Object.defineProperty(proto, 'src', {
        configurable: true,
        enumerable: d.enumerable,
        get: d.get,
        set: function (v) {
          if (isBlockedUrl(v)) { bump(); return; }
          d.set.call(this, v);
        }
      });
    } catch (e) {}
  }
  patchSrc(window.HTMLScriptElement && HTMLScriptElement.prototype);
  patchSrc(window.HTMLIFrameElement && HTMLIFrameElement.prototype);
  patchSrc(window.HTMLImageElement && HTMLImageElement.prototype);
  patchSrc(window.HTMLEmbedElement && HTMLEmbedElement.prototype);

  try {
    var origSetAttr = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function (name, value) {
      if (SRC_TAGS[this.tagName] && typeof name === 'string' && name.toLowerCase() === 'src' && isBlockedUrl(value)) {
        bump();
        return;
      }
      return origSetAttr.apply(this, arguments);
    };
  } catch (e) {}

  // document.write('<script src="ad...">')
  try {
    var SCRIPT_TAG_RE = /<script\b[^>]*\bsrc\s*=\s*["']?([^"'\s>]+)[^>]*>[\s\S]*?<\/script\s*>/gi;
    var IFRAME_TAG_RE = /<iframe\b[^>]*\bsrc\s*=\s*["']?([^"'\s>]+)[^>]*>[\s\S]*?<\/iframe\s*>/gi;
    var cleanWrite = function (html) {
      if (typeof html !== 'string') return html;
      function strip(tag, src) {
        if (isBlockedUrl(src)) { bump(); return ''; }
        return tag;
      }
      return html.replace(SCRIPT_TAG_RE, strip).replace(IFRAME_TAG_RE, strip);
    };
    var origWrite = document.write;
    var origWriteln = document.writeln;
    document.write = function () {
      return origWrite.apply(document, [].map.call(arguments, cleanWrite));
    };
    document.writeln = function () {
      return origWriteln.apply(document, [].map.call(arguments, cleanWrite));
    };
  } catch (e) {}

  // Ad scripts written straight into the HTML. Changing the type before the
  // script runs stops it executing.
  function handleAddedNode(node) {
    if (node.nodeType !== 1 || node.hasAttribute('data-niksnaks')) return;
    var tag = node.tagName;

    if (tag === 'SCRIPT' && node.src && isBlockedUrl(node.src)) {
      node.type = 'javascript/blocked';
      if (node.parentNode) node.parentNode.removeChild(node);
      bump();
      return;
    }
    if ((tag === 'IFRAME' || tag === 'IMG' || tag === 'EMBED' || tag === 'OBJECT') &&
        isBlockedUrl(node.src || node.data || node.getAttribute('src'))) {
      if (node.parentNode) node.parentNode.removeChild(node);
      bump();
      return;
    }
    if (tag === 'META' && /refresh/i.test(node.httpEquiv || '')) {
      var m = /url\s*=\s*['"]?([^'"]+)/i.exec(node.content || '');
      if (m && (isBlockedUrl(m[1]) || hostOf(m[1]) !== location.hostname)) {
        if (node.parentNode) node.parentNode.removeChild(node);
        bump();
      }
      return;
    }
    if (node.firstElementChild) {
      var inner = node.querySelectorAll('script[src], iframe[src]');
      for (var i = 0; i < inner.length; i++) handleAddedNode(inner[i]);
    }
  }

  var sweepTimer = null;
  var observer = new MutationObserver(function (mutations) {
    for (var i = 0; i < mutations.length; i++) {
      var added = mutations[i].addedNodes;
      for (var j = 0; j < added.length; j++) handleAddedNode(added[j]);
    }
    pointerDirty = true;
    if (!sweepTimer) sweepTimer = setTimeout(function () { sweepTimer = null; sweepOverlays(); }, 400);
  });
  observer.observe(document, { childList: true, subtree: true });

  /* =====================================================================
   * 7. AD HIDING — CSS plus an overlay sweeper
   * ===================================================================== */

  addStyle(AD_CSS_SELECTORS.join(',\n') + ' { display: none !important; }\n' + (RULE.css || ''));

  var BAIT_TEXT = /click (here )?to (continue|close|play|watch)|klik (hier )?om|tap to continue|close ad|skip ad/i;

  function alphaOf(color) {
    if (!color || color === 'transparent') return 0;
    var m = /rgba?\(([^)]+)\)/.exec(color);
    if (!m) return 1;
    var p = m[1].split(',');
    return p.length > 3 ? parseFloat(p[3]) : 1;
  }

  function fullscreenEl() {
    return document.fullscreenElement || document.webkitFullscreenElement || null;
  }

  // Removes invisible click-catching layers and "click to continue" screens
  // that cover the page.
  function sweepOverlays() {
    if (!document.body || RULE.sweep === false || ON_HOME) return;
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var screenArea = vw * vh;
    var nodes = [].slice.call(document.body.children)
      .concat([].slice.call(document.querySelectorAll('[style*="z-index"]'), 0, 300));

    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (!el.parentNode || el.hasAttribute('data-niksnaks')) continue;
      if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'LINK') continue;

      var cs = getComputedStyle(el);
      if (cs.position !== 'fixed' && cs.position !== 'absolute') continue;
      if (!(parseInt(cs.zIndex, 10) >= 100)) continue;
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;

      var r = el.getBoundingClientRect();
      var w = Math.max(0, Math.min(r.right, vw) - Math.max(r.left, 0));
      var h = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
      if (w * h < screenArea * 0.5) continue;

      if (el.tagName === 'VIDEO' || el.querySelector('video, [data-niksnaks]')) continue;
      var fs = fullscreenEl();
      if (fs && (fs === el || el.contains(fs))) continue;

      var text = (el.textContent || '').replace(/\s+/g, ' ');
      var invisible = parseFloat(cs.opacity) < 0.15 ||
        (alphaOf(cs.backgroundColor) < 0.05 && cs.backgroundImage === 'none' &&
         !el.querySelector('img, iframe, svg, canvas, picture'));
      var bait = text.length < 200 && BAIT_TEXT.test(text);
      var bigLink = el.tagName === 'A';
      var adFrame = el.tagName === 'IFRAME' && isBlockedUrl(el.src);

      if ((invisible && text.length < 40) || bait || bigLink || adFrame) {
        log('removed overlay', el.tagName, el.id || el.className || '');
        el.parentNode.removeChild(el);
        bump();
      }
    }
  }

  onReady(function () {
    sweepOverlays();
    var runs = 0;
    var t = setInterval(function () {
      sweepOverlays();
      if (++runs >= 20) clearInterval(t);
    }, 1500);
  });

  // On the homepage only the blocking above runs.
  if (ON_HOME) return;

  /* =====================================================================
   * 8. UI STYLES (toolbar, focus ring, toast, dark mode)
   * ===================================================================== */

  addStyle([
    // Dark mode: invert the page, then invert media back to normal
    'html.nk-dark { filter: invert(1) hue-rotate(180deg) !important; background: #fff !important; }',
    'html.nk-dark img, html.nk-dark video, html.nk-dark canvas, html.nk-dark iframe,',
    'html.nk-dark embed, html.nk-dark object, html.nk-dark svg image,',
    'html.nk-dark [style*="background-image"], html.nk-dark [data-niksnaks]',
    '  { filter: invert(1) hue-rotate(180deg) !important; }',
    'html.nk-dark [style*="background-image"] img, html.nk-dark [style*="background-image"] video',
    '  { filter: none !important; }',

    // Shared reset for our own elements
    '#nk-bar, #nk-bar *:not(path), #nk-ring, #nk-toast { all: initial; box-sizing: border-box !important;',
    '  font-family: Nunito, SamsungOne, "Tizen Sans", "Segoe UI", Arial, sans-serif !important; }',

    // Focus ring
    '#nk-ring { position: fixed !important; z-index: 2147483646 !important; pointer-events: none !important;',
    '  display: none; border: 4px solid #4FA77A !important; border-radius: 12px !important;',
    '  box-shadow: 0 0 0 4px rgba(28,29,32,.75), 0 0 28px 6px rgba(79,167,122,.75) !important;',
    '  transition: left .12s ease, top .12s ease, width .12s ease, height .12s ease !important; }',

    // Toolbar
    '#nk-bar { position: fixed !important; z-index: 2147483647 !important; top: 24px !important;',
    '  left: 50% !important; transform: translate(-50%, -160%) !important; display: flex !important;',
    '  align-items: center !important; padding: 10px 14px !important; border-radius: 999px !important;',
    '  background: rgba(28,29,32,.96) !important; border: 2px solid #4A4D53 !important;',
    '  box-shadow: 0 12px 40px rgba(0,0,0,.6) !important; transition: transform .25s ease !important;',
    '  visibility: hidden; }',
    '#nk-bar.nk-show { transform: translate(-50%, 0) !important; visibility: visible; }',
    '#nk-bar .nk-brand { display: flex !important; align-items: center !important; padding: 0 18px 0 8px !important;',
    '  color: #F3F5EE !important; font-size: 24px !important; font-weight: 800 !important; white-space: nowrap !important; }',
    '#nk-bar .nk-brand svg { width: 30px !important; height: 30px !important; margin-right: 10px !important; }',
    '#nk-bar button { display: flex !important; align-items: center !important; margin: 0 4px !important;',
    '  padding: 12px 22px !important; border-radius: 999px !important; background: #26272B !important;',
    '  color: #F3F5EE !important; font-size: 22px !important; font-weight: 700 !important; cursor: pointer !important;',
    '  border: 2px solid #4A4D53 !important; white-space: nowrap !important; }',
    '#nk-bar button svg { width: 26px !important; height: 26px !important; margin-right: 10px !important; }',
    '#nk-bar button.nk-sel { border-color: #4FA77A !important; background: #36383D !important;',
    '  box-shadow: 0 0 20px rgba(79,167,122,.6) !important; }',
    '#nk-bar svg { display: block !important; fill: none !important; color: inherit !important; stroke: currentColor !important;',
    '  stroke-width: 2 !important; stroke-linecap: round !important; stroke-linejoin: round !important; }',
    '#nk-bar .nk-brand svg { stroke: #4FA77A !important; }',
    '#nk-bar .nk-count { display: flex !important; align-items: center !important; padding: 0 12px 0 16px !important;',
    '  color: #A9ADB3 !important; font-size: 20px !important; font-weight: 700 !important; white-space: nowrap !important; }',
    '#nk-bar .nk-count svg { width: 22px !important; height: 22px !important; margin-right: 8px !important; }',

    // Mouse cursor (TizenBrew doesn't let the TV draw its own pointer)
    '#nk-cursor { all: initial; position: fixed !important; left: 0 !important; top: 0 !important;',
    '  width: 36px !important; height: 36px !important; z-index: 2147483647 !important;',
    '  pointer-events: none !important; opacity: 0; transition: opacity .3s !important; }',
    '#nk-cursor svg { display: block !important; width: 36px !important; height: 36px !important;',
    '  filter: drop-shadow(0 2px 3px rgba(0,0,0,.6)) !important; }',
    'html.nk-cursor, html.nk-cursor * { cursor: none !important; }',

    // Toast
    '#nk-toast { position: fixed !important; z-index: 2147483647 !important; left: 50% !important;',
    '  bottom: 48px !important; transform: translate(-50%, 200%) !important; padding: 16px 30px !important;',
    '  border-radius: 999px !important; background: rgba(28,29,32,.96) !important; color: #F3F5EE !important;',
    '  border: 2px solid #4A4D53 !important; font-size: 24px !important; font-weight: 700 !important;',
    '  transition: transform .25s ease !important; pointer-events: none !important; }',
    '#nk-toast.nk-show { transform: translate(-50%, 0) !important; }'
  ].join('\n'));

  var NS = 'http://www.w3.org/2000/svg';
  var ICONS = {
    tree: ['m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 3l4 4.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.7 1.7H17Z', 'M12 22v-3'],
    home: ['M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8', 'M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'],
    back: ['m12 19-7-7 7-7', 'M19 12H5'],
    reload: ['M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8', 'M21 3v5h-5'],
    moon: ['M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z'],
    shield: ['M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z']
  };

  function icon(name) {
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    ICONS[name].forEach(function (d) {
      var p = document.createElementNS(NS, 'path');
      p.setAttribute('d', d);
      svg.appendChild(p);
    });
    return svg;
  }

  function el(tag, attrs, children) {
    var e = document.createElement(tag);
    for (var k in attrs) if (attrs.hasOwnProperty(k)) e.setAttribute(k, attrs[k]);
    (children || []).forEach(function (c) {
      e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return e;
  }

  /* =====================================================================
   * 9. TOAST
   * ===================================================================== */

  var toastEl = null;
  var toastTimer = null;
  function toast(msg) {
    if (!IS_TOP || ON_HOME) return;
    if (!document.body) { onReady(function () { toast(msg); }); return; }
    if (!toastEl) {
      toastEl = el('div', { id: 'nk-toast', 'data-niksnaks': '' });
      document.documentElement.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.className = 'nk-show';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.className = ''; }, 2200);
  }

  /* =====================================================================
   * 10. DARK MODE
   * ===================================================================== */

  var DARK_KEY = 'niksnaks-dark';  // per site: 'on' | 'off' | not set (auto)
  var darkOn = false;

  function luminance(color) {
    var m = /rgba?\(([^)]+)\)/.exec(color || '');
    if (!m) return null;
    var p = m[1].split(',').map(parseFloat);
    if (p.length > 3 && p[3] < 0.5) return null;  // transparent: look further up
    return (0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2]) / 255;
  }

  // Samples five points on screen and checks the real background behind each.
  function pageLooksLight() {
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var points = [[0.5, 0.5], [0.25, 0.3], [0.75, 0.3], [0.25, 0.75], [0.75, 0.75]];
    var total = 0;
    var n = 0;
    points.forEach(function (pt) {
      var node = document.elementFromPoint(vw * pt[0], vh * pt[1]);
      var lum = null;
      while (node && node.nodeType === 1 && lum === null) {
        lum = luminance(getComputedStyle(node).backgroundColor);
        node = node.parentNode;
      }
      total += lum === null ? 1 : lum;  // nothing painted = browser white
      n++;
    });
    return total / n > 0.55;
  }

  function setDark(on, announce) {
    darkOn = on;
    var cls = document.documentElement.className.replace(/\s*nk-dark/g, '');
    document.documentElement.className = on ? cls + ' nk-dark' : cls;
    if (bar) bar.dark.lastChild.textContent = on ? 'Dark: on' : 'Dark: off';
    if (announce) toast(on ? 'Dark mode on' : 'Dark mode off');
  }

  function toggleDark() {
    setDark(!darkOn, true);
    store(DARK_KEY, darkOn ? 'on' : 'off');
  }

  function initDark() {
    var saved = store(DARK_KEY);
    var pref = saved || RULE.dark || 'auto';
    if (pref === 'on') return setDark(true);
    if (pref === 'off') return;
    // Wait a moment so the site has painted its real background
    setTimeout(function () {
      if (!saved && document.body && pageLooksLight()) setDark(true);
    }, 700);
  }

  /* =====================================================================
   * 11. TOOLBAR
   * ===================================================================== */

  var bar = null;
  var barOpen = false;
  var barIndex = 0;
  var beforeBar = null;
  var barHideTimer = null;

  function buildBar() {
    if (!IS_TOP) return;
    var buttons = [
      el('button', { 'data-act': 'home' }, [icon('home'), 'Home']),
      el('button', { 'data-act': 'back' }, [icon('back'), 'Back']),
      el('button', { 'data-act': 'reload' }, [icon('reload'), 'Reload']),
      el('button', { 'data-act': 'dark' }, [icon('moon'), 'Dark: off'])
    ];
    var count = el('span', { 'class': 'nk-count' }, [icon('shield'), blockedCount + ' blocked']);
    var root = el('div', { id: 'nk-bar', 'data-niksnaks': '' },
      [el('span', { 'class': 'nk-brand' }, [icon('tree'), 'Niksnaks ' + VERSION])].concat(buttons, [count]));

    buttons.forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        runAction(b.getAttribute('data-act'));
      });
    });

    root.addEventListener('mouseenter', function () { clearTimeout(barHideTimer); });
    root.addEventListener('mouseleave', function () { if (!barOpen) peekBar(1200); });

    document.documentElement.appendChild(root);
    bar = { root: root, buttons: buttons, count: count, dark: buttons[3] };
    bar.count.lastChild.textContent = blockedCount + ' blocked';
    bar.dark.lastChild.textContent = darkOn ? 'Dark: on' : 'Dark: off';

    // Show briefly on every page load. This is also the injection test:
    // if you see the bar on a site, the script is running there.
    peekBar(4000);
  }

  function peekBar(ms) {
    if (!bar || barOpen) return;
    bar.root.className = 'nk-show';
    clearTimeout(barHideTimer);
    barHideTimer = setTimeout(function () { if (!barOpen) bar.root.className = ''; }, ms);
  }

  function openBar() {
    if (!bar) return;
    clearTimeout(barHideTimer);
    barOpen = true;
    beforeBar = focused;
    try { if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur(); } catch (e) {}
    bar.root.className = 'nk-show';
    barIndex = 0;
    focusEl(bar.buttons[0]);
  }

  function closeBar() {
    if (!bar) return;
    barOpen = false;
    bar.root.className = '';
    bar.buttons.forEach(function (b) { b.className = ''; });
    var back = beforeBar;
    beforeBar = null;
    if (back && document.contains(back)) focusEl(back);
    else hideRing();
  }

  function runAction(act) {
    if (act === 'home') goHome();
    else if (act === 'back') { closeBar(); goBack(); }
    else if (act === 'reload') location.reload();
    else if (act === 'dark') toggleDark();
  }

  function goHome() { location.href = HOME_URL; }

  function goBack() {
    if (!IS_TOP) { sendTop('leave'); return; }
    if (history.length > 1) history.back();
    else goHome();
  }

  /* =====================================================================
   * 12. REMOTE NAVIGATION (spatial: arrows jump to the nearest item)
   * ===================================================================== */

  var NAV_SELECTOR = [
    'a[href]', 'button', 'input', 'select', 'textarea', 'summary', 'video', 'iframe',
    '[tabindex]', '[role="button"]', '[role="link"]', '[role="menuitem"]', '[role="tab"]',
    '[role="option"]', '[onclick]'
  ].join(',');

  var focused = null;
  var ring = null;

  function isEditable(e) {
    if (!e) return false;
    if (e.tagName === 'TEXTAREA') return true;
    if (e.tagName === 'INPUT') {
      var t = (e.type || 'text').toLowerCase();
      return ['button', 'submit', 'reset', 'checkbox', 'radio', 'image', 'range', 'color', 'file', 'hidden'].indexOf(t) === -1;
    }
    return !!e.isContentEditable;
  }

  // Many sites make plain <div>s clickable with JavaScript (like the wmovies play
  // button). They nearly always get cursor:pointer, so treat those as buttons too.
  var NAV_CORE = 'a[href],button,[role="button"],[onclick]';
  var pointerCache = [];
  var pointerDirty = true;
  var pointerTime = 0;

  function pointerTargets() {
    if (!pointerDirty && Date.now() - pointerTime < 3000) return pointerCache;
    pointerDirty = false;
    pointerTime = Date.now();
    pointerCache = [];
    if (!document.body) return pointerCache;
    var els = document.body.getElementsByTagName('*');
    if (els.length > 6000) return pointerCache;  // huge page: too slow on a TV
    var memo = typeof WeakMap === 'function' ? new WeakMap() : null;
    function isPointer(e) {
      if (memo && memo.has(e)) return memo.get(e);
      var p = getComputedStyle(e).cursor === 'pointer';
      if (memo) memo.set(e, p);
      return p;
    }
    for (var i = 0; i < els.length; i++) {
      var e = els[i];
      if (!isPointer(e)) continue;
      var parent = e.parentElement;
      if (parent && parent !== document.body && isPointer(parent)) continue;  // only the outer one
      if (e.matches(NAV_SELECTOR)) continue;  // already a normal candidate
      if ((e.closest && e.closest(NAV_CORE)) || e.querySelector(NAV_CORE)) continue;
      pointerCache.push(e);
    }
    return pointerCache;
  }

  function collect() {
    var vh = window.innerHeight;
    var all = [].slice.call(document.querySelectorAll(NAV_SELECTOR)).concat(pointerTargets());
    if (RULE.clickable) all = all.concat([].slice.call(document.querySelectorAll(RULE.clickable)));
    var stamp = Date.now() + Math.random();
    var out = [];
    for (var i = 0; i < all.length; i++) {
      var e = all[i];
      if (e.__nkSeen === stamp) continue;  // listed twice
      e.__nkSeen = stamp;
      if (e.disabled || e.type === 'hidden') continue;
      if (bar && bar.root.contains(e)) continue;  // toolbar has its own mode
      var r = e.getBoundingClientRect();
      if (r.width < 6 || r.height < 6) continue;
      if (e.tagName === 'IFRAME' && (r.width < 200 || r.height < 120)) continue;
      if (r.bottom < -vh * 1.5 || r.top > vh * 2.5) continue;
      var cs = getComputedStyle(e);
      if (cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.05) continue;
      if (e.closest && e.closest('[aria-hidden="true"]')) continue;
      out.push({ el: e, r: r });
    }
    return out;
  }

  function inView(r) {
    return r.bottom > 0 && r.right > 0 && r.top < window.innerHeight && r.left < window.innerWidth;
  }

  // Is something else (an overlay) sitting on top of this element?
  function covered(e, r) {
    if (!inView(r)) return false;
    var x = Math.min(Math.max(r.left + r.width / 2, 1), window.innerWidth - 1);
    var y = Math.min(Math.max(r.top + r.height / 2, 1), window.innerHeight - 1);
    var hit = document.elementFromPoint(x, y);
    return !!hit && hit !== e && !e.contains(hit) && !hit.contains(e);
  }

  function score(cur, c, dir) {
    var ccx = (c.left + c.right) / 2, ccy = (c.top + c.bottom) / 2;
    var ux = (cur.left + cur.right) / 2, uy = (cur.top + cur.bottom) / 2;
    var primary, ortho, orthoCenter;
    if (dir === 'right' || dir === 'left') {
      if (dir === 'right' ? ccx <= ux + 1 : ccx >= ux - 1) return -1;
      primary = dir === 'right' ? c.left - cur.right : cur.left - c.right;
      ortho = Math.max(0, Math.max(c.top, cur.top) - Math.min(c.bottom, cur.bottom));
      orthoCenter = Math.abs(ccy - uy);
    } else {
      if (dir === 'down' ? ccy <= uy + 1 : ccy >= uy - 1) return -1;
      primary = dir === 'down' ? c.top - cur.bottom : cur.top - c.bottom;
      ortho = Math.max(0, Math.max(c.left, cur.left) - Math.min(c.right, cur.right));
      orthoCenter = Math.abs(ccx - ux);
    }
    primary = Math.max(0, primary);
    return primary + ortho * 3 + orthoCenter * 0.15;
  }

  function scroller(from, vertical) {
    var n = from && from.parentNode;
    while (n && n.nodeType === 1 && n !== document.body && n !== document.documentElement) {
      var cs = getComputedStyle(n);
      var ov = vertical ? cs.overflowY : cs.overflowX;
      if ((ov === 'auto' || ov === 'scroll') &&
          (vertical ? n.scrollHeight > n.clientHeight + 4 : n.scrollWidth > n.clientWidth + 4)) return n;
      n = n.parentNode;
    }
    return document.scrollingElement || document.documentElement;
  }

  function canScroll(s, dir) {
    if (dir === 'down') return s.scrollTop + s.clientHeight < s.scrollHeight - 4;
    if (dir === 'up') return s.scrollTop > 4;
    if (dir === 'right') return s.scrollLeft + s.clientWidth < s.scrollWidth - 4;
    return s.scrollLeft > 4;
  }

  function scrollPage(dir) {
    var vertical = dir === 'up' || dir === 'down';
    var s = scroller(focused, vertical);
    if (!canScroll(s, dir)) return false;
    var amount = (vertical ? window.innerHeight : window.innerWidth) * 0.6;
    if (dir === 'up' || dir === 'left') amount = -amount;
    if (s === document.scrollingElement || s === document.documentElement) {
      window.scrollBy(vertical ? 0 : amount, vertical ? amount : 0);
    } else if (vertical) {
      s.scrollTop += amount;
    } else {
      s.scrollLeft += amount;
    }
    return true;
  }

  function move(dir) {
    if (barOpen) {
      if (dir === 'left' || dir === 'right') {
        barIndex = Math.max(0, Math.min(bar.buttons.length - 1, barIndex + (dir === 'right' ? 1 : -1)));
        focusEl(bar.buttons[barIndex]);
      } else if (dir === 'down') {
        closeBar();
      }
      return;
    }

    var list = collect();
    var cur = focused && document.contains(focused) ? focused.getBoundingClientRect() : null;
    if (cur && !inView(cur)) cur = null;

    // Nothing selected yet: start from what the mouse is on, else the first item on screen
    if (!cur && hoverEl && document.contains(hoverEl) && inView(hoverEl.getBoundingClientRect())) {
      focusEl(hoverEl);
      return;
    }
    if (!cur) {
      var onScreen = list.filter(function (c) { return inView(c.r) && !covered(c.el, c.r); });
      onScreen.sort(function (a, b) {
        return dir === 'up' ? b.r.bottom - a.r.bottom || a.r.left - b.r.left
                            : a.r.top - b.r.top || a.r.left - b.r.left;
      });
      if (onScreen.length) focusEl(onScreen[0].el);
      else if (!scrollPage(dir) && dir === 'up') openBar();
      return;
    }

    var scored = [];
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      if (c.el === focused || c.el.contains(focused) || focused.contains(c.el)) continue;
      var s = score(cur, c.r, dir);
      if (s >= 0) scored.push({ el: c.el, r: c.r, s: s });
    }
    scored.sort(function (a, b) { return a.s - b.s; });

    var best = null;
    for (var j = 0; j < scored.length && j < 12; j++) {
      if (!covered(scored[j].el, scored[j].r)) { best = scored[j]; break; }
    }

    // Too far away (or nothing at all)? Scroll a bit instead.
    var limit = (dir === 'up' || dir === 'down') ? window.innerHeight * 0.8 : window.innerWidth * 0.8;
    if (!best || best.s > limit) {
      if (scrollPage(dir)) return;
      if (!best && dir === 'up') { openBar(); return; }
      if (!best) return;
    }
    focusEl(best.el);
  }

  function ensureRing() {
    if (ring || !document.documentElement) return;
    ring = el('div', { id: 'nk-ring', 'data-niksnaks': '' });
    document.documentElement.appendChild(ring);
  }

  function placeRing() {
    if (!ring || !focused || !document.contains(focused) || (bar && bar.root.contains(focused))) { hideRing(); return; }
    var r = focused.getBoundingClientRect();
    ring.style.setProperty('display', 'block', 'important');
    ring.style.setProperty('left', (r.left - 6) + 'px', 'important');
    ring.style.setProperty('top', (r.top - 6) + 'px', 'important');
    ring.style.setProperty('width', (r.width + 12) + 'px', 'important');
    ring.style.setProperty('height', (r.height + 12) + 'px', 'important');
  }

  function hideRing() {
    if (ring) ring.style.setProperty('display', 'none', 'important');
  }

  function focusEl(e) {
    ensureRing();
    focused = e;
    if (bar) {
      bar.buttons.forEach(function (b) { b.className = b === e ? 'nk-sel' : ''; });
    }
    if (!(bar && bar.root.contains(e))) {
      // Make non-focusable click targets focusable so screen readers/keys agree
      if (e.tabIndex < 0 && !e.hasAttribute('tabindex') && e.tagName !== 'IFRAME') e.setAttribute('tabindex', '-1');
      try { e.focus({ preventScroll: true }); } catch (x) { try { e.focus(); } catch (y) {} }
      var r = e.getBoundingClientRect();
      var m = 80;
      if (r.top < m || r.bottom > window.innerHeight - m || r.left < 0 || r.right > window.innerWidth) {
        try { e.scrollIntoView({ block: 'center', inline: 'nearest' }); } catch (x) { e.scrollIntoView(false); }
      }
      placeRing();
    } else {
      hideRing();
    }
  }

  var ringFrame = 0;
  function queueRing() {
    if (ringFrame) return;
    ringFrame = requestAnimationFrame(function () { ringFrame = 0; placeRing(); });
  }
  window.addEventListener('scroll', queueRing, true);
  window.addEventListener('resize', queueRing);

  function activate(e) {
    if (!e) return false;
    var tag = e.tagName;
    if (bar && bar.root.contains(e)) { runAction(e.getAttribute('data-act')); return true; }
    if (isEditable(e) || tag === 'SELECT') {
      e.focus();  // opens the TV keyboard / picker
      if (tag === 'SELECT') { try { e.click(); } catch (x) {} }
      return true;
    }
    if (tag === 'VIDEO') {
      if (e.paused) { try { e.play(); } catch (x) {} } else { e.pause(); }
      return true;
    }
    if (tag === 'IFRAME') {
      enterFrame(e, true);
      return true;
    }
    navClick = true;
    try { e.click(); } finally { navClick = false; }
    afterActivate(e);
    return true;
  }

  // Move the remote into a player iframe. press = also press its play button.
  function enterFrame(f, press) {
    try { f.focus(); f.contentWindow.focus(); } catch (x) {}
    if (press) {
      try { f.contentWindow.postMessage({ niksnaks: 'center' }, '*'); } catch (x) {}
    }
    toast(press ? 'Player: OK play/pause, \u25C0 \u25B6 skip 10s, BACK leave'
                : 'Press OK to play. BACK leaves the player');
  }

  // Site rule "then": after clicking X, move to Y (e.g. play button -> player)
  function afterActivate(t) {
    var then = RULE.then;
    if (!then || !IS_TOP || !t.matches) return;
    for (var sel in then) {
      if (!then.hasOwnProperty(sel) || !t.matches(sel)) continue;
      var targetSel = then[sel];
      setTimeout(function () {
        var f = document.querySelector(targetSel);
        if (!f) return;
        var r = f.getBoundingClientRect();
        if (r.width < 50 || r.height < 50) return;
        focusEl(f);
        if (f.tagName === 'IFRAME') enterFrame(f, false);
      }, 1600);
      return;
    }
  }

  function largestVideo() {
    var vids = document.getElementsByTagName('video');
    var best = null;
    var bestArea = 0;
    for (var i = 0; i < vids.length; i++) {
      var r = vids[i].getBoundingClientRect();
      if (r.width * r.height > bestArea) { bestArea = r.width * r.height; best = vids[i]; }
    }
    return best;
  }

  // Press whatever sits in the middle of the screen: in a player that is the
  // play button. Nested player iframes get the press passed on.
  function clickCenter() {
    var cx = window.innerWidth / 2;
    var cy = window.innerHeight / 2;
    var t = document.elementFromPoint(cx, cy);
    if (!t) return;
    if (t.tagName === 'IFRAME') { enterFrame(t, true); return; }
    var v = largestVideo();
    var wasPaused = v ? v.paused : false;
    var opts = { bubbles: true, cancelable: true, view: window, clientX: cx, clientY: cy, button: 0 };
    navClick = true;
    try {
      ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach(function (type) {
        try { t.dispatchEvent(new MouseEvent(type, opts)); } catch (x) {}
      });
    } finally { navClick = false; }
    // Some players ignore synthetic clicks: start the video directly
    if (v && wasPaused) {
      setTimeout(function () {
        if (!v.paused) return;
        try { var p = v.play(); if (p && p.catch) p.catch(function () {}); } catch (x) {}
      }, 700);
    }
  }

  function findVideo() {
    var fs = fullscreenEl();
    if (fs) return fs.tagName === 'VIDEO' ? fs : fs.querySelector('video');
    if (focused && focused.tagName === 'VIDEO') return focused;
    return null;
  }

  function exitFullscreen() {
    try {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    } catch (e) {}
  }

  function stop(e) {
    e.preventDefault();
    e.stopImmediatePropagation();
  }

  function submitInput(input) {
    var form = input.form;
    input.blur();
    if (!form) return;
    if (form.requestSubmit) { form.requestSubmit(); return; }
    var btn = form.querySelector('[type="submit"], button:not([type])');
    if (btn) btn.click();
    else form.submit();
  }

  var DIRS = {};
  DIRS[KEY.LEFT] = 'left';
  DIRS[KEY.RIGHT] = 'right';
  DIRS[KEY.UP] = 'up';
  DIRS[KEY.DOWN] = 'down';

  // Remote colour keys plus keyboard equivalents
  function shortcut(e) {
    var k = e.keyCode;
    if (k === KEY.RED || k === KEY.F1 || k === KEY.BROWSER_HOME || (e.altKey && k === KEY.HOME)) return 'home';
    if (k === KEY.YELLOW || k === KEY.F2) return 'bar';
    if (k === KEY.BLUE || k === KEY.F3) return 'dark';
    if (k === KEY.F5 || k === KEY.BROWSER_REFRESH || (e.ctrlKey && k === KEY.R)) return 'reload';
    if (k === KEY.F6 || (e.ctrlKey && k === KEY.L)) return 'search';
    if (k === KEY.BROWSER_BACK || (e.altKey && k === KEY.LEFT)) return 'back';
    if (k === KEY.BROWSER_FORWARD || (e.altKey && k === KEY.RIGHT)) return 'forward';
    return null;
  }

  function runShortcut(action) {
    if (action === 'home') goHome();
    else if (action === 'bar') { if (barOpen) closeBar(); else openBar(); }
    else if (action === 'dark') toggleDark();
    else if (action === 'reload') location.reload();
    else if (action === 'search') location.href = HOME_URL + '#search';
    else if (action === 'back') goBack();
    else if (action === 'forward') history.forward();
  }

  function onKey(e) {
    if (document.querySelector('meta[name="niksnaks-home"]')) return;  // homepage has its own
    var k = e.keyCode;
    var active = document.activeElement;

    // Colour keys and keyboard shortcuts work everywhere, even while typing
    var action = shortcut(e);
    if (action) {
      stop(e);
      if (IS_TOP) runShortcut(action); else sendTop(action);
      return;
    }

    // Typing in a text field
    if (isEditable(active)) {
      if (k === KEY.BACK || k === KEY.ESC || k === KEY.IME_CANCEL) {
        stop(e);
        active.blur();
        focusEl(active);
      } else if (k === KEY.IME_DONE) {
        stop(e);
        submitInput(active);
      } else if ((k === KEY.UP || k === KEY.DOWN) && active.tagName === 'INPUT') {
        stop(e);
        active.blur();
        focused = active;
        move(DIRS[k]);
      }
      return;
    }

    // Video player
    var video = findVideo();
    var fs = fullscreenEl();
    // Inside a player iframe with nothing selected: the remote controls the video
    var frameVideo = (!IS_TOP && !fs && !(focused && document.contains(focused))) ? largestVideo() : null;
    if (frameVideo) video = frameVideo;
    if (fs || (video && (focused === video || video === frameVideo))) {
      if (k === KEY.BACK || (k === KEY.ESC && fs)) {
        stop(e);
        if (fs) exitFullscreen(); else goBack();
        return;
      }
      if (video && (k === KEY.LEFT || k === KEY.RIGHT)) {
        stop(e);
        video.currentTime = Math.max(0, video.currentTime + (k === KEY.RIGHT ? 10 : -10));
        return;
      }
      if (video && k === KEY.ENTER) {
        stop(e);
        if (video === frameVideo && video.paused && !video.currentTime) clickCenter();  // first start: use the player's own button
        else if (video.paused) video.play();
        else video.pause();
        return;
      }
      if (fs) return;  // let the site's player handle everything else
    }

    if (DIRS[k]) {
      stop(e);
      move(DIRS[k]);
      return;
    }

    if (k === KEY.ENTER) {
      var target = focused && document.contains(focused) ? focused : null;
      if (target) {
        stop(e);
        activate(target);
      } else if (!IS_TOP) {
        stop(e);
        clickCenter();
      }
      return;
    }

    if (k === KEY.BACK || k === KEY.BACKSPACE) {
      stop(e);
      if (barOpen) closeBar();
      else goBack();
    } else if (k === KEY.ESC && barOpen) {
      stop(e);
      closeBar();
    }
  }

  window.addEventListener('keydown', onKey, true);

  // Mouse: clicking hides the ring, but the arrows carry on from what you clicked or hovered.
  // Moving the pointer to the top edge of the screen shows the toolbar.
  var hoverEl = null;
  var lastMouse = 0;

  function navTarget(t) {
    while (t && t.nodeType === 1) {
      if (t.matches && t.matches(NAV_SELECTOR)) return t;
      t = t.parentNode;
    }
    return null;
  }

  window.addEventListener('mouseover', function (e) { hoverEl = navTarget(e.target); }, true);
  window.addEventListener('mousemove', function (e) {
    lastMouse = Date.now();
    if (IS_TOP) {
      drawCursor(e.clientX, e.clientY);
      if (e.clientY <= 6) peekBar(2500);
    } else {
      try { window.parent.postMessage({ niksnaksCursor: [e.clientX, e.clientY] }, '*'); } catch (x) {}
    }
  }, true);
  window.addEventListener('mousedown', function (e) {
    lastMouse = Date.now();
    if (bar && bar.root.contains(e.target)) return;
    focused = navTarget(e.target);
    hideRing();
  }, true);

  // Keyboard Tab: let the green ring follow the browser's own focus
  window.addEventListener('focusin', function (e) {
    var t = e.target;
    if (!t || t.nodeType !== 1 || t === focused || t === document.body) return;
    if (bar && bar.root.contains(t)) return;
    if (Date.now() - lastMouse < 400) return;  // came from a click, not Tab
    ensureRing();
    focused = t;
    placeRing();
  }, true);

  /* =====================================================================
   * 12b. MOUSE CURSOR — drawn by us, because the TV doesn't show its pointer
   *      inside TizenBrew. Hides itself after 4 seconds without movement.
   * ===================================================================== */

  var cursorEl = null;
  var cursorTimer = null;
  var cursorFrame = 0;
  var cursorX = 0;
  var cursorY = 0;

  function drawCursor(x, y) {
    cursorX = x;
    cursorY = y;
    if (!document.documentElement) return;
    if (!cursorEl) {
      cursorEl = el('div', { id: 'nk-cursor', 'data-niksnaks': '' });
      var svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('viewBox', '0 0 24 24');
      var p = document.createElementNS(NS, 'path');
      p.setAttribute('d', 'M4 2.5v17.2l4.6-4.4 3 6.9 3.1-1.3-3-6.8h6.4z');
      p.setAttribute('fill', '#F3F5EE');
      p.setAttribute('stroke', '#1C1D20');
      p.setAttribute('stroke-width', '1.5');
      p.setAttribute('stroke-linejoin', 'round');
      svg.appendChild(p);
      cursorEl.appendChild(svg);
      document.documentElement.appendChild(cursorEl);
    }
    if (!cursorFrame) {
      cursorFrame = requestAnimationFrame(function () {
        cursorFrame = 0;
        // The arrow's tip sits at (6, 4) inside the 36px box
        cursorEl.style.setProperty('transform', 'translate(' + (cursorX - 6) + 'px,' + (cursorY - 4) + 'px)', 'important');
      });
    }
    var root = document.documentElement;
    if (root.className.indexOf('nk-cursor') === -1) root.className += ' nk-cursor';
    cursorEl.style.setProperty('opacity', '1', 'important');
    clearTimeout(cursorTimer);
    cursorTimer = setTimeout(function () { cursorEl.style.setProperty('opacity', '0', 'important'); }, 4000);
  }

  // Mouse moves inside a player iframe: the frame tells its parent, which adds
  // the iframe's position and draws the cursor (or passes it further up).
  window.addEventListener('message', function (e) {
    var pos = e.data && e.data.niksnaksCursor;
    if (!pos || pos.length !== 2 || e.source === window) return;
    var frames = document.querySelectorAll('iframe');
    for (var i = 0; i < frames.length; i++) {
      if (frames[i].contentWindow === e.source) {
        var r = frames[i].getBoundingClientRect();
        var x = r.left + (+pos[0] || 0);
        var y = r.top + (+pos[1] || 0);
        if (IS_TOP) drawCursor(x, y);
        else { try { window.parent.postMessage({ niksnaksCursor: [x, y] }, '*'); } catch (x2) {} }
        return;
      }
    }
  });

  /* =====================================================================
   * 13. FRAMES — keys pressed inside a player iframe are passed to the top
   * ===================================================================== */

  function sendTop(cmd) {
    try { window.top.postMessage({ niksnaks: cmd }, '*'); } catch (e) {}
  }

  if (IS_TOP) {
    window.addEventListener('message', function (e) {
      var cmd = e.data && e.data.niksnaks;
      if (typeof cmd !== 'string' || e.source === window) return;
      // Keys only reach the frame that has focus, so ignore messages from any other frame
      var act = document.activeElement;
      if (!act || act.tagName !== 'IFRAME' || !isWithin(e.source, act.contentWindow)) return;
      if (cmd !== 'leave') { runShortcut(cmd); return; }
      // BACK in the player: put the ring back on the player on the page
      window.focus();
      try { act.blur(); } catch (x) {}
      focusEl(act);
    });
  }

  // Is window w this frame window, or a frame nested inside it?
  function isWithin(w, frameWin) {
    for (var i = 0; w && i < 10; i++) {
      if (w === frameWin) return true;
      if (w === window) return false;
      try { w = w.parent; } catch (x) { return false; }
    }
    return false;
  }

  // In a frame: the page above asks us to press the player's play button
  if (!IS_TOP) {
    window.addEventListener('message', function (e) {
      if (e.source !== window.parent || !e.data || e.data.niksnaks !== 'center') return;
      var v = largestVideo();
      if (v && v.currentTime > 0) {
        if (v.paused) { try { v.play(); } catch (x) {} } else v.pause();
      } else {
        clickCenter();
      }
    });
  }

  /* =====================================================================
   * 14. START
   * ===================================================================== */

  // Ask Tizen for the colour keys too (TizenBrew also does this from package.json)
  try {
    if (window.tizen && tizen.tvinputdevice) {
      ['ColorF0Red', 'ColorF2Yellow', 'ColorF3Blue'].forEach(function (name) {
        try { tizen.tvinputdevice.registerKey(name); } catch (e) {}
      });
    }
  } catch (e) {}

  onReady(function () {
    if (document.querySelector('meta[name="niksnaks-home"]')) return;
    buildBar();
    if (IS_TOP) initDark();  // frames are handled by the page's own dark mode
    if (IS_TOP && RULE.focus) {
      setTimeout(siteAutoFocus, 800);
      setTimeout(siteAutoFocus, 2500);  // pages that render late
    }
  });

  function siteAutoFocus() {
    if (focused) return;  // you already moved
    var f = document.querySelector(RULE.focus);
    if (!f) return;
    var r = f.getBoundingClientRect();
    if (r.width < 6 || r.height < 6 || !inView(r)) return;
    focusEl(f);
  }
})();
