"""Make a new Niksnaks-browser release for TizenBrew.

    py tools/release.py 0.1.5

- sets the version in package.json and in the script header
- copies mods/userScript.js to dist/niksnaks-<version>.js and points
  package.json "main" at it (a new filename is never stale in jsDelivr's cache)
- keeps the 3 newest dist files

Then commit, push, wait a minute and open:
https://purge.jsdelivr.net/gh/Niksnaks3/Tizenbrowser@main/package.json
"""
import json
import os
import re
import shutil
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'mods', 'userScript.js')
PKG = os.path.join(ROOT, 'package.json')
DIST = os.path.join(ROOT, 'dist')
KEEP = 3


def main():
    if len(sys.argv) != 2 or not re.fullmatch(r'\d+\.\d+\.\d+', sys.argv[1]):
        sys.exit('usage: py tools/release.py <version, e.g. 0.1.5>')
    version = sys.argv[1]

    script = open(SRC, encoding='utf-8').read()
    script = re.sub(r'(// @version\s+)\S+', r'\g<1>' + version, script, count=1)
    open(SRC, 'w', encoding='utf-8', newline='\n').write(script)

    os.makedirs(DIST, exist_ok=True)
    name = 'niksnaks-%s.js' % version
    shutil.copyfile(SRC, os.path.join(DIST, name))

    pkg = json.load(open(PKG, encoding='utf-8'))
    pkg['version'] = version
    pkg['main'] = 'dist/' + name
    pkg['files'] = ['dist/']
    open(PKG, 'w', encoding='utf-8', newline='\n').write(json.dumps(pkg, indent=2) + '\n')

    def key(f):
        return [int(x) for x in re.findall(r'\d+', f)]
    old = sorted((f for f in os.listdir(DIST) if re.fullmatch(r'niksnaks-[\d.]+\.js', f)), key=key)
    for f in old[:-KEEP]:
        os.remove(os.path.join(DIST, f))

    print('Release %s ready: package.json main -> dist/%s' % (version, name))


if __name__ == '__main__':
    main()
