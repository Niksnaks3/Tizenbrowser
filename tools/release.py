"""Make a new Niksnaks-browser release.

    py tools/release.py 0.1.6

How updates reach the TV
------------------------
TizenBrew loads dist/niksnaks-loader.js from jsDelivr, pinned to one commit
(module name "Niksnaks3/Tizenbrowser@<commit>"), so that file never goes stale.
On every page the loader fetches the newest script from GitHub Pages
(docs/niksnaks.js) and runs it. If that fails, it runs the copy built into the
loader instead.

So for a normal update: edit mods/userScript.js, run this script, commit and
push. The TV picks it up within a few minutes on the next page it opens.
No purging, no TV restart, no re-adding the module.

This script:
- sets the version in mods/userScript.js (header and VERSION) and package.json
- writes docs/niksnaks.js       (the live script GitHub Pages serves)
- writes dist/niksnaks-loader.js (loader + fallback copy, what TizenBrew loads)
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'mods', 'userScript.js')
PKG = os.path.join(ROOT, 'package.json')
LIVE_FILE = os.path.join(ROOT, 'docs', 'niksnaks.js')
LOADER_FILE = os.path.join(ROOT, 'dist', 'niksnaks-loader.js')
LIVE_URL = 'https://niksnaks3.github.io/Tizenbrowser/niksnaks.js'

LOADER = """// Niksnaks-browser loader. TizenBrew injects this file into every page.
// It runs the newest script from GitHub Pages, so updates need no reinstall.
// If that can't load (offline, or a site that blocks it), it runs the copy below.
(function () {
  if (window.__niksnaksLoader) return;
  window.__niksnaksLoader = true;
  var LIVE = '%(live)s';
  try {
    var x = new XMLHttpRequest();
    // New copy at most every 2 minutes; otherwise the browser cache answers fast
    x.open('GET', LIVE + '?v=' + Math.floor(Date.now() / 120000), false);
    x.send();
    if (x.status === 200 && x.responseText.indexOf('__niksnaks') !== -1) {
      (0, eval)(x.responseText + '\\n//# sourceURL=' + LIVE);
      if (window.__niksnaks) {
        try { console.log('[Niksnaks] running live script from GitHub Pages'); } catch (e) {}
        return;
      }
    }
  } catch (e) {}
  try { console.log('[Niksnaks] live script unavailable, using built-in copy'); } catch (e) {}
  // ---- Fallback: built-in copy (version %(version)s) ----
%(script)s
})();
"""


def write(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, 'w', encoding='utf-8', newline='\n').write(text)


def main():
    if len(sys.argv) != 2 or not re.fullmatch(r'\d+\.\d+\.\d+', sys.argv[1]):
        sys.exit('usage: py tools/release.py <version, e.g. 0.1.6>')
    version = sys.argv[1]

    script = open(SRC, encoding='utf-8').read()
    script = re.sub(r'(// @version\s+)\S+', r'\g<1>' + version, script, count=1)
    script = re.sub(r"(var VERSION = ')[^']*(')", r'\g<1>' + version + r'\g<2>', script, count=1)
    write(SRC, script)

    write(LIVE_FILE, script)
    write(LOADER_FILE, LOADER % {'live': LIVE_URL, 'version': version, 'script': script})

    pkg = json.load(open(PKG, encoding='utf-8'))
    pkg['version'] = version
    pkg['main'] = 'dist/niksnaks-loader.js'
    pkg['files'] = ['dist/']
    write(PKG, json.dumps(pkg, indent=2) + '\n')

    # Old versioned files from the previous release scheme
    dist = os.path.dirname(LOADER_FILE)
    for f in os.listdir(dist):
        if re.fullmatch(r'niksnaks-[\d.]+\.js', f):
            os.remove(os.path.join(dist, f))

    print('Release %s ready:' % version)
    print('  docs/niksnaks.js        live script (GitHub Pages)')
    print('  dist/niksnaks-loader.js loader + fallback (TizenBrew via jsDelivr)')


if __name__ == '__main__':
    main()
