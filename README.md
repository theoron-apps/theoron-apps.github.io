# theoron-apps.github.io

The website of [Theoron](https://github.com/theoron-apps), served at **https://theoron-apps.github.io**.

A single static page: plain HTML, CSS and JavaScript, no build step. Fonts, three.js and images are kept in the repository, so visitors make no third-party requests.

## Layout

| Path | What it is |
|---|---|
| `index.html` | The page. English text is written here, so it reads correctly without JavaScript. |
| `assets/css/site.css` | All styles. |
| `assets/js/main.js` | Language switch, releases list, scroll reveals, and starting the sphere. |
| `assets/js/i18n.js` | Texts in English, Ukrainian and Russian. |
| `assets/js/sphere.js` | The 3D armillary sphere in the hero, built from code with three.js. |
| `assets/img/sphere.webp` | Static sphere shown when WebGL is unavailable. |
| `data/releases.json` | Latest releases of the apps, refreshed on every deploy. |
| `scripts/fetch-releases.mjs` | Fetches releases from the GitHub API into `data/releases.json`. |
| `.github/workflows/pages.yml` | Deploys the site on every push to `main` and every six hours. |

## Editing

- **Texts:** change the key in all three languages in `assets/js/i18n.js`, and the English text in `index.html` too.
- **A new app:** copy one `<article class="app">` block in `index.html`, add its texts to `i18n.js`, its icon and screenshots to `assets/img/`, and its repository to `REPOS` in `scripts/fetch-releases.mjs` and `APPS` in `assets/js/main.js`.
- **Preview locally:** run `python3 -m http.server` in the repository folder and open http://localhost:8000. Opening `index.html` as a file does not work, because browsers block JavaScript modules on `file://`.

## Deploying

Pages must use **GitHub Actions** as the source: Settings → Pages → Build and deployment → Source → GitHub Actions. The workflow fetches fresh release data and publishes the site, so nothing has to be committed when an app ships a new version.
