# Niksnaks-browser

A TizenBrew **mods** module for Samsung TVs. It opens the Niksnaks homepage and injects one
script into every site that adds pop-up/ad/tracker blocking, remote-control navigation,
a mini toolbar and automatic dark mode.

```
Tizenbrowser/
├── package.json         TizenBrew module info ("main" = dist/niksnaks-loader.js)
├── tools/release.py     makes a release: py tools/release.py 0.1.6
├── dist/
│   └── niksnaks-loader.js  loader + fallback copy (what TizenBrew loads)
├── docs/                the homepage (GitHub Pages serves this folder)
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   ├── logo.svg
│   └── niksnaks.js      live script the loader fetches (built by release.py)
└── mods/
    └── userScript.js    source of the script (edit this one)
```

## Remote keys

Remote, keyboard and mouse all work at the same time.

| Remote | Keyboard | What it does |
|---|---|---|
| Arrows | Arrows | Jump to the nearest link/button; scrolls when nothing is near |
| | Tab / Shift+Tab | Normal browser focus; the green ring follows it |
| OK | Enter (Space on the homepage) | Click the selected item |
| BACK | Backspace, Alt+Left | Leave a text field, exit fullscreen, or go to the previous page |
| | Alt+Right | Forward |
| Red | F1, Alt+Home | Go to the homepage |
| Yellow | F2 | Open/close the toolbar (Home, Back, Reload, Dark) |
| Blue | F3 | Dark mode on/off (remembered per site) |
| | F5, Ctrl+R | Reload |
| | Ctrl+L, F6 | Homepage search bar (type a search or web address) |
| | Esc | Close the toolbar / leave a text field (sites can use it too) |
| Up at the top of a page | | Opens the toolbar |

On the homepage you can just start typing to search. With a mouse: hover and click as
usual, and move the pointer to the top edge of the screen to show the toolbar.

Green is left alone: TizenBrew uses it for the module manager.

## 1. One-time setup

1. **Homepage address.** It lives at `https://niksnaks3.github.io/Tizenbrowser/`. If that ever
   changes, update it in *both* `package.json` (`websiteURL`) and `mods/userScript.js` (`HOME_URL`).
2. **Put the homepage online.** In the GitHub repo go to *Settings → Pages → Build and
   deployment → Deploy from a branch → `main` / `/docs`*. After a minute it's live.
3. **Install on the TV.** Open TizenBrew, press **Green** for the module manager, choose to add
   a **GitHub** module and type the pinned name `Niksnaks3/Tizenbrowser@2f0b6b5` (see "How
   updates work" below). Then start Niksnaks-browser.

### How updates work

TizenBrew loads `dist/niksnaks-loader.js` from jsDelivr, pinned to one commit, so it can never
be served stale. On every page the loader fetches the newest script from GitHub Pages
(`docs/niksnaks.js`) and runs it; if that fails it runs its built-in copy. The toolbar shows
the version that is running (e.g. "Niksnaks 0.1.5").

You only need to re-add the module (with a newer commit) if the loader itself changes.

## 2. The key test (do this first)

TizenBrew injects the script into every new page (on each `Runtime.executionContextCreated`),
so this should pass. Check it anyway.

Do **not** add `evaluateScriptOnDocumentStart` to `package.json`: in TizenBrew it stops GitHub
mods modules from opening at all (the launch message uses the short module name, but the TV
side looks it up by full `gh/...` name).

1. Start Niksnaks-browser on the TV.
2. Open any tile.
3. The Niksnaks toolbar should slide down for about 4 seconds on that site.
   - **Toolbar appears** → injection works everywhere. Continue.
   - **No toolbar** → TizenBrew only injected into the homepage. Stop here and look into
     this before tuning anything else.
4. Press Yellow, then Red. You should land back on the homepage.

## 3. Updating

- **Homepage only** (`docs/`): commit and push. GitHub Pages updates in a minute or so.
- **Script** (`mods/`): edit `mods/userScript.js`, run `py tools/release.py <new version>`
  (e.g. `0.1.6`), commit and push. GitHub Pages serves the new script within a minute or two,
  and the TV uses it on the next page it opens (allow up to ~5 minutes for caches).
  No purging, no TV restart.
- Don't create GitHub releases or tags: jsDelivr would then serve the newest tag instead of
  `main`.

## 4. Testing on a PC

- **Homepage:** open `docs/index.html` in Chrome. It scales to any window; arrow keys,
  Enter and Escape work like the remote.
- **Script:** install the Tampermonkey extension and add `mods/userScript.js` as a new
  script (the header at the top is already set up). Red/Yellow/Blue only exist on the TV;
  on a PC use the toolbar with the mouse. Backspace = BACK.

## 5. Tuning (build step 6)

All in `mods/userScript.js`:

- `AD_DOMAINS`: ad, pop-under and tracker domains (subdomains included).
- `SITE_RULES`: per-site settings: extra CSS to hide things, default dark mode, turning the
  overlay remover off, and domains to never block on that site.
- `AD_CSS_SELECTORS`: generic ad containers hidden on every site.

The browser console logs every blocked pop-up and removed overlay with a `[Niksnaks]`
prefix, which is the easiest way to see what happened on a site.

## Known limits

- Ads that load before the script runs can still download; the script hides them but can't
  stop the request like a real ad blocker.
- `<meta refresh>` redirects in the original HTML can't be cancelled. If one goes to a known
  ad domain, the redirect guard bounces back from there.
- Players inside cross-origin iframes only get remote navigation if TizenBrew also injects
  into frames. BACK always returns from the player to the page if it does.
- Streaming sites change their ad tricks often, so `AD_DOMAINS` needs updating now and then.
